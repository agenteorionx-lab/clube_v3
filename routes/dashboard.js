const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware.verifyToken, dashboardController.getStats);
router.get('/reports', authMiddleware.verifyToken, authMiddleware.isAdmin, dashboardController.getReports);

module.exports = router;
