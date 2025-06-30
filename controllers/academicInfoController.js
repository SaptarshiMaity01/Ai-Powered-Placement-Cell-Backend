import AcademicInfo from '../models/AcademicInfo.js';

export const getAcademicInfo = async (req, res) => {
  try {
    const info = await AcademicInfo.findOne({ user: req.user.id });
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch academic info', error: err });
  }
};

export const saveAcademicInfo = async (req, res) => {
  try {
    const existing = await AcademicInfo.findOne({ user: req.user.id });

    if (existing) {
      const updated = await AcademicInfo.findOneAndUpdate(
        { user: req.user.id },
        { ...req.body },
        { new: true }
      );
      return res.status(200).json(updated);
    }

    const info = new AcademicInfo({ ...req.body, user: req.user.id });
    await info.save();
    res.status(201).json(info);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save academic info', error: err });
  }
};
