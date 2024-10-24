import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const auth = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(403).json({ success: false });
  }

  if (req.user) {
    return next();
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ success: false });
  }

  if (decoded?.id) {
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ success: false });
    }
    req.user = user;
    return next();
  }

  return res.status(403).json({ success: false });
};


export default auth;
