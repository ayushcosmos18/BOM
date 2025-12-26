const Task = require("../models/Task");
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Upload media files (Images/Videos) for Social Posts
 * @route   POST /api/social/upload
 */
exports.uploadMedia = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => {
            return {
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                filePath: `/uploads/${file.filename}` 
            };
        });

        res.status(200).json({
            message: 'Media uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error("Social Media Upload Error:", error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};

/**
 * @desc    Create a new Social Idea (Left Side Card)
 * @route   POST /api/social/create-idea
 */
exports.createSocialIdea = async (req, res) => {
    try {
        const { projectId, title, postType, platform } = req.body;

        const newTask = await Task.create({
            project: projectId,
            title: title || "New Social Post",
            isSocialPost: true,
            status: "Pending",
            createdBy: req.user._id,
            socialMeta: {
                postType: postType || 'static',
                platform: platform || 'Instagram',
                isPosted: false,
                gridIndex: null // Starts in the "Warehouse" (Left Side)
            }
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating social idea:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Get the Social Board Data (Left & Right Panels)
 * @route   GET /api/social/board
 */
exports.getSocialBoard = async (req, res) => {
    try {
        const { projectId, month, year } = req.query;
        const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;

        // 1. Fetch "Warehouse" Items (Left Side)
        // UPDATED LOGIC: Only show items that are NOT on the grid anywhere.
        // This ensures "used" posts don't appear when switching months.
        const warehouseTasks = await Task.find({
            project: projectId,
            isSocialPost: true,
            "socialMeta.gridIndex": null, // STRICT: Must not be on grid
            "socialMeta.isPosted": false  // And not marked as posted/done
        }).sort({ createdAt: -1 });

        // 2. Fetch "Grid" Items (Right Side)
        // Logic: Assigned to grid AND belongs to current selected month
        const gridTasks = await Task.find({
            project: projectId,
            isSocialPost: true,
            "socialMeta.plannedMonth": formattedMonth,
            "socialMeta.gridIndex": { $ne: null }
        }).sort({ "socialMeta.gridIndex": 1 });

        res.json({
            warehouse: warehouseTasks,
            grid: gridTasks
        });
    } catch (error) {
        console.error("Error fetching social board:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Update Social Task Details
 * @route   PUT /api/social/task/:id
 */
exports.updateSocialTask = async (req, res) => {
    try {
        const { caption, hashtags, isPosted, mediaFiles, postType, gridDisplayImage, title, dueDate, assignedTo } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: "Task not found" });

        // Standard Task Updates
        if (title) task.title = title;
        if (dueDate) task.dueDate = dueDate;
        if (assignedTo) task.assignedTo = assignedTo;

        // Social Meta Updates
        if (caption !== undefined) task.socialMeta.caption = caption;
        if (hashtags !== undefined) task.socialMeta.hashtags = hashtags;
        if (isPosted !== undefined) task.socialMeta.isPosted = isPosted;
        if (postType !== undefined) task.socialMeta.postType = postType;
        if (mediaFiles && Array.isArray(mediaFiles)) task.socialMeta.mediaFiles = mediaFiles;
        if (gridDisplayImage) task.socialMeta.gridDisplayImage = gridDisplayImage;

        if (mediaFiles && mediaFiles.length > 0 && task.status === 'Pending') {
            task.status = 'In Progress';
        }

        await task.save();
        res.json(task);
    } catch (error) {
        console.error("Error updating social task:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Handle Drag-and-Drop Logic (Move between Left/Right or Reorder)
 * @route   PUT /api/social/grid-update
 */
exports.updateGridPositions = async (req, res) => {
    try {
        const { updates } = req.body; 

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ message: "Invalid updates array" });
        }

        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update.taskId },
                update: {
                    $set: {
                        "socialMeta.gridIndex": update.gridIndex, // Can be null (back to warehouse) or 0-11
                        "socialMeta.plannedMonth": update.plannedMonth // Can be null or "2025-02"
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await Task.bulkWrite(bulkOps);
        }

        res.json({ message: "Grid updated successfully" });
    } catch (error) {
        console.error("Error updating grid:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Download a ZIP of the Grid for a specific month
 * @route   GET /api/social/download
 */
exports.downloadGrid = async (req, res) => {
    try {
        const { projectId, month, year } = req.query;
        // Format: "2025-02"
        const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;

        // 1. Fetch only Tasks on the Grid
        const gridTasks = await Task.find({
            project: projectId,
            isSocialPost: true,
            "socialMeta.plannedMonth": formattedMonth,
            "socialMeta.gridIndex": { $ne: null }
        }).sort({ "socialMeta.gridIndex": 1 });

        if (gridTasks.length === 0) {
            return res.status(404).json({ message: "No posts found on the grid for this month." });
        }

        // 2. Setup Archiver (The Zipper)
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Tell browser this is a file download
        res.attachment(`SocialGrid-${formattedMonth}.zip`);
        
        // Pipe the zip stream directly to the response (efficient!)
        archive.pipe(res);

        // 3. Loop and Pack Files
        const rootDir = `${formattedMonth}`; // Top folder inside zip

        for (const task of gridTasks) {
            const index = task.socialMeta.gridIndex + 1; // 1-based index (e.g., 01, 02)
            const prefix = index.toString().padStart(2, '0');
            // Sanitize title for filename
            const safeTitle = (task.title || 'untitled').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
            
            const type = task.socialMeta.postType || 'static';
            const mediaFiles = task.socialMeta.mediaFiles || [];

            if (mediaFiles.length === 0) continue;

            // --- FOLDER STRATEGY ---
            if (type === 'carousel') {
                // Folder: /Carousels/01_Title/
                mediaFiles.forEach((file, i) => {
                    const relativePath = file.url.startsWith('/') ? file.url.slice(1) : file.url;
                    const filePath = path.join(__dirname, '..', relativePath); 
                    
                    if (fs.existsSync(filePath)) {
                        archive.file(filePath, { 
                            name: `${rootDir}/Carousels/${prefix}_${safeTitle}/${i + 1}${path.extname(file.originalName || file.url)}` 
                        });
                    }
                });

                // Add Caption Text
                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Carousels/${prefix}_${safeTitle}/caption.txt` });
                }

            } else if (type === 'reel') {
                // Folder: /Reels/02_Title/
                const videoFile = mediaFiles.find(f => f.mimeType.includes('video')) || mediaFiles[0];
                const relativePath = videoFile.url.startsWith('/') ? videoFile.url.slice(1) : videoFile.url;
                const videoPath = path.join(__dirname, '..', relativePath);

                if (fs.existsSync(videoPath)) {
                    archive.file(videoPath, { 
                        name: `${rootDir}/Reels/${prefix}_${safeTitle}/${prefix}_video${path.extname(videoFile.originalName || videoFile.url)}` 
                    });
                }

                // Add Cover Art if exists
                const coverUrl = task.socialMeta.gridDisplayImage;
                if (coverUrl && coverUrl !== videoFile.url) {
                    const relCoverPath = coverUrl.startsWith('/') ? coverUrl.slice(1) : coverUrl;
                    const coverPath = path.join(__dirname, '..', relCoverPath);
                    if (fs.existsSync(coverPath)) {
                        archive.file(coverPath, { name: `${rootDir}/Reels/${prefix}_${safeTitle}/cover.jpg` });
                    }
                }

                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Reels/${prefix}_${safeTitle}/caption.txt` });
                }

            } else {
                // Folder: /Statics/ (Files directly inside)
                const file = mediaFiles[0];
                const relativePath = file.url.startsWith('/') ? file.url.slice(1) : file.url;
                const filePath = path.join(__dirname, '..', relativePath);

                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { 
                        name: `${rootDir}/Statics/${prefix}_${safeTitle}${path.extname(file.originalName || file.url)}` 
                    });
                }
                
                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Statics/${prefix}_${safeTitle}_caption.txt` });
                }
            }
        }

        // Finalize the zip (closes the stream)
        await archive.finalize();

    } catch (error) {
        console.error("Download Grid Error:", error);
        if (!res.headersSent) res.status(500).json({ message: "Server Error" });
    }
};