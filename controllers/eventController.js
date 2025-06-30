import Event from '../models/Event.js';
import mongoose from 'mongoose';

// Helper function to validate event data
const validateEventData = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  }
  
  if (!data.start || isNaN(new Date(data.start).getTime())) {
    errors.start = 'Valid start time is required';
  }
  
  if (!data.end || isNaN(new Date(data.end).getTime())) {
    errors.end = 'Valid end time is required';
  } else if (new Date(data.end) <= new Date(data.start)) {
    errors.end = 'End time must be after start time';
  }
  
  if (data.color && !/^#([0-9A-F]{3}){1,2}$/i.test(data.color)) {
    errors.color = 'Invalid color format';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};

// @desc    Get all events for a user
// @route   GET /api/events
// @access  Private
export const getEvents = async (req, res) => {
  try {
    // Optional query parameters for date range
    const { start, end } = req.query;
    
    let query = { user: req.user.id };
    
    if (start && !isNaN(new Date(start).getTime())) {
      query.start = {
        $gte: new Date(start)
      };
    }
    
    if (end && !isNaN(new Date(end).getTime())) {
      query.start = query.start || {};
      query.start.$lte = new Date(end);
    }
    
    const events = await Event.find(query).sort({ start: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res) => {
  try {
    const { title, start, end, color, description } = req.body;
    
    // Validate input data
    const validationErrors = validateEventData(req.body);
    if (validationErrors) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    const event = new Event({
      title: title.trim(),
      start: new Date(start),
      end: new Date(end),
      color: color || '#0a66c2',
      description: description ? description.trim() : '',
      user: req.user.id
    });
    
    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (err) {
    console.error(err);
    
    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(err.errors).reduce((acc, { properties }) => {
        acc[properties.path] = properties.message;
        return acc;
      }, {});
      
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req, res) => {
  try {
    const { title, start, end, color, description } = req.body;
    const eventId = req.params.id;
    
    // Validate input data
    const validationErrors = validateEventData(req.body);
    if (validationErrors) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Changed from findOne({ id: eventId }) to findById(eventId)
    const event = await Event.findOne({ 
      _id: eventId, 
      user: req.user.id 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update fields
    event.title = title.trim();
    event.start = new Date(start);
    event.end = new Date(end);
    event.color = color;
    event.description = description ? description.trim() : '';
    
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    
    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(err.errors).reduce((acc, { properties }) => {
        acc[properties.path] = properties.message;
        return acc;
      }, {});
      
      return res.status(400).json({ 
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    // Changed from findOneAndDelete({ id: eventId }) to findOneAndDelete({ _id: eventId })
    const event = await Event.findOneAndDelete({ 
      _id: eventId, 
      user: req.user.id 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event removed', id: event._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};