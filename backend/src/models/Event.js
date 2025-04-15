const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on createdAt for efficient queries
EventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Event', EventSchema);
