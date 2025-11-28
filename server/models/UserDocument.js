// models/UserDocument.js
const mongoose = require("mongoose");

const userDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LetterTemplate",
      required: true,
    },

    // (Optionally keep this if you already have it in DB; not used in Option 1 logic)
    clientInstanceId: {
      type: String,
      default: null,
      index: true,
    },

    // Name you will show in "Recent Letters" cards
    name: {
      type: String,
      required: true,
    },

    file: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      fileName: {
        type: String,
        required: true,
      },
      fileSize: Number,
      fileType: String,
    },
  },
  { timestamps: true }
);

// basic indexes
userDocumentSchema.index({ user: 1 });
userDocumentSchema.index({ originalTemplate: 1 });

module.exports = mongoose.model("UserDocument", userDocumentSchema);
