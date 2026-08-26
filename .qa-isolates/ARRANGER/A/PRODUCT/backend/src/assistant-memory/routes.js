import express from 'express';
import { buildAssistantReply } from './uaos-assistant.js';

const router = express.Router();
const memory = {};

router.post('/chat', (req, res) => {
  const userId = req.body?.userId || 'local-user';
  memory[userId] = memory[userId] || { started: false, notes: [] };

  const message = req.body?.message || '';
  memory[userId].started = true;
  memory[userId].notes.push({ message, time: new Date().toISOString() });

  const answer = buildAssistantReply({
    message,
    profile: memory[userId]
  });

  res.json({
    ok: true,
    userId,
    memory: memory[userId],
    ...answer
  });
});

router.get('/memory/:userId', (req, res) => {
  res.json({
    ok: true,
    memory: memory[req.params.userId] || null
  });
});

export default router;
