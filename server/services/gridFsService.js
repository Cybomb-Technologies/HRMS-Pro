// services/gridFsService.js
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket = null;

function initBucket() {
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, { bucketName: "files" });
  console.log("✅ GridFS bucket initialized (files)");
}

if (mongoose.connection.readyState === 1) {
  initBucket();
} else {
  mongoose.connection.once("open", initBucket);
}

function ensureBucket() {
  if (!bucket) {
    throw new Error("GridFS bucket not initialized yet");
  }
}

// =============================
// DUPLICATE FILE
// =============================
exports.duplicateFile = async (fileId, newFilename) => {
  ensureBucket();

  return new Promise((resolve, reject) => {
    try {
      const downloadStream = bucket.openDownloadStream(fileId);
      const uploadStream = bucket.openUploadStream(newFilename);

      downloadStream.pipe(uploadStream);

      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (err) => reject(err));
      downloadStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

// =============================
// REPLACE FILE
// =============================
exports.replaceFile = async (oldFileId, newFileStream, filename, mimetype) => {
  ensureBucket();

  return new Promise(async (resolve, reject) => {
    try {
      try {
        await bucket.delete(oldFileId);
      } catch (err) {
        console.log("⚠️ Warning: old file not found for delete (ignored)");
      }

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: mimetype,
      });
      newFileStream.pipe(uploadStream);

      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (err) => reject(err));
      newFileStream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

// =============================
// GET FILE STREAM
// =============================
exports.getFileStream = async (fileId) => {
  ensureBucket();
  return bucket.openDownloadStream(fileId);
};

// =============================
// DELETE FILE
// =============================
exports.deleteFile = async (fileId) => {
  ensureBucket();
  return bucket.delete(fileId);
};

// =============================
// GET FILE METADATA
// =============================
exports.getFileInfo = async (fileId) => {
  ensureBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  return files[0] || null;
};
