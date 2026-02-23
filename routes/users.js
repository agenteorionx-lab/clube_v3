const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Only Admin can access these routes
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isAdmin);

router.get('/', userController.list);
router.post('/', userController.create);
router.delete('/:id', userController.delete);

module.exports = router;
