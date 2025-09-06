// EcoFinds Store - LocalStorage-based data management

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  greenPoints: number;
  totalCO2Saved: number;
  totalWaterSaved: number;
  purchases: string[];
  wishlist: string[];
  ecoIdentity: 'save-money' | 'reduce-waste' | 'find-unique' | null;
  onboarded: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  ecoImpact: {
    co2Kg: number;
    waterL: number;
  };
  badges: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  userId: string;
  productIds: string[];
  subtotal: number;
  ecoTotals: {
    co2Kg: number;
    waterL: number;
  };
  carbonNeutralDonation: boolean;
  createdAt: string;
}

export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Furniture',
  'Kids'
];

export const ECO_CONSTANTS = {
  Electronics: { co2Kg: 250, waterL: 5000 },
  Clothing: { co2Kg: 15, waterL: 1500 },
  Books: { co2Kg: 2, waterL: 50 },
  Furniture: { co2Kg: 120, waterL: 3000 },
  Kids: { co2Kg: 8, waterL: 300 }
};

export const BADGE_RULES = {
  'High Impact Save': (product: Product) => 
    ['Electronics', 'Furniture'].includes(product.category),
  'Eco Choice': (product: Product) => 
    ['Books', 'Kids', 'Clothing'].includes(product.category),
  'Budget Saver': (product: Product) => product.price < 1000
};

class EcoStore {
  private currentUser: User | null = null;

