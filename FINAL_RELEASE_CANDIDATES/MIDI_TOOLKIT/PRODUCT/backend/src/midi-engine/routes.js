import express from 'express';
import { generateMidiPlan, generateStylePlan } from './style-midi-engine.js';

const router = express.Router();

router.post('/midi-plan', (req, res) => {
  res.json(generateMidiPlan(req.body?.arrangement || {}));
});

router.post('/style-plan', (req, res) => {
  res.json(generateStylePlan(req.body?.arrangement || {}));
});

export default router;
