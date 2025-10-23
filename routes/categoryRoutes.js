const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// CRUD routes (commented for now)
// router.post('/', categoryController.createCategory);
// router.put('/:id', categoryController.updateCategory);
// router.delete('/:id', categoryController.deleteCategory);

// Get all categories
router.get('/', categoryController.getCategories);

// Get category by slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Get category by id
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
