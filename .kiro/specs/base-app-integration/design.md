# Base App Integration - Design

## Architecture Overview

Интеграция Memory Match BASE с Base App через:
1. **Farcaster Account Association** - связь с Farcaster аккаунтом
2. **Webhook Endpoint** - получение событий от Base App
3. **Base App Detection** - определение окружения и оптимизация
4. **Farcaster Frames** - интеграция с Farcaster (опционально)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Base App                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Memory Match BASE Mini App              │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │   React     │  │  OnchainKit  │  │   Wagmi    │ │   │
│  │  │     App     │  │   (1.1.2)    │  │  (2.13.6)  │ │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘ │   │
│  │         │                 │                 │        │   │
│  │         └─────────────────┴─────────────────┘        │   │
│  │                          │                           │   │
│  │                  ┌───────▼────────┐                  │   │
│  │                  │  Base Account  │                  │   │
│  │                  │   (Passkey)    │                  │   │
│  │                  └───────┬────────┘                  │   │
│  │                          │                           │   │
│  └──────────────────────────┼───────────────────────────┘   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Base Mainnet     │
                    │                    │
                    │  Smart Contract    │
                    │  0x93aC1C7...      │
                    │                    │
                    │  Coinbase          │
                    │  Paymaster         │
                    └────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Farcaster Integration                     │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Account         │         │    Webhook       │         │
│  │  Association     │◄────────┤    Endpoint      │         │
│  │                  │         │  /api/webhook    │         │
│  │  FID + Signature │         │                  │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           Farcaster Frames (Optional)        │          │
│  │                                               │          │
│  │  Frame Image + Meta Tags + Action Handlers   │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Farcaster Account Association

#### Configuration Flow
```typescript
// minikit.config.ts
export const minikitConfig = {
  accountAssociation: {
    header: {
      fid: parseInt(import.meta.env.VITE_FARCASTER_FID || '0'),
      type: 'custody' as const,
      key: import.meta.env.VITE_FARCASTER_CUSTODY_ADDRESS || '',
    },
    payload: {
      domain: new URL(ROOT_URL).hostname,
      timestamp: ACCOUNT_ASSOCIATION_TIMESTAMP || Date.now(),
    },
    signature: import.meta.env.VITE_ACCOUNT_ASSOCIATION_SIGNATURE || '',
  },
  // ... miniapp config
};
```

#### Signature Generation Process
```
1. User runs: npm run generate-account-association
2. Script prompts for FID
3. Script prompts for custody private key
4. Script creates message:
   {
     header: { fid, type: 'custody', key: publicKey },
     payload: { domain, timestamp }
   }
5. Script signs message with private key
6. Script outputs signature and timestamp
7. User adds to .env:
   VITE_FARCASTER_FID=...
   VITE_FARCASTER_CUSTODY_ADDRESS=...
   VITE_ACCOUNT_ASSOCIATION_SIGNATURE=...
   VITE_ACCOUNT_ASSOCIATION_TIMESTAMP=...
```

#### Security Considerations
- Private key никогда не сохраняется
- Signature генерируется один раз
- Environment variables не коммитятся
- Signature верифицируется Farcaster

### 2. Webhook Implementation

#### Endpoint Design
```typescript
// api/webhook.ts
import crypto from 'crypto';

interface WebhookEvent {
  event: 'miniapp.install' | 'miniapp.uninstall' | 'miniapp.open' | 'frame.button';
  data: {
    fid: number;
    timestamp: number;
    [key: string]: any;
  };
}

export async function POST(request: Request) {
  // 1. Extract signature from header
  const signature = request.headers.get('X-Farcaster-Signature');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  // 2. Get request body
  const body = await request.text();
  
  // 3. Verify signature
  const isValid = verifySignature(body, signature);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 4. Parse event
  const event: WebhookEvent = JSON.parse(body);

  // 5. Handle event
  await handleEvent(event);

  // 6. Return success
  return new Response('OK', { status: 200 });
}

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function handleEvent(event: WebhookEvent) {
  switch (event.event) {
    case 'miniapp.install':
      console.log(`User ${event.data.fid} installed the app`);
      // Track installation
      break;
    
    case 'miniapp.uninstall':
      console.log(`User ${event.data.fid} uninstalled the app`);
      // Track churn
      break;
    
    case 'miniapp.open':
      console.log(`User ${event.data.fid} opened the app`);
      // Track engagement
      break;
    
    case 'frame.button':
      console.log(`User ${event.data.fid} clicked Frame button`);
      // Handle Frame action
      break;
  }
}
```

