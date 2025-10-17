const Announcement = require('../models/Announcements');

// @desc    Get all announcements with filtering
// @route   GET /api/announcements
// @access  Public
const getAnnouncements = async (req, res) => {
  try {
    const {
      category,
      priority,
      status = 'all',
      search,
      page = 1,
      limit = 50
    } = req.query;

    console.log('Received request with filters:', { category, priority, status, search });

    let query = {};

    // Build filter query
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search functionality
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    console.log(`Found ${announcements.length} announcements out of ${total} total`);

    res.json({
      success: true,
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching announcements', 
      error: error.message 
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    // Increment view count
    announcement.viewCount += 1;
    await announcement.save();

    res.json({
      success: true,
      announcement
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching announcement', 
      error: error.message 
    });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin/HR)
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      category = 'general',
      priority = 'normal',
      status = 'published',
      isPinned = false
    } = req.body;

    console.log('Creating announcement with data:', { 
      title: title?.substring(0, 50) + '...', 
      category, 
      priority, 
      status,
      isPinned 
    });

    // Basic validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 5 characters long'
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Content must be at least 10 characters long'
      });
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      status,
      isPinned,
      author: req.user?.name || 'Admin'
    });

    const createdAnnouncement = await announcement.save();
    
    console.log('Announcement created successfully with ID:', createdAnnouncement._id);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: createdAnnouncement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating announcement',
      error: error.message
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin/HR)
const updateAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      priority,
      status,
      isPinned
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    // Update fields only if they are provided
    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (category !== undefined) announcement.category = category;
    if (priority !== undefined) announcement.priority = priority;
    if (status !== undefined) announcement.status = status;
    if (isPinned !== undefined) announcement.isPinned = isPinned;

    const updatedAnnouncement = await announcement.save();
    
    console.log('Announcement updated successfully');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement',
      error: error.message
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin/HR)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    await Announcement.deleteOne({ _id: req.params.id });
    
    console.log('Announcement deleted successfully:', req.params.id);
    
    res.json({ 
      success: true,
      message: 'Announcement deleted successfully' 
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting announcement', 
      error: error.message 
    });
  }
};

// @desc    Toggle like on announcement
// @route   POST /api/announcements/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    const userId = req.body.userId || 'anonymous-user';

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    const isLiked = announcement.toggleLike(userId);
    await announcement.save();
    
    console.log(`User ${userId} ${isLiked ? 'liked' : 'unliked'} announcement ${announcement._id}`);

    res.json({
      success: true,
      likes: announcement.likes,
      isLiked
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while toggling like', 
      error: error.message 
    });
  }
};

// @desc    Toggle bookmark on announcement
// @route   POST /api/announcements/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    const userId = req.body.userId || 'anonymous-user';

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    const isBookmarked = announcement.toggleBookmark(userId);
    await announcement.save();
    
    console.log(`User ${userId} ${isBookmarked ? 'bookmarked' : 'unbookmarked'} announcement ${announcement._id}`);

    res.json({
      success: true,
      isBookmarked
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while toggling bookmark', 
      error: error.message 
    });
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content, author } = req.body; // author should come from frontend
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    // Use the author sent from frontend (employee name)
    const comment = {
      author: author || 'Employee', // Fallback to 'Employee' if not provided
      content: content.trim(),
      timestamp: new Date()
    };

    announcement.comments.push(comment);
    const updatedAnnouncement = await announcement.save();

    const newComment = updatedAnnouncement.comments[updatedAnnouncement.comments.length - 1];
    
    console.log(`New comment added to announcement ${announcement._id} by ${comment.author}`);

    res.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while adding comment', 
      error: error.message 
    });
  }
};

// @desc    Add reaction to comment
// @route   POST /api/announcements/:id/comment/:commentId/react
// @access  Private
const addCommentReaction = async (req, res) => {
  try {
    const { emoji, userId } = req.body;
    const { id, commentId } = req.params;

    if (!emoji || !emoji.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    const hadReaction = announcement.addCommentReaction(commentId, emoji.trim(), userId || 'anonymous-user');
    await announcement.save();

    const updatedComment = announcement.comments.id(commentId);
    
    console.log(`User ${userId} ${hadReaction ? 'removed' : 'added'} reaction ${emoji} to comment ${commentId}`);

    res.json({
      success: true,
      comment: updatedComment,
      hadReaction
    });
  } catch (error) {
    console.error('Add comment reaction error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while adding reaction', 
      error: error.message 
    });
  }
};

// @desc    Toggle pin announcement
// @route   PATCH /api/announcements/:id/pin
// @access  Private (Admin/HR)
const togglePin = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    announcement.isPinned = !announcement.isPinned;
    const updatedAnnouncement = await announcement.save();

    console.log(`Announcement ${announcement._id} pin status: ${updatedAnnouncement.isPinned}`);

    res.json({ 
      success: true,
      isPinned: updatedAnnouncement.isPinned 
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while toggling pin', 
      error: error.message 
    });
  }
};

// @desc    Get announcements for employee feed (only published)
// @route   GET /api/announcements/feed
// @access  Public
const getEmployeeFeed = async (req, res) => {
  try {
    const { category, priority, search, bookmarked, page = 1, limit = 20 } = req.query;

    console.log('Fetching employee feed with filters:', { category, priority, search, bookmarked });

    let query = { status: 'published' };

    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Handle bookmark filtering
    if (bookmarked && bookmarked !== 'all') {
      // In a real app, you'd get userId from authentication
      const userId = 'current-user'; // This should come from auth middleware
      query.bookmarkedBy = userId;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    console.log(`Employee feed: Found ${announcements.length} published announcements`);

    res.json({
      success: true,
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get employee feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee feed',
      error: error.message
    });
  }
};

// @desc    Get bookmarked announcements for user
// @route   GET /api/announcements/bookmarks/:userId
// @access  Private
const getBookmarkedAnnouncements = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const announcements = await Announcement.getBookmarkedByUser(userId);

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('Get bookmarked announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookmarked announcements',
      error: error.message
    });
  }
};

// @desc    Get announcement statistics
// @route   GET /api/announcements/stats/summary
// @access  Private (Admin/HR)
const getAnnouncementStats = async (req, res) => {
  try {
    const total = await Announcement.countDocuments();
    const published = await Announcement.countDocuments({ status: 'published' });
    const draft = await Announcement.countDocuments({ status: 'draft' });
    const archived = await Announcement.countDocuments({ status: 'archived' });
    const pinned = await Announcement.countDocuments({ isPinned: true });

    // Calculate total engagement (likes + comments)
    const announcements = await Announcement.find().select('likes comments');
    const totalLikes = announcements.reduce((sum, ann) => sum + (ann.likes || 0), 0);
    const totalComments = announcements.reduce((sum, ann) => sum + (ann.comments?.length || 0), 0);
    const totalEngagement = totalLikes + totalComments;

    // Get most popular categories
    const categoryStats = await Announcement.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        published,
        draft,
        archived,
        pinned,
        totalLikes,
        totalComments,
        totalEngagement,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get announcement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
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
  getAnnouncementStats
};