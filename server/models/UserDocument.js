const mongoose = require("mongoose");

const userDocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "LetterTemplate", required: true },
  name: { type: String, required: true },
  file: {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    fileSize: Number,
    fileType: String,
  },
}, { timestamps: true });

userDocumentSchema.index({ user: 1, originalTemplate: 1 }, { unique: true });

module.exports = mongoose.model("UserDocument", userDocumentSchema);
