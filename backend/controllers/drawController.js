import auth from '../middleware/auth.js';
import express from 'express';
import async from 'async';
import fs from 'fs';
import { type } from 'os';
import sharp from 'sharp';
// import * as tf from '@tensorflow/tfjs-node';
import ml5 from 'ml5';

const classifier = await ml5.imageClassifier('../aimodels/drawModel.json');
export const tucanDraw = async (req, res) => {
  const imageData = req.body.image;
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const resizedBuffer = await sharp(imageBuffer)
  .resize(224, 224)  
  .removeAlpha()     
  .toFormat('png')    
  .toBuffer();
  

  // Here, you can process the resizedBuffer as needed
  res.json({ message: 'Image received and processed successfully' });
};
