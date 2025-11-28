// routes/editorRoutes.js
const express = require("express");
const router = express.Router();
const editorController = require("../controllers/editorController");

// Create user document from template (with optional custom name)
router.post(
  "/template/:id/create",
  editorController.createDocumentFromTemplate
);

// id here is ALWAYS UserDocument _id (not template)
router.get("/:id/config", editorController.getEditorConfig);

// OnlyOffice file load
router.get("/userdoc/:id/file", editorController.getFile);

// OnlyOffice save callback
router.post("/userdoc/:id/save", editorController.saveFile);

// Recent user documents with pagination & category filter
router.get("/user/documents", editorController.getUserDocuments);

module.exports = router;
