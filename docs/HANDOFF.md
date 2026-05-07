# DEVO+ — Как пользоваться и как продолжить работу с другим AI

Этот документ собран так, чтобы вы (или **любой другой AI/разработчик**) могли:
1. Запустить и использовать DEVO+ на своём компьютере.
2. Продолжить разработку Phase 2+ без потери контекста.

---

## Часть 1. Как пользоваться (запуск на вашем компьютере)

### Что нужно установить один раз

| Инструмент | Зачем | Как поставить |
|---|---|---|
| **Python 3.11+** | для backend (FastAPI) | https://www.python.org/downloads/ |
| **Poetry** | менеджер пакетов Python | `curl -sSL https://install.python-poetry.org \| python3 -` |
| **Node.js 20+** | для frontend (Vite/React) | https://nodejs.org или `nvm install 20` |
| **Git** | клонировать репозиторий | https://git-scm.com |
| **Cloudflared** *(опционально)* | публиковать в интернет без покупки домена | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ |

### Шаг 1. Клонировать репозиторий

```bash
git clone https://github.com/89532425259denis-alt/Messenger-.git devo-plus
cd devo-plus
```

### Шаг 2. Настроить ключи Google и Cloudflare

#### 2a. Google OAuth — **разрешите домен localhost** (это блокировало вход во время теста!)
1. Откройте https://console.cloud.google.com/apis/credentials
2. Найдите ваш OAuth 2.0 Client ID (тот, чей `GOOGLE_CLIENT_ID` вы мне присылали).
3. **Authorized JavaScript origins** → добавьте:
   - `http://localhost:5173`
   - `http://localhost:8000`
   - (потом, когда поднимете cloudflared) ваш постоянный URL, например `https://chat.example.com`
4. Save.

#### 2b. Cloudflare Turnstile — **разрешите домен localhost**
1. Откройте https://dash.cloudflare.com → Turnstile → ваш виджет.
2. **Hostname management** → добавьте `localhost`.
3. Save.

> Без этих двух шагов кнопка «Continue with Google» НЕ работает на localhost — это не баг кода, это политики Google и Cloudflare. Я предупреждал об этом во время теста; именно из-за этого T8 в отчёте отмечен как BLOCKED.

### Шаг 3. Запустить backend

```bash
cd api
cp .env.example .env
# Откройте .env в редакторе и впишите свои значения:
#   GOOGLE_CLIENT_ID=ваш_google_client_id
#   TURNSTILE_SITE_KEY=ваш_site_key
#   TURNSTILE_SECRET_KEY=ваш_secret_key
#   JWT_SECRET=сгенерируйте_случайную_строку  ← см. ниже
poetry install
poetry run fastapi dev app/main.py
```

Сгенерировать случайный `JWT_SECRET`:
```bash
python3 -c 'import secrets; print(secrets.token_hex(32))'
```

Должно появиться:
```
Server started at http://127.0.0.1:8000
Documentation at http://127.0.0.1:8000/docs
```

### Шаг 4. Запустить frontend (в другом терминале)

```bash
cd web
cp .env.example .env
# .env уже содержит: VITE_API_BASE_URL=http://localhost:8000 — менять не нужно
npm install
npm run dev
```

Откройте в браузере: **http://localhost:5173**

### Шаг 5. (Опционально) Открыть приложение в интернет через cloudflared

Без покупки домена:
```bash
cloudflared tunnel --url http://localhost:5173
```
Cloudflared выдаст временный URL вида `https://random-name.trycloudflare.com` — его можно скинуть друзьям.

Для постоянного домена смотрите `cloudflared/config.example.yml`.

> Если используете cloudflared URL — добавьте его в **Authorized JavaScript origins** Google и в **Hostname management** Turnstile (как в шаге 2).

### Что вы должны увидеть

- **http://localhost:5173/login** — экран входа с логотипом DEVO+ и кнопкой «Continue with Google».
- После входа — главный экран со списком чатов (как на ваших скриншотах).
- Темы: солнце / луна / системная — переключатель в правом верхнем углу.

> На текущем этапе (**Phase 1**) реальной отправки сообщений ещё нет — клик по чату открывает заглушку «Скоро здесь будут сообщения». Полный функционал по фазам — см. `docs/roadmap.md`.

---

## Часть 2. Как продолжить работу с другим AI

Этот раздел — короткий брифинг, который вы можете **скопировать целиком** в чат с любым другим AI (Cursor, Claude, GPT-4, другая сессия Devin), чтобы он мгновенно вошёл в контекст.

### Брифинг для нового AI (скопируйте всё ниже одним сообщением)

