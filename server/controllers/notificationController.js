const Notification = require("../models/Notification");

// Create notification
const createNotification = async (notificationData) => {
  try {
    console.log(
      "🔔 [DEBUG] Creating notification with data:",
      notificationData
    );

    // Validate required fields
    const requiredFields = [
      "recipientId",
      "recipientEmail",
      "senderId",
      "senderName",
      "type",
      "title",
      "message",
    ];
    const missingFields = requiredFields.filter(
      (field) => !notificationData[field]
    );

    if (missingFields.length > 0) {
      console.error("❌ [DEBUG] Missing required fields:", missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const notification = new Notification(notificationData);
    await notification.save();
    console.log(
      "✅ [DEBUG] Notification created successfully:",
      notification._id
    );
    return notification;
  } catch (error) {
    console.error("❌ [DEBUG] Error creating notification:", error.message);
    console.error("❌ [DEBUG] Full error:", error);
    throw error;
  }
};

// Get notifications for employee
const getNotifications = async (req, res) => {
  try {
    console.log("🔔 [DEBUG] Getting notifications for employee");
    const { employeeId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    console.log("🔔 [DEBUG] Request params:", { employeeId, limit, page });

    if (!employeeId) {
      console.error("❌ [DEBUG] Employee ID is required");
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const skip = (page - 1) * limit;

    console.log("🔔 [DEBUG] Querying notifications for:", employeeId);
    const notifications = await Notification.find({
      recipientId: employeeId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({
      recipientId: employeeId,
    });

    console.log("✅ [DEBUG] Found notifications:", notifications.length);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ [DEBUG] Error getting notifications:", error.message);
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔔 [DEBUG] Marking notification as read:", id);

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      console.error("❌ [DEBUG] Notification not found:", id);
      return res.status(404).json({ message: "Notification not found" });
    }

    console.log("✅ [DEBUG] Notification marked as read:", id);
    res.json(notification);
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error marking notification as read:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(
      "🔔 [DEBUG] Marking all notifications as read for:",
      employeeId
    );

    const result = await Notification.updateMany(
      { recipientId: employeeId, isRead: false },
      { isRead: true }
    );

    console.log(
      "✅ [DEBUG] Marked all as read. Modified count:",
      result.modifiedCount
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error marking all notifications as read:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("🔔 [DEBUG] Getting unread count for:", employeeId);

    const count = await Notification.countDocuments({
      recipientId: employeeId,
      isRead: false,
    });

    console.log("✅ [DEBUG] Unread count:", count);
    res.json({ count });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error getting unread notification count:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔔 [DEBUG] Deleting notification:", id);

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      console.error("❌ [DEBUG] Notification not found for deletion:", id);
      return res.status(404).json({ message: "Notification not found" });
    }

    console.log("✅ [DEBUG] Notification deleted successfully:", id);
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ [DEBUG] Error deleting notification:", error.message);
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create announcement notification for all employees
const createAnnouncementNotification = async (announcementData) => {
  try {
    const { announcementId, title, author, authorId } = announcementData;

    console.log("🔔 [DEBUG] Creating announcement notification:", {
      announcementId,
      title,
      author,
      authorId,
    });

    // In a real implementation, you would get all employee IDs from your database
    // For now, we'll create a notification that can be sent to all employees
    const notification = new Notification({
      recipientId: "all_employees", // Special ID for broadcast notifications
      recipientEmail: "all@company.com",
      senderId: authorId,
      senderName: author,
      type: "announcement_created",
      title: "New Announcement",
      message: `New announcement: ${title}`,
      module: "announcement",
      moduleId: announcementId,
      relatedEmployeeId: authorId,
      relatedEmployeeName: author,
      priority: "high",
      actionUrl: `/announcements/${announcementId}`,
    });

    await notification.save();
    console.log("✅ [DEBUG] Announcement notification created successfully");
    return notification;
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating announcement notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    throw error;
  }
};

// Create comment notification for announcement author/admin
const createCommentNotification = async (commentData) => {
  try {
    const {
      announcementId,
      announcementTitle,
      commentAuthor,
      commentAuthorId,
      announcementAuthorId,
    } = commentData;

    console.log("🔔 [DEBUG] Creating comment notification:", {
      announcementId,
      announcementTitle,
      commentAuthor,
      commentAuthorId,
      announcementAuthorId,
    });

    const notification = new Notification({
      recipientId: announcementAuthorId, // Notify the announcement author
      recipientEmail: "admin@company.com", // This should be the actual author's email
      senderId: commentAuthorId,
      senderName: commentAuthor,
      type: "announcement_comment",
      title: "New Comment on Announcement",
      message: `${commentAuthor} commented on your announcement: "${announcementTitle}"`,
      module: "announcement",
      moduleId: announcementId,
      relatedEmployeeId: commentAuthorId,
      relatedEmployeeName: commentAuthor,
      priority: "medium",
      actionUrl: `/announcements/${announcementId}`,
    });

    await notification.save();
    console.log("✅ [DEBUG] Comment notification created successfully");
    return notification;
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating comment notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    throw error;
  }
};

// ✅ NEW: Create document submission notification for admin/HR
const createDocumentSubmissionNotification = async (submissionData) => {
  try {
    const { employeeId, employeeName, adminId, adminEmail, onboardingId } =
      submissionData;

    console.log("🔔 [DEBUG] Creating document submission notification:", {
      employeeId,
      employeeName,
      adminId,
      adminEmail,
      onboardingId,
    });

    // ✅ FIXED: Get actual admin users from database
    let recipientId = adminId || "admin"; // fallback
    let recipientEmail = adminEmail || "hr@company.com"; // fallback

    try {
      // Get users with admin/hr roles who should receive notifications
      const User = require("../models/User");
      const adminUsers = await User.find({
        role: { $in: ["admin", "hr", "employer"] },
      });

      if (adminUsers.length > 0) {
        // Use the first admin user found
        recipientId = adminUsers[0]._id.toString();
        recipientEmail = adminUsers[0].email;
        console.log(
          "✅ [DEBUG] Found admin user for notification:",
          recipientId,
          recipientEmail
        );
      } else {
        console.log("ℹ️ [DEBUG] No admin users found, using fallback");
      }
    } catch (userError) {
      console.log(
        "ℹ️ [DEBUG] Using fallback admin ID due to error:",
        userError.message
      );
    }

    const notification = new Notification({
      recipientId: recipientId,
      recipientEmail: recipientEmail,
      senderId: employeeId,
      senderName: employeeName,
      type: "onboarding_documents_submitted",
      title: "Documents Submitted for Review",
      message: `Employee ${employeeId} ${employeeName} has submitted all required documents and is pending for review.`,
      module: "onboarding",
      moduleId: onboardingId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "high",
      actionUrl: `/onboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Document submission notification created successfully"
    );
    return notification;
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating document submission notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    throw error;
  }
};

// ✅ FIXED: Create offboarding reminder notification (HTTP handler)
const createOffboardingReminderNotification = async (req, res) => {
  try {
    const { employeeId, employeeName, employeeEmail, currentStep } = req.body;

    console.log("🔔 [DEBUG] Creating offboarding reminder notification:", {
      employeeId,
      employeeName,
      employeeEmail,
      currentStep,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail) {
      console.error(
        "❌ [DEBUG] Missing required fields for offboarding reminder"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: "system",
      senderName: "HR System",
      type: "offboarding_reminder",
      title: "Offboarding Process Started",
      message: `Your offboarding process has been initiated. Please submit the required documents for the current step: ${
        currentStep || "Not started"
      }`,
      module: "offboarding",
      moduleId: employeeId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "high",
      actionUrl: `/my-offboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Offboarding reminder notification created successfully"
    );

    res.json({
      success: true,
      message: "Offboarding reminder sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating offboarding reminder notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create offboarding reminder notification",
      error: error.message,
    });
  }
};

// ✅ FIXED: Create offboarding completion notification (HTTP handler)
const createOffboardingCompletionNotification = async (req, res) => {
  try {
    const { employeeId, employeeName, employeeEmail } = req.body;

    console.log("🔔 [DEBUG] Creating offboarding completion notification:", {
      employeeId,
      employeeName,
      employeeEmail,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail) {
      console.error(
        "❌ [DEBUG] Missing required fields for offboarding completion"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: "system",
      senderName: "HR System",
      type: "offboarding_completed",
      title: "Offboarding Process Completed",
      message: `Your offboarding process has been completed successfully. All formalities are now complete.`,
      module: "offboarding",
      moduleId: employeeId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "high",
      actionUrl: `/my-offboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Offboarding completion notification created successfully"
    );

    res.json({
      success: true,
      message: "Offboarding completion notification sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating offboarding completion notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create offboarding completion notification",
      error: error.message,
    });
  }
};

// ✅ ENHANCED: Create onboarding reminder notification with dynamic messages
const createOnboardingReminder = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      employeeEmail,
      currentStep,
      status,
      senderId,
      senderName,
      title,
      message,
    } = req.body;

    console.log("🔔 [DEBUG] Creating onboarding reminder notification:", {
      employeeId,
      employeeName,
      employeeEmail,
      currentStep,
      status,
      senderId,
      senderName,
      title,
      message,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail) {
      console.error(
        "❌ [DEBUG] Missing required fields for onboarding reminder"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail are required",
      });
    }

    // Determine notification type and content based on status
    let notificationType = "onboarding_reminder";
    let notificationTitle = title;
    let notificationMessage = message;

    console.log("🔔 [DEBUG] Current status for message generation:", status);
    console.log("🔔 [DEBUG] Custom title provided:", title);
    console.log("🔔 [DEBUG] Custom message provided:", message);

    // If no custom message provided, generate based on status
    if (!notificationMessage) {
      console.log(
        "🔔 [DEBUG] Generating dynamic message based on status:",
        status
      );

      switch (status) {
        case "in-progress":
          notificationMessage = `Your onboarding process has started. Please complete all the required steps to finish your onboarding. Current step: ${
            currentStep || "Not started"
          }`;
          notificationTitle = "Onboarding Process Started";
          break;
        case "completed":
          notificationMessage = `Congratulations ${employeeName}! Your onboarding process has been completed successfully. Welcome to the team!`;
          notificationType = "onboarding_completed";
          notificationTitle = "Onboarding Completed!";
          break;
        case "on-hold":
          notificationMessage = `Your onboarding process is currently on hold. Please contact HR for more information.`;
          notificationTitle = "Onboarding On Hold";
          break;
        case "pending-activation":
          notificationMessage = `Your onboarding is pending activation. We'll notify you once it's activated.`;
          notificationTitle = "Onboarding Pending Activation";
          break;
        default:
          notificationMessage = `Your onboarding process requires attention. Please check your onboarding dashboard. Current step: ${
            currentStep || "Not started"
          }`;
          notificationTitle = "Onboarding Update";
      }
    }

    // If no custom title provided but we have custom message, use default title
    if (!notificationTitle && notificationMessage) {
      notificationTitle = "Onboarding Reminder";
    }

    console.log("🔔 [DEBUG] Final notification details:", {
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      status: status,
    });

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: senderId || "system",
      senderName: senderName || "HR System",
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      module: "onboarding",
      moduleId: employeeId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: status === "completed" ? "high" : "medium",
      actionUrl: `/my-onboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Onboarding reminder notification created successfully:",
      notification._id
    );

    res.json({
      success: true,
      message: "Onboarding reminder sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating onboarding reminder notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create onboarding reminder notification",
      error: error.message,
    });
  }
};

// NEW: Create onboarding step completion notification
const createOnboardingStepCompletion = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      employeeEmail,
      completedStep,
      senderId,
      senderName,
    } = req.body;

    console.log(
      "🔔 [DEBUG] Creating onboarding step completion notification:",
      {
        employeeId,
        employeeName,
        employeeEmail,
        completedStep,
        senderId,
        senderName,
      }
    );

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail || !completedStep) {
      console.error("❌ [DEBUG] Missing required fields for step completion");
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail, completedStep are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: senderId || "system",
      senderName: senderName || "HR System",
      type: "onboarding_step_completed",
      title: "Onboarding Step Completed",
      message: `Great! You've completed the step: ${completedStep}. Continue with the next steps.`,
      module: "onboarding",
      moduleId: employeeId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "low",
      actionUrl: `/my-onboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Onboarding step completion notification created successfully:",
      notification._id
    );

    res.json({
      success: true,
      message: "Step completion notification sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating onboarding step completion notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create step completion notification",
      error: error.message,
    });
  }
};

// NEW: Create onboarding completion notification
const createOnboardingCompletion = async (req, res) => {
  try {
    const { employeeId, employeeName, employeeEmail, senderId, senderName } =
      req.body;

    console.log("🔔 [DEBUG] Creating onboarding completion notification:", {
      employeeId,
      employeeName,
      employeeEmail,
      senderId,
      senderName,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail) {
      console.error(
        "❌ [DEBUG] Missing required fields for onboarding completion"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: senderId || "system",
      senderName: senderName || "HR System",
      type: "onboarding_completed",
      title: "Onboarding Completed!",
      message: `Congratulations ${employeeName}! Your onboarding process has been completed successfully. Welcome to the team!`,
      module: "onboarding",
      moduleId: employeeId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "high",
      actionUrl: `/my-onboarding`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Onboarding completion notification created successfully:",
      notification._id
    );

    res.json({
      success: true,
      message: "Onboarding completion notification sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating onboarding completion notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create onboarding completion notification",
      error: error.message,
    });
  }
};

// ✅ NEW: Create team member added notification
const createTeamMemberAddedNotification = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      employeeEmail,
      teamName,
      teamId,
      addedBy,
    } = req.body;

    console.log("🔔 [DEBUG] Creating team member added notification:", {
      employeeId,
      employeeName,
      employeeEmail,
      teamName,
      teamId,
      addedBy,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail || !teamName) {
      console.error(
        "❌ [DEBUG] Missing required fields for team member added notification"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail, teamName are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: addedBy?.id || "system",
      senderName: addedBy?.name || "HR System",
      type: "team_member_added",
      title: "Team Assignment",
      message: `You have been added to the team: ${teamName}`,
      module: "team",
      moduleId: teamId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "medium",
      actionUrl: `/teams`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Team member added notification created successfully:",
      notification._id
    );

    res.json({
      success: true,
      message: "Team member added notification sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating team member added notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create team member added notification",
      error: error.message,
    });
  }
};

// ✅ NEW: Create team member removed notification
const createTeamMemberRemovedNotification = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      employeeEmail,
      teamName,
      teamId,
      removedBy,
    } = req.body;

    console.log("🔔 [DEBUG] Creating team member removed notification:", {
      employeeId,
      employeeName,
      employeeEmail,
      teamName,
      teamId,
      removedBy,
    });

    // Validate required fields
    if (!employeeId || !employeeName || !employeeEmail || !teamName) {
      console.error(
        "❌ [DEBUG] Missing required fields for team member removed notification"
      );
      return res.status(400).json({
        message:
          "Missing required fields: employeeId, employeeName, employeeEmail, teamName are required",
      });
    }

    const notification = new Notification({
      recipientId: employeeId,
      recipientEmail: employeeEmail,
      senderId: removedBy?.id || "system",
      senderName: removedBy?.name || "HR System",
      type: "team_member_removed",
      title: "Team Removal",
      message: `You have been removed from the team: ${teamName}`,
      module: "team",
      moduleId: teamId,
      relatedEmployeeId: employeeId,
      relatedEmployeeName: employeeName,
      priority: "medium",
      actionUrl: `/teams`,
    });

    await notification.save();
    console.log(
      "✅ [DEBUG] Team member removed notification created successfully:",
      notification._id
    );

    res.json({
      success: true,
      message: "Team member removed notification sent successfully",
      notification: notification,
    });
  } catch (error) {
    console.error(
      "❌ [DEBUG] Error creating team member removed notification:",
      error.message
    );
    console.error("❌ [DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create team member removed notification",
      error: error.message,
    });
  }
};

// ✅ TEMPORARY: Test endpoint for document submission notifications
const testDocumentSubmissionNotification = async (req, res) => {
  try {
    const { employeeId, employeeName } = req.body;

    const testData = {
      employeeId: employeeId || "EMP001",
      employeeName: employeeName || "Test Employee",
      adminId: "admin",
      adminEmail: "admin@company.com",
      onboardingId: "test-onboarding-id",
    };

    const notification = await createDocumentSubmissionNotification(testData);

    res.json({
      success: true,
      message: "Test notification created",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  createAnnouncementNotification,
  createCommentNotification,
  createDocumentSubmissionNotification,
  createOffboardingReminderNotification,
  createOffboardingCompletionNotification,
  createOnboardingReminder,
  createOnboardingStepCompletion,
  createOnboardingCompletion,
  createTeamMemberAddedNotification, // ✅ NEW: Export team member added function
  createTeamMemberRemovedNotification, // ✅ NEW: Export team member removed function
  testDocumentSubmissionNotification,
};
