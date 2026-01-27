# Base App Integration - Requirements

## Overview

Интеграция Memory Match BASE в экосистему Base App как Mini App для распространения через официальный каталог приложений Base.

## Цель

Сделать Memory Match BASE полноценным Mini App для Base App с:
1. Farcaster account association (обязательно)
2. Webhook для событий Mini App (обязательно)
3. Оптимизацией для мобильных устройств
4. Поддержкой Farcaster Frames (опционально)
5. Готовностью к публикации в Base App

## Текущий статус

### ✅ Уже реализовано
- Игра полностью работает (100 уровней)
- OnchainKit 1.1.2 интегрирован
- Smart Wallet с Passkey
- Coinbase Paymaster (gasless транзакции)
- Смарт-контракт развернут на Base Mainnet
- 502/502 тестов проходят
- Responsive дизайн
- Accessibility (WCAG 2.1 AA)

### 🎯 Требуется реализовать
- Farcaster account association
- Webhook endpoint для событий
- Base App detection
- Мобильные оптимизации
- Farcaster Frames (опционально)

## User Stories

### US-1: Farcaster Account Association
**Как** владелец Mini App  
**Я хочу** связать приложение с моим Farcaster аккаунтом  
**Чтобы** пользователи могли верифицировать владельца и приложение было доступно в Base App

**Acceptance Criteria:**
- [ ] FID (Farcaster ID) получен из Warpcast
- [ ] Custody address определен
- [ ] Signature сгенерирован с помощью скрипта
- [ ] Environment variables настроены
- [ ] `minikit.config.ts` корректно читает переменные
- [ ] Конфигурация проверена локально
- [ ] Конфигурация работает в production

**Technical Details:**
- Использовать существующий `scripts/generate-account-association.ts`
- Команда: `npm run generate-account-association`
- Переменные окружения:
  - `VITE_FARCASTER_FID`
  - `VITE_FARCASTER_CUSTODY_ADDRESS`
  - `VITE_ACCOUNT_ASSOCIATION_SIGNATURE`
  - `VITE_ACCOUNT_ASSOCIATION_TIMESTAMP`

### US-2: Webhook Implementation
**Как** разработчик Mini App  
**Я хочу** получать события от Base App  
**Чтобы** отслеживать установки, открытия и взаимодействия пользователей

**Acceptance Criteria:**
- [ ] Webhook secret сгенерирован
- [ ] Endpoint `/api/webhook` создан
- [ ] HMAC-SHA256 signature verification реализована
- [ ] Event handlers для `miniapp.install`, `miniapp.uninstall`, `miniapp.open` работают
- [ ] Webhook протестирован локально с ngrok
- [ ] Webhook развернут в production
- [ ] События логируются корректно

**Technical Details:**
- Endpoint: `POST /api/webhook`
- Header: `X-Farcaster-Signature`
- Events: `miniapp.install`, `miniapp.uninstall`, `miniapp.open`, `frame.button`
- Signature verification: HMAC-SHA256 с timing-safe comparison

### US-3: Base App Detection
**Как** пользователь  
**Я хочу** чтобы приложение оптимально работало в Base App  
**Чтобы** получить лучший опыт использования

**Acceptance Criteria:**
- [ ] Функция `isBaseApp()` определяет Base App environment
- [ ] Функция `getBaseAppContext()` возвращает контекст
- [ ] CSS класс `.base-app` добавляется к body
- [ ] Мобильные оптимизации применяются автоматически
- [ ] UI адаптируется под Base App

**Technical Details:**
- Проверка user agent на 'BaseApp'
- Проверка `window.baseApp` property
- Проверка `window.farcaster` property
- Conditional rendering компонентов

### US-4: Mobile Optimizations
**Как** мобильный пользователь  
**Я хочу** чтобы игра быстро загружалась и плавно работала  
**Чтобы** комфортно играть на телефоне

**Acceptance Criteria:**
- [ ] Touch targets минимум 44x44px (уже есть)
- [ ] Tap highlight отключен для Base App
- [ ] Touch callout отключен
- [ ] User select оптимизирован
- [ ] Overscroll behavior настроен
- [ ] Анимации оптимизированы для mobile
- [ ] Viewport 375x667px протестирован

**Technical Details:**
- CSS оптимизации для `.base-app`
- `-webkit-tap-highlight-color: transparent`
- `-webkit-touch-callout: none`
- `overscroll-behavior: none`
- `will-change` для анимаций

### US-5: Farcaster Frames (Optional)
**Как** пользователь Farcaster  
**Я хочу** видеть превью игры и статистику во Frames  
**Чтобы** быстро оценить прогресс и поделиться с друзьями

**Acceptance Criteria:**
- [ ] Frame meta tags добавлены в `index.html`
- [ ] Frame image создан (1200x630px, 1.91:1)
- [ ] Frame action handlers реализованы
- [ ] Endpoint `/api/frame/stats` работает
- [ ] Frames протестированы в Warpcast
- [ ] Кнопки Frame работают корректно

**Technical Details:**
- Meta tags: `fc:frame`, `fc:frame:image`, `fc:frame:button:*`
- Image: max 256KB, 1200x630px
- Endpoint: `POST /api/frame/stats`
- Response: HTML с Frame metadata

### US-6: Testing & Documentation
**Как** разработчик  
**Я хочу** убедиться что все работает корректно  
**Чтобы** успешно пройти review в Base App

**Acceptance Criteria:**
- [ ] Все функции протестированы локально
- [ ] Production deployment протестирован
- [ ] Документация обновлена
- [ ] Troubleshooting guide создан
- [ ] Screenshots подготовлены
- [ ] Privacy policy и Terms of Service готовы

