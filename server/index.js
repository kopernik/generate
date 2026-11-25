import 'dotenv/config'
import cors from 'cors'
import express from 'express'

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
  const topic = typeof request.body?.topic === 'string' ? request.body.topic.trim() : ''
  const count = Number(request.body?.count)
  const style = typeof request.body?.style === 'string' ? request.body.style.trim() : 'Любой стиль'

  if (topic.length < 2 || topic.length > 180) {
    return response.status(400).json({ error: 'Тема должна содержать от 2 до 180 символов.' })
  }

  if (![5, 8, 10].includes(count)) {
    return response.status(400).json({ error: 'Выберите 5, 8 или 10 вариантов.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: 'Сервер пока не настроен: добавьте ключ OpenAI в server/.env.' })
  }

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions: `Ты — редактор и автор цепляющих заголовков на русском языке. Предложи ровно ${count} разных заголовков для статьи. Стиль: ${style}. Каждый заголовок — не более 10 слов, ясный, естественный и вовлекающий. Не добавляй нумерацию, кавычки, пояснения или Markdown. Верни каждый заголовок с новой строки.`,
        input: `Тема статьи: ${topic}`,
        max_output_tokens: 500,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!aiResponse.ok) {
      const details = await aiResponse.json().catch(() => ({}))
      console.error('OpenAI API error:', aiResponse.status, details.error?.message || 'unknown error')
      return response.status(502).json({ error: 'Не удалось получить заголовки от ИИ. Попробуйте ещё раз.' })
    }

    const data = await aiResponse.json()
    const outputText = data.output_text || data.output
      ?.flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text)
      .join('\n') || ''
    const headlines = outputText
      .split('\n')
      .map((line) => line.replace(/^\s*(?:\d+[.)]|[-•])\s*/, '').replace(/^['"«»]+|['"«»]+$/g, '').trim())
      .filter(Boolean)
      .slice(0, count)

    if (headlines.length === 0) {
      return response.status(502).json({ error: 'ИИ вернул пустой ответ. Попробуйте изменить тему.' })
    }

    return response.json({ headlines })
  } catch (error) {
    console.error('Headline generation failed:', error.message)
    const message = error.name === 'TimeoutError'
      ? 'Запрос занял слишком много времени. Попробуйте ещё раз.'
      : 'Не удалось связаться с сервисом ИИ. Проверьте подключение и попробуйте снова.'
    return response.status(502).json({ error: message })
  }
})

app.listen(port, () => {
  console.log(`Headline API listening on http://localhost:${port}`)
})
