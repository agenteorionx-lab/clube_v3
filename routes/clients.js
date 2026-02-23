const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.verifyToken);

router.get('/', clientController.list);
router.post('/', clientController.create);
router.post('/:id/pay', clientController.confirmPayment);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

module.exports = router;
