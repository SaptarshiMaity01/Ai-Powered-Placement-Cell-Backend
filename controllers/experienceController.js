import Experience from "../models/Experience.js";

// GET all experiences
export const getExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find({ userId:req.user.id });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch experiences" });
  }
};

// POST a new experience
export const createExperience = async (req, res) => {
  try {
    const { role, company, duration, description } = req.body;
    if (!role || !company || !duration) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const newExp = new Experience({ userId:req.user.id , role, company, duration, description });
    await newExp.save();
    res.status(201).json(newExp);
  } catch (error) {
    res.status(500).json({ error: "Failed to create experience" });
  }
};

// PUT (update) experience
export const updateExperience = async (req, res) => {
  try {
    const updated = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update experience" });
  }
};

// DELETE experience
export const deleteExperience = async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: "Experience deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete experience" });
  }
};