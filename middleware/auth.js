const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Share = require('../models/Share');

// Verify JWT token middleware
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check note access permission middleware
exports.checkNotePermission = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    const share = await Share.findOne({ noteId, userId });
    
    if (!share && req.method !== 'GET') {
      return res.status(403).json({ message: 'Write permission required' });
    }

    if (!share && req.method === 'GET') {
      return res.status(403).json({ message: 'Read permission required' });
    }

    if (share.permission === 'read' && req.method !== 'GET') {
      return res.status(403).json({ message: 'Write permission required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking note permission' });
  }
};