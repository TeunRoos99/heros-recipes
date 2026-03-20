const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - public
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY order_index, name').all();
  res.json({ categories });
});

// POST /api/categories - admin only
router.post('/', auth, adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Naam is verplicht' });
  }
  const trimmed = name.trim();
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(trimmed);
  if (existing) {
    return res.status(409).json({ error: 'Categorie bestaat al' });
  }
  const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM categories').get();
  const id = uuidv4();
  db.prepare('INSERT INTO categories (id, name, order_index) VALUES (?, ?, ?)').run(id, trimmed, (maxOrder.max ?? -1) + 1);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json({ category });
});

// DELETE /api/categories/:id - admin only
router.delete('/:id', auth, adminOnly, (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ error: 'Categorie niet gevonden' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Categorie verwijderd' });
});

module.exports = router;
