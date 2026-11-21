require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();

// Connect MongoDB Atlas
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/stats", (req, res, next) => {
  // Shortcut route alias for stats
  const { getStats } = require("./controllers/enquiryController");
  return getStats(req, res, next);
});

// Root & Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Just Relax Spa Doha - Official API Server",
    database: "MongoDB Atlas Connected",
    version: "1.0.0",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Just Relax Spa Server Running] on port ${PORT}`);
});
