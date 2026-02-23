const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/photo', authMiddleware.verifyToken, uploadController.uploadMiddleware, uploadController.updatePhoto);

module.exports = router;
