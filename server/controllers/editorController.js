// controllers/editorController.js

const LetterTemplate = require("../models/LetterTemplate");
const UserDocument = require("../models/UserDocument");
const User = require("../models/User");
const gridFsService = require("../services/gridFsService");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// =========================
// ENV VARS
// =========================
let ONLYOFFICE_SERVER,
  APP_JWT_SECRET,
  DS_JWT_SECRET,
  APP_INTERNAL_URL,
  DS_PUBLIC_URL;

function initializeEnv() {
  ONLYOFFICE_SERVER = process.env.ONLYOFFICE_URL || "http://localhost:8083";
  APP_JWT_SECRET = process.env.JWT_SECRET;
  DS_JWT_SECRET = process.env.DOCUMENT_SERVER_JWT_SECRET;
  APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://localhost:5000";
  DS_PUBLIC_URL = process.env.DS_PUBLIC_URL || "http://localhost:8083";
}

function getEnv() {
  if (!APP_JWT_SECRET) throw new Error("JWT_SECRET missing");
  if (!DS_JWT_SECRET) throw new Error("DOCUMENT_SERVER_JWT_SECRET missing");

  console.log("🔧 Editor ENV:", {
    ONLYOFFICE_SERVER,
    APP_INTERNAL_URL,
    DS_PUBLIC_URL,
  });

  return {
    ONLYOFFICE_SERVER,
    APP_JWT_SECRET,
    DS_JWT_SECRET,
    APP_INTERNAL_URL,
    DS_PUBLIC_URL,
  };
}

// =========================
// AUTH HELPERS
// =========================
function extractToken(req) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.slice(7);
  }
  if (req.query.token) return req.query.token;
  return null;
}

async function verifyToken(req, allowDS = false) {
  const { APP_JWT_SECRET } = getEnv();
  const token = extractToken(req);
  if (!token) throw new Error("Missing token");

  try {
    const decoded = jwt.verify(token, APP_JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) throw new Error("Token missing user id");

    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("Invalid user");

    return { user, token, ds: false };
  } catch (err) {
    if (allowDS) {
      const decodedWeak = jwt.decode(token);
      const userId = decodedWeak?.userId || decodedWeak?.id;
      const user = userId ? await User.findById(userId).select("-password") : null;
      return { user: user || { _id: "ds_callback_user" }, token, ds: true };
    }
    throw err;
  }
}

// =========================
// FILE TYPE HELPERS
// =========================
function cleanExt(filename) {
  if (!filename) return "docx";

  let ext = filename.split(".").pop().toLowerCase();
  if (ext === "ocx") ext = "docx";
  if (ext === "doc") ext = "docx";

  return ext;
}

function extToDocTypeAndFileType(filename) {
  const ext = cleanExt(filename);

  const word = ["docx", "odt", "rtf", "txt", "pdf"];
  const cell = ["xlsx", "xls", "ods", "csv"];
  const slide = ["pptx", "ppt", "odp"];

  let documentType = "word";
  if (cell.includes(ext)) documentType = "cell";
  else if (slide.includes(ext)) documentType = "slide";

  return { documentType, fileType: ext };
}