**Technical Details:**
- Тестирование в viewport 375x667px
- Проверка всех 100 уровней
- Проверка wallet connection
- Проверка gasless транзакций
- Проверка webhook events

### US-7: Base App Submission
**Как** владелец приложения  
**Я хочу** опубликовать игру в Base App  
**Чтобы** пользователи могли найти и установить её

**Acceptance Criteria:**
- [ ] Все материалы подготовлены (иконки, screenshots, описание)
- [ ] Account association верифицирована
- [ ] Webhook работает
- [ ] Приложение протестировано
- [ ] Форма submission заполнена
- [ ] Приложение отправлено на review
- [ ] Review пройден успешно

**Technical Details:**
- Name: "Memory Match BASE"
- Category: "Games"
- Tags: memory, game, base, crypto, puzzle, blockchain, web3
- Icons: 512x512px (уже есть)
- Screenshots: multiple sizes (уже есть)

## Technical Requirements

### Environment Variables
```env
# Farcaster Account Association
VITE_FARCASTER_FID=your_fid
VITE_FARCASTER_CUSTODY_ADDRESS=0x...
VITE_ACCOUNT_ASSOCIATION_SIGNATURE=0x...
VITE_ACCOUNT_ASSOCIATION_TIMESTAMP=1234567890

# Webhook
WEBHOOK_SECRET=your_webhook_secret

# Existing (already configured)
VITE_ONCHAINKIT_API_KEY=...
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_APP_URL=https://memory-match-base.app
```

### API Endpoints

#### POST /api/webhook
Receives events from Base App.

**Headers:**
- `X-Farcaster-Signature`: HMAC-SHA256 signature

**Body:**
```json
{
  "event": "miniapp.install" | "miniapp.uninstall" | "miniapp.open" | "frame.button",
  "data": {
    "fid": 12345,
    "timestamp": 1234567890,
    ...
  }
}
```

**Response:**
- 200: Event processed
- 401: Invalid signature
- 500: Server error

#### POST /api/frame/stats (Optional)
Returns Frame with user stats.

**Body:**
```json
{
  "untrustedData": {
    "fid": 12345,
    "buttonIndex": 1
  }
}
```

**Response:**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="..." />
    ...
  </head>
</html>
```

### File Structure
```
.kiro/specs/base-app-integration/
├── requirements.md          # This file
├── design.md               # Implementation design
└── tasks.md                # Actionable tasks

scripts/
└── generate-account-association.ts  # Already exists

src/utils/
└── baseApp.ts              # To be created

api/
├── webhook.ts              # To be created
└── frame/
    └── stats.ts            # To be created (optional)
```

## Dependencies

### Already Installed
- `@coinbase/onchainkit`: ^1.1.2
- `viem`: ^2.21.54
- `wagmi`: ^2.13.6
- `ethers`: ^6.13.4

### To Install
- `ngrok`: For local webhook testing (dev dependency)

## Success Criteria

Integration считается успешной когда:

1. ✅ Account association настроена и верифицирована
2. ✅ Webhook получает и обрабатывает события
3. ✅ Приложение корректно работает в Base App
4. ✅ Все тесты проходят
5. ✅ Документация полная
6. ✅ Submission в Base App одобрен
7. ✅ Приложение опубликовано

## Constraints

### Security
- Никогда не коммитить private keys
- Использовать environment variables для secrets
- Webhook signature verification обязательна
- HTTPS для production webhook

### Performance
- Загрузка < 3 секунд на 3G
- Smooth animations (60 FPS)
- Минимальный bundle size
- Lazy loading для assets

### Compatibility
- iOS Safari 14+
- Android Chrome 90+
- Base App latest version
- Responsive: 320px - 1920px

### Accessibility
- WCAG 2.1 AA (уже реализовано)
- Touch targets 44x44px (уже реализовано)
- Keyboard navigation (уже реализовано)
- Screen reader support (уже реализовано)

## Timeline

**Total Estimated Time:** 1-2 weeks

- **Phase 1:** Farcaster Account Association (1-2 hours)
- **Phase 2:** Webhook Implementation (2-4 hours)
- **Phase 3:** Base App Optimizations (2-3 hours)
- **Phase 4:** Farcaster Frames (2-3 hours, optional)
- **Phase 5:** Testing & Documentation (2-3 hours)
- **Phase 6:** Submission & Review (1-2 days)

## Resources

### Documentation
- Base Mini Apps: https://docs.base.org/mini-apps/
- Farcaster Docs: https://docs.farcaster.xyz/
- OnchainKit: https://onchainkit.xyz/
- Warpcast: https://warpcast.com/

### Tools
- Coinbase Developer Platform: https://portal.cdp.coinbase.com/
- Farcaster Hub: https://hub.farcaster.xyz/
- ngrok: https://ngrok.com/
- Basescan: https://basescan.org/

### Community
- Base Discord: https://discord.gg/buildonbase
- Farcaster Discord: https://discord.gg/farcaster

## Notes

- Скрипт `generate-account-association.ts` уже создан и готов к использованию
- `minikit.config.ts` уже настроен, нужно только добавить environment variables
- Все иконки и screenshots уже подготовлены
- Смарт-контракт уже развернут на Base Mainnet
- Приложение production-ready, нужна только интеграция с Base App

## Next Steps

1. Прочитать design.md для деталей реализации
2. Выполнить tasks из tasks.md
3. Начать с Phase 1: Farcaster Account Association
