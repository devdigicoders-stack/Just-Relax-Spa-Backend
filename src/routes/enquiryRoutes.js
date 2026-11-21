const express = require("express");
const router = express.Router();
const {
  getEnquiries,
  createEnquiry,
  updateStatus,
  deleteEnquiry,
  getStats,
} = require("../controllers/enquiryController");

router.get("/stats", getStats);
router.get("/", getEnquiries);
router.post("/", createEnquiry);
router.patch("/:id", updateStatus);
router.delete("/:id", deleteEnquiry);

module.exports = router;
