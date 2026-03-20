const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

function getRecipeWithDetails(id) {
  const recipe = db.prepare(`
    SELECT r.*, u.username as author
    FROM recipes r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id);
  if (!recipe) return null;

  recipe.ingredients = db.prepare(
    'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index'
  ).all(id);

  recipe.steps = db.prepare(
    'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index'
  ).all(id);

  const tagRows = db.prepare(`
    SELECT t.name FROM tags t
    JOIN recipe_tags rt ON rt.tag_id = t.id
    WHERE rt.recipe_id = ?
  `).all(id);
  recipe.tags = tagRows.map(t => t.name);

  return recipe;
}

// GET /api/recipes
router.get('/', optionalAuth, (req, res) => {
  const { category, tag, search, my } = req.query;
  let query = `
    SELECT r.*, u.username as author
    FROM recipes r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.deleted_at IS NULL
  `;
  const params = [];

  if (my === 'true' && req.user) {
    query += ' AND r.user_id = ?';
    params.push(req.user.id);
  } else if (!req.user) {
    query += ' AND r.is_public = 1';
  } else {
    query += ' AND (r.is_public = 1 OR r.user_id = ?)';
    params.push(req.user.id);
  }

  if (category) {
    query += ' AND r.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (tag) {
    query += ` AND r.id IN (
      SELECT rt.recipe_id FROM recipe_tags rt
      JOIN tags t ON t.id = rt.tag_id
      WHERE t.name = ?
    )`;
    params.push(tag);
  }

  query += ' ORDER BY r.created_at DESC';

  const recipes = db.prepare(query).all(...params);

  // Add tags to each recipe
  for (const recipe of recipes) {
    const tagRows = db.prepare(`
      SELECT t.name FROM tags t
      JOIN recipe_tags rt ON rt.tag_id = t.id
      WHERE rt.recipe_id = ?
    `).all(recipe.id);
    recipe.tags = tagRows.map(t => t.name);
  }

  res.json({ recipes });
});

// GET /api/recipes/trash
router.get('/trash', auth, (req, res) => {
  let query = `
    SELECT r.*, u.username as author
    FROM recipes r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.deleted_at IS NOT NULL
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' AND r.user_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY r.deleted_at DESC';
  const recipes = db.prepare(query).all(...params);

  for (const recipe of recipes) {
    const tagRows = db.prepare(`
      SELECT t.name FROM tags t
      JOIN recipe_tags rt ON rt.tag_id = t.id
      WHERE rt.recipe_id = ?
    `).all(recipe.id);
    recipe.tags = tagRows.map(t => t.name);
  }

  res.json({ recipes });
});

