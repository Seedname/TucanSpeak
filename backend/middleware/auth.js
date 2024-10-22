import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const auth = async (rq, rs, next) => {
  try {
    const token = rq.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return rs.status(401).json({ success: false, message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return rs.status(401).json({ success: false, message: 'User not found' });
    }

    rq.user = user;
    next();
  } catch (error) {
    rs.status(401).json({ success: false, message: 'Token is invalid' });
  }
};

export default auth;