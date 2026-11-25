# Генератор креативных заголовков

React-интерфейс находится в `client/`, API на Express — в `server/`.

## Локальный запуск

1. Установите зависимости сервера: `cd server && npm install`.
2. Скопируйте `server/.env.example` в `server/.env` и добавьте свой `OPENAI_API_KEY`.
3. В первом терминале запустите API: `cd server && npm run dev`.
4. Во втором терминале запустите интерфейс: `cd client && npm run dev`.

Vite проксирует запросы `/api` на Express по адресу `http://localhost:3001`.

## Переменные сервера

- `OPENAI_API_KEY` — секретный ключ API; храните его только в `server/.env`.
- `OPENAI_MODEL` — модель, по умолчанию `gpt-4o-mini`.
- `PORT` — порт сервера, по умолчанию `3001`.

API принимает `POST /api/generate-headlines` с JSON `{ "topic": "...", "count": 5, "style": "Любой стиль" }` и возвращает `{ "headlines": ["..."] }`.

## Развёртывание

Сервер можно разместить на Railway или Render, указав корневой каталог `server/` и переменные окружения `OPENAI_API_KEY` и `CLIENT_ORIGIN` (адрес сайта). Клиент размещается на Vercel или Netlify; задайте `VITE_API_URL` как адрес опубликованного API (без завершающего `/`). Файл-пример клиентских переменных — `client/.env.example`.
