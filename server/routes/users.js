const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require admin
router.use(auth, adminOnly);

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, created_at, deleted_at FROM users ORDER BY created_at DESC
  `).all();
  res.json({ users });
});

// POST /api/users
router.post('/', (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, username, email || null, passwordHash, role === 'admin' ? 'admin' : 'user');

  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ user });
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  db.prepare("UPDATE users SET deleted_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ message: 'User deleted' });
});

// POST /api/users/:id/restore
router.post('/:id/restore', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NOT NULL').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found or not deleted' });

  db.prepare('UPDATE users SET deleted_at = NULL WHERE id = ?').run(req.params.id);
  res.json({ message: 'User restored' });
});

module.exports = router;
