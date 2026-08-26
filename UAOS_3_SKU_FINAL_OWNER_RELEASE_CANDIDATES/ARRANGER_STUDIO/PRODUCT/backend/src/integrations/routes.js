import express from 'express';
import { listIntegrations } from './integrations.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(listIntegrations());
});

export default router;