#### Webhook Security
```typescript
// Security measures:
1. HMAC-SHA256 signature verification
2. Timing-safe comparison
3. HTTPS only in production
4. Secret stored in environment variables
5. Request body validation
6. Rate limiting (optional)
7. IP whitelist (optional)
```

#### Local Testing with ngrok
```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start local server
npm run dev

# 3. Start ngrok tunnel
ngrok http 3000

# 4. Update webhook URL in minikit.config.ts
webhookUrl: 'https://abc123.ngrok.io/api/webhook'

# 5. Test with curl
curl -X POST https://abc123.ngrok.io/api/webhook \
  -H "X-Farcaster-Signature: <signature>" \
  -H "Content-Type: application/json" \
  -d '{"event":"miniapp.open","data":{"fid":12345,"timestamp":1234567890}}'
```

### 3. Base App Detection

#### Utility Implementation
```typescript
// src/utils/baseApp.ts

/**
 * Detects if app is running inside Base App
 */
export function isBaseApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || '';
  if (userAgent.includes('BaseApp')) return true;
  
  // Check for Base App specific properties
  if ('baseApp' in window) return true;
  if ('farcaster' in window) return true;
  
  return false;
}

/**
 * Gets Base App context information
 */
export function getBaseAppContext() {
  if (!isBaseApp()) return null;
  
  return {
    isBaseApp: true,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    // Add more context as needed
  };
}

/**
 * Applies Base App specific optimizations
 */
export function optimizeForBaseApp() {
  if (!isBaseApp()) return;
  
  // Add class to body
  document.body.classList.add('base-app');
  
  // Disable pull-to-refresh
  document.body.style.overscrollBehavior = 'none';
  
  // Optimize touch
  document.body.style.webkitTapHighlightColor = 'transparent';
  document.body.style.webkitTouchCallout = 'none';
  
  // Prevent text selection during gameplay
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
}

/**
 * Initialize Base App optimizations
 */
export function initBaseApp() {
  if (isBaseApp()) {
    optimizeForBaseApp();
    console.log('Base App detected and optimized');
  }
}
```

#### Usage in App
```typescript
// src/main.tsx
import { initBaseApp } from './utils/baseApp';

// Initialize Base App optimizations
initBaseApp();

// ... rest of app initialization
```

#### Conditional Rendering
```typescript
// src/components/Header.tsx
import { isBaseApp } from '../utils/baseApp';

export function Header() {
  const inBaseApp = isBaseApp();
  
  return (
    <header>
      {/* Show different UI based on environment */}
      {!inBaseApp && <WalletButton />}
      {inBaseApp && <BaseAppHeader />}
    </header>
  );
}
```

### 4. Mobile Optimizations

#### CSS for Base App
```css
/* src/index.css */

/* Base App specific styles */
.base-app {
  /* Disable tap highlight */
  -webkit-tap-highlight-color: transparent;
  
  /* Disable touch callout */
  -webkit-touch-callout: none;
  
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  
  /* Prevent overscroll */
  overscroll-behavior: none;
  -webkit-overscroll-behavior: none;
  
  /* Smooth scrolling */
  -webkit-overflow-scrolling: touch;
}

/* Optimize animations for mobile */
.base-app .card {
  /* Use GPU acceleration */
  transform: translateZ(0);
  will-change: transform;
  
  /* Optimize transitions */
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Ensure touch targets are large enough */
.base-app button,
.base-app .card {
  min-width: 44px;
  min-height: 44px;
}

/* Optimize for small screens */
@media (max-width: 375px) {
  .base-app .game-board {
    padding: 8px;
  }
  
  .base-app .card {
    margin: 4px;
  }
}
```

#### Performance Optimizations
```typescript
// Lazy load images
const cardImages = import.meta.glob('/public/assets/projects/*.svg', {
  eager: false,
});

// Preload critical assets
function preloadCriticalAssets() {
  const critical = [
    '/assets/projects/base.svg',
    '/assets/projects/coinbase.svg',
    // ... other frequently used images
  ];
  
  critical.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Optimize animations
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
```

### 5. Farcaster Frames (Optional)

#### Frame Meta Tags
```html
<!-- index.html -->
<head>
  <!-- Farcaster Frame metadata -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="https://memory-match-base.app/frame-image.png" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="View Stats" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="https://memory-match-base.app/api/frame/stats" />
  <meta property="fc:frame:button:2" content="Play Game" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="https://memory-match-base.app" />
</head>
```

