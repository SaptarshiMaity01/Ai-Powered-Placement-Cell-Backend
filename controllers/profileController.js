import Profile from "../models/Profile.js";

export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    res.status(200).json(profile || {});
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const saveProfile = async (req, res) => {
  try {
    
    const existing = await Profile.findOne({ userId: req.user.id });
    if (existing) {
      const updated = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        req.body,
        { new: true }
      );
      res.status(200).json(updated);
    } else {
      const newProfile = await Profile.create({ userId: req.user.id, ...req.body });
      res.status(201).json(newProfile);
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
