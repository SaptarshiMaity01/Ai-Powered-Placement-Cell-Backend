import express from "express";
import Announcement from "../models/Announcement.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create announcement
router.post("/", verifyToken, async (req, res) => {
  const { title, content, targetAudience } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newAnnouncement = await Announcement.create({
      title,
      content,
      targetAudience,
      createdBy: req.user.id,
    });

    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Fetch all announcements (optionally filter by role)
router.get("/", verifyToken, async (req, res) => {
  if (!req.user.role) {
    console.warn("Warning: User role is undefined - using fallback filter");
  }
  console.log("Fetching announcements for user:", {
    userId: req.user.id,
    role: req.user.role
  });

  try {
    const query = {
      $or: [
        { targetAudience: req.user.role },
        { targetAudience: "all" },
        { createdBy: req.user.id }
      ]
    };

    console.log("Database query:", query);
    
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    
    console.log("Found announcements:", announcements.length);
    res.status(200).json(announcements);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});
// Update announcement
router.put("/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { title, content, targetAudience } = req.body;

  try {
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, targetAudience },
      { new: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json(updatedAnnouncement);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Delete announcement
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Allow deletion by admin OR the creator of the announcement
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (req.user.role !== "admin" && announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

export default router;
