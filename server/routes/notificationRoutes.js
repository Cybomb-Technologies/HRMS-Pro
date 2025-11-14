const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  createAnnouncementNotification,
  createCommentNotification,
  createDocumentSubmissionNotification, // ✅ NEW
  createOnboardingReminder,
  createOnboardingStepCompletion,
  createOnboardingCompletion,
  testDocumentSubmissionNotification, // ✅ NEW: Test function
} = require("../controllers/notificationController");

// Existing routes
router.get("/:employeeId", getNotifications);
router.patch("/:id/read", markNotificationAsRead);
router.patch("/:employeeId/read-all", markAllNotificationsAsRead);
router.get("/:employeeId/unread-count", getUnreadNotificationCount);
router.delete("/:id", deleteNotification);

// NEW ROUTES for announcement notifications
router.post("/announcement", createAnnouncementNotification);
router.post("/comment", createCommentNotification);

// ✅ NEW ROUTE for document submission notifications
router.post("/documents/submitted", createDocumentSubmissionNotification);

// ✅ NEW: Test route for document submission notifications
router.post("/test/document-submission", testDocumentSubmissionNotification);

// NEW ROUTES for onboarding notifications
router.post("/onboarding/reminder", createOnboardingReminder);
router.post("/onboarding/step-completion", createOnboardingStepCompletion);
router.post("/onboarding/completion", createOnboardingCompletion);

module.exports = router;
