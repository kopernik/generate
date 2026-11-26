export async function generateHeadlines({ topic: rawTopic, count: rawCount, style: rawStyle }) {
  const topic = typeof rawTopic === 'string' ? rawTopic.trim() : ''
  const count = Number(rawCount)
  const style = typeof rawStyle === 'string' ? rawStyle.trim() : 'Любой стиль'

  if (topic.length < 2 || topic.length > 180) {
    return { status: 400, body: { error: 'Тема должна содержать от 2 до 180 символов.' } }
  }

  if (![5, 8, 10].includes(count)) {
    return { status: 400, body: { error: 'Выберите 5, 8 или 10 вариантов.' } }
  }

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN
  if (!accountId || !apiToken) {
    return { status: 503, body: { error: 'Сервер пока не настроен: добавьте CF_ACCOUNT_ID и CF_API_TOKEN.' } }
  }

  try {
    const model = process.env.CF_AI_MODEL || '@cf/qwen/qwen3.8-27b'
    const instruction = `Ты — редактор и автор цепляющих заголовков на русском языке. Предложи ровно ${count} разных заголовков для статьи. Стиль: ${style}. Каждый заголовок — не более 10 слов, ясный, естественный и вовлекающий. Не добавляй нумерацию, кавычки, пояснения или Markdown. Верни каждый заголовок с новой строки.`
    const aiResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: `Тема статьи: ${topic}` },
        ],
        max_tokens: 1200,
        reasoning_effort: 'low',
        temperature: 0.9,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!aiResponse.ok) {
      const details = await aiResponse.json().catch(() => ({}))
      const providerMessage = details.errors?.[0]?.message || details.error?.message || 'unknown error'
      console.error('Cloudflare Workers AI error:', aiResponse.status, providerMessage)
      if (aiResponse.status === 429) {
        return { status: 429, body: { error: 'Cloudflare AI временно перегружен или исчерпан дневной лимит. Попробуйте позже.' } }
      }
      if ([401, 403].includes(aiResponse.status)) {
        return { status: 502, body: { error: 'Cloudflare отклонил доступ. Проверьте Account ID, API-токен и его права Workers AI.' } }
      }
      if (aiResponse.status >= 500) {
        return { status: 502, body: { error: 'Cloudflare AI временно недоступен. Попробуйте ещё раз позже.' } }
      }
      return { status: 502, body: { error: 'Cloudflare AI не принял запрос. Проверьте модель и настройки API.' } }
    }

    const data = await aiResponse.json()
    if (data.success === false) {
      const providerMessage = data.errors?.[0]?.message || 'unknown error'
      console.error('Cloudflare Workers AI error:', providerMessage)
      return { status: 502, body: { error: 'Cloudflare AI не смог обработать запрос. Попробуйте ещё раз.' } }
    }

    const outputText = data.result?.response || data.result?.choices?.[0]?.message?.content || ''
    const headlines = outputText
      .split('\n')
      .map((line) => line.replace(/^\s*(?:\d+[.)]|[-•])\s*/, '').replace(/^['"«»]+|['"«»]+$/g, '').trim())
      .filter(Boolean)
      .slice(0, count)

    if (headlines.length === 0) {
      return { status: 502, body: { error: 'ИИ вернул пустой ответ. Попробуйте изменить тему.' } }
    }

    return { status: 200, body: { headlines } }
  } catch (error) {
    console.error('Headline generation failed:', error.message)
    const message = error.name === 'TimeoutError'
      ? 'Запрос занял слишком много времени. Попробуйте ещё раз.'
      : 'Не удалось связаться с сервисом ИИ. Проверьте подключение и попробуйте снова.'
    return { status: 502, body: { error: message } }
  }
}
