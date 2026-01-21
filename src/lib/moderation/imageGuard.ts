/**
 * NSFW Image Detection Utility
 * Part of Stacq Sentinel automated moderation system
 * 
 * Uses nsfwjs with TensorFlow.js to detect NSFW content in images
 * before upload to prevent policy violations.
 */

import * as nsfwjs from 'nsfwjs';

let model: nsfwjs.NSFWJS | null = null;

/**
 * Initialize the NSFW detection model
 * Model is cached after first load for performance
 */
async function loadModel(): Promise<nsfwjs.NSFWJS> {
  if (model) return model;
  
  model = await nsfwjs.load();
  return model;
}

/**
 * Check if an image contains NSFW content
 * 
 * @param file - Image file to check
 * @returns Object with isNSFW boolean and predictions array
 * 
 * Threshold: 0.80 (80%) for Porn or Hentai categories
 * This is a STRICT threshold as specified in requirements
 */
export async function checkImageSafety(file: File): Promise<{
  isNSFW: boolean;
  predictions: Array<{ className: string; probability: number }>;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      // Step A: Load image into HTML img element
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          // Step B: Initialize NSFW model
          const nsfwModel = await loadModel();
          
          // Step C: Run classification
          const predictions = await nsfwModel.classify(img);
          
          // Step D: Check strict threshold (80%)
          const pornPrediction = predictions.find(p => p.className === 'Porn');
          const hentaiPrediction = predictions.find(p => p.className === 'Hentai');
          
          const pornProbability = pornPrediction?.probability || 0;
          const hentaiProbability = hentaiPrediction?.probability || 0;
          
          const isNSFW = pornProbability > 0.80 || hentaiProbability > 0.80;
          
          // Clean up
          URL.revokeObjectURL(objectUrl);
          
          resolve({
            isNSFW,
            predictions: predictions.map(p => ({
              className: p.className,
              probability: p.probability
            }))
          });
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    } catch (error) {
      reject(error);
    }
  });
}
