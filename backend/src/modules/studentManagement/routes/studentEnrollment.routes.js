const express = require("express");
const router = express.Router();

const {
  create,
  updateClass,
  updateStatus,
  getAll,
} = require("../controllers/studentEnrollment.controller");

/*
  Enrollment Routes
*/

router.post("/enrollments", create);
router.patch("/enrollments/:id/class", updateClass);
router.patch("/enrollments/:id/status", updateStatus);
router.get("/enrollments", getAll);

module.exports = router;
