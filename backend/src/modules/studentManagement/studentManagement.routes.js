const express = require("express");
const router = express.Router();

const studentIdentityRoutes = require("./routes/studentIdentity.routes");
const studentEnrollmentRoutes = require("./routes/studentEnrollment.routes");

/*
  Aggregate Student Management Routes
*/

router.use(studentIdentityRoutes);
router.use(studentEnrollmentRoutes);

module.exports = router;
