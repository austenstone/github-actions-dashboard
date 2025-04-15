require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Webhooks } = require('@octokit/webhooks');
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/github-actions-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Initialize Webhooks
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

// Import routes
const workflowRoutes = require('./routes/workflow');

// Webhook event handlers
webhooks.on('workflow_run', ({ id, name, payload }) => {
  console.log(`Received webhook event: ${name} with id: ${id}`);
  // Store the raw payload in MongoDB
  require('./models/Event').create({
    type: name,
    payload: payload
  });
  
  // Extract and store structured data
  const workflowData = {
    repositoryName: payload.repository.full_name,
    workflowName: payload.workflow.name,
    workflowId: payload.workflow.id,
    runId: payload.workflow_run.id,
    status: payload.workflow_run.status,
    conclusion: payload.workflow_run.conclusion,
    startedAt: payload.workflow_run.created_at,
    endedAt: payload.workflow_run.updated_at
  };
  
  require('./models/Workflow').create(workflowData);
});

webhooks.on('workflow_job', ({ id, name, payload }) => {
  console.log(`Received webhook event: ${name} with id: ${id}`);
  // Store the raw payload
  require('./models/Event').create({
    type: name,
    payload: payload
  });
  
  // Update workflow with job info
  const jobData = {
    jobName: payload.workflow_job.name,
    jobStatus: payload.workflow_job.status,
    jobConclusion: payload.workflow_job.conclusion,
    startedAt: payload.workflow_job.started_at,
    completedAt: payload.workflow_job.completed_at
  };
  
  // Find and update the associated workflow
  require('./models/Workflow').findOneAndUpdate(
    { runId: payload.workflow_job.run_id },
    { $push: { jobs: jobData } },
    { new: true }
  );
});

// Optional: handle push events if needed
webhooks.on('push', ({ id, name, payload }) => {
  console.log(`Received webhook event: ${name} with id: ${id}`);
  require('./models/Event').create({
    type: name,
    payload: payload
  });
});

// Webhook route
app.post('/webhook', (req, res) => {
  // Verify webhook signature
  if (!req.headers['x-hub-signature-256']) {
    return res.status(400).send('No signature found');
  }
  
  try {
    // Verify and process the webhook
    webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'],
      name: req.headers['x-github-event'],
      signature: req.headers['x-hub-signature-256'],
      payload: req.body
    }).catch(err => console.error('Webhook verification failed:', err));
    
    return res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Error processing webhook');
  }
});

// API routes
app.use('/api/workflows', workflowRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
