const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/shopping/lists
router.get('/lists', (req, res) => {
  const lists = db.prepare('SELECT * FROM shopping_lists WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ lists });
});

// POST /api/shopping/lists
router.post('/lists', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO shopping_lists (id, user_id, name) VALUES (?, ?, ?)').run(id, req.user.id, name);
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ?').get(id);
  res.status(201).json({ list });
});

// DELETE /api/shopping/lists/:id
router.delete('/lists/:id', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  db.prepare('DELETE FROM shopping_items WHERE list_id = ?').run(req.params.id);
  db.prepare('DELETE FROM shopping_lists WHERE id = ?').run(req.params.id);
  res.json({ message: 'List deleted' });
});

// GET /api/shopping/lists/:id/items
router.get('/lists/:id/items', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const items = db.prepare('SELECT * FROM shopping_items WHERE list_id = ? ORDER BY order_index, id').all(req.params.id);
  res.json({ items });
});

// POST /api/shopping/lists/:id/items
router.post('/lists/:id/items', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const items = Array.isArray(req.body) ? req.body : [req.body];
  const maxIndex = db.prepare('SELECT MAX(order_index) as max FROM shopping_items WHERE list_id = ?').get(req.params.id);
  let orderIndex = (maxIndex.max || 0) + 1;

  const insertItem = db.prepare(
    'INSERT INTO shopping_items (id, list_id, name, amount, unit, checked, order_index) VALUES (?, ?, ?, ?, ?, 0, ?)'
  );

  const inserted = [];
  for (const item of items) {
    if (!item.name) continue;
    const id = uuidv4();
    insertItem.run(id, req.params.id, item.name, item.amount || null, item.unit || null, orderIndex++);
    inserted.push(db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id));
  }

  res.status(201).json({ items: inserted });
});

// PUT /api/shopping/lists/:id/items/:itemId
router.put('/lists/:id/items/:itemId', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const item = db.prepare('SELECT * FROM shopping_items WHERE id = ? AND list_id = ?').get(req.params.itemId, req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { name, amount, unit, checked } = req.body;
  db.prepare(`
    UPDATE shopping_items SET
    name = ?, amount = ?, unit = ?, checked = ?
    WHERE id = ?
  `).run(
    name !== undefined ? name : item.name,
    amount !== undefined ? amount : item.amount,
    unit !== undefined ? unit : item.unit,
    checked !== undefined ? (checked ? 1 : 0) : item.checked,
    req.params.itemId
  );

  const updated = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(req.params.itemId);
  res.json({ item: updated });
});

// DELETE /api/shopping/lists/:id/items/:itemId
router.delete('/lists/:id/items/:itemId', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  db.prepare('DELETE FROM shopping_items WHERE id = ? AND list_id = ?').run(req.params.itemId, req.params.id);
  res.json({ message: 'Item deleted' });
});

// POST /api/shopping/lists/:id/add-recipe
router.post('/lists/:id/add-recipe', (req, res) => {
  const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { recipe_id, servings_multiplier = 1, checked_ingredient_ids = [] } = req.body;
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL').get(recipe_id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index').all(recipe_id);

  const maxIndex = db.prepare('SELECT MAX(order_index) as max FROM shopping_items WHERE list_id = ?').get(req.params.id);
  let orderIndex = (maxIndex.max || 0) + 1;

  const insertItem = db.prepare(
    'INSERT INTO shopping_items (id, list_id, name, amount, unit, checked, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const inserted = [];
  for (const ing of ingredients) {
    const id = uuidv4();
    const amount = ing.amount ? ing.amount * servings_multiplier : null;
    const checked = checked_ingredient_ids.includes(ing.id) ? 1 : 0;
    insertItem.run(id, req.params.id, ing.name, amount, ing.unit, checked, orderIndex++);
    inserted.push(db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id));
  }

  res.status(201).json({ items: inserted, added: inserted.length });
});

module.exports = router;
