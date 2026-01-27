# 🧪 Тестирование Webhook

## Статус: Phase 2.3 - Webhook Testing

Webhook endpoint уже создан (`api/webhook.ts`). Теперь нужно протестировать его локально.

---

## Шаг 1: Установить ngrok (если еще нет)

### Windows:
```bash
# Вариант 1: Через npm (рекомендуется)
npm install -g ngrok

# Вариант 2: Скачать с сайта
# https://ngrok.com/download
# Распаковать и добавить в PATH
```

### Проверка установки:
```bash
ngrok version
# Должно показать версию, например: ngrok version 3.x.x
```

---

## Шаг 2: Запустить dev server

```bash
# В первом терминале
npm run dev
```

**Ожидаемый результат:**
```
VITE v5.4.21  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Оставь этот терминал открытым!**

---

## Шаг 3: Запустить ngrok

```bash
# В ВТОРОМ терминале (новое окно)
ngrok http 3000
```

**Ожидаемый результат:**
```
ngrok

Session Status                online
Account                       your@email.com
Version                       3.x.x
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Важно:** Скопируй URL вида `https://abc123.ngrok.io`

**Оставь этот терминал открытым!**

---

## Шаг 4: Протестировать webhook

### Вариант A: С помощью curl (Windows CMD)

```bash
# В ТРЕТЬЕМ терминале

# 1. Установить переменные
set NGROK_URL=https://abc123.ngrok.io
set WEBHOOK_SECRET=your_webhook_secret_from_env

# 2. Создать тестовое событие
set EVENT_DATA={"event":"miniapp.open","data":{"fid":12345,"timestamp":1234567890}}

# 3. Сгенерировать signature (нужен Node.js)
node -e "const crypto = require('crypto'); const body = '%EVENT_DATA%'; const secret = '%WEBHOOK_SECRET%'; const hmac = crypto.createHmac('sha256', secret); hmac.update(body); console.log(hmac.digest('hex'));"

# 4. Скопировать полученный signature

# 5. Отправить запрос
curl -X POST %NGROK_URL%/api/webhook ^
  -H "X-Farcaster-Signature: PASTE_SIGNATURE_HERE" ^
  -H "Content-Type: application/json" ^
  -d "%EVENT_DATA%"
```

### Вариант B: С помощью PowerShell (рекомендуется)

```powershell
# В ТРЕТЬЕМ терминале (PowerShell)

# 1. Установить переменные
$ngrokUrl = "https://abc123.ngrok.io"
$webhookSecret = "your_webhook_secret_from_env"

# 2. Создать тестовое событие
$eventData = '{"event":"miniapp.open","data":{"fid":12345,"timestamp":1234567890}}'

# 3. Сгенерировать signature
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($webhookSecret)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($eventData))
$signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()

# 4. Отправить запрос
$headers = @{
    "X-Farcaster-Signature" = $signature
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "$ngrokUrl/api/webhook" `
    -Method POST `
    -Headers $headers `
    -Body $eventData
