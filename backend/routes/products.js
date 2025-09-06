const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken, optionalAuth, checkResourceOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isInt({ min: 1 }).withMessage('Category must be a valid ID'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term too long'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('condition').optional().isIn(['New', 'Like New', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition'),
  query('sortBy').optional().isIn(['price_asc', 'price_desc', 'newest', 'oldest', 'popular']).withMessage('Invalid sort option')
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

    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE p.status = 'available'";
    const params = [];

    // Build WHERE clause based on filters
    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    if (condition) {
      whereClause += ' AND p.condition = ?';
      params.push(condition);
    }

    // Sort clause
    let orderClause = '';
    switch (sortBy) {
      case 'price_asc':
        orderClause = 'ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderClause = 'ORDER BY p.price DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY p.created_at ASC';
        break;
      case 'popular':
        orderClause = 'ORDER BY p.view_count DESC';
        break;
      default:
        orderClause = 'ORDER BY p.created_at DESC';
    }

    // Main query
    const productsQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.original_price, 
        p.condition, p.image_url, p.view_count, p.sustainability_score,
        p.location, p.created_at,
        c.name as category_name, c.icon as category_icon,
        u.username as seller_username, u.avatar_url as seller_avatar,
        CASE WHEN w.id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN wishlist w ON p.id = w.product_id AND w.user_id = ?
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    // Execute queries
    const [products, countResult] = await Promise.all([
      dbAll(productsQuery, [req.user?.id || null, ...params, limit, offset]),
      dbGet(countQuery, params)
    ]);

    const totalProducts = countResult.total;
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await dbGet(`
      SELECT 
        p.id, p.title, p.description, p.price, p.original_price, 
        p.condition, p.image_url, p.additional_images, p.view_count, 
        p.sustainability_score, p.location, p.created_at, p.updated_at,
        c.name as category_name, c.icon as category_icon,
        u.id as seller_id, u.username as seller_username, 
        u.full_name as seller_name, u.avatar_url as seller_avatar,
        u.eco_points as seller_eco_points,
        CASE WHEN w.id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted,
        CASE WHEN cart.id IS NOT NULL THEN 1 ELSE 0 END as is_in_cart
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN wishlist w ON p.id = w.product_id AND w.user_id = ?
      LEFT JOIN cart ON p.id = cart.product_id AND cart.user_id = ?
      WHERE p.id = ? AND p.status = 'available'
    `, [req.user?.id || null, req.user?.id || null, id]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (only if not viewing own product)
    if (!req.user || req.user.id !== product.seller_id) {
      await dbRun('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
      product.view_count += 1;
    }

    // Parse additional images
    if (product.additional_images) {
      try {
        product.additional_images = JSON.parse(product.additional_images);
      } catch {
        product.additional_images = [];
      }
    }

    // Get related products (same category, excluding this product)
    const relatedProducts = await dbAll(`
      SELECT 
        p.id, p.title, p.price, p.image_url, p.condition,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'available'
      ORDER BY p.created_at DESC
      LIMIT 4
    `, [product.category_id, id]);

    res.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create new product
router.post('/', authenticateToken, [
  body('title').isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('original_price').optional().isFloat({ min: 0 }).withMessage('Original price must be positive'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('condition').isIn(['New', 'Like New', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition'),
  body('location').optional().isLength({ max: 255 }).withMessage('Location too long')
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

    const {
      title,
      description,
      price,
      original_price,
      category_id,
      condition,
      image_url,
      additional_images,
      location
    } = req.body;

    // Verify category exists
    const category = await dbGet('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Calculate sustainability score
    let sustainabilityScore = 50; // Base score
    if (original_price && price < original_price * 0.5) sustainabilityScore += 20;
    if (condition === 'New' || condition === 'Like New') sustainabilityScore += 15;
    if (condition === 'Good') sustainabilityScore += 10;
    if (description && description.length > 100) sustainabilityScore += 5;

    const result = await dbRun(`
      INSERT INTO products (
        title, description, price, original_price, category_id, 
        condition, image_url, additional_images, seller_id, 
        sustainability_score, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, description || '', price, original_price || null, category_id,
      condition, image_url || '', JSON.stringify(additional_images || []),
      req.user.id, sustainabilityScore, location || ''
    ]);

    // Give eco points to seller for listing
    await dbRun(
      'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
      [10, req.user.id]
    );

    // Get the created product
    const newProduct = await dbGet(`
      SELECT 
        p.*, c.name as category_name, c.icon as category_icon,
        u.username as seller_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', authenticateToken, checkResourceOwnership('product'), [
  body('title').optional().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('original_price').optional().isFloat({ min: 0 }).withMessage('Original price must be positive'),
  body('category_id').optional().isInt({ min: 1 }).withMessage('Valid category is required'),
  body('condition').optional().isIn(['New', 'Like New', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition'),
  body('location').optional().isLength({ max: 255 }).withMessage('Location too long')
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

    const { id } = req.params;
    const updateFields = [];
    const params = [];

    const allowedFields = [
      'title', 'description', 'price', 'original_price', 
      'category_id', 'condition', 'image_url', 'additional_images', 'location'
    ];

    // Build dynamic update query
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        if (field === 'additional_images') {
          params.push(JSON.stringify(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await dbRun(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated product
    const updatedProduct = await dbGet(`
      SELECT 
        p.*, c.name as category_name, c.icon as category_icon,
        u.username as seller_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', authenticateToken, checkResourceOwnership('product'), async (req, res) => {
  try {
    const { id } = req.params;

    await dbRun('UPDATE products SET status = ? WHERE id = ?', ['deleted', id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Get user's listings
router.get('/user/my-listings', authenticateToken, async (req, res) => {
  try {
    const products = await dbAll(`
      SELECT 
        p.id, p.title, p.price, p.condition, p.image_url, p.view_count,
        p.status, p.created_at,
        c.name as category_name,
        COUNT(w.id) as wishlist_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN wishlist w ON p.id = w.product_id
      WHERE p.seller_id = ? AND p.status != 'deleted'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your listings'
    });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await dbAll(
      'SELECT id, name, description, icon FROM categories ORDER BY name'
    );

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;