const express = require("express");
const router = express.Router();

const {
  create,
  deactivate,
  getByGrade,
} = require("../controllers/section.controller");

/*
  =====================================
  Section Routes
  =====================================
*/

router.post("/", create);
router.patch("/:id/deactivate", deactivate);
router.get("/", getByGrade);

module.exports = router;
