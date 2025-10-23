import auth from '../middleware/auth.js';
import express from 'express';
import async from 'async';
import fs from 'fs';
import { type } from 'os';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';

import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = 'file://' + path.resolve(__dirname, '../aimodels/drawModel.json');
const model = await tf.loadLayersModel(modelPath);


export const tucanDraw = async (req, res) => {
  const imageData = req.body.image;
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const resizedBuffer = await sharp(imageBuffer)
  .resize(224, 224)  
  .removeAlpha()     
  .toFormat('png')    
  .toBuffer();

  const imageTensor = tf.node.decodeImage(resizedBuffer, 3)
  .expandDims(0);

  console.log(model.summary());

  // const predictions = await model.predict(imageTensor).data();
  // console.log(predictions)


  // Here, you can process the resizedBuffer as needed
  res.json({ message: 'Image received and processed successfully' });
};