```

### Вариант C: Простой тест-скрипт

Создам готовый скрипт для тебя:

```bash
# Запустить:
node test-webhook.js
```

---

## Ожидаемые результаты

### В терминале с dev server:
```
[Open] User 12345 opened the app at 2009-02-13T23:31:30.000Z
```

### В терминале с curl/PowerShell:
```
StatusCode        : 200
StatusDescription : OK
Content           : {"success":true}
```

### В ngrok Web Interface (http://127.0.0.1:4040):
```
POST /api/webhook    200 OK
```

---

## Проверка разных событий

### Test 1: miniapp.install
```powershell
$eventData = '{"event":"miniapp.install","data":{"fid":12345,"timestamp":1234567890}}'
# Повторить шаги 3-4
```

**Ожидается:** `[Install] User 12345 installed the app...`

### Test 2: miniapp.uninstall
```powershell
$eventData = '{"event":"miniapp.uninstall","data":{"fid":12345,"timestamp":1234567890}}'
# Повторить шаги 3-4
```

**Ожидается:** `[Uninstall] User 12345 uninstalled the app...`

### Test 3: frame.button
```powershell
$eventData = '{"event":"frame.button","data":{"fid":12345,"timestamp":1234567890,"buttonIndex":1}}'
# Повторить шаги 3-4
```

**Ожидается:** `[Frame] User 12345 clicked button 1...`

---

## Тестирование ошибок

### Test 4: Invalid signature
```powershell
$headers = @{
    "X-Farcaster-Signature" = "invalid_signature"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "$ngrokUrl/api/webhook" `
    -Method POST `
    -Headers $headers `
    -Body $eventData
```

**Ожидается:** `401 Unauthorized` + `Invalid webhook signature`

### Test 5: Missing signature
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "$ngrokUrl/api/webhook" `
    -Method POST `
    -Headers $headers `
    -Body $eventData
```

**Ожидается:** `401 Unauthorized` + `Missing X-Farcaster-Signature header`

### Test 6: Invalid event structure
```powershell
$eventData = '{"event":"miniapp.open","data":{"fid":12345}}'  # Missing timestamp
# Сгенерировать signature и отправить
```

**Ожидается:** `400 Bad Request` + `Invalid event structure`

---

## Troubleshooting

### ❌ "ngrok: command not found"
```bash
# Установить ngrok:
npm install -g ngrok

# Или скачать с https://ngrok.com/download
```

### ❌ "WEBHOOK_SECRET not configured"
```bash
# Проверить .env файл:
# Должна быть строка: WEBHOOK_SECRET=your_secret_here

# Перезапустить dev server:
# Ctrl+C в терминале с npm run dev
npm run dev
```

### ❌ "Connection refused"
```bash
# Проверить что dev server запущен:
# Должен быть терминал с "Local: http://localhost:3000/"

# Проверить что ngrok указывает на правильный порт:
ngrok http 3000
```

### ❌ "Invalid signature"
```bash
# Проверить что используешь правильный WEBHOOK_SECRET
# Он должен совпадать с тем, что в .env

# Проверить что signature генерируется правильно
# Используй скрипт test-webhook.js
```

---

## Checklist

После успешного тестирования:

- [ ] Dev server запущен
- [ ] ngrok запущен и показывает URL
- [ ] Test 1: miniapp.install работает (200 OK)
- [ ] Test 2: miniapp.uninstall работает (200 OK)
- [ ] Test 3: miniapp.open работает (200 OK)
- [ ] Test 4: frame.button работает (200 OK)
- [ ] Test 5: Invalid signature возвращает 401
- [ ] Test 6: Missing signature возвращает 401
- [ ] Test 7: Invalid event возвращает 400
- [ ] Логи в dev server показывают события

---

## Следующий шаг

После успешного тестирования:

✅ **Phase 2 Complete!**

Переходи к **Phase 5: Production Deployment**

См. [NEXT_STEPS.md](NEXT_STEPS.md) → Phase 5

---

## Быстрая команда для копирования

```powershell
# Полный тест (PowerShell)
$ngrokUrl = "https://YOUR_NGROK_URL.ngrok.io"
$webhookSecret = "YOUR_WEBHOOK_SECRET"
$eventData = '{"event":"miniapp.open","data":{"fid":12345,"timestamp":1234567890}}'
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($webhookSecret)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($eventData))
$signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()
$headers = @{"X-Farcaster-Signature" = $signature; "Content-Type" = "application/json"}
Invoke-WebRequest -Uri "$ngrokUrl/api/webhook" -Method POST -Headers $headers -Body $eventData
```

**Замени:**
- `YOUR_NGROK_URL` на твой ngrok URL
- `YOUR_WEBHOOK_SECRET` на твой webhook secret из .env

**Запусти и проверь результат!** 🚀
