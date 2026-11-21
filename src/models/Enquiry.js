const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["booking", "contact"],
      default: "booking",
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
    },
    treatment: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      default: "60 min",
    },
    date: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
    guestName: {
      type: String,
      required: [true, "Guest name is required"],
      trim: true,
    },
    guestPhone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      default: "Website Form",
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate clean sequential ID (e.g. ENQ-1001, ENQ-1002)
enquirySchema.pre("save", async function (next) {
  if (!this.id) {
    const count = await mongoose.model("Enquiry").countDocuments();
    this.id = `ENQ-${1001 + count}`;
  }
  next();
});

module.exports = mongoose.model("Enquiry", enquirySchema);
