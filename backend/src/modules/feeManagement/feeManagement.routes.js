const express = require("express");

const router = express.Router();

const feeRoutes = require("./routes/fee.routes");

router.use("/fees", feeRoutes);

module.exports = router;
