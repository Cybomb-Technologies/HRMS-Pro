const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "leave_application",
        "leave_approved",
        "leave_rejected",
        "leave_cancelled",
        "announcement",
        "announcement_like",
        "announcement_comment",
        "onboarding_reminder",
        "onboarding_step_completed",
        "onboarding_completed",
        "onboarding_documents_submitted", // ✅ NEW: Document submission type
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      default: "leave",
    },
    moduleId: {
      type: mongoose.Schema.Types.Mixed, // ✅ CHANGED: Allow both ObjectId and String
    },
    relatedEmployeeId: {
      type: String,
    },
    relatedEmployeeName: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    actionUrl: {
      type: String,
    },
    tenantId: {
      type: String,
      default: "TENANT01",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ module: 1, moduleId: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
