const Task = require("../models/Task");
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // <--- THIS WAS MISSING

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
                filePath: file.path // Cloudinary URL
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
                gridIndex: null
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

        const warehouseTasks = await Task.find({
            project: projectId,
            isSocialPost: true,
            "socialMeta.gridIndex": null,
            "socialMeta.isPosted": false
        }).sort({ createdAt: -1 });

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

        if (title) task.title = title;
        if (dueDate) task.dueDate = dueDate;
        if (assignedTo) task.assignedTo = assignedTo;

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
 * @desc    Handle Drag-and-Drop Logic
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
                        "socialMeta.gridIndex": update.gridIndex,
                        "socialMeta.plannedMonth": update.plannedMonth
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
 * @desc    Download a ZIP of the Grid for a specific month (Cloudinary Compatible)
 * @route   GET /api/social/download
 */
exports.downloadGrid = async (req, res) => {
    try {
        const { projectId, month, year } = req.query;
        const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;

        const gridTasks = await Task.find({
            project: projectId,
            isSocialPost: true,
            "socialMeta.plannedMonth": formattedMonth,
            "socialMeta.gridIndex": { $ne: null }
        }).sort({ "socialMeta.gridIndex": 1 });

        if (gridTasks.length === 0) {
            return res.status(404).json({ message: "No posts found on the grid for this month." });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`SocialGrid-${formattedMonth}.zip`);
        archive.pipe(res);

        const rootDir = `${formattedMonth}`;

        // --- SELF-HEALING DOWNLOADER ---
        const appendRemoteFile = async (url, archivePath) => {
            try {
                // Try 1: Normal Download
                const response = await axios.get(url, { responseType: 'stream' });
                archive.append(response.data, { name: archivePath });
            } catch (err) {
                // Try 2: Fix Double Extension (e.g., .png.png -> .png)
                if (url && url.match(/\.(\w+)\.\1$/)) {
                    try {
                        console.log(`Attempting to fix broken URL: ${url}`);
                        const fixedUrl = url.replace(/(\.\w+)$/, ''); // Remove the last extension
                        const retryResponse = await axios.get(fixedUrl, { responseType: 'stream' });
                        archive.append(retryResponse.data, { name: archivePath });
                        return; // Success! Exit function.
                    } catch (retryErr) {
                        console.error(`Retry failed for ${url}`);
                    }
                }

                console.error(`Failed to download ${url}`, err.message);
                archive.append(`Failed to download: ${url}\nError: ${err.message}`, { name: `${archivePath}.error.txt` });
            }
        };

        for (const task of gridTasks) {
            const index = task.socialMeta.gridIndex + 1;
            const prefix = index.toString().padStart(2, '0');
            const safeTitle = (task.title || 'untitled').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
            
            const type = task.socialMeta.postType || 'static';
            const mediaFiles = task.socialMeta.mediaFiles || [];

            if (mediaFiles.length === 0) continue;

            if (type === 'carousel') {
                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    const fileUrl = file.filePath || file.url; 
                    const ext = path.extname(file.originalName || 'image.jpg') || '.jpg';
                    const archivePath = `${rootDir}/Carousels/${prefix}_${safeTitle}/${i + 1}${ext}`;
                    
                    await appendRemoteFile(fileUrl, archivePath);
                }
                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Carousels/${prefix}_${safeTitle}/caption.txt` });
                }

            } else if (type === 'reel') {
                const videoFile = mediaFiles.find(f => f.mimeType.includes('video')) || mediaFiles[0];
                const fileUrl = videoFile.filePath || videoFile.url;
                const ext = path.extname(videoFile.originalName || 'video.mp4') || '.mp4';
                
                await appendRemoteFile(fileUrl, `${rootDir}/Reels/${prefix}_${safeTitle}/${prefix}_video${ext}`);

                const coverUrl = task.socialMeta.gridDisplayImage;
                if (coverUrl && coverUrl !== fileUrl) {
                     await appendRemoteFile(coverUrl, `${rootDir}/Reels/${prefix}_${safeTitle}/cover.jpg`);
                }
                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Reels/${prefix}_${safeTitle}/caption.txt` });
                }

            } else {
                const file = mediaFiles[0];
                const fileUrl = file.filePath || file.url;
                const ext = path.extname(file.originalName || 'image.jpg') || '.jpg';
                
                await appendRemoteFile(fileUrl, `${rootDir}/Statics/${prefix}_${safeTitle}${ext}`);
                
                if (task.socialMeta.caption) {
                    archive.append(task.socialMeta.caption, { name: `${rootDir}/Statics/${prefix}_${safeTitle}_caption.txt` });
                }
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error("Download Grid Error:", error);
        if (!res.headersSent) res.status(500).json({ message: "Server Error" });
    }
};