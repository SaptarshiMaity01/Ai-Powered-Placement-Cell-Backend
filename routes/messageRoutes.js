import express from 'express';
import Message from '../models/Message.js';
import  verifyToken  from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all chat users
router.get('/users', verifyToken, async (req, res) => {
  console.log("GET /users route hit ✅");
  

  try {
    // 1. First get all users except current user
    const allUsers = await User.find({
      _id: { $ne: req.user.id }
    }).select('name avatar online role');

 
    // Find latest messages where current user is the receiver
    const unreadMessages = await Message.aggregate([
      { 
        $match: {
          
          receiverId: new mongoose.Types.ObjectId(req.user.id),
          read: false // Assuming you have a 'read' field
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$senderId",
          lastMessage: { $first: "$content" },
          lastMessageTime: { $first: "$timestamp" },
          unreadCount: { $sum: 1 }
        }
      }
    ]);
    
    // Create a map for quick lookup
    const unreadMap = {};
    unreadMessages.forEach(item => {
      unreadMap[item._id.toString()] = {
        lastMessage: item.lastMessage,
        lastMessageTime: item.lastMessageTime,
        unreadCount: item.unreadCount
      };
    });

    console.log("Current user ID:", req.user.id);
   console.log("Total users found:", allUsers.length);
   console.log("req.user.id:", req.user.id);
console.log("Type of req.user.id:", typeof req.user.id);

console.log("Unread messages aggregation result:", 
  JSON.stringify(unreadMessages, null, 2));

console.log("Unread map contents:", 
  Object.entries(unreadMap).map(([k, v]) => ({ [k]: v })));
    
    // 2. Transform into chat user format
    const chatUsers = allUsers.map(user => {
      const userId = user._id.toString();
      const userUnread = unreadMap[userId] || {};
      
      return {
        id: userId,
        name: user.name,
        avatar: user.avatar || '',
        online: user.online || false,
        type: user.role || 'student',
        hasNewMessage: !!userUnread.unreadCount, // Only true if there are unread messages
        unreadCount: userUnread.unreadCount || 0,
        lastMessage: userUnread.lastMessage || '',
        lastMessageTime: userUnread.lastMessageTime || null,
        isNewChat: !userUnread.lastMessage // Flag to indicate if this is a new potential chat
      };
    });

    console.log("Returning chat users with unread info:", 
      chatUsers.map(u => ({name: u.name, hasNew: u.hasNewMessage, count: u.unreadCount})));
    
    res.json(chatUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
});

// Add this new endpoint for creating first message
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    // Create first message
    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content
    });
    
    const savedMessage = await message.save();
    
    res.json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting conversation",
      error: error.message
    });
  }
});

// Get messages between two users
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name avatar');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save a message
router.post('/', verifyToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content
    });

    const savedMessage = await message.save();
    
    // Populate sender info before sending back
    const populatedMessage = await Message.populate(savedMessage, {
      path: 'senderId',
      select: 'name avatar'
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:userId/read', verifyToken, async (req, res) => {
  try {
    // Mark all messages from this user to current user as read
    await Message.updateMany(
      { 
        senderId: req.params.userId, 
        receiverId: req.user.id,
        read: false
      },
      { $set: { read: true } }
    );
    
    console.log(`Marked messages from ${req.params.userId} to ${req.user.id} as read`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;