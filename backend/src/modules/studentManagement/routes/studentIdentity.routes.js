const express = require("express");
const router = express.Router();

const {
  create,
  update,
  deactivate,
  getProfile,
  getAll,
} = require("../controllers/studentIdentity.controller");
const {
  createCombined,
} = require("../controllers/studentOnboarding.controller");

/*
  Student Identity Routes
*/

router.post("/students", create);
router.post("/students/onboard", createCombined);
router.patch("/students/:id", update);
router.patch("/students/:id/deactivate", deactivate);
router.get("/students", getAll);
router.get("/students/:id", getProfile);

module.exports = router;
