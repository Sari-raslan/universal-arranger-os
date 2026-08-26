import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { preprocessSheetImage } from './cv/preprocess.js';
import { segmentStaffLines } from './cv/staff-segmentation.js';
import { classifySymbolsFromStaff } from './ml/symbol-classifier.js';
import { reconstructRhythm } from './rhythm/rhythm-reconstruction.js';
import { detectBeamsSlursTies } from './rhythm/beam-slur-tie.js';
import { separateChordsAndVoices } from './arrangement/voice-separation.js';
import { buildMusicXml } from './musicxml/musicxml-builder.js';
import { buildMidi } from './musicxml/midi-builder.js';

export async function analyzeSheetToMidi(inputPath) {
  const id = uuidv4();

  fs.mkdirSync(path.join('uploads', 'omr'), { recursive: true });
  fs.mkdirSync('generated-midi', { recursive: true });
  fs.mkdirSync('generated-musicxml', { recursive: true });

  const processedPath = path.join('uploads', 'omr', `${id}.processed.png`);
  const midiPath = path.join('generated-midi', `${id}.mid`);
  const musicXmlPath = path.join('generated-musicxml', `${id}.musicxml`);

  const preprocess = await preprocessSheetImage(inputPath, processedPath);
  const staffSegmentation = await segmentStaffLines(processedPath);
  const symbols = classifySymbolsFromStaff(staffSegmentation);
  const rhythm = reconstructRhythm(symbols);
  const relations = detectBeamsSlursTies(symbols);
  const arrangement = separateChordsAndVoices(rhythm);
  const musicXml = buildMusicXml(rhythm);

  fs.writeFileSync(musicXmlPath, musicXml);
  buildMidi(rhythm, midiPath);

  return {
    ok: true,
    id,
    inputPath,
    processedPath,
    midiPath,
    musicXmlPath,
    preprocess,
    staffSegmentation,
    symbols,
    rhythm,
    relations,
    arrangement,
    quality: {
      professional: false,
      level: 'scaffold',
      note: 'This is the professional OMR architecture scaffold. ML model training is required for production-grade recognition.'
    }
  };
}
