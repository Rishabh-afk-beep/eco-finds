const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, 'ecofinds.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run("PRAGMA foreign_keys = ON");

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          phone VARCHAR(20),
          address TEXT,
          avatar_url VARCHAR(500),
          eco_points INTEGER DEFAULT 0,
          onboarded BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('✅ Users table ready');
      });

      // Categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating categories table:', err);
        else console.log('✅ Categories table ready');
      });

      // Products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          original_price DECIMAL(10,2),
          category_id INTEGER,
          condition VARCHAR(50) DEFAULT 'Good',
          image_url VARCHAR(500),
          additional_images TEXT,
          seller_id INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'available',
          view_count INTEGER DEFAULT 0,
          sustainability_score INTEGER DEFAULT 0,
          location VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) console.error('Error creating products table:', err);
        else console.log('✅ Products table ready');
      });

      // Cart table
      db.run(`
        CREATE TABLE IF NOT EXISTS cart (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(user_id, product_id)
        )
      `, (err) => {
        if (err) console.error('Error creating cart table:', err);
        else console.log('✅ Cart table ready');
      });

      // Wishlist table
      db.run(`
        CREATE TABLE IF NOT EXISTS wishlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(user_id, product_id)
        )
      `, (err) => {
        if (err) console.error('Error creating wishlist table:', err);
        else console.log('✅ Wishlist table ready');
      });

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          buyer_id INTEGER NOT NULL,
          seller_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          payment_status VARCHAR(50) DEFAULT 'pending',
          shipping_address TEXT,
          tracking_number VARCHAR(100),
          eco_points_earned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating orders table:', err);
        else console.log('✅ Orders table ready');
      });

      // Reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reviewer_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          seller_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating reviews table:', err);
        else console.log('✅ Reviews table ready');
      });

      // Insert default categories
      const defaultCategories = [
        { name: 'Electronics', description: 'Phones, laptops, gadgets', icon: 'smartphone' },
        { name: 'Fashion', description: 'Clothing, shoes, accessories', icon: 'shirt' },
        { name: 'Home & Garden', description: 'Furniture, decor, tools', icon: 'home' },
        { name: 'Books', description: 'Textbooks, novels, magazines', icon: 'book' },
        { name: 'Sports', description: 'Equipment, clothing, accessories', icon: 'dumbbell' },
        { name: 'Toys & Games', description: 'Kids toys, board games, puzzles', icon: 'gamepad-2' },
        { name: 'Automotive', description: 'Car parts, accessories', icon: 'car' },
        { name: 'Art & Crafts', description: 'Handmade items, supplies', icon: 'palette' }
      ];

      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)
      `);

      defaultCategories.forEach(category => {
        insertCategory.run(category.name, category.description, category.icon);
      });
      insertCategory.finalize();

      console.log('🌱 Database initialization completed');
      resolve();
    });
  });
};

// Database helper functions
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  initDatabase,
  dbAll,
  dbGet,
  dbRun
};