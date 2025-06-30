import Skill from '../models/skillModel.js';

// Get all skills for the user
export const getUserSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id });
    res.json(skills.map((s) => s.name));
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error while fetching skills' });
  }
};

// Add a new skill for the user
export const addUserSkill = async (req, res) => {
  const { skill } = req.body;

  if (!skill) {
    return res.status(400).json({ message: 'Skill is required' });
  }

  try {
    // Check if the skill already exists for the user
    const existing = await Skill.findOne({ user: req.user.id, name: skill });

    if (existing) {
      return res.status(409).json({ message: `Skill "${skill}" already exists` });
    }

    // Create and save new skill
    const newSkill = new Skill({
      name: skill,
      user: req.user.id,
    });

    await newSkill.save();

    // Return updated skills list
    const updatedSkills = await Skill.find({ user: req.user.id });
    res.status(201).json(updatedSkills.map((s) => s.name));
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Server error while adding skill' });
  }
};

// Remove a skill for the user
export const removeUserSkill = async (req, res) => {
  const skillName = req.params.skill;

  try {
    await Skill.deleteOne({ user: req.user.id, name: skillName });

    const updatedSkills = await Skill.find({ user: req.user.id });
    res.json(updatedSkills.map((s) => s.name));
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ message: 'Server error while removing skill' });
  }
};
