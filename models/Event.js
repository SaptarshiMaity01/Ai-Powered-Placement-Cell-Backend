import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty']
  },
  start: {
    type: Date,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(value) {
        return value !== null && value !== undefined;
      },
      message: 'Start time cannot be null'
    }
  },
  end: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(value) {
        // Ensure end is after start
        return value !== null && value !== undefined && value > this.start;
      },
      message: 'End time must be after start time'
    }
  },
  color: {
    type: String,
    default: '#0a66c2',
    validate: {
      validator: function(value) {
        // Simple hex color validation
        return /^#([0-9A-F]{3}){1,2}$/i.test(value);
      },
      message: 'Invalid color format'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster querying by user and date range
eventSchema.index({ user: 1, start: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;