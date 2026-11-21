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

exports.changePassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication token required" });
    }

    const secret = process.env.JWT_SECRET || "justrelaxspa_luxury_jwt_default";
    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin account not found" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Both current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long",
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Incorrect current password",
      });
    }

    admin.password = newPassword; // Mongoose pre('save') hashes it with bcrypt
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully. Please keep your new credentials secure.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