  // User management
  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const userId = localStorage.getItem('currentUserId');
      if (userId) {
        this.currentUser = this.getUser(userId);
      }
    }
    return this.currentUser;
  }

  login(email: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem('currentUserId', user.id);
      this.currentUser = user;
      return user;
    }
    return null;
  }

  register(email: string, password: string, username: string): User {
    const users = this.getUsers();
    const newUser: User = {
      id: this.generateId(),
      email,
      username,
      greenPoints: 0,
      totalCO2Saved: 0,
      totalWaterSaved: 0,
      purchases: [],
      wishlist: [],
      ecoIdentity: null,
      onboarded: false,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserId', newUser.id);
    this.currentUser = newUser;
    return newUser;
  }

  logout() {
    localStorage.removeItem('currentUserId');
    this.currentUser = null;
  }

  updateUser(updates: Partial<User>) {
    if (!this.currentUser) return;
    
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === this.currentUser!.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('users', JSON.stringify(users));
      this.currentUser = users[index];
    }
  }

  // Product management
  getProducts(): Product[] {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
  }

  getProduct(id: string): Product | null {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'badges'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      badges: this.calculateBadges(product)
    };
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      if (updates.category || updates.price) {
        products[index].badges = this.calculateBadges(products[index]);
      }
      localStorage.setItem('products', JSON.stringify(products));
    }
  }

  deleteProduct(id: string) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(filtered));
  }

  // Cart management
  getCart(): Cart {
    const user = this.getCurrentUser();
    if (!user) return { userId: '', items: [] };
    
    const cart = localStorage.getItem(`cart_${user.id}`);
    return cart ? JSON.parse(cart) : { userId: user.id, items: [] };
  }

  addToCart(productId: string, quantity = 1) {
    const user = this.getCurrentUser();
    if (!user) return;

    const cart = this.getCart();
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(cart));
  }

  updateCartItem(productId: string, quantity: number) {
    const user = this.getCurrentUser();
    if (!user) return;

    const cart = this.getCart();
    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.productId !== productId);
    } else {
      const item = cart.items.find(item => item.productId === productId);
      if (item) item.quantity = quantity;
    }
    
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(cart));
  }

  clearCart() {
    const user = this.getCurrentUser();
    if (!user) return;
    
    localStorage.removeItem(`cart_${user.id}`);
  }

  // Order management
  createOrder(carbonNeutralDonation = false): Order {
    const user = this.getCurrentUser();
    const cart = this.getCart();
    if (!user || !cart.items.length) throw new Error('Invalid order');

    const products = this.getProducts();
    const orderProducts = cart.items.map(item => 
      products.find(p => p.id === item.productId)!
    );

    const subtotal = cart.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return sum + (product.price * item.quantity);
    }, 0);

    const ecoTotals = cart.items.reduce((totals, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        co2Kg: totals.co2Kg + (product.ecoImpact.co2Kg * item.quantity),
        waterL: totals.waterL + (product.ecoImpact.waterL * item.quantity)
      };
    }, { co2Kg: 0, waterL: 0 });

    const order: Order = {
      id: this.generateId(),
      userId: user.id,
      productIds: cart.items.map(item => item.productId),
      subtotal: carbonNeutralDonation ? subtotal + 10 : subtotal,
      ecoTotals,
      carbonNeutralDonation,
      createdAt: new Date().toISOString()
    };

    // Save order
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Update user stats
    const greenPoints = Math.round(ecoTotals.co2Kg / 10);
    this.updateUser({
      greenPoints: user.greenPoints + greenPoints,
      totalCO2Saved: user.totalCO2Saved + ecoTotals.co2Kg,
      totalWaterSaved: user.totalWaterSaved + ecoTotals.waterL,
      purchases: [...user.purchases, order.id]
    });

    // Clear cart
    this.clearCart();

    return order;
  }

  getOrders(): Order[] {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
  }

  getUserOrders(): Order[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    return this.getOrders().filter(order => order.userId === user.id);
  }

  // Wishlist management
  getWishlist(): string[] {
    const user = this.getCurrentUser();
    return user ? user.wishlist : [];
  }

  addToWishlist(productId: string) {
    const user = this.getCurrentUser();
    if (!user) return;

    if (!user.wishlist.includes(productId)) {
      this.updateUser({
        wishlist: [...user.wishlist, productId]
      });
    }
  }

  removeFromWishlist(productId: string) {
    const user = this.getCurrentUser();
    if (!user) return;

    this.updateUser({
      wishlist: user.wishlist.filter(id => id !== productId)
    });
  }

  isInWishlist(productId: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.wishlist.includes(productId) : false;
  }

  // AI Product Analysis (Mock)
  analyzeProduct(imageFile: File): Promise<{ title: string; category: string; badges: string[]; }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock AI analysis based on common patterns
        const mockAnalysis = [
          { title: "Vintage MacBook Pro", category: "Electronics", badges: ["High Impact Save"] },
          { title: "Classic Denim Jacket", category: "Clothing", badges: ["Eco Choice"] },
          { title: "Hardcover Novel Collection", category: "Books", badges: ["Eco Choice", "Budget Saver"] },
          { title: "Wooden Coffee Table", category: "Furniture", badges: ["High Impact Save"] },
          { title: "Kids Toy Set", category: "Kids", badges: ["Eco Choice", "Budget Saver"] }
        ];
        
        const randomIndex = Math.floor(Math.random() * mockAnalysis.length);
        resolve(mockAnalysis[randomIndex]);
      }, 1500);
    });
  }

  // Camera/AR suggestions (Mock)
  getCameraSuggestions(): Promise<{ suggestions: string[]; confidence: number; }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = [
          "This item looks perfect for EcoFinds! Electronics like this can save 250kg CO₂.",
          "Great find! Clothing items are popular and help reduce textile waste.",
          "Books are always in demand on our platform. This could earn you ₹200-500!",
          "Furniture items have high environmental impact - this could save 120kg CO₂!",
          "Kids items are perfect for giving toys a second life!"
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        resolve({
          suggestions: [randomSuggestion],
          confidence: Math.floor(Math.random() * 30) + 70 // 70-100% confidence
        });
      }, 800);
    });
  }

  // Utility methods
  getUsers(): User[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  getUser(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private calculateBadges(product: Partial<Product>): string[] {
    const badges: string[] = [];
    Object.entries(BADGE_RULES).forEach(([badge, rule]) => {
      if (rule(product as Product)) {
        badges.push(badge);
      }
    });
    return badges;
  }

  // Initialize with demo data
  seedData() {
    if (localStorage.getItem('dataSeeded')) return;

    // Create demo user
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@ecofinds.com',
      username: 'EcoEnthusiast',
      greenPoints: 50,
      totalCO2Saved: 125,
      totalWaterSaved: 2500,
      purchases: [],
      wishlist: ['1', '2'],
      ecoIdentity: 'reduce-waste',
      onboarded: true,
      createdAt: new Date().toISOString()
    };

    // Demo products
    const demoProducts: Product[] = [
      {
        id: '1',
        ownerId: 'demo-user',
        title: 'iPhone 12 Pro - Excellent Condition',
        description: 'Barely used iPhone 12 Pro with original box and accessories. Perfect for giving it a second life!',
        category: 'Electronics',
        price: 45000,
        imageUrl: '/placeholder.svg',
        ecoImpact: ECO_CONSTANTS.Electronics,
        badges: ['High Impact Save'],
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        ownerId: 'demo-user',
        title: 'Vintage Leather Jacket',
        description: 'Classic brown leather jacket from the 80s. Timeless style with sustainable choice.',
        category: 'Clothing',
        price: 2500,
        imageUrl: '/placeholder.svg',
        ecoImpact: ECO_CONSTANTS.Clothing,
        badges: ['Eco Choice'],
        createdAt: new Date().toISOString()
      },
      // Add more demo products...
    ];

    localStorage.setItem('users', JSON.stringify([demoUser]));
    localStorage.setItem('products', JSON.stringify(demoProducts));
    localStorage.setItem('dataSeeded', 'true');
  }
}

export const store = new EcoStore();