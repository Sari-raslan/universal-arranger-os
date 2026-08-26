import express from 'express';
import { productionReadiness } from './readiness.js';

const router = express.Router();

router.get('/readiness', (_req, res) => {
  res.json(productionReadiness());
});

export default router;
