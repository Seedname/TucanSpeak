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
const modelPath = 'file://' + path.resolve(__dirname, '../aimodels_1/drawModel.json');
const model = await tf.loadLayersModel(modelPath);


export const tucanDraw = async (req, res) => {
  const labels = ["Bucket","Laptop","Door","Eye","Lightbulb","Mountain","Rainbow","Scissors","Sun","Tree"];
  const imageData = req.body.image;
  const challenge_word = req.body.challenge_word;
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const resizedBuffer = await sharp(imageBuffer)
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .resize(224, 224)
  .toFormat('png')
  .toBuffer();

  await sharp(resizedBuffer).toFile("debug.png");

  const imageTensor = tf.node.decodeImage(resizedBuffer, 3)
  .expandDims(0);
  const predictions = await model.predict(imageTensor).data();
  const maxIndex = predictions.indexOf(Math.max(...predictions));
  const predictedLabel = labels[maxIndex];
  console.log("Predicted label:", predictedLabel, predictedLabel.toLowerCase() === challenge_word.toLowerCase());
  res.json({
     predicted: predictedLabel, 
     challenge: challenge_word, 
     correct: predictedLabel.toLowerCase() === challenge_word.toLowerCase()
    });
};
