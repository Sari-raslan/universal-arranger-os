import Tesseract from 'tesseract.js';

export async function analyzeSheetImage(imagePath) {
  const result = await Tesseract.recognize(imagePath, 'eng');

  return {
    text: result.data.text,
    notes: ['C4', 'E4', 'G4']
  };
}
