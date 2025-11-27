const LetterTemplate = require('../models/LetterTemplate');
const LetterCategory = require('../models/LetterCategory');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Initialize a single consistent GridFS bucket
let gridFSBucket;
function initGridFS() {
  const db = mongoose.connection.db;
  gridFSBucket = new GridFSBucket(db, {
    bucketName: 'files'
  });
}
mongoose.connection.once('open', initGridFS);

// ==================== GET ALL TEMPLATES ====================
exports.getTemplates = async (req, res) => {
  try {
    const templates = await LetterTemplate.find()
      .populate('category', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates'
    });
  }
};

// ==================== CREATE TEMPLATE ====================
exports.createTemplate = async (req, res) => {
  try {
    console.log('📥 CREATE TEMPLATE');

    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { name, description, category } = req.body;
    if (!name || !category) return res.status(400).json({ success: false, message: 'Name and category required' });

    const categoryExists = await LetterCategory.findById(category);
    if (!categoryExists) return res.status(400).json({ success: false, message: 'Category not found' });

    if (!req.files?.file) return res.status(400).json({ success: false, message: 'Template file required' });

    const file = req.files.file;
    const userId = req.user.id;

    const uploadStream = gridFSBucket.openUploadStream(file.name, {
      contentType: file.mimetype,
      metadata: {
        templateName: name,
        uploadedBy: userId,
        templateUUID: uuidv4(),
        created: new Date()
      }
    });

    uploadStream.end(file.data);

    uploadStream.on('finish', async () => {
      const realFileId = uploadStream.id;

      console.log("📦 FILE SAVED → GRIDFS _id:", realFileId);

      const fileData = {
        fileId: realFileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadDate: new Date()
      };

      const template = await LetterTemplate.create({
        name: name.trim(),
        description: description?.trim(),
        category,
        file: fileData,
        createdBy: userId
      });

      await template.populate('category', 'name description');

      return res.status(201).json({
        success: true,
        message: "Template created successfully",
        template
      });
    });

    uploadStream.on('error', (error) => {
      console.error('❌ GridFS upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading file'
      });
    });

  } catch (error) {
    console.error('❌ Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template'
    });
  }
};

// ==================== UPDATE TEMPLATE ====================
exports.updateTemplate = async (req, res) => {
  try {
    console.log('📥 UPDATE TEMPLATE');

    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { name, description, category, isActive } = req.body;

    let template = await LetterTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const userId = req.user.id;

    // IF NO NEW FILE UPLOADED
    if (!req.files?.file) {
      template = await LetterTemplate.findByIdAndUpdate(
        req.params.id,
        {
          name: name?.trim(),
          description: description?.trim(),
          category,
          isActive
        },
        { new: true }
      );
      return res.status(200).json({ success: true, message: "Template updated", template });
    }

    // NEW FILE RECEIVED
    const file = req.files.file;

    if (template.file?.fileId) {
      try {
        await gridFSBucket.delete(template.file.fileId);
        console.log('🗑️ old file deleted');
      } catch (e) {
        console.log('⚠️ failed to delete old file');
      }
    }

    const uploadStream = gridFSBucket.openUploadStream(file.name, {
      contentType: file.mimetype,
      metadata: { templateName: name, updatedBy: userId }
    });

    uploadStream.end(file.data);

    uploadStream.on('finish', async () => {
      const realFileId = uploadStream.id;

      const fileDataUpdated = {
        fileId: realFileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadDate: new Date()
      };

      template = await LetterTemplate.findByIdAndUpdate(
        req.params.id,
        {
          name: name?.trim(),
          description: description?.trim(),
          category,
          isActive,
          file: fileDataUpdated
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Template updated with new file",
        template
      });
    });

    uploadStream.on('error', err => {
      console.log("❌ GridFS error:", err);
      return res.status(500).json({ success: false, message: "Error uploading new file" });
    });

  } catch (error) {
    console.error('❌ Update template error:', error);
    res.status(500).json({ success: false, message: 'Error updating template' });
  }
};

// ==================== DOWNLOAD FILE ====================
exports.downloadTemplateFile = async (req, res) => {
  try {
    const template = await LetterTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    if (!template.file?.fileId) return res.status(404).json({ success: false, message: "No file assigned" });

    const files = await gridFSBucket.find({ _id: template.file.fileId }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: "File missing in GridFS" });

    res.setHeader("Content-Type", template.file.fileType);
    res.setHeader("Content-Disposition", `attachment; filename="${template.file.fileName}"`);

    gridFSBucket.openDownloadStream(template.file.fileId).pipe(res);

  } catch (error) {
    console.error("❌ download error:", error);
    res.status(500).json({ success: false, message: "Download failed" });
  }
};

// ==================== DELETE TEMPLATE ====================
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await LetterTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });

    if (template.file?.fileId) {
      try {
        await gridFSBucket.delete(template.file.fileId);
        console.log("🗑️ deleted file:", template.file.fileId);
      } catch (e) {
        console.log("⚠️ failed to delete GridFS file");
      }
    }

    await LetterTemplate.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: "Template + file deleted" });

  } catch (error) {
    console.error("❌ delete error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// ==================== FILE INFO DEBUG ====================
exports.getTemplateFileInfo = async (req, res) => {
  try {
    const t = await LetterTemplate.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: "Not found" });

    const fileExists = await gridFSBucket.find({ _id: t.file?.fileId }).toArray();

    return res.status(200).json({
      success: true,
      document: t.name,
      storedFileReference: t.file,
      existsInGridFS: fileExists.length > 0,
      gridFSFile: fileExists[0] || null
    });

  } catch (e) {
    return res.status(500).json({ success: false, message: "Error reading file info" });
  }
};

// ==================== CATEGORY CRUD ====================
exports.getCategories = async (req, res) => {
  try {
    const categories = await LetterCategory.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching categories" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name required" });

    const category = await LetterCategory.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user?.id
    });

    res.status(201).json({ success: true, category });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const t = await LetterCategory.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name?.trim(),
        description: req.body.description?.trim(),
        isActive: req.body.isActive
      },
      { new: true }
    );

    res.status(200).json({ success: true, category: t });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const usageCount = await LetterTemplate.countDocuments({ category: req.params.id });

    if (usageCount > 0) {
      return res.status(400).json({ success: false, message: `Category used by ${usageCount} templates` });
    }

    await LetterCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Category deleted" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting category" });
  }
};
