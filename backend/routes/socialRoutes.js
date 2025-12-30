const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const socialController = require('../controllers/socialController');

// 1. IMPORT THE UPLOAD MIDDLEWARE
const upload = require('../middlewares/uploadMiddleware'); 

// ==========================================
// 1. STATIC ROUTES
// ==========================================
router.get('/download', protect, socialController.downloadGrid); 
router.get('/board', protect, socialController.getSocialBoard);

// ==========================================
// 2. POST ROUTES
// ==========================================

// 2. INJECT MIDDLEWARE HERE
// 'files' must match the key used in frontend: formData.append('files', ...)
router.post('/upload', protect, upload.array('files'), socialController.uploadMedia);

router.post('/create-idea', protect, socialController.createSocialIdea);

// ==========================================
// 3. PUT ROUTES
// ==========================================
router.put('/grid-update', protect, socialController.updateGridPositions);
router.put('/task/:id', protect, socialController.updateSocialTask);

module.exports = router;