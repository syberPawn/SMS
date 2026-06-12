const express = require("express");

const examinationRoutes = require("./routes/examination.routes");

const router = express.Router();

/*
  Mount Examination Routes
*/

router.use("/examination", examinationRoutes);
router.get("/test-exam", (req, res) => {
  res.send("Exam route working");
});

module.exports = router;
