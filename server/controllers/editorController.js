const LetterTemplate = require("../models/LetterTemplate");
const UserDocument = require("../models/UserDocument");
const User = require("../models/User");
const gridFsService = require("../services/gridFsService");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// =========================
// ENV VARS
// =========================
let ONLYOFFICE_SERVER, APP_JWT_SECRET, DS_JWT_SECRET, APP_INTERNAL_URL, DS_PUBLIC_URL;

function initializeEnv() {
  ONLYOFFICE_SERVER = process.env.ONLYOFFICE_URL || "http://localhost:8083";
  APP_JWT_SECRET = process.env.JWT_SECRET;
  DS_JWT_SECRET = process.env.DOCUMENT_SERVER_JWT_SECRET;
  APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://host.docker.internal:5000";
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

  return { ONLYOFFICE_SERVER, APP_JWT_SECRET, DS_JWT_SECRET, APP_INTERNAL_URL, DS_PUBLIC_URL };
}

// =========================
// HELPERS
// =========================
function extractToken(req) {
  if (req.headers.authorization?.startsWith("Bearer "))
    return req.headers.authorization.slice(7);
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
// FIX FILE TYPE
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
// GET CONFIG
// =========================
exports.getEditorConfig = async (req, res) => {
  try {
    initializeEnv();
    const { DS_JWT_SECRET, APP_INTERNAL_URL, DS_PUBLIC_URL } = getEnv();
    const { user, token } = await verifyToken(req);

    const templateId = req.params.id;
    console.log(`📋 Editor config request — template: ${templateId} user: ${user.email}`);

    if (!mongoose.Types.ObjectId.isValid(templateId))
      return res.status(400).json({ success: false, message: "Invalid template ID" });

    let userDoc = await UserDocument.findOne({
      user: user._id,
      originalTemplate: templateId,
    });

    // ===============================
    // FIRST TIME → CLONE TEMPLATE
    // ===============================
    if (!userDoc) {
      console.log("🆕 First-time open — cloning template");

      const template = await LetterTemplate.findById(templateId);
      if (!template) return res.status(404).json({ success: false, message: "Template not found" });

      const newName = template.file.fileName.replace(".ocx", ".docx");

      const newFileId = await gridFsService.duplicateFile(template.file.fileId, newName);

      userDoc = await UserDocument.create({
        user: user._id,
        originalTemplate: templateId,
        name: `${template.name} (My Document)`,
        file: {
          fileId: newFileId,
          fileName: newName,
          fileSize: template.file.fileSize,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      });
    }

    // ===============================
    // EXISTING DOC
    // ===============================
    else {
      console.log("♻️ Using existing document:", userDoc._id.toString());
    }

    // ===============================
    // BUILD CONFIG
    // ===============================
    const { documentType, fileType } = extToDocTypeAndFileType(userDoc.file.fileName);

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
        key: `${userDoc._id}_${Date.now()}`,
      },
      editorConfig: {
        callbackUrl,
        mode: "edit",
        user: {
          id: String(user._id),
          name: user.email,
        },
      },
    };

    const tokenForDS = jwt.sign(configPayload, DS_JWT_SECRET, { expiresIn: "24h" });

    return res.json({
      success: true,
      documentServerApiUrl: `${DS_PUBLIC_URL}/web-apps/apps/api/documents/api.js`,
      config: configPayload,
      token: tokenForDS,
    });
  } catch (error) {
    console.error("❌ CONFIG ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// FILE LOAD
// =========================
exports.getFile = async (req, res) => {
  try {
    initializeEnv();
    const { user, ds } = await verifyToken(req, true);
    const docId = req.params.id;

    const userDoc = await UserDocument.findById(docId);
    if (!ds && userDoc.user.toString() !== user._id.toString())
      return res.status(403).json({ success: false, message: "Forbidden" });

    const stream = await gridFsService.getFileStream(userDoc.file.fileId);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `inline; filename="${userDoc.file.fileName}"`);
    stream.pipe(res);
  } catch (error) {
    console.error("❌ getFile ERROR:", error);
    return res.status(500).json({ success: false, message: "File load failed" });
  }
};

// =========================
// FILE SAVE
// =========================
exports.saveFile = async (req, res) => {
  try {
    initializeEnv();
    const { user, ds } = await verifyToken(req, true);

    const { status, url } = req.body;
    const docId = req.params.id;

    if (![2].includes(Number(status)))
      return res.json({ error: 0 });

    const userDoc = await UserDocument.findById(docId);
    const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

    const response = await fetch(url);
    const newFileId = await gridFsService.replaceFile(
      userDoc.file.fileId,
      response.body,
      userDoc.file.fileName,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    userDoc.file.fileId = newFileId;
    await userDoc.save();

    return res.json({ error: 0 });
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    return res.json({ error: 1, message: error.message });
  }
};
