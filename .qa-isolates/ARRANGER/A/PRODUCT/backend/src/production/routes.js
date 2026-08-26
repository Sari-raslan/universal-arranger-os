import express from 'express'
import { productionChecklist } from './checklist.js'

const router = express.Router()

router.get('/checklist', (req, res) => {
  res.json(productionChecklist())
})

export default router