// =========================
// CREATE DOC FROM TEMPLATE
// =========================
// POST /api/editor/template/:id/create
// body: { name?: string }
exports.createDocumentFromTemplate = async (req, res) => {
  try {
    initializeEnv();
    const { user } = await verifyToken(req);

    const templateId = req.params.id;
    const customName = (req.body?.name || "").trim();

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid template ID" });
    }

    const template = await LetterTemplate.findById(templateId);
    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }
    if (!template.file || !template.file.fileId) {
      return res
        .status(404)
        .json({ success: false, message: "Template file not found" });
    }

    const originalName =
      template.file.fileName || `${template.name || "Document"}.docx`;
    const ext = cleanExt(originalName);
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    const newFileName = `${baseName}-${Date.now()}.${ext}`;

    // Clone underlying file
    const newFileId = await gridFsService.duplicateFile(
      template.file.fileId,
      newFileName
    );

    const finalName =
      customName ||
      `${template.name} (Copy ${new Date().toLocaleString()})`;

    const userDoc = await UserDocument.create({
      user: user._id,
      originalTemplate: template._id,
      name: finalName,
      file: {
        fileId: newFileId,
        fileName: newFileName,
        fileSize: template.file.fileSize,
        fileType:
          template.file.fileType ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });

    console.log(
      `✅ New user document created from template ${template._id} for user ${user.email}: ${userDoc._id}`
    );

    return res.json({
      success: true,
      documentId: userDoc._id,
      document: userDoc,
    });
  } catch (error) {
    console.error("❌ createDocumentFromTemplate ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// =========================
// GET EDITOR CONFIG
// =========================
//  - :id is ALWAYS a UserDocument _id
exports.getEditorConfig = async (req, res) => {
  try {
    initializeEnv();
    const { DS_JWT_SECRET, APP_INTERNAL_URL, DS_PUBLIC_URL } = getEnv();
    const { user, token } = await verifyToken(req);

    const docId = req.params.id;
    console.log(`📋 Editor config request — docId: ${docId} user: ${user.email}`);

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid document ID" });
    }

    const userDoc = await UserDocument.findOne({
      _id: docId,
      user: user._id,
    });

    if (!userDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }
    if (!userDoc.file || !userDoc.file.fileName) {
      return res
        .status(500)
        .json({ success: false, message: "User document file missing" });
    }

    const { documentType, fileType } = extToDocTypeAndFileType(
      userDoc.file.fileName
    );
    console.log("🧩 Clean file type:", fileType);

    const fileUrl = `${APP_INTERNAL_URL}/api/editor/userdoc/${userDoc._id}/file?token=${token}`;
    const callbackUrl = `${APP_INTERNAL_URL}/api/editor/userdoc/${userDoc._id}/save?token=${token}`;

    const configPayload = {
      type: "desktop",
      documentType,
      document: {
        title: userDoc.name,
        fileType,
        url: fileUrl,
        key: `${userDoc._id}_${userDoc.updatedAt.getTime()}`,
      },
      editorConfig: {
        callbackUrl,
        mode: "edit",
        user: {
          id: String(user._id),
          name: user.email,
        },
        customization: {
          about: false,
          feedback: false,
          support: false,
          logo: { image: "", imageEmbedded: "", url: "" },
        },
      },
    };

    const tokenForDS = jwt.sign(configPayload, DS_JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.json({
      success: true,
      documentServerApiUrl: `${DS_PUBLIC_URL}/web-apps/apps/api/documents/api.js`,
      config: configPayload,
      token: tokenForDS,
    });
  } catch (error) {
    console.error("❌ CONFIG ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// =========================
// GET FILE (OnlyOffice loads)
// =========================
exports.getFile = async (req, res) => {
  try {
    initializeEnv();
    const { user, ds } = await verifyToken(req, true);
    const docId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid document ID" });
    }

    const userDoc = await UserDocument.findById(docId);
    if (!userDoc || !userDoc.file?.fileId) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    if (!ds && userDoc.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    const stream = await gridFsService.getFileStream(userDoc.file.fileId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${userDoc.file.fileName || "document.docx"}"`
    );
    stream.pipe(res);
  } catch (error) {
    console.error("❌ getFile ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to stream file" });
  }
};

// =========================
// SAVE FILE (OnlyOffice callback)
// =========================
exports.saveFile = async (req, res) => {
  try {
    initializeEnv();
    const { user, ds } = await verifyToken(req, true);
    const docId = req.params.id;
    const { status, url } = req.body;

    console.log("💾 Save callback:", { docId, status, url });

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.json({ error: 1, message: "Invalid document ID" });
    }

    const userDoc = await UserDocument.findById(docId);
    if (!userDoc) return res.json({ error: 1, message: "Document not found" });

    if (!ds && userDoc.user.toString() !== user._id.toString()) {
      return res.json({ error: 1, message: "Access denied" });
    }

    // Only save on status 2 (document is ready for saving)
    // Status 4 = closed without changes → ignore
    if (![2, 4].includes(Number(status))) {
      console.log("📝 No changes to save, status:", status);
      return res.json({ error: 0 });
    }
    if (Number(status) === 4) {
      console.log("📝 Document closed without changes");
      return res.json({ error: 0 });
    }

    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));

    const response = await fetch(url);
    if (!response.ok) {
      console.error("❌ Failed to download updated file from OnlyOffice");
      return res.json({
        error: 1,
        message: "Failed to download updated file",
      });
    }

    const newFileId = await gridFsService.replaceFile(
      userDoc.file.fileId,
      response.body,
      userDoc.file.fileName,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    userDoc.file.fileId = newFileId;
    await userDoc.save(); // timestamps:true → updatedAt auto updated

    console.log(`✅ Document saved successfully for user ${user.email}`);
    return res.json({ error: 0 });
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    return res.json({ error: 1, message: "Failed to save document" });
  }
};

// =========================
// GET USER DOCUMENTS (RECENT LETTERS)
// =========================
// GET /api/editor/user/documents?page=&limit=&category=
exports.getUserDocuments = async (req, res) => {
  try {
    initializeEnv();
    const { user } = await verifyToken(req);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const categoryId = req.query.category || null;

    const filter = { user: user._id };

    if (categoryId) {
      const templateIds = await LetterTemplate.find({
        category: categoryId,
      }).distinct("_id");
      filter.originalTemplate = { $in: templateIds };
    }

    const [docs, total] = await Promise.all([
      UserDocument.find(filter)
        .populate("originalTemplate", "name category")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      UserDocument.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      documents: docs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("❌ Get User Documents Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
