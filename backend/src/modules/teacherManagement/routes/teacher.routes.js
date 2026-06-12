const express = require("express");

const router = express.Router();

const { create, getAll } = require("../controllers/teacher.controller");

router.post("/teachers", create);
router.get("/teachers", getAll);

module.exports = router;
