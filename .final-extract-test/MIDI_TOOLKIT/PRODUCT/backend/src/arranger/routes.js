import express from 'express';
import { buildArrangementPlan } from './personalized-arranger.js';

const router = express.Router();

router.post('/personalize', (req, res) => {
  const { melody, tasteProfile } = req.body || {};

  const plan = buildArrangementPlan({
    melody,
    tasteProfile
  });

  res.json(plan);
});

export default router;
