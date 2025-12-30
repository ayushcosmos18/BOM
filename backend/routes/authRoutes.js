const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware"); // This is now your Cloudinary middleware
const router = express.Router();

// AuthRoutes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// --- FIX: Return Cloudinary URL directly ---
router.post("/upload-image", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Cloudinary storage puts the full secure URL in 'path'
    // We no longer need to construct a local URL with req.protocol/host
    const imageUrl = req.file.path; 

    res.status(200).json({ imageUrl });
});

module.exports = router;