const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
    users: [
      {
        type: String,
        required: true,
      },
    ],
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: String,
      required: false, // Store employee ID for reference
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reactions: [reactionSchema],
    edited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must be at least 10 characters long"],
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    author: {
      type: String,
      required: true,
      default: "Admin",
      trim: true,
    },
    authorId: {
      type: String,
      required: false, // NEW: Store author ID for notifications
    },
    category: {
      type: String,
      required: true,
      enum: ["general", "hr", "it", "finance", "events", "policy", "emergency"],
      default: "general",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: [
      {
        type: String,
      },
    ],
    bookmarkedBy: [
      {
        type: String,
      },
    ],
    comments: [commentSchema],
    attachments: [
      {
        filename: String,
        url: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
announcementSchema.index({ isPinned: -1, createdAt: -1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ status: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ bookmarkedBy: 1 });
announcementSchema.index({ likedBy: 1 });
announcementSchema.index({ title: "text", content: "text", author: "text" });

// Virtual for comment count
announcementSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Static method to get published announcements
announcementSchema.statics.getPublished = function (filters = {}) {
  const query = { status: "published", ...filters };
  return this.find(query).sort({ isPinned: -1, createdAt: -1 });
};

// Static method to get bookmarked announcements for a user
announcementSchema.statics.getBookmarkedByUser = function (userId) {
  return this.find({
    bookmarkedBy: userId,
    status: "published",
  }).sort({ createdAt: -1 });
};

// Method to toggle like
announcementSchema.methods.toggleLike = function (userId) {
  const userIndex = this.likedBy.indexOf(userId);

  if (userIndex > -1) {
    // Unlike
    this.likedBy.splice(userIndex, 1);
    this.likes = Math.max(0, this.likes - 1);
    return false;
  } else {
    // Like
    this.likedBy.push(userId);
    this.likes += 1;
    return true;
  }
};

// Method to toggle bookmark
announcementSchema.methods.toggleBookmark = function (userId) {
  const userIndex = this.bookmarkedBy.indexOf(userId);

  if (userIndex > -1) {
    // Remove bookmark
    this.bookmarkedBy.splice(userIndex, 1);
    return false;
  } else {
    // Add bookmark
    this.bookmarkedBy.push(userId);
    return true;
  }
};

// Method to add comment reaction
announcementSchema.methods.addCommentReaction = function (
  commentId,
  emoji,
  userId
) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Find or create reaction
  let reaction = comment.reactions.find((r) => r.emoji === emoji);

  if (!reaction) {
    reaction = {
      emoji: emoji,
      users: [],
      count: 0,
    };
    comment.reactions.push(reaction);
  }

  const userIndex = reaction.users.indexOf(userId);

  if (userIndex > -1) {
    // Remove reaction
    reaction.users.splice(userIndex, 1);
    reaction.count = Math.max(0, reaction.count - 1);
    return false;
  } else {
    // Add reaction
    reaction.users.push(userId);
    reaction.count += 1;
    return true;
  }
};

// Method to add comment
announcementSchema.methods.addComment = function (author, content, authorId) {
  const comment = {
    author: author,
    authorId: authorId,
    content: content,
    timestamp: new Date(),
  };

  this.comments.push(comment);
  return this.comments[this.comments.length - 1];
};

// Pre-save middleware to ensure data consistency
announcementSchema.pre("save", function (next) {
  // Ensure likes count matches likedBy array length
  if (this.likes !== this.likedBy.length) {
    this.likes = this.likedBy.length;
  }

  next();
});

// Instance method to check if user has liked
announcementSchema.methods.hasLiked = function (userId) {
  return this.likedBy.includes(userId);
};

// Instance method to check if user has bookmarked
announcementSchema.methods.hasBookmarked = function (userId) {
  return this.bookmarkedBy.includes(userId);
};

module.exports = mongoose.model("Announcement", announcementSchema);
