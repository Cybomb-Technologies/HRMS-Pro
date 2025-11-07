const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike,
  toggleBookmark,
  addComment,
  addCommentReaction,
  togglePin,
  getEmployeeFeed,
  getBookmarkedAnnouncements,
  getAnnouncementStats,
} = require("../controllers/announcementController");

// Public routes
router.get("/", getAnnouncements);
router.get("/feed", getEmployeeFeed);
router.get("/:id", getAnnouncement);
router.get("/stats/summary", getAnnouncementStats);

// Bookmark routes
router.get("/bookmarks/:userId", getBookmarkedAnnouncements);

// Interaction routes (should be protected in production)
router.post("/:id/like", toggleLike);
router.post("/:id/bookmark", toggleBookmark);
router.post("/:id/comment", addComment);
router.post("/:id/comment/:commentId/react", addCommentReaction);
router.patch("/:id/pin", togglePin);

// Admin routes (should have admin authentication middleware)
router.post("/", createAnnouncement);
router.put("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