// GET /api/recipes/:id
router.get('/:id', optionalAuth, (req, res) => {
  const recipe = getRecipeWithDetails(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  if (recipe.deleted_at) return res.status(404).json({ error: 'Recipe not found' });

  if (!recipe.is_public) {
    if (!req.user || (req.user.id !== recipe.user_id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  res.json({ recipe });
});

// POST /api/recipes
router.post('/', auth, (req, res) => {
  const { title, description, category, prep_time, cook_time, rest_time, servings, is_public, ingredients, steps, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO recipes (id, user_id, title, description, category, prep_time, cook_time, rest_time, servings, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, title, description || null, category || null,
    prep_time || null, cook_time || null, rest_time || null, servings || null, is_public ? 1 : 0);

  // Insert ingredients
  if (ingredients && ingredients.length > 0) {
    const insertIng = db.prepare(
      'INSERT INTO ingredients (id, recipe_id, name, amount, unit, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    );
    ingredients.forEach((ing, idx) => {
      insertIng.run(uuidv4(), id, ing.name, ing.amount || null, ing.unit || null, idx);
    });
  }

  // Insert steps
  if (steps && steps.length > 0) {
    const insertStep = db.prepare(
      'INSERT INTO steps (id, recipe_id, description, order_index) VALUES (?, ?, ?, ?)'
    );
    steps.forEach((step, idx) => {
      insertStep.run(uuidv4(), id, step.description, idx);
    });
  }

  // Insert tags
  if (tags && tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
    const insertRecipeTag = db.prepare('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)');
    tags.forEach(tagName => {
      insertTag.run(uuidv4(), tagName);
      const tag = getTag.get(tagName);
      if (tag) insertRecipeTag.run(id, tag.id);
    });
  }

  const recipe = getRecipeWithDetails(id);
  res.status(201).json({ recipe });
});

// PUT /api/recipes/:id
router.put('/:id', auth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  if (req.user.id !== recipe.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, category, prep_time, cook_time, rest_time, servings, is_public, ingredients, steps, tags } = req.body;

  db.prepare(`
    UPDATE recipes SET title=?, description=?, category=?, prep_time=?, cook_time=?, rest_time=?,
    servings=?, is_public=?, updated_at=datetime('now') WHERE id=?
  `).run(
    title || recipe.title, description !== undefined ? description : recipe.description,
    category || recipe.category, prep_time !== undefined ? prep_time : recipe.prep_time,
    cook_time !== undefined ? cook_time : recipe.cook_time,
    rest_time !== undefined ? rest_time : recipe.rest_time,
    servings !== undefined ? servings : recipe.servings,
    is_public !== undefined ? (is_public ? 1 : 0) : recipe.is_public,
    req.params.id
  );

  // Update ingredients
  if (ingredients !== undefined) {
    db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(req.params.id);
    const insertIng = db.prepare(
      'INSERT INTO ingredients (id, recipe_id, name, amount, unit, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    );
    ingredients.forEach((ing, idx) => {
      insertIng.run(uuidv4(), req.params.id, ing.name, ing.amount || null, ing.unit || null, idx);
    });
  }

  // Update steps
  if (steps !== undefined) {
    db.prepare('DELETE FROM steps WHERE recipe_id = ?').run(req.params.id);
    const insertStep = db.prepare(
      'INSERT INTO steps (id, recipe_id, description, order_index) VALUES (?, ?, ?, ?)'
    );
    steps.forEach((step, idx) => {
      insertStep.run(uuidv4(), req.params.id, step.description, idx);
    });
  }

  // Update tags
  if (tags !== undefined) {
    db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(req.params.id);
    if (tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
      const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const insertRecipeTag = db.prepare('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)');
      tags.forEach(tagName => {
        insertTag.run(uuidv4(), tagName);
        const tag = getTag.get(tagName);
        if (tag) insertRecipeTag.run(req.params.id, tag.id);
      });
    }
  }

  const updated = getRecipeWithDetails(req.params.id);
  res.json({ recipe: updated });
});

// DELETE /api/recipes/:id (soft delete)
router.delete('/:id', auth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  if (req.user.id !== recipe.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare("UPDATE recipes SET deleted_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ message: 'Recipe moved to trash' });
});

// POST /api/recipes/:id/restore
router.post('/:id/restore', auth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NOT NULL').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found in trash' });

  if (req.user.id !== recipe.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('UPDATE recipes SET deleted_at = NULL WHERE id = ?').run(req.params.id);
  res.json({ message: 'Recipe restored' });
});

// DELETE /api/recipes/:id/permanent
router.delete('/:id/permanent', auth, adminOnly, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(req.params.id);
  db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(req.params.id);
  db.prepare('DELETE FROM steps WHERE recipe_id = ?').run(req.params.id);
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Recipe permanently deleted' });
});

// GET /api/recipes/:id/share
router.get('/:id/share', optionalAuth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  if (!recipe.is_public && (!req.user || (req.user.id !== recipe.user_id && req.user.role !== 'admin'))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ shareUrl: `/recipes/${req.params.id}`, isPublic: !!recipe.is_public });
});

// POST /api/recipes/export
router.post('/export', auth, (req, res) => {
  const recipes = db.prepare(`
    SELECT * FROM recipes WHERE user_id = ? AND deleted_at IS NULL
  `).all(req.user.id);

  const exportData = recipes.map(recipe => {
    const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index').all(recipe.id);
    const steps = db.prepare('SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index').all(recipe.id);
    const tagRows = db.prepare(`
      SELECT t.name FROM tags t JOIN recipe_tags rt ON rt.tag_id = t.id WHERE rt.recipe_id = ?
    `).all(recipe.id);
    return { ...recipe, ingredients, steps, tags: tagRows.map(t => t.name) };
  });

  res.json({ recipes: exportData, exportedAt: new Date().toISOString(), version: '1.0.0' });
});

// POST /api/recipes/import
router.post('/import', auth, (req, res) => {
  const { recipes } = req.body;
  if (!Array.isArray(recipes)) return res.status(400).json({ error: 'Invalid import format' });

  let imported = 0;
  let skipped = 0;

  const importTx = db.transaction(() => {
    for (const recipe of recipes) {
      if (!recipe.id || !recipe.title) { skipped++; continue; }

      const existing = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipe.id);
      if (existing) { skipped++; continue; }

      db.prepare(`
        INSERT INTO recipes (id, user_id, title, description, category, prep_time, cook_time, rest_time, servings, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recipe.id, req.user.id, recipe.title, recipe.description || null,
        recipe.category || null, recipe.prep_time || null, recipe.cook_time || null,
        recipe.rest_time || null, recipe.servings || null, recipe.is_public || 0,
        recipe.created_at || new Date().toISOString(), recipe.updated_at || new Date().toISOString()
      );

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const insertIng = db.prepare(
          'INSERT OR IGNORE INTO ingredients (id, recipe_id, name, amount, unit, order_index) VALUES (?, ?, ?, ?, ?, ?)'
        );
        recipe.ingredients.forEach((ing, idx) => {
          insertIng.run(ing.id || uuidv4(), recipe.id, ing.name, ing.amount || null, ing.unit || null, idx);
        });
      }

      if (recipe.steps && recipe.steps.length > 0) {
        const insertStep = db.prepare(
          'INSERT OR IGNORE INTO steps (id, recipe_id, description, order_index) VALUES (?, ?, ?, ?)'
        );
        recipe.steps.forEach((step, idx) => {
          insertStep.run(step.id || uuidv4(), recipe.id, step.description, idx);
        });
      }

      if (recipe.tags && recipe.tags.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
        const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
        const insertRecipeTag = db.prepare('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)');
        recipe.tags.forEach(tagName => {
          insertTag.run(uuidv4(), tagName);
          const tag = getTag.get(tagName);
          if (tag) insertRecipeTag.run(recipe.id, tag.id);
        });
      }

      imported++;
    }
  });

  importTx();
  res.json({ imported, skipped, message: `Imported ${imported} recipes, skipped ${skipped} duplicates` });
});

module.exports = router;
