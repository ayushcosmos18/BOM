const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, required: true },
});

const remarkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

const revisionLogSchema = new mongoose.Schema({
    comment: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

// --- NEW: Social Media Specific Sub-Schema ---
const socialMetaSchema = new mongoose.Schema({
    // Defines exactly what the UI should render
    postType: { type: String, enum: ['static', 'carousel', 'reel'], default: 'static' },

    // The Grid Representation (What shows on the Right Side Grid)
    gridDisplayImage: { type: String }, 

    // The Actual Content (Stored on your Local PC)
    mediaFiles: [{
        url: { type: String },       // "http://192.168.x.x:5000/uploads/vid.mp4"
        mimeType: { type: String },  // "video/mp4" or "image/jpeg"
        originalName: { type: String }
    }],

    caption: { type: String },
    hashtags: { type: String },
    
    // Position on the Right-Side Grid (0-11 usually). Null if still in Left Zone.
    gridIndex: { type: Number, default: null },
    
    // Which "Month Bucket" this belongs to (e.g., "2025-02")
    plannedMonth: { type: String },
    
    // THE CHECKBOX: True = Posted, False = Pending
    isPosted: { type: Boolean, default: false },
    
    // Optional: Platform specific status
    platform: { type: String, enum: ['Instagram', 'LinkedIn', 'YouTube'], default: 'Instagram' }
}, { _id: false }); // No separate ID needed for this sub-object

const TaskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    
    // --- NEW: Flag to identify this as a Social Media Task ---
    isSocialPost: { type: Boolean, default: false },
    socialMeta: { type: socialMetaSchema, default: {} },
    // --------------------------------------------------------

    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    reviewers: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    reviewStatus: {
        type: String,
        enum: ['NotSubmitted', 'PendingReview', 'PendingFinalApproval', 'Approved', 'ChangesRequested'],
        default: 'NotSubmitted'
    },
    revisionCount: { type: Number, default: 0 },
    revisionHistory: [revisionLogSchema],
    
    lastNudgedAt: { type: Date, default: null },
    startDate: { type: Date },
    dueDate: { type: Date }, // Removed 'required: true' to allow flexibility for ideas
    estimatedHours: { type: Number, default: 0 },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
    remarks: [remarkSchema],
    comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);