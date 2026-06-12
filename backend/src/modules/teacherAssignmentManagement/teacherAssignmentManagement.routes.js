const express = require("express");
const router = express.Router();

/*
  =====================================
  Teacher Assignment Management Route Aggregator
  =====================================
*/

const teacherAssignmentRoutes = require("./routes/teacherAssignment.routes");

// Mount sub-routes
router.use("/", teacherAssignmentRoutes);

module.exports = router;
