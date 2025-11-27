const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket;
function initBucket() {
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, { bucketName: "files" });
  console.log("✅ GridFS bucket initialized");
}

mongoose.connection.once("open", initBucket);

// =============================
// DUPLICATE FILE
// =============================
exports.duplicateFile = async (fileId, newFilename) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cleanName = newFilename.replace(".ocx", ".docx");

      const downloadStream = bucket.openDownloadStream(fileId);
      const uploadStream = bucket.openUploadStream(cleanName);

      downloadStream.pipe(uploadStream);

      uploadStream.on("finish", () => {
        resolve(uploadStream.id);
      });

      uploadStream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

// =============================
// REPLACE FILE
// =============================
exports.replaceFile = async (oldFileId, newFileStream, filename, mimetype) => {
  return new Promise(async (resolve, reject) => {
    try {
      try {
        await bucket.delete(oldFileId);
      } catch {}

      const safeName = filename.replace(".ocx", ".docx");
      const uploadStream = bucket.openUploadStream(safeName, { contentType: mimetype });
      newFileStream.pipe(uploadStream);

      uploadStream.on("finish", () => resolve(uploadStream.id));
      uploadStream.on("error", reject);

    } catch (error) {
      reject(error);
    }
  });
};

// =============================
// GET STREAM
// =============================
exports.getFileStream = async (fileId) => {
  return bucket.openDownloadStream(fileId);
};

// =============================
// DELETE
// =============================
exports.deleteFile = async (fileId) => {
  return bucket.delete(fileId);
};

// =============================
// FILE INFO
// =============================
exports.getFileInfo = async (fileId) => {
  const files = await bucket.find({ _id: fileId }).toArray();
  return files[0] || null;
};
