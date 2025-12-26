const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const socialController = require('../controllers/socialController');

// ==========================================
// 1. STATIC ROUTES MUST COME FIRST
// ==========================================

// This specific route must be defined BEFORE any generic /:id routes
router.get('/download', protect, socialController.downloadGrid); 

router.get('/board', protect, socialController.getSocialBoard);

// ==========================================
// 2. DYNAMIC ROUTES COME LAST
// ==========================================

// If you have something like this, it must be at the bottom:
// router.get('/:id', protect, socialController.getSocialTaskById); 

// POST Routes
router.post('/upload', protect, socialController.uploadMedia);
router.post('/create-idea', protect, socialController.createSocialIdea);

// PUT Routes
router.put('/grid-update', protect, socialController.updateGridPositions);
router.put('/task/:id', protect, socialController.updateSocialTask);

module.exports = router;