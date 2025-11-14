const Onboarding = require("../models/onboardingModel");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const {
  createDocumentSubmissionNotification,
} = require("./notificationController");

// Get all onboarding records
const getAllOnboarding = async (req, res) => {
  try {
    const onboardingRecords = await Onboarding.find().sort({ createdAt: -1 });
    res.json(onboardingRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload document - FIXED VERSION with duplicate notification prevention for 8 steps
const uploadDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get data from FormData (not req.body when using multipart/form-data)
    const { stepId, stepName } = req.body;
    const file = req.file;

    console.log("Upload document request:", {
      employeeId,
      stepId,
      stepName,
      file: file ? file.originalname : "No file",
    });

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!stepId) {
      return res.status(400).json({ error: "Step ID is required" });
    }

    const onboarding = await Onboarding.findOne({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    const document = {
      _id: new mongoose.Types.ObjectId(),
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
      status: "pending",
    };

    // Add document to the specific step
    const step = onboarding.steps.find((s) => s.stepId === parseInt(stepId));
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    if (!step.documents) {
      step.documents = [];
    }
    step.documents.push(document);

    await onboarding.save();

    console.log("Document uploaded successfully:", document);

    // ✅ FIXED: Check if all 8 required documents are uploaded and notify admin ONLY ONCE
    await checkAndNotifyDocumentCompletion(onboarding);

    res.json({ document, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ FIXED: Function to check if ALL 8 documents are uploaded and notify admin ONLY ONCE
const checkAndNotifyDocumentCompletion = async (onboarding) => {
  try {
    console.log(
      "🔔 [DEBUG] Checking document completion for:",
      onboarding.employeeId
    );

    // ✅ FIXED: All 8 steps require documents
    const documentRequiredSteps = [1, 2, 3, 4, 5, 6, 7, 8]; // All 8 steps need documents

    let allDocumentsUploaded = true;
    let uploadedDocumentsCount = 0;
    let requiredDocumentsCount = 0;
    let missingSteps = [];

    // Check each step that requires documents
    for (const stepId of documentRequiredSteps) {
      const step = onboarding.steps.find((s) => s.stepId === stepId);
      if (step) {
        requiredDocumentsCount++;
        if (step.documents && step.documents.length > 0) {
          uploadedDocumentsCount++;
          console.log(
            `✅ Step ${stepId} (${step.name}): ${step.documents.length} documents`
          );
        } else {
          allDocumentsUploaded = false;
          missingSteps.push(stepId);
          console.log(`❌ Step ${stepId} (${step.name}): No documents`);
        }
      }
    }

    console.log("🔔 [DEBUG] Document completion check:", {
      employeeId: onboarding.employeeId,
      allDocumentsUploaded,
      uploadedDocumentsCount,
      requiredDocumentsCount,
      missingSteps:
        missingSteps.length > 0 ? missingSteps : "None - All Complete!",
    });

    // ✅ FIXED: Only notify if ALL 8 required documents are uploaded
    if (allDocumentsUploaded && uploadedDocumentsCount === 8) {
      // ✅ PREVENT DUPLICATE NOTIFICATIONS: Check if we already notified recently
      const Notification = require("../models/Notification");
      const existingNotification = await Notification.findOne({
        type: "onboarding_documents_submitted",
        relatedEmployeeId: onboarding.employeeId,
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Check last 24 hours
        },
      });

      if (existingNotification) {
        console.log(
          "ℹ️ [DEBUG] Notification already sent recently for this employee, skipping duplicate"
        );
        return;
      }

      console.log(
        "🎉 [DEBUG] ALL 8 DOCUMENTS COMPLETED! Sending one-time notification to admin"
      );

      try {
        // Get User model
        const User = require("../models/User");
        const adminUsers = await User.find({
          role: { $in: ["admin", "hr", "employer"] },
        }).limit(1); // Get first admin

        if (adminUsers.length > 0) {
          const adminUser = adminUsers[0];

          await createDocumentSubmissionNotification({
            employeeId: onboarding.employeeId,
            employeeName: onboarding.name,
            adminId: adminUser._id.toString(),
            adminEmail: adminUser.email,
            onboardingId: onboarding._id,
          });

          console.log(
            "✅ [DEBUG] Document submission notification sent to admin:",
            adminUser.email
          );
        } else {
          console.log("❌ [DEBUG] No admin users found for notification");
          // Fallback: send to default admin
          await createDocumentSubmissionNotification({
            employeeId: onboarding.employeeId,
            employeeName: onboarding.name,
            adminId: "admin",
            adminEmail: "hr@company.com",
            onboardingId: onboarding._id,
          });
        }
      } catch (error) {
        console.error("❌ [DEBUG] Error getting admin user:", error);
        // Fallback: send to default admin
        await createDocumentSubmissionNotification({
          employeeId: onboarding.employeeId,
          employeeName: onboarding.name,
          adminId: "admin",
          adminEmail: "hr@company.com",
          onboardingId: onboarding._id,
        });
      }
    } else {
      console.log("ℹ️ [DEBUG] Documents not complete yet:", {
        uploaded: uploadedDocumentsCount,
        required: requiredDocumentsCount,
        remaining: requiredDocumentsCount - uploadedDocumentsCount,
        missingSteps: missingSteps,
      });
    }
  } catch (error) {
    console.error("❌ [DEBUG] Error checking document completion:", error);
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    const onboarding = await Onboarding.findOne({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    // Find and remove document from all steps
    onboarding.steps.forEach((step) => {
      if (step.documents) {
        step.documents = step.documents.filter(
          (doc) => doc._id.toString() !== documentId
        );
      }
    });

    await onboarding.save();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get onboarding by employee ID
const getOnboardingByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const onboarding = await Onboarding.findOne({ employeeId });

    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    res.json(onboarding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start new onboarding process
const startOnboarding = async (req, res) => {
  try {
    const { employeeId, startDate, assignedTo } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check if onboarding already exists for this employee
    const existingOnboarding = await Onboarding.findOne({ employeeId });
    if (existingOnboarding) {
      return res
        .status(400)
        .json({ error: "Onboarding process already exists for this employee" });
    }

    // Initialize steps
    const steps = Onboarding.initializeSteps(assignedTo);

    // Create new onboarding record
    const onboarding = new Onboarding({
      employeeId,
      name: employee.name,
      email: employee.email,
      position: employee.designation,
      department: employee.department,
      startDate,
      assignedTo,
      steps,
      status: "in-progress",
      progress: 0,
      currentStep: "Offer Letter",
      completedSteps: 0,
      totalSteps: steps.length,
    });

    await onboarding.save();
    res.status(201).json(onboarding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update onboarding status
const updateOnboardingStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, notes } = req.body;

    const onboarding = await Onboarding.findOne({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    onboarding.status = status;
    if (notes) onboarding.notes = notes;
    onboarding.updatedAt = new Date();

    await onboarding.save();
    res.json(onboarding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete a step
const completeStep = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { stepId, notes } = req.body;

    const onboarding = await Onboarding.findOne({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    // Find the step
    const step = onboarding.steps.find((s) => s.stepId === stepId);
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    // Update step
    step.completed = true;
    step.completedAt = new Date();
    if (notes) step.notes = notes;

    // Save and let pre-save middleware handle progress calculation
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update step notes
const updateStepNotes = async (req, res) => {
  try {
    const { employeeId, stepId } = req.params;
    const { notes } = req.body;

    const onboarding = await Onboarding.findOne({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    const step = onboarding.steps.find((s) => s.stepId === parseInt(stepId));
    if (!step) {
      return res.status(404).json({ error: "Step not found" });
    }

    step.notes = notes;
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete onboarding record
const deleteOnboarding = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const onboarding = await Onboarding.findOneAndDelete({ employeeId });
    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding record not found" });
    }

    res.json({ message: "Onboarding record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get onboarding statistics
const getOnboardingStats = async (req, res) => {
  try {
    const total = await Onboarding.countDocuments();
    const inProgress = await Onboarding.countDocuments({
      status: "in-progress",
    });
    const completed = await Onboarding.countDocuments({ status: "completed" });
    const onHold = await Onboarding.countDocuments({ status: "on-hold" });
    const pendingActivation = await Onboarding.countDocuments({
      status: "pending-activation",
    });

    res.json({
      total,
      inProgress,
      completed,
      onHold,
      pendingActivation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOnboarding,
  getOnboardingByEmployeeId,
  startOnboarding,
  updateOnboardingStatus,
  completeStep,
  updateStepNotes,
  deleteOnboarding,
  getOnboardingStats,
  uploadDocument,
  deleteDocument,
  checkAndNotifyDocumentCompletion,
};
