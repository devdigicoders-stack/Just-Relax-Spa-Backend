const Enquiry = require("../models/Enquiry");

// GET /api/enquiries - Paginated & filtered list
exports.getEnquiries = async (req, res) => {
  try {
    const { search, branch, status, type, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: "i" } },
        { guestPhone: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
        { treatment: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (branch && branch !== "All") {
      query.branch = { $regex: branch, $options: "i" };
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (type && type !== "All") {
      query.type = type;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: enquiries,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/enquiries - Create new enquiry
exports.createEnquiry = async (req, res) => {
  try {
    const { guestName, guestPhone, branch } = req.body;
    if (!guestName || !guestPhone) {
      return res.status(400).json({
        success: false,
        error: "Guest name and phone number are required",
      });
    }

    const enquiry = new Enquiry({
      ...req.body,
      branch: branch || "Jouri, a Murwab Hotel",
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/enquiries/:id - Update status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }] },
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/enquiries/:id - Delete enquiry
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    res.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/stats - Aggregated stats for Highcharts & KPIs
exports.getStats = async (req, res) => {
  try {
    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: "Pending" });
    const confirmed = await Enquiry.countDocuments({ status: "Confirmed" });
    const completed = await Enquiry.countDocuments({ status: "Completed" });
    const cancelled = await Enquiry.countDocuments({ status: "Cancelled" });

    // Branch breakdown
    const branchStats = await Enquiry.aggregate([
      { $group: { _id: "$branch", count: { $sum: 1 } } },
    ]);
    const branchDistribution = branchStats.map((b) => ({
      name: b._id || "Other",
      y: b.count,
    }));

    // Daily volume (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build complete 7-day category array
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      dailyMap[label] = 0;
    }
    dailyStats.forEach((item) => {
      if (dailyMap[item._id] !== undefined) {
        dailyMap[item._id] = item.count;
      }
    });

    const dailyTrend = {
      categories: Object.keys(dailyMap),
      data: Object.values(dailyMap),
    };

    // Top treatments requested
    const treatmentStats = await Enquiry.aggregate([
      { $match: { treatment: { $ne: "", $exists: true } } },
      { $group: { _id: "$treatment", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const topTreatments = treatmentStats.map((t) => ({
      name: t._id,
      count: t.count,
    }));

    res.json({
      success: true,
      stats: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        conversionRate: total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0,
      },
      charts: {
        branchDistribution,
        dailyTrend,
        topTreatments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
