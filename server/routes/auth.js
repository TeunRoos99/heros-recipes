const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
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
    VALUES (?, ?, ?, ?, 'user')
  `).run(id, username, email || null, passwordHash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

// PUT /api/auth/password
router.put('/password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Huidig en nieuw wachtwoord zijn verplicht' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Nieuw wachtwoord moet minimaal 6 tekens zijn' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').get(req.user.id);
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(401).json({ error: 'Huidig wachtwoord klopt niet' });
  }
  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
  res.json({ message: 'Wachtwoord gewijzigd' });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ? AND deleted_at IS NULL').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

module.exports = router;
