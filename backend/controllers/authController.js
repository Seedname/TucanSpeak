import bcrypt from 'bcrypt';
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import User from "../models/userModel.js";
import dotenv from "dotenv"

dotenv.config()

var smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


const sendVerificationEmail = (name ,email, verificationString) => {
  smtpTransport.sendMail({
    from: 'TucanSpeak',
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

export const register = async (rq, rs) => {
  try {
    const { fullName, email, password } = rq.body;

    let user = await User.findOne({ email });
    if (user) {
      return rs.status(400).json({success: false, messgae: 'User already exists'});
    }

    const salt = await bcrypt.genSalt(10);
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

    rs.status(201).json({success: true, message: 'User registered. Please check your email to verify your account'})
  } catch (e) {
    console.log(e);
    rs.status(500).json({message: 'Server Error'});
  }
};

export const login = async (rq, rs) => {
  try {
    const { email, password } = rq.body;

    const user = await User.findOne({ email });
    if(!user) {
      return rs.status(400).json({success: false, message: 'Invalid Credentials'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return rs.status(400).json({ message: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      return rs.status(400).json({success: false, message: 'Please verify your email before logging in'})
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    rs.json({ token });
  } catch(e) {
    console.error(e);
    rs.status(500).json({succes: false, message: "Server Error"})
  } 
};

export const verifyEmail = async (rq, rs) => {
  try {
    const { token } = rq.params;

    const user = await User.findOne({ verificationToken: token });
    if(!user) {
      return rs.status(400).json({succes: false, message: 'Invalid verification token'});
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    rs.json({success: true, message: "Email verified successfully. You can now log in."});
  } catch (e) {
    console.error(e);
    rs.status(500).json({success: false, message: "Server error"});
  }
};

export const checkVerification = async (rq, rs) => {
  try {
    const { email } = rq.body;

    const user = await User.findOne({email});
    if(!user) {
      return rs.status(400).json({success: false, message: "User not found" });
    }
    
    rs.json({succes: true, isVerified: user.isVerified});
  } catch (e) {
    console.error(e);
    rs.status(500).json({success: false, message: "Server Error"})
  }
}

export const logout = async (rq, rs) => {
  rs.json({ message: 'Logged out successfully' });
};