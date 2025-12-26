const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 1. Ensure the upload directory exists automatically
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename: Replace spaces with dashes, add timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/\s+/g, '-');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    },
});

// 3. File Filter (Added Video Support)
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/jpg', 
        'image/webp',
        'video/mp4', 
        'video/quicktime', // .mov (iPhone videos)
        'video/x-matroska' // .mkv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, MP4, and MOV are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // Limit: 500MB for Reels
    }
});

module.exports = upload;