const express = require("express");
const router = express.Router();
const editorController = require("../controllers/editorController");

router.get("/:id/config", editorController.getEditorConfig);
router.get("/userdoc/:id/file", editorController.getFile);
router.post("/userdoc/:id/save", editorController.saveFile);

module.exports = router;
