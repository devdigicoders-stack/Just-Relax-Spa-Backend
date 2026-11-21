const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Please enter both username and password",
      });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const secret = process.env.JWT_SECRET || "justrelaxspa_luxury_jwt_default";
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      secret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const secret = process.env.JWT_SECRET || "justrelaxspa_luxury_jwt_default";
    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin user not found" });
    }

    res.json({ success: true, user: admin });
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};
