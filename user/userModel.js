// require mongoose
const mongoose = require("mongoose");

// create a schema
const userSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  name: String,
  location: {
    type: String,
    default: "unknown",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  resetPasswordToken: {
    type: String,
    default: "",
  },
  resetPasswordExpires: {
    type: Date,
    default: null// 24 hours in milliseconds
  }
});

// create a model and export it
// User is model, users is collection
module.exports = mongoose.model("User", userSchema, "users");
