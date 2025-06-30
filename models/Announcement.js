import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetAudience: { type: String, enum: ["student", "recruiter", "all"], default: "all" },
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // your user model
    required: true,
  },
});

export default mongoose.model("Announcement", announcementSchema);
