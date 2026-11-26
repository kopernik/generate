import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { generateHeadlines } from '../client/lib/generate-headlines.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(express.json({ limit: '10kb' }))
if (process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN }))
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.post('/api/generate-headlines', async (request, response) => {
  const { status, body } = await generateHeadlines(request.body || {})
  return response.status(status).json(body)
})

app.listen(port, () => {
  console.log(`Headline API listening on http://localhost:${port}`)
})
