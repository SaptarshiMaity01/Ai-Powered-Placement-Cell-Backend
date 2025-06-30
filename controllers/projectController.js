import Project from '../models/Project.js';

export const getProjects = async (req, res) => {
  const projects = await Project.find({ user: req.user.id });
  res.json(projects);
};

export const createProject = async (req, res) => {
  const { title, description, techStack, githubLink } = req.body;
  if (!title || !description || techStack.length === 0) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const project = new Project({
    title,
    description,
    techStack,
    githubLink,
    user: req.user.id,
  });

  const savedProject = await project.save();
  res.status(201).json(savedProject);
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (project.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const updated = await Project.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (project.user.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await project.deleteOne();
  res.json({ message: 'Project deleted successfully' });
};
