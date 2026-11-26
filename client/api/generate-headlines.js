import { generateHeadlines } from '../lib/generate-headlines.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Метод не поддерживается.' })
  }

  const { status, body } = await generateHeadlines(request.body || {})
  return response.status(status).json(body)
}
