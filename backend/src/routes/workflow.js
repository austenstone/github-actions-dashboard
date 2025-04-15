const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');

// Get all workflows with optional filtering
router.get('/', async (req, res) => {
  try {
    const { repository, status, conclusion, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object based on query parameters
    const filter = {};
    if (repository) filter.repositoryName = repository;
    if (status) filter.status = status;
    if (conclusion) filter.conclusion = conclusion;
    
    // Get total count for pagination
    const totalCount = await Workflow.countDocuments(filter);
    
    // Get workflows with pagination
    const workflows = await Workflow.find(filter)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      data: workflows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active workflows (status = in_progress or queued)
router.get('/active', async (req, res) => {
  try {
    const activeWorkflows = await Workflow.find({
      status: { $in: ['in_progress', 'queued'] }
    }).sort({ startedAt: -1 });
    
    res.json(activeWorkflows);
  } catch (error) {
    console.error('Error fetching active workflows:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ runId: req.params.id });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error(`Error fetching workflow ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get workflow statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { repository, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Build filter object
    const filter = {
      startedAt: { $gte: startDate }
    };
    if (repository) filter.repositoryName = repository;
    
    // Get workflow count by status
    const statusStats = await Workflow.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    // Get workflow count by conclusion
    const conclusionStats = await Workflow.aggregate([
      { $match: { ...filter, conclusion: { $ne: null } } },
      { $group: {
        _id: '$conclusion',
        count: { $sum: 1 }
      }}
    ]);
    
    // Get average duration by workflow name
    const durationStats = await Workflow.aggregate([
      { $match: { 
        ...filter, 
        status: 'completed',
        startedAt: { $ne: null },
        endedAt: { $ne: null }
      }},
      { $project: {
        workflowName: 1,
        duration: { 
          $divide: [
            { $subtract: ['$endedAt', '$startedAt'] },
            1000 // Convert to seconds
          ]
        }
      }},
      { $group: {
        _id: '$workflowName',
        avgDuration: { $avg: '$duration' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      statusStats,
      conclusionStats,
      durationStats
    });
  } catch (error) {
    console.error('Error fetching workflow statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
