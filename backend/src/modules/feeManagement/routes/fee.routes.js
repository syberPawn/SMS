const express = require("express");

const router = express.Router();

const {
  createFeeStructureController,
  getFeeStructureController,
  recordPaymentController,
  getStudentMonthlyStatusController,
  getSectionMonthlySummaryController,
} = require("../controllers/fee.controller");

/*
  ==============================
  FEE STRUCTURE
  ==============================
*/

router.post("/structure", createFeeStructureController);

router.get("/structure", getFeeStructureController);

/*
  ==============================
  RECORD PAYMENT
  ==============================
*/

router.post("/payment", recordPaymentController);

/*
  ==============================
  STUDENT MONTHLY STATUS
  ==============================
*/

router.get("/student-status", getStudentMonthlyStatusController);

/*
  ==============================
  SECTION MONTHLY SUMMARY
  ==============================
*/

router.get("/section-summary", getSectionMonthlySummaryController);

module.exports = router;
