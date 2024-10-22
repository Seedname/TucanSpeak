import express from "express";
import { register, login, verifyEmail, logout, checkVerification } from "../controllers/authController.js";
import User from '../models/userModel.js';
import auth from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/verify/:token', verifyEmail)
authRouter.post('/check-verification', checkVerification)
authRouter.post('/logout', logout);

authRouter.get('/user-stats', auth, async (rq, rs) => {
  try {
    const user = await User.findById(rq.user._id);
    if (!user) {
      return resizeBy.status(404).json({success: false, message: 'User not found' });
    }

    rs.json({
      success: true,
      level: user.level,
      xp: user.xp,
      requiredXP: user.getRequiredXP()
    });
  } catch (e) {
    console.error('Error fetching user stats:', e);
    rs.status(500).json({success: false, message: 'Server error'});
  }
});

export default authRouter;