const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Cart Routes

// Get user's cart
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const cartItems = await dbAll(`
      SELECT 
        c.id as cart_id, c.quantity,
        p.id, p.title, p.price, p.image_url, p.condition,
        p.seller_id, u.username as seller_username,
        cat.name as category_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE c.user_id = ? AND p.status = 'available'
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        summary: {
          totalItems,
          totalAmount: parseFloat(totalAmount.toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// Add item to cart
router.post('/cart', authenticateToken, [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product ID required'),
  body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { product_id, quantity = 1 } = req.body;

    // Check if product exists and is available
    const product = await dbGet(
      'SELECT id, seller_id, status FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Check if user is trying to add their own product
    if (product.seller_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own product to cart'
      });
    }

    // Check if item already in cart
    const existingItem = await dbGet(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      await dbRun(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [Math.min(newQuantity, 10), existingItem.id] // Max 10 items
      );
    } else {
      // Add new item
      await dbRun(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    res.json({
      success: true,
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
router.put('/cart/:cart_id', authenticateToken, [
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cart_id } = req.params;
    const { quantity } = req.body;

    // Verify cart item belongs to user
    const cartItem = await dbGet(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [cart_id, req.user.id]
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await dbRun(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, cart_id]
    );

    res.json({
      success: true,
      message: 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/cart/:cart_id', authenticateToken, async (req, res) => {
  try {
    const { cart_id } = req.params;

    // Verify cart item belongs to user
    const cartItem = await dbGet(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [cart_id, req.user.id]
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await dbRun('DELETE FROM cart WHERE id = ?', [cart_id]);

    res.json({
      success: true,
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
});

// Wishlist Routes

// Get user's wishlist
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlistItems = await dbAll(`
      SELECT 
        w.id as wishlist_id, w.created_at as added_at,
        p.id, p.title, p.price, p.image_url, p.condition,
        p.seller_id, u.username as seller_username,
        cat.name as category_name,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as is_in_cart
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN cart c ON p.id = c.product_id AND c.user_id = w.user_id
      WHERE w.user_id = ? AND p.status = 'available'
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: { items: wishlistItems }
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
});

// Add item to wishlist
router.post('/wishlist', authenticateToken, [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { product_id } = req.body;

    // Check if product exists and is available
    const product = await dbGet(
      'SELECT id, seller_id, status FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own product to wishlist'
      });
    }

    // Check if already in wishlist
    const existingItem = await dbGet(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    await dbRun(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully'
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist'
    });
  }
});

// Remove item from wishlist
router.delete('/wishlist/:product_id', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.params;

    const result = await dbRun(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist'
    });
  }
});

// Order Routes

// Create order (checkout)
router.post('/orders', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Valid quantity required'),
  body('shipping_address').notEmpty().withMessage('Shipping address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, shipping_address } = req.body;

    // Validate all products exist and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await dbGet(
        'SELECT id, title, price, seller_id, status FROM products WHERE id = ? AND status = "available"',
        [item.product_id]
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product_id} not found or not available`
        });
      }

      if (product.seller_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot purchase your own product'
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product.id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Create orders (one for each seller)
    const createdOrders = [];
    
    for (const item of orderItems) {
      const result = await dbRun(`
        INSERT INTO orders (
          buyer_id, seller_id, product_id, quantity, total_amount,
          shipping_address, eco_points_earned
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        req.user.id, item.seller_id, item.product_id, item.quantity,
        item.total, shipping_address, Math.floor(item.total * 0.1)
      ]);

      createdOrders.push(result.id);

      // Update product status to sold
      await dbRun('UPDATE products SET status = ? WHERE id = ?', ['sold', item.product_id]);
    }

    // Award eco points to buyer
    const totalEcoPoints = Math.floor(totalAmount * 0.1);
    await dbRun(
      'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
      [totalEcoPoints, req.user.id]
    );

    // Clear cart items that were ordered
    for (const item of orderItems) {
      await dbRun(
        'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
        [req.user.id, item.product_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderIds: createdOrders,
        totalAmount,
        ecoPointsEarned: totalEcoPoints
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Get user's purchase history
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await dbAll(`
      SELECT 
        o.id, o.quantity, o.total_amount, o.status, o.payment_status,
        o.eco_points_earned, o.created_at,
        p.id as product_id, p.title as product_title, p.image_url as product_image,
        u.username as seller_username, u.full_name as seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: { orders }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get user's sales (as seller)
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await dbAll(`
      SELECT 
        o.id, o.quantity, o.total_amount, o.status, o.payment_status,
        o.created_at,
        p.id as product_id, p.title as product_title, p.image_url as product_image,
        u.username as buyer_username, u.full_name as buyer_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: { sales }
    });

  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales'
    });
  }
});

module.exports = router;