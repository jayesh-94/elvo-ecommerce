const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      fullName: {
        type: String,
        default: "",
      },
      line1: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      postalCode: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
