const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { initializeDatabase } = require('./db');
const { defineModels } = require('./models');
const { authenticateToken, requireRole, JWT_SECRET } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// Password Validation Helper
function isPasswordValid(password) {
  if (!password || password.length < 8 || password.length > 16) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUppercase && hasSpecial;
}

// Global model references
let User, Store, Rating;

// Connect to database and start server
const PORT = process.env.PORT || 5000;

initializeDatabase().then(sequelize => {
  const models = defineModels(sequelize);
  User = models.User;
  Store = models.Store;
  Rating = models.Rating;

  app.listen(PORT, () => {
    console.log(`🚀 Store Rating Backend server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('💥 Critical Error: Database initialization failed. Exiting.', err);
  process.exit(1);
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register Normal User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, address, password } = req.body;

    // Manual Form validations as requested
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ message: 'Name must be between 20 and 60 characters.' });
    }
    if (!address || address.length > 400) {
      return res.status(400).json({ message: 'Address cannot exceed 400 characters.' });
    }
    if (!isPasswordValid(password)) {
      return res.status(400).json({ 
        message: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.' 
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      address,
      password: hashedPassword,
      role: 'user'
    });

    res.status(201).json({ message: 'Registration successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
});

// Single Login System
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, address: user.address },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed.' });
  }
});

// Update Password
app.post('/api/auth/update-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!isPasswordValid(password)) {
      return res.status(400).json({ 
        message: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.update({ password: hashedPassword }, { where: { id: req.user.id } });

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Password update failed.' });
  }
});

// ==========================================
// SYSTEM ADMINISTRATOR ENDPOINTS
// ==========================================

// Get Stats (Total users, stores, ratings)
app.get('/api/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalRatings = await Rating.count();

    res.json({ totalUsers, totalStores, totalRatings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add New User (admin/user/store_owner)
app.post('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validations
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ message: 'Name must be between 20 and 60 characters.' });
    }
    if (!address || address.length > 400) {
      return res.status(400).json({ message: 'Address cannot exceed 400 characters.' });
    }
    if (!isPasswordValid(password)) {
      return res.status(400).json({ 
        message: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.' 
      });
    }
    if (!['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      address,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        address: newUser.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add New Store (and automatically create a corresponding Store Owner account)
app.post('/api/admin/stores', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, address } = req.body;

    // Validations
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ message: 'Store name must be between 20 and 60 characters.' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Store email is required.' });
    }
    if (!address || address.length > 400) {
      return res.status(400).json({ message: 'Store address cannot exceed 400 characters.' });
    }

    // Check if store email is already in use (stores or users)
    const existingStore = await Store.findOne({ where: { email } });
    if (existingStore) {
      return res.status(400).json({ message: 'Store email is already registered.' });
    }

    // Check if a store owner user with this email exists or create it
    let storeOwner = await User.findOne({ where: { email } });
    
    if (!storeOwner) {
      // Auto-generate Owner password and Owner name conforming to validations
      const defaultOwnerName = `Owner of ${name}`.substring(0, 60);
      const ownerName = defaultOwnerName.length < 20 
        ? defaultOwnerName.padEnd(20, ' ') 
        : defaultOwnerName;
      
      const defaultOwnerPassword = 'OwnerPassword123!';
      const hashedPassword = await bcrypt.hash(defaultOwnerPassword, 10);

      storeOwner = await User.create({
        name: ownerName,
        email,
        address,
        password: hashedPassword,
        role: 'store_owner'
      });
    } else {
      // If a user with this email exists but is not a store owner, prompt error
      if (storeOwner.role !== 'store_owner') {
        return res.status(400).json({ 
          message: 'A user with this email exists but does not have the Store Owner role.' 
        });
      }
    }

    const newStore = await Store.create({
      name,
      email,
      address,
      ownerId: storeOwner.id
    });

    res.status(201).json({
      message: 'Store created successfully! A Store Owner account has been created/assigned under the store\'s email.',
      store: newStore,
      ownerAccount: {
        email: storeOwner.email,
        temporaryPassword: 'OwnerPassword123!'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View a list of stores: Name, Email, Address, Rating
app.get('/api/admin/stores', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { sortBy = 'name', order = 'ASC' } = req.query;
    
    // Fetch all stores and calculate their overall rating
    const stores = await Store.findAll({
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: ['rating']
        }
      ]
    });

    // Map response with overall rating
    let storeList = stores.map(store => {
      const totalRatings = store.ratings.length;
      const avgRating = totalRatings > 0 
        ? parseFloat((store.ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(2))
        : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: avgRating,
        totalReviewsCount: totalRatings
      };
    });

    // Sort store list
    storeList.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return order.toUpperCase() === 'ASC' ? -1 : 1;
      if (valA > valB) return order.toUpperCase() === 'ASC' ? 1 : -1;
      return 0;
    });

    res.json(storeList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View a list of users (normal and admin and owners) with Name, Email, Address, Role, and Rating (if owner)
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { sortBy = 'name', order = 'ASC', filterRole, filterSearch } = req.query;

    const queryOptions = {
      include: [
        {
          model: Store,
          as: 'store',
          include: [
            {
              model: Rating,
              as: 'ratings',
              attributes: ['rating']
            }
          ]
        }
      ]
    };

    // Construct Where conditions
    const whereConditions = [];

    if (filterRole) {
      whereConditions.push({ role: filterRole });
    }

    if (filterSearch) {
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${filterSearch}%` } },
          { email: { [Op.like]: `%${filterSearch}%` } },
          { address: { [Op.like]: `%${filterSearch}%` } }
        ]
      });
    }

    if (whereConditions.length > 0) {
      queryOptions.where = { [Op.and]: whereConditions };
    }

    const users = await User.findAll(queryOptions);

    let userList = users.map(user => {
      let rating = null;
      let storeName = null;

      if (user.role === 'store_owner' && user.store) {
        storeName = user.store.name;
        const total = user.store.ratings.length;
        rating = total > 0 
          ? parseFloat((user.store.ratings.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(2))
          : 0;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        rating,
        storeName
      };
    });

    // Sort list
    userList.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return order.toUpperCase() === 'ASC' ? -1 : 1;
      if (valA > valB) return order.toUpperCase() === 'ASC' ? 1 : -1;
      return 0;
    });

    res.json(userList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// NORMAL USER ENDPOINTS
// ==========================================

// View lists of all stores (for users) with overall average and this user's rating
app.get('/api/user/stores', authenticateToken, requireRole(['user']), async (req, res) => {
  try {
    const { search } = req.query;

    const queryOptions = {
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: ['userId', 'rating']
        }
      ]
    };

    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const stores = await Store.findAll(queryOptions);

    const storeList = stores.map(store => {
      const totalRatings = store.ratings.length;
      const overallRating = totalRatings > 0 
        ? parseFloat((store.ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(2))
        : 0;

      // Find if this current user submitted a rating
      const userSubmittedRating = store.ratings.find(r => r.userId === req.user.id);
      const userRating = userSubmittedRating ? userSubmittedRating.rating : null;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating,
        userRating
      };
    });

    res.json(storeList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit/Modify Rating
app.post('/api/user/ratings', authenticateToken, requireRole(['user']), async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user.id;

    if (!storeId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Check if user has already rated this store
    const existingRating = await Rating.findOne({ where: { userId, storeId } });

    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
      return res.json({ message: 'Your rating has been updated successfully!', rating: existingRating });
    } else {
      const newRating = await Rating.create({ userId, storeId, rating });
      return res.status(201).json({ message: 'Rating submitted successfully!', rating: newRating });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// STORE OWNER ENDPOINTS
// ==========================================

// Store Owner Dashboard
app.get('/api/owner/dashboard', authenticateToken, requireRole(['store_owner']), async (req, res) => {
  try {
    // Find the store owned by this user
    const store = await Store.findOne({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Rating,
          as: 'ratings',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email']
            }
          ]
        }
      ]
    });

    if (!store) {
      return res.status(404).json({ 
        message: 'No store registered for this store owner. Please contact an administrator.' 
      });
    }

    const totalRatings = store.ratings.length;
    const avgRating = totalRatings > 0 
      ? parseFloat((store.ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(2))
      : 0;

    // View a list of users who have submitted ratings
    const usersWhoRated = store.ratings.map(r => ({
      userId: r.userId,
      userName: r.user ? r.user.name : 'Unknown User',
      userEmail: r.user ? r.user.email : 'N/A',
      rating: r.rating,
      date: r.createdAt
    }));

    res.json({
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      storeEmail: store.email,
      averageRating: avgRating,
      totalRatings,
      usersWhoRated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
