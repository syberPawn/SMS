const express = require("express");

const router = express.Router();

const noticeRoutes = require("./routes/notice.routes");

/*a
  ==============================
  NOTICE ROUTES
  ==============================
*/

router.use("/notices", noticeRoutes);

module.exports = router;
