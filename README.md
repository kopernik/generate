# Генератор креативных заголовков

React-интерфейс находится в `client/`, API на Express — в `server/`.

## Локальный запуск

1. Установите зависимости сервера: `cd server && npm install`.
2. В Cloudflare Dashboard откройте Workers AI → Use REST API, создайте токен Workers AI и скопируйте Account ID. При создании пользовательского токена выдайте ему права Workers AI Read и Workers AI Edit.
3. Скопируйте `server/.env.example` в `server/.env` и укажите `CF_ACCOUNT_ID` и `CF_API_TOKEN`.
4. В первом терминале запустите API: `cd server && npm run dev`.
5. Во втором терминале запустите интерфейс: `cd client && npm run dev`.

Vite проксирует запросы `/api` на Express по адресу `http://localhost:3001`.

## Переменные сервера

- `CF_ACCOUNT_ID` — Account ID Cloudflare.
- `CF_API_TOKEN` — секретный токен с правами Workers AI; храните его только в `server/.env`.
- `CF_AI_MODEL` — модель Workers AI, по умолчанию `@cf/qwen/qwen3.8-27b` с минимальным уровнем рассуждений для ускорения генерации.
- `PORT` — порт сервера, по умолчанию `3001`.

API принимает `POST /api/generate-headlines` с JSON `{ "topic": "...", "count": 5, "style": "Любой стиль" }` и возвращает `{ "headlines": ["..."] }`.

## Развёртывание

Проект можно целиком разместить на Vercel: React будет собираться как статический сайт, а `/api/generate-headlines` — работать как Vercel Function. Express остаётся для локальной разработки.

1. Импортируйте GitHub-репозиторий в Vercel и выберите **Root Directory** `client/`.
2. Используйте Vite preset, команду сборки `npm run build` и папку результата `dist`.
3. В настройках проекта Vercel добавьте `CF_ACCOUNT_ID`, `CF_API_TOKEN` и `CF_AI_MODEL` (значение модели — `@cf/qwen/qwen3.8-27b`). Секретный токен храните в переменных Vercel, не в репозитории.
4. Запустите Deploy. Параметр функции установлен на 60 секунд для запроса к модели.

Фронтенд и API будут доступны на одном домене; `VITE_API_URL` оставьте пустым. На бесплатном плане Workers AI действует лимит 10 000 Neurons в день; после его исчерпания запросы не проходят до сброса квоты.
