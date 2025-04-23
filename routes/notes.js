const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, checkNotePermission } = require('../middleware/auth');
const Note = require('../models/Note');
const Version = require('../models/Version');
const Share = require('../models/Share');
const User = require('../models/User');

// Validation middleware
const validateNote = [
  body('title').trim().notEmpty(),
  body('content').notEmpty(),
  body('tags').isArray()
];

// Create a new note
router.post('/', authenticateToken, validateNote, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags } = req.body;
    const note = new Note({
      title,
      content,
      tags,
      createdBy: req.user._id
    });

    await note.save();

    // Create initial version
    const version = new Version({
      noteId: note._id,
      versionNumber: 1,
      title,
      content,
      tags,
      editedBy: req.user._id
    });

    await version.save();

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error creating note' });
  }
});

// Get all notes (with optional search and tag filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, tag } = req.query;
    const query = { createdBy: req.user._id };

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Add tag filter if provided
    if (tag) {
      query.tags = tag;
    }

    const notes = await Note.find(query);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

// Get a specific note
router.get('/:noteId', authenticateToken, checkNotePermission, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching note' });
  }
});

// Update a note
router.put('/:noteId', authenticateToken, checkNotePermission, validateNote, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Get the latest version number
    const latestVersion = await Version.findOne({ noteId: note._id })
      .sort({ versionNumber: -1 })
      .select('versionNumber');
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create new version
    const version = new Version({
      noteId: note._id,
      versionNumber: newVersionNumber,
      title: note.title,
      content: note.content,
      tags: note.tags,
      editedBy: req.user._id
    });

    // Update note
    const { title, content, tags } = req.body;
    note.title = title;
    note.content = content;
    note.tags = tags;

    await Promise.all([
      version.save(),
      note.save()
    ]);

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error updating note' });
  }
});

// Delete a note
router.delete('/:noteId', authenticateToken, checkNotePermission, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete note, versions, and shares
    await Promise.all([
      Note.deleteOne({ _id: note._id }),
      Version.deleteMany({ noteId: note._id }),
      Share.deleteMany({ noteId: note._id })
    ]);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note' });
  }
});

// Get note versions
router.get('/:noteId/versions', authenticateToken, checkNotePermission, async (req, res) => {
  try {
    const versions = await Version.find({ noteId: req.params.noteId })
      .sort({ versionNumber: -1 });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching versions' });
  }
});

// Get specific version
router.get('/:noteId/versions/:versionNumber', authenticateToken, checkNotePermission, async (req, res) => {
  try {
    const version = await Version.findOne({
      noteId: req.params.noteId,
      versionNumber: req.params.versionNumber
    });
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }
    res.json(version);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching version' });
  }
});

// Share note with user
router.post('/:noteId/shares', authenticateToken, async (req, res) => {
  try {
    const { email, permission } = req.body;
    if (!['read', 'write'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission type' });
    }

    const note = await Note.findOne({
      _id: req.params.noteId,
      createdBy: req.user._id
    });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const share = new Share({
      noteId: note._id,
      userId: targetUser._id,
      permission
    });

    await share.save();
    res.status(201).json(share);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Share already exists' });
    }
    res.status(500).json({ message: 'Error sharing note' });
  }
});

// Remove share
router.delete('/:noteId/shares/:userId', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      createdBy: req.user._id
    });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await Share.deleteOne({
      noteId: req.params.noteId,
      userId: req.params.userId
    });

    res.json({ message: 'Share removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing share' });
  }
});

// List shares for a note
router.get('/:noteId/shares', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      createdBy: req.user._id
    });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const shares = await Share.find({ noteId: req.params.noteId })
      .populate('userId', 'email');
    res.json(shares);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shares' });
  }
});

module.exports = router;