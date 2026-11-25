import { useState } from 'react'
import './App.css'

const styles = ['Любой стиль', 'Интригующий', 'Экспертный', 'Дружелюбный', 'Провокационный']

function SparkleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" /><path d="m19 15 .9 3.1L23 19l-3.1.9L19 23l-.9-3.1L15 19l3.1-.9L19 15Z" /></svg>
}

function App() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('Любой стиль')
  const [count, setCount] = useState('5')
  const [headlines, setHeadlines] = useState([])
  const [copied, setCopied] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate(event) {
    event?.preventDefault()
    if (!topic.trim() || isLoading) return
    setIsLoading(true)
    setError('')

    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const result = await fetch(`${apiBase}/api/generate-headlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count: Number(count), style }),
      })
      const data = await result.json()
      if (!result.ok) throw new Error(data.error || 'Не удалось сгенерировать заголовки.')
      if (!Array.isArray(data.headlines) || data.headlines.length === 0) {
        throw new Error('ИИ не вернул заголовки. Попробуйте ещё раз.')
      }
      setHeadlines(data.headlines)
    } catch (requestError) {
      setError(requestError.message || 'Не удалось связаться с сервером. Попробуйте ещё раз.')
      setHeadlines([])
    } finally {
      setIsLoading(false)
    }
  }

  async function copyHeadline(text, index) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(index)
      window.setTimeout(() => setCopied(-1), 1600)
    } catch {
      setCopied(-1)
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Искра — на главную">
          <span className="brand-mark"><SparkleIcon /></span>
          <span>искра<span className="brand-dot">.</span></span>
        </a>
        <span className="topbar-note">Мастерская заголовков</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="eyebrow-line" /> ИДЕИ, КОТОРЫЕ ЦЕПЛЯЮТ</div>
        <h1>Хорошая история<br /><span>начинается с заголовка.</span></h1>
        <p className="hero-copy">Поделитесь темой — и получите идеи, мимо которых<br className="desktop-break" /> невозможно пролистнуть.</p>

        <form className="generator" onSubmit={generate}>
          <label className="field-label" htmlFor="topic">О чём ваша статья?</label>
          <div className="topic-field">
            <span className="topic-icon"><SparkleIcon /></span>
            <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Например, как ИИ меняет образование" maxLength={180} />
            <span className="char-count">{topic.length}/180</span>
          </div>
          <div className="form-bottom">
            <div className="options">
              <label className="select-wrap">
                <span className="sr-only">Стиль заголовков</span>
                <select value={style} onChange={(event) => setStyle(event.target.value)}>{styles.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <span className="option-divider" />
              <label className="count-wrap"><span>Вариантов</span>
                <select value={count} onChange={(event) => setCount(event.target.value)} aria-label="Количество вариантов">
                  <option value="5">5</option><option value="8">8</option><option value="10">10</option>
                </select>
              </label>
            </div>
            <button className="generate-button" type="submit" disabled={!topic.trim() || isLoading}>
              <SparkleIcon /> <span>{isLoading ? 'Ищем идеи…' : 'Придумать заголовки'}</span> {!isLoading && <span className="button-arrow">↗</span>}
            </button>
          </div>
        </form>
        <div className="hint"><span className="hint-star">✳</span> Чем точнее тема, тем интереснее результат</div>
      </section>

      {error ? (
        <section className="error-state" role="alert">
          <span className="error-symbol">!</span><p>{error}</p>
          <button onClick={generate} disabled={isLoading}>{isLoading ? 'Пробуем ещё…' : 'Повторить'}</button>
        </section>
      ) : headlines.length > 0 ? (
        <section className="results" aria-live="polite">
          <div className="results-heading"><div><div className="results-kicker">ВАШИ ИДЕИ</div><h2>Есть за что зацепиться<span>.</span></h2></div><span className="results-count">{headlines.length} вариантов</span></div>
          <div className="headline-list">
            {headlines.map((headline, index) => <article className="headline-card" key={`${headline}-${index}`}>
              <span className="headline-number">{String(index + 1).padStart(2, '0')}</span><p>{headline}</p>
              <button className={`copy-button ${copied === index ? 'is-copied' : ''}`} onClick={() => copyHeadline(headline, index)} aria-label="Скопировать заголовок">{copied === index ? 'Готово ✓' : <><span>Копировать</span><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="9" height="10" rx="2"/><path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg></>}</button>
            </article>)}
          </div>
          <button className="again-button" onClick={generate}><SparkleIcon /> Попробовать ещё</button>
        </section>
      ) : isLoading ? (
        <section className="loading-state" aria-live="polite"><span className="loading-spinner" /><p>Подбираем точные слова…</p><span>Сейчас появятся свежие идеи</span></section>
      ) : (
        <section className="empty-state">
          <div className="empty-ornament"><span>✳</span><i /><b>✦</b></div>
          <p>Здесь появятся ваши будущие хиты</p>
          <span>Начните с темы выше — остальное за нами</span>
        </section>
      )}

      <footer className="footer"><span>Искра <span className="footer-dot">✳</span> Заголовки с характером</span><span>Сделано для хороших историй</span></footer>
    </main>
  )
}

export default App
