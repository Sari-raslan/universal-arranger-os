import express from 'express';
import { listPlans } from './plans.js';

const router = express.Router();

router.get('/plans', (_req, res) => {
  res.json({ ok: true, plans: listPlans() });
});

export default router;
