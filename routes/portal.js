const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware.verifyToken, portalController.getMyData);
router.put('/me', authMiddleware.verifyToken, portalController.updateMyData);

module.exports = router;
