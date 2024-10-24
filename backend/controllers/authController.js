import bcrypt from 'bcrypt';
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import User from "../models/userModel.js";
import dotenv from "dotenv"

dotenv.config()

var smtpTransport = nodemailer.createTransport({
  host: "mail.smtp2go.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = (name, email, verificationString) => {
  smtpTransport.sendMail({
    from: "noreply@tucanspeak.org",
    to: email,
    subject: 'TucanSpeak Verification',
    text: `Hello ${name}, please follow the following link to verify your account:\nhttp://localhost:4000/auth/verify/${verificationString}`,
    html: `<p>Hello ${name}, please follow the following link to verify your account:</p><br><a href="http://localhost:4000/auth/verify/${verificationString}">http://localhost:4000/auth/verify/${verificationString}</a>`
  },
    function (error) {
      if(error){
        console.log(error);
        console.log(process.env.SMTP_USER, process.env.SMTP_PASS);
      } else {
        console.log('Message sent to:', email);
      }
    }
  );
}

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({success: false, message: 'User already exists'});
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');

    user = new User({
      fullName,
      email,
      password: hashedPassword,
      verificationToken
    });

    await user.save()

    sendVerificationEmail(fullName, email, verificationToken);

    res.status(201).json({success: true, message: 'User registered. Please check your email to verify your account'})
  } catch (e) {
    console.log(e);
    res.status(500).json({success: false, message: 'Server Error'});
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', 
      maxAge: 3600000, 
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if(!user) {
      return res.status(400).json({success: false, message: 'Invalid verification token'});
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({success: true, message: "Email verified successfully. You can now log in."});
  } catch (e) {
    console.error(e);
    res.status(500).json({success: false, message: "Server error"});
  }
};

export const checkVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({email});
    if(!user) {
      return res.status(400).json({success: false, message: "User not found" });
    }
    
    res.status(200).json({succes: true, isVerified: user.isVerified});
  } catch (e) {
    console.error(e);
    res.status(500).json({success: false, message: "Server Error"})
  }
}

export const checkAuthentication = async (req, res) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(403).json({ success: false })
  }

  try  {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({succes: true});
  } catch (err) {
    return res.status(403).json({ success: false })
  }
}

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({ message: 'Logged out successfully' });
};