#### Frame Image Generation
```typescript
// api/frame/image.ts
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  
  // Get user stats from blockchain
  const stats = await getUserStats(fid);
  
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0052FF',
          color: 'white',
          fontFamily: 'Inter',
        }}
      >
        <h1 style={{ fontSize: '72px', margin: 0 }}>
          Memory Match BASE
        </h1>
        <p style={{ fontSize: '36px', margin: '20px 0' }}>
          Level {stats.currentLevel} • {stats.totalStars} ⭐
        </p>
        <p style={{ fontSize: '24px', opacity: 0.8 }}>
          {stats.completedLevels}/100 levels completed
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

#### Frame Action Handler
```typescript
// api/frame/stats.ts
export async function POST(request: Request) {
  const body = await request.json();
  const { untrustedData } = body;
  const fid = untrustedData.fid;
  
  // Get user stats
  const stats = await getUserStats(fid);
  
  // Generate Frame response
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://memory-match-base.app/api/frame/image?fid=${fid}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Refresh" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:2" content="Play Now" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="https://memory-match-base.app" />
      </head>
      <body>
        <h1>Memory Match BASE Stats</h1>
        <p>Level: ${stats.currentLevel}</p>
        <p>Stars: ${stats.totalStars}</p>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

## Data Flow

### Account Association Flow
```
1. Developer runs generate-account-association script
2. Script prompts for FID and private key
3. Script generates signature
4. Developer adds signature to .env
5. App reads signature from environment
6. minikit.config.ts exports configuration
7. Base App verifies signature on submission
```

### Webhook Event Flow
```
1. User installs/opens/uninstalls Mini App in Base App
2. Base App sends POST request to webhook URL
3. Webhook receives request with X-Farcaster-Signature header
4. Webhook verifies HMAC-SHA256 signature
5. If valid, webhook parses event data
6. Webhook calls appropriate event handler
7. Handler logs event and updates metrics
8. Webhook returns 200 OK
```

### Base App Detection Flow
```
1. App loads in browser or Base App
2. isBaseApp() checks user agent and window properties
3. If Base App detected:
   - Add .base-app class to body
   - Apply mobile optimizations
   - Adjust UI components
4. If browser:
   - Show standard UI
   - No special optimizations
```

### Frame Interaction Flow
```
1. User shares app link in Farcaster
2. Farcaster renders Frame with image and buttons
3. User clicks "View Stats" button
4. Farcaster sends POST to /api/frame/stats
5. Handler gets user FID from request
6. Handler fetches stats from blockchain
7. Handler generates new Frame with stats
8. Farcaster displays updated Frame
```

## Error Handling

### Webhook Errors
```typescript
// Handle signature verification failure
if (!isValid) {
  console.error('Invalid webhook signature');
  return new Response('Invalid signature', { status: 401 });
}

// Handle parsing errors
try {
  const event = JSON.parse(body);
} catch (error) {
  console.error('Failed to parse webhook body:', error);
  return new Response('Invalid JSON', { status: 400 });
}

// Handle event processing errors
try {
  await handleEvent(event);
} catch (error) {
  console.error('Failed to handle event:', error);
  return new Response('Internal error', { status: 500 });
}
```

### Base App Detection Errors
```typescript
// Graceful fallback if detection fails
try {
  const inBaseApp = isBaseApp();
  if (inBaseApp) {
    optimizeForBaseApp();
  }
} catch (error) {
  console.error('Base App detection failed:', error);
  // Continue with standard UI
}
```

### Frame Errors
```typescript
// Handle missing FID
if (!fid) {
  return new Response('Missing FID', { status: 400 });
}

// Handle blockchain errors
try {
  const stats = await getUserStats(fid);
} catch (error) {
  console.error('Failed to get user stats:', error);
  // Return default Frame
  return generateDefaultFrame();
}
```

## Testing Strategy

### Unit Tests
```typescript
// Test Base App detection
describe('isBaseApp', () => {
  it('returns true when BaseApp in user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 BaseApp/1.0',
      configurable: true,
    });
    expect(isBaseApp()).toBe(true);
  });
  
  it('returns false in normal browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/120.0',
      configurable: true,
    });
    expect(isBaseApp()).toBe(false);
  });
});

// Test signature verification
describe('verifySignature', () => {
  it('returns true for valid signature', () => {
    const body = '{"event":"miniapp.open"}';
    const secret = 'test-secret';
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    expect(verifySignature(body, signature, secret)).toBe(true);
  });
  
  it('returns false for invalid signature', () => {
    const body = '{"event":"miniapp.open"}';
    const signature = 'invalid';
    const secret = 'test-secret';
    
    expect(verifySignature(body, signature, secret)).toBe(false);
  });
});
```

### Integration Tests
```typescript
// Test webhook endpoint
describe('POST /api/webhook', () => {
  it('accepts valid webhook event', async () => {
    const event = { event: 'miniapp.open', data: { fid: 12345 } };
    const body = JSON.stringify(event);
    const signature = generateSignature(body);
    
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'X-Farcaster-Signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    });
    
    expect(response.status).toBe(200);
  });
  
  it('rejects invalid signature', async () => {
    const event = { event: 'miniapp.open', data: { fid: 12345 } };
    const body = JSON.stringify(event);
    
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'X-Farcaster-Signature': 'invalid',
        'Content-Type': 'application/json',
      },
      body,
    });
    
    expect(response.status).toBe(401);
  });
});
```

### Manual Testing
```bash
# Test account association
1. Run: npm run generate-account-association
2. Add variables to .env
3. Run: npm run dev
4. Check console for errors
5. Verify minikit.config.ts reads variables

# Test webhook locally
1. Run: npm run dev
2. Run: ngrok http 3000
3. Update webhook URL
4. Send test event with curl
5. Check server logs
6. Verify event is processed

# Test in Base App
1. Deploy to production
2. Install Base App on mobile
3. Install Mini App
4. Test all features
5. Check for errors
6. Verify UI looks correct
```

## Deployment

### Environment Variables
```bash
# Production .env
VITE_FARCASTER_FID=12345
VITE_FARCASTER_CUSTODY_ADDRESS=0x...
VITE_ACCOUNT_ASSOCIATION_SIGNATURE=0x...
VITE_ACCOUNT_ASSOCIATION_TIMESTAMP=1234567890
WEBHOOK_SECRET=your_webhook_secret_here
VITE_APP_URL=https://memory-match-base.app
VITE_ONCHAINKIT_API_KEY=...
VITE_WALLETCONNECT_PROJECT_ID=...
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_FARCASTER_FID
vercel env add VITE_FARCASTER_CUSTODY_ADDRESS
vercel env add VITE_ACCOUNT_ASSOCIATION_SIGNATURE
vercel env add VITE_ACCOUNT_ASSOCIATION_TIMESTAMP
vercel env add WEBHOOK_SECRET
```

### Netlify Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_FARCASTER_FID 12345
netlify env:set VITE_FARCASTER_CUSTODY_ADDRESS 0x...
netlify env:set VITE_ACCOUNT_ASSOCIATION_SIGNATURE 0x...
netlify env:set VITE_ACCOUNT_ASSOCIATION_TIMESTAMP 1234567890
netlify env:set WEBHOOK_SECRET your_secret
```

## Security Considerations

### Private Keys
- Никогда не коммитить в git
- Использовать только для генерации signature
- Удалить после использования
- Хранить в безопасном месте

### Webhook Secret
- Генерировать криптографически стойкий
- Хранить в environment variables
- Не логировать
- Ротировать периодически

### Signature Verification
- Всегда использовать timing-safe comparison
- Проверять перед обработкой события
- Логировать неудачные попытки
- Рассмотреть rate limiting

### HTTPS
- Обязательно для production webhook
- Использовать для всех API endpoints
- Проверять сертификаты

## Performance Considerations

### Bundle Size
- Code splitting для routes
- Lazy loading для компонентов
- Tree shaking для неиспользуемого кода
- Минификация в production

### Loading Speed
- Preload критичных assets
- Lazy load изображений
- Optimize images (SVG)
- Use CDN для static assets

### Runtime Performance
- Мемоизация компонентов
- Виртуализация длинных списков
- Debounce/throttle событий
- Optimize re-renders

### Mobile Performance
- GPU acceleration для анимаций
- Reduce motion для accessibility
- Optimize touch events
- Minimize reflows/repaints

## Monitoring & Analytics

### Webhook Events
```typescript
// Track webhook events
function trackWebhookEvent(event: WebhookEvent) {
  console.log(`[Webhook] ${event.event}`, {
    fid: event.data.fid,
    timestamp: event.data.timestamp,
  });
  
  // Send to analytics
  analytics.track(event.event, {
    fid: event.data.fid,
    timestamp: event.data.timestamp,
  });
}
```

### Base App Usage
```typescript
// Track Base App usage
if (isBaseApp()) {
  analytics.track('base_app_detected', {
    viewport: getBaseAppContext()?.viewport,
    userAgent: navigator.userAgent,
  });
}
```

### Error Tracking
```typescript
// Track errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Send to error tracking service
  errorTracking.captureException(event.error, {
    context: {
      isBaseApp: isBaseApp(),
      url: window.location.href,
    },
  });
});
```

## Next Steps

1. Прочитать tasks.md для списка задач
2. Начать с Phase 1: Farcaster Account Association
3. Выполнить все задачи последовательно
4. Тестировать после каждой фазы
5. Задокументировать изменения
6. Подготовить submission в Base App
