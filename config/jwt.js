import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role, // Include role in the token
      email: user.email, // Optional but useful
      name: user.name,
      isActive: user.isActive, // Optional
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d' // Or your preferred expiration
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};