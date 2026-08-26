import express from 'express';
import { assistantReply } from './assistant.js';

const router = express.Router();

router.post('/chat', (req, res) => {
  res.json(assistantReply(req.body || {}));
});

export default router;
