import express from 'express';
import { createCloudUser, syncLibrary } from './cloud-sync.js';

const router = express.Router();

router.post('/user', (req, res) => {
  res.json({ ok: true, user: createCloudUser(req.body?.email) });
});

router.post('/library', (req, res) => {
  res.json({ ok: true, sync: syncLibrary(req.body?.userId, req.body?.items) });
});

export default router;
