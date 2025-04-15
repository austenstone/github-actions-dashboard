const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  jobName: String,
  jobStatus: String,
  jobConclusion: String,
  startedAt: Date,
  completedAt: Date
});

const WorkflowSchema = new mongoose.Schema({
  repositoryName: {
    type: String,
    required: true,
    index: true
  },
  workflowName: {
    type: String,
    required: true
  },
  workflowId: {
    type: String,
    required: true
  },
  runId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ['queued', 'in_progress', 'completed']
  },
  conclusion: {
    type: String,
    enum: ['success', 'failure', 'cancelled', 'skipped', 'timed_out', 'action_required', null]
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: Date,
  jobs: [JobSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indices for efficient queries
WorkflowSchema.index({ repositoryName: 1, createdAt: -1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ conclusion: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