> Я работаю над DEVO+ — кастомным мессенджером в стиле Telegram с минималистичным дизайном (glassmorphism, шрифт Nunito для логотипа, Inter для контента). Репозиторий: **https://github.com/89532425259denis-alt/Messenger-**
>
> **Стек (бесплатные альтернативы Cloudflare Workers/DO):**
> - Backend: FastAPI + SQLAlchemy 2 (async) + SQLite, Poetry, в `api/`
> - Frontend: Vite + React 18 + TypeScript + Tailwind + shadcn/ui, в `web/`
> - Realtime: FastAPI WebSocket с in-memory broker (`api/app/realtime.py`)
> - Auth: Google Identity Services (id_token) + Cloudflare Turnstile, JWT HS256
> - Туннель: Cloudflared
> - Звонки (Phase 6): Jitsi Meet через iframe API
>
> **Что уже готово (Phase 1 — merged в PR #1):**
> - Дизайн-система, темы (light/dark/system), glassmorphism utilities
> - Login через Google OAuth + Turnstile, JWT-сессии
> - Главный экран: логотип DEVO+, поиск, ⋮-меню, карточки чатов, FAB, светлая/тёмная темы
> - Профиль, заглушка чата
> - REST: `GET /healthz`, `GET /config`, `POST /auth/google`, `GET /me`, `GET /chats`
> - WebSocket: `GET /ws/chat/{chat_id}?token=<jwt>` (in-memory broker, presence, typing, ping)
> - SQLAlchemy модели: User, Chat, ChatMember, Message, ChatKind (direct/group/channel/saved), MemberRole (owner/admin/member)
> - Cloudflared конфиг и docs
>
> **План оставшихся фаз** (`docs/roadmap.md`):
> 2. 1-на-1 чаты: реальные сообщения, реакции, reply, edit/delete у себя/у всех, прочитано/доставлено, online/typing/last seen, дата-разделители при скролле, кнопка ↓, звук отправки, контекстное меню чата (закрепить/архив/очистить/удалить), поиск в чате
> 3. Медиа: фото/видео/голосовые/документы с подписью + предпросмотром, inline crop фото, inline trim видео
> 4. Группы/каналы/сообщества: роли, права админов, lobby mode, исчезающие сообщения (1 час … 7 дней), action log
> 5. Поиск (юзеры+каналы), `/u/<username>` ссылки, опросы, геопозиция (включая разовую самоуничтожающуюся через 5 мин), обои чата и приложения
> 6. Звонки через Jitsi + Audio Rooms (поднятие руки, несколько модераторов)
> 7. Stealth-режим, точное «был в HH:MM», антибот-скоринг
> 8. PWA, push-уведомления, архив, тесты (pytest + vitest + Playwright)
>
> **Как запускать локально:**
> ```bash
> cd api && cp .env.example .env  # вписать GOOGLE_CLIENT_ID, TURNSTILE_*, JWT_SECRET
> poetry install && poetry run fastapi dev app/main.py
>
> cd web && cp .env.example .env
> npm install && npm run dev
> ```
> Frontend: http://localhost:5173, backend: http://localhost:8000.
>
> **Важные подводные камни:**
> - В `api/app/db.py` сессия экспортируется как `SessionLocal` (НЕ `async_session`).
> - JWT хранится в `localStorage['devo-plus.token']`, выпускается через `app.security.issue_token(user_id)`.
> - Turnstile siteverify бежит ПЕРЕД проверкой Google id_token в `/auth/google`, поэтому фейковая пара токенов даёт 403 «Bot challenge failed», а не Google-ошибку.
> - WebSocket требует, чтобы юзер был членом чата (`ChatMember`); иначе 403.
> - Google OAuth и Turnstile должны иметь localhost в whitelisted origins/hostnames, иначе кнопка не работает (это **не** баг кода, это настройка консолей).
>
> **Что мне нужно от тебя сейчас:** [ВАША ЗАДАЧА — например: «Реализуй Phase 2: реальную отправку сообщений в 1-на-1 чате с реакциями и edit/delete»].
>
> Создавай PR в новую ветку `devin/<timestamp>-phase-2-direct-chats` (или аналогичную) и пуш в репозиторий выше.

### Полезные ссылки для нового AI / разработчика
- Главный PR (Phase 1): https://github.com/89532425259denis-alt/Messenger-/pull/1
- Roadmap по фазам: [`docs/roadmap.md`](roadmap.md)
- Test-плана и отчёт: см. комментарий в PR от 7 мая 2026
- Тестовая запись прохождения Phase 1: https://app.devin.ai/attachments/c3a7e350-fb3f-4b09-b88f-9bece15b0eb0/rec-9941254b68ac4fd0886138ef5b0768a7-edited.mp4
- Skill для тестирования (если работаете с Devin): `.agents/skills/testing-devo-plus/SKILL.md`

### Что НЕ нужно делать новому AI (предупреждения)
- Не пытаться заменить SQLite + FastAPI на платные Cloudflare Durable Objects — мы намеренно используем бесплатный стек.
- Не ослаблять JWT/CORS/Turnstile проверки. Если нужен dev-bypass — он уже есть: при пустом `TURNSTILE_SECRET_KEY` сервер пропускает проверку.
- Не редактировать сгенерированные миграции/lock-файлы вручную — пользоваться `poetry add` и `npm install`.
- Не коммитить `.env` (он в `.gitignore`).
- Не править стилистику логотипа без необходимости — Nunito 900 закруглённый шрифт согласован с пользователем по референсу.

---

## Часть 3. Если что-то ломается

| Симптом | Что проверить |
|---|---|
| Кнопка «Continue with Google» не нажимается | DevTools Console → ищите `GSI_LOGGER: origin not allowed`. Добавьте `http://localhost:5173` в Authorized JavaScript origins (см. шаг 2a). |
| Виджет Turnstile пустой / ошибка 400020 | Добавьте `localhost` в Hostname management виджета Turnstile (см. шаг 2b). |
| Backend не стартует, ошибка про `SessionLocal` | Проверьте, что в `api/.env` есть `JWT_SECRET` и `GOOGLE_CLIENT_ID`. |
| Frontend белый экран | DevTools Console → ищите ошибки. Проверьте `web/.env`: `VITE_API_BASE_URL=http://localhost:8000`. |
| `/auth/google` возвращает 403 «Bot challenge failed» | Это нормально для фейкового токена. Реальный поток: Turnstile отдаёт токен → `/auth/google` его принимает. |
| Сообщения не отправляются | Phase 1 этого ещё не делает. Нужно Phase 2 (реальные сообщения). |

Если совсем застряли — откройте issue в репозитории или скиньте лог другому AI с куском брифинга выше.
