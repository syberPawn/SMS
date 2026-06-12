const express = require("express");
const router = express.Router();

const {
  create,
  deactivate,
  activate,
  getAll,
} = require("../controllers/subject.controller");

/*
  =====================================
  Subject Routes
  =====================================
*/

router.post("/", create);
router.patch("/:id/deactivate", deactivate);
router.patch("/:id/activate", activate);
router.get("/", getAll);

module.exports = router;
