const express = require("express");

const router = express.Router();

const {
  createNoticeController,
  getNoticesForAdminController,
  getActiveNoticesController,
  changeNoticeStatusController,
} = require("../controllers/notice.controller");

/*
  ==============================
  CREATE NOTICE
  ==============================
*/

router.post("/", createNoticeController);

/*
  ==============================
  ADMIN NOTICE LISTING
  ==============================
*/

router.get("/admin", getNoticesForAdminController);

/*
  ==============================
  ACTIVE NOTICES (TEACHER/STUDENT)
  ==============================
*/

router.get("/", getActiveNoticesController);

/*
  ==============================
  CHANGE NOTICE STATUS
  ==============================
*/

router.patch("/:id/status", changeNoticeStatusController);

module.exports = router;
