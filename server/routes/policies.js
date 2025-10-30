const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const { authMiddleware: auth } = require('../middleware/authMiddleware');

const { check, validationResult } = require('express-validator');

// @route   GET /api/policies
// @desc    Get all policies
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching policies for user:', req.user.id);
    const policies = await Policy.find({ isActive: true })
      .select('-__v')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${policies.length} policies`);
    
    // Return the policies array directly in data field
    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/categories/list
// @desc    Get all policy categories
// @access  Private
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Policy.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/search/:query
// @desc    Search policies
// @access  Private
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    const policies = await Policy.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error searching policies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/policies/:id
// @desc    Get single policy
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/policies
// @desc    Create new policy
// @access  Private (Admin/HR)
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
    check('content', 'Content is required').not().isEmpty().trim()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    if (!['admin', 'hr', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    const { title, category, content, tags } = req.body;

    const newPolicy = new Policy({
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      tags: tags || [],
      createdBy: req.user.id
    });

    const policy = await newPolicy.save();
    await policy.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: policy,
      message: 'Policy created successfully'
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/policies/:id
// @desc    Update policy
// @access  Private (Admin/HR)
router.put('/:id', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('category', 'Category is required').not().isEmpty().trim(),
    check('content', 'Content is required').not().isEmpty().trim()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    if (!['admin', 'hr', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    const { title, category, content, tags } = req.body;

    let policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title: title.trim(),
          category: category.trim(),
          content: content.trim(),
          tags: tags || policy.tags,
          lastModifiedBy: req.user.id,
          version: policy.version + 1
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      data: updatedPolicy,
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/policies/:id
// @desc    Delete policy (soft delete)
// @access  Private (Admin/HR)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'hr', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }

    await Policy.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          isActive: false,
          lastModifiedBy: req.user.id 
        } 
      }
    );

    res.json({ 
      success: true,
      message: 'Policy deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting policy:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Policy not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;