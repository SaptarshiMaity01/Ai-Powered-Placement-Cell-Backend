import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // get token after "Bearer"

  console.log('--- JWT Verification Debug ---');
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (!token) {
    console.error('Error: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    console.log('Verifying token with secret:', process.env.JWT_SECRET ? '*****' : 'UNDEFINED_SECRET');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token Payload:', JSON.stringify(decoded, null, 2));
    
    // Enhanced user object assignment
    req.user = {
      id: decoded.id,
      role: decoded.role, // Make sure this matches your token structure
      email: decoded.email // Add other fields as needed
    };
    
    console.log('Assigned req.user:', req.user);
    
    // Verify critical fields exist
    if (!req.user.id) {
      console.error('Error: Missing user ID in token');
      return res.status(403).json({ message: 'Invalid token payload' });
    }
    
    if (!req.user.role) {
      console.warn('Warning: No role found in token payload');
    }

    next();
  } catch (err) {
    console.error('Token Verification Error:', err.message);
    console.error('Error Stack:', err.stack);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(403).json({ 
      message: 'Invalid token',
      error: err.message 
    });
  }
};

export default verifyToken;