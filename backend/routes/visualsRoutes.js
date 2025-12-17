const express = require("express");
const router = express.Router();
// 👇 1. IMPORT the new function
const { getProjectWorkMap, getProductionFlowSankey, createProductionLog } = require("../controllers/visualsController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Route for the Project Work Map (moved from projectRoutes.js)
router.get("/:id/work-map", protect, getProjectWorkMap);

// Route for the new CEO Sankey Diagram
router.get("/production-flow", protect, adminOnly, getProductionFlowSankey);

// Route to create new log data (for Postman)
// 👇 2. ADD THIS NEW ROUTE
router.post("/production-log", protect, adminOnly, createProductionLog);

module.exports = router;