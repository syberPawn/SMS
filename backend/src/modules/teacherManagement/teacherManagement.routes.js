const express = require("express");

const router = express.Router();

const teacherRoutes = require("./routes/teacher.routes");

router.use("/", teacherRoutes);

module.exports = router;
