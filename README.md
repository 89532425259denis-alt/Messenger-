# DEVO+

Минималистичный мессенджер с glassmorphism-оформлением, входом через Google,
антибот-защитой Cloudflare Turnstile и доставкой через Cloudflare Tunnel
(`cloudflared`). Это **Фаза 1** — фундамент проекта: дизайн-система, авторизация,
список чатов, заглушка чата и каркас real-time WebSocket.

> Полный план проекта (звонки на Jitsi Meet, Audio Rooms, исчезающие сообщения,
> Stealth-режим и т.д.) описан в [`docs/roadmap.md`](docs/roadmap.md).
>
> **Не знаете с чего начать?** Откройте [`docs/HANDOFF.md`](docs/HANDOFF.md) —
> там пошаговая инструкция «как пользоваться» и брифинг для другого AI/разработчика,
> чтобы продолжить разработку без потери контекста.

## Стек

| Слой         | Технология                                                         |
|--------------|--------------------------------------------------------------------|
| Frontend     | Vite + React 18 + TypeScript + Tailwind + shadcn/ui + lucide       |
| Backend      | FastAPI + SQLAlchemy 2 (async) + SQLite (aiosqlite)                |
| Realtime     | FastAPI WebSocket + in-process room broker (`app/realtime.py`)     |
| Auth         | Google OAuth (id_token) + собственные JWT-сессии                   |
| Antibot      | Cloudflare Turnstile (опционально, в `.env`)                        |
| Туннель      | `cloudflared` (Cloudflare Tunnel, бесплатно)                        |
| Звонки       | Jitsi Meet через iframe API (Фаза 6)                               |

## Структура репозитория

```
devo-plus/
├── api/                       # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI приложение
│   │   ├── config.py          # pydantic-settings, env vars
│   │   ├── db.py              # async-engine, session, init
│   │   ├── models.py          # User, Chat, ChatMember, Message
│   │   ├── schemas.py         # pydantic-схемы для API
│   │   ├── deps.py            # зависимости (auth, session)
│   │   ├── security.py        # JWT (HS256, без зависимостей)
│   │   ├── realtime.py        # in-memory room broker
│   │   ├── routers/           # auth, users, chats, config, ws
│   │   └── services/          # google_oauth, turnstile
│   ├── pyproject.toml
│   └── .env.example
├── web/                       # Vite + React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css          # темы + glassmorphism utilities
│   │   ├── components/        # Logo, SearchBar, ChatCard, Menu, ...
│   │   ├── pages/             # Login, Home, Profile, ChatPlaceholder
│   │   └── lib/               # api, theme, auth helpers
│   ├── tailwind.config.js
│   └── .env.example
├── cloudflared/
│   └── config.example.yml
└── README.md
```

## Быстрый старт (локально)

### 1. Backend (FastAPI)

```bash
cd api
cp .env.example .env       # добавьте GOOGLE_CLIENT_ID, остальное опционально
poetry install
poetry run fastapi dev app/main.py
# → http://localhost:8000  (Swagger UI: /docs)
```

### 2. Frontend (Vite + React)

```bash
cd web
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:5173
```

### 3. Cloudflared (опционально, бесплатно)

Чтобы открыть приложение в интернет без покупки домена:

```bash
# Backend
cloudflared tunnel --url http://localhost:8000

# Frontend
cloudflared tunnel --url http://localhost:5173
```

Для постоянных hostnames смотрите [`cloudflared/config.example.yml`](cloudflared/config.example.yml).

## Настройка Google OAuth

1. Откройте [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create credentials → **OAuth client ID** → Application type **Web application**.
3. Authorized JavaScript origins:
   - `http://localhost:5173`
   - ваш cloudflared hostname (например `https://chat.example.com`)
4. Скопируйте Client ID в `api/.env` (`GOOGLE_CLIENT_ID=…`). Для frontend он автоматически
   подгружается через `/config`.

## Настройка Cloudflare Turnstile (опционально)

1. [dash.cloudflare.com → Turnstile → Add site](https://dash.cloudflare.com/?to=/:account/turnstile).
2. Site key → `TURNSTILE_SITE_KEY`, Secret key → `TURNSTILE_SECRET_KEY` в `api/.env`.
3. На странице входа появится виджет, и сервер будет проверять токен через `siteverify`.

Если ключи не заданы — сервер пропускает проверку (удобно для дев-режима).

## API endpoints (Фаза 1)

| Метод | URL                | Описание                                       |
|-------|--------------------|------------------------------------------------|
| GET   | `/healthz`         | Healthcheck                                    |
| GET   | `/config`          | Публичный конфиг для фронтенда                 |
| POST  | `/auth/google`     | Обмен Google id_token на DEVO+ JWT             |
| GET   | `/me`              | Текущий пользователь                           |
| GET   | `/chats`           | Список чатов пользователя                      |
| WS    | `/ws/chat/{id}`    | WebSocket для realtime событий чата            |

## Дизайн-система

- Шрифты: **Nunito 900** (логотип/заголовки), **Inter** (тело)
- Темы: `light` / `dark` / `system` (toggle на каждой странице)
- Glassmorphism utilities: `.glass`, `.glass-strong`, `.scroll-fade-y`
- Базовый радиус карточек: `1.25rem` (24px), кнопки и аватары — пилюли/круги
- Цвета — нейтральные градации серого + `--accent` (чёрный в light, белый в dark)

## Roadmap

См. [docs/roadmap.md](docs/roadmap.md) — следующие фазы (1-на-1 чаты, медиа,
группы/каналы, Audio Rooms, Stealth-режим, исчезающие сообщения и др.).
