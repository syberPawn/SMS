const express = require("express");
const router = express.Router();

/*
  =====================================
  Academic Structure Route Aggregator
  =====================================
*/

const academicYearRoutes = require("./routes/academicYear.routes");
const gradeRoutes = require("./routes/grade.routes");
const sectionRoutes = require("./routes/section.routes");
const subjectRoutes = require("./routes/subject.routes");
const gradeSubjectMappingRoutes = require("./routes/gradeSubjectMapping.routes");

// Mount sub-routes
router.use("/academic-years", academicYearRoutes);
router.use("/grades", gradeRoutes);
router.use("/sections", sectionRoutes);
router.use("/subjects", subjectRoutes);
router.use("/grade-subject-mappings", gradeSubjectMappingRoutes);

module.exports = router;
