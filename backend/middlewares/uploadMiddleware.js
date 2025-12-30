const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path'); // <--- IMPORT THIS
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderName = 'social-media-manager/misc';
        let resourceType = 'auto';

        if (file.mimetype.startsWith('video')) {
            folderName = 'social-media-manager/reels';
            resourceType = 'video';
        } else if (file.mimetype.startsWith('image')) {
            folderName = 'social-media-manager/images';
            resourceType = 'image';
        }

        // --- FIX: Strip extension to prevent .png.png ---
        const nameWithoutExt = path.parse(file.originalname).name;

        return {
            folder: folderName,
            resource_type: resourceType,
            // Use nameWithoutExt instead of file.originalname
            public_id: `${Date.now()}-${nameWithoutExt.replace(/\s+/g, '-')}`, 
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/x-matroska'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, MP4, and MOV are allowed.'), false);
        }
    }
});

module.exports = upload;