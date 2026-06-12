const express = require("express");
const router = express.Router();

const analyticsRoutes = require("./routes/analytics.routes");

/*
  ==============================
  Dashboard Analytics Module Routes
  ==============================
*/

router.use("/analytics", analyticsRoutes);

module.exports = router;
