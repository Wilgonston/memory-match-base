# Design Document: Memory Match BASE

## Overview

Memory Match BASE - это React-приложение, реализующее классическую игру на память с тематикой BASE blockchain экосистемы. Приложение разработано как Mini App для BASE App платформы, что обеспечивает мгновенный запуск без установки и социальную интеграцию.

Архитектура построена на функциональных компонентах React с использованием хуков для управления состоянием, TypeScript для типобезопасности, и CSS/Tailwind для стилизации. Приложение включает полную интеграцию с Base blockchain для аутентификации, хранения прогресса on-chain и социальных функций, с graceful fallback на LocalStorage при недоступности блокчейна.

Приложение использует компонентный подход с четким разделением ответственности:
- **Presentation Layer**: React компоненты для UI
- **State Management**: React hooks (useState, useEffect, useReducer) для управления состоянием игры
- **Business Logic**: Утилитарные функции для игровой логики
- **Persistence Layer**: LocalStorage API для сохранения прогресса (с синхронизацией blockchain)
- **Blockchain Layer**: OnchainKit, wagmi, viem для интеграции с Base blockchain
- **Mini App Integration**: MiniKit SDK для интеграции с BASE App и Farcaster

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     App Component                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Game State Management (useReducer)      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  LevelSelect   │ │  GameBoard  │ │  ResultScreen  │
│   Component    │ │  Component  │ │   Component    │
└────────────────┘ └──────┬──────┘ └────────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
         ┌──────▼───┐ ┌───▼────┐ ┌─▼──────┐
         │  Header  │ │  Grid  │ │ Footer │
         └──────────┘ └───┬────┘ └────────┘
                          │
                     ┌────▼────┐
                     │  Card   │
                     └─────────┘
```

### Component Hierarchy

1. **App**: Корневой компонент, управляет глобальным состоянием
2. **LevelSelect**: Экран выбора уровня
3. **GameBoard**: Основной игровой экран
   - **Header**: Отображает уровень, таймер, счетчик ходов
   - **Grid**: Сетка карт
     - **Card**: Отдельная игровая карта
   - **Footer**: Кнопки управления (пауза, рестарт)
4. **ResultScreen**: Экран результатов после завершения уровня
5. **PauseOverlay**: Оверлей паузы

## Components and Interfaces

### Core Types

```typescript
// Card type representing a single game card
interface Card {
  id: string;              // Unique identifier
  imageId: string;         // ID of the BASE project image
  isFlipped: boolean;      // Whether card is face-up
  isMatched: boolean;      // Whether card has been matched
}

// Game state representing current game session
interface GameState {
  level: number;           // Current level (1-100)
  cards: Card[];           // Array of cards on the board
  flippedCards: string[];  // IDs of currently flipped cards
  matchedPairs: number;    // Number of matched pairs
  moves: number;           // Number of moves made
  timeRemaining: number;   // Seconds remaining
  isPlaying: boolean;      // Whether game is active
  isPaused: boolean;       // Whether game is paused
  gameStatus: 'playing' | 'won' | 'lost';
}

// Level configuration
interface LevelConfig {
  level: number;
  gridSize: 4 | 6 | 8;     // Grid dimensions (4x4, 6x6, 8x8)
  timeLimit: number;       // Time limit in seconds
  optimalMoves: number;    // Moves for 3 stars
  acceptableMoves: number; // Moves for 2 stars
}

// Progress data stored in LocalStorage
interface ProgressData {
  completedLevels: Set<number>;
  levelStars: Map<number, number>;  // level -> stars (1-3)
  highestUnlockedLevel: number;
  soundEnabled: boolean;
}

// BASE project image
interface ProjectImage {
  id: string;
  name: string;
  imagePath: string;
}
```

### Game State Management

```typescript
// Game actions for reducer
type GameAction =
  | { type: 'START_LEVEL'; level: number }
  | { type: 'FLIP_CARD'; cardId: string }
  | { type: 'MATCH_FOUND'; cardIds: [string, string] }
  | { type: 'NO_MATCH'; cardIds: [string, string] }
  | { type: 'TICK_TIMER' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESTART_LEVEL' }
  | { type: 'COMPLETE_LEVEL' }
  | { type: 'FAIL_LEVEL' };

// Game reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  // Implementation handles all game state transitions
}
```

### Component Interfaces

```typescript
// App Component
interface AppProps {}

// LevelSelect Component
interface LevelSelectProps {
  progressData: ProgressData;
  onLevelSelect: (level: number) => void;
}

// GameBoard Component
interface GameBoardProps {
  gameState: GameState;
  onCardClick: (cardId: string) => void;
  onPause: () => void;
  onRestart: () => void;
}

// Card Component
interface CardProps {
  card: Card;
  onClick: (cardId: string) => void;
  disabled: boolean;
}

// Header Component
interface HeaderProps {
  level: number;
  moves: number;
  timeRemaining: number;
}

// ResultScreen Component
interface ResultScreenProps {
  level: number;
  moves: number;
  timeElapsed: number;
  stars: number;
  onNextLevel: () => void;
  onRetry: () => void;
  onLevelSelect: () => void;
}
```

## Data Models

### Level Configuration Data

```typescript
// Generate level configuration based on level number
function getLevelConfig(level: number): LevelConfig {
  let gridSize: 4 | 6 | 8;
  let timeLimit: number;
  let optimalMoves: number;
  let acceptableMoves: number;

  if (level <= 25) {
    gridSize = 4;
    timeLimit = 60;
    optimalMoves = 12;
    acceptableMoves = 16;
  } else if (level <= 60) {
    gridSize = 6;
    timeLimit = 90;
    optimalMoves = 24;
    acceptableMoves = 32;
  } else {
    gridSize = 8;
    timeLimit = 120;
    optimalMoves = 40;
    acceptableMoves = 52;
  }

  return { level, gridSize, timeLimit, optimalMoves, acceptableMoves };
}
```

### Card Generation

```typescript
// Generate shuffled cards for a level
function generateCards(gridSize: number, availableImages: ProjectImage[]): Card[] {
  const totalCards = gridSize * gridSize;
  const pairsNeeded = totalCards / 2;
  
  // Select random images
  const selectedImages = selectRandomImages(availableImages, pairsNeeded);
  
  // Create pairs
  const cards: Card[] = [];
  selectedImages.forEach((image, index) => {
    cards.push({
      id: `${image.id}-1`,
      imageId: image.id,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: `${image.id}-2`,
      imageId: image.id,
      isFlipped: false,
      isMatched: false,
    });
  });
  
  // Shuffle cards
  return shuffleArray(cards);
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Progress Persistence

```typescript
// Storage manager for LocalStorage operations
class StorageManager {
  private static STORAGE_KEY = 'memory-match-base-progress';

  // Save progress to LocalStorage
  static saveProgress(progress: ProgressData): void {
    try {
      const serialized = {
        completedLevels: Array.from(progress.completedLevels),
        levelStars: Array.from(progress.levelStars.entries()),
        highestUnlockedLevel: progress.highestUnlockedLevel,
        soundEnabled: progress.soundEnabled,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // Load progress from LocalStorage
  static loadProgress(): ProgressData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultProgress();
      }
      
      const parsed = JSON.parse(stored);
      return {
        completedLevels: new Set(parsed.completedLevels),
        levelStars: new Map(parsed.levelStars),
        highestUnlockedLevel: parsed.highestUnlockedLevel,
        soundEnabled: parsed.soundEnabled ?? true,
      };
    } catch (error) {
      console.error('Failed to load progress:', error);
      return this.getDefaultProgress();
    }
  }

  private static getDefaultProgress(): ProgressData {
    return {
      completedLevels: new Set(),
      levelStars: new Map(),
      highestUnlockedLevel: 1,
      soundEnabled: true,
    };
  }
}
```

### Star Rating Calculation

```typescript
// Calculate star rating based on moves
function calculateStars(moves: number, config: LevelConfig): number {
  if (moves <= config.optimalMoves) {
    return 3;
  } else if (moves <= config.acceptableMoves) {
    return 2;
  } else {
    return 1;
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Card Pair Invariant

*For any* generated card array, the number of cards with each unique imageId should always be exactly 2.

**Validates: Requirements 1.1, 8.3**

### Property 2: Grid Size Consistency

*For any* level configuration, the total number of cards should equal gridSize × gridSize, and this number should always be even.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Shuffle Preserves Content

*For any* array of cards, shuffling should preserve all cards (same imageIds and same count) while changing their order.

**Validates: Requirements 1.5**

### Property 4: Match Detection Correctness

*For any* two flipped cards, they should be marked as matched if and only if their imageId values are identical.

**Validates: Requirements 3.1, 3.2**

### Property 5: Timer Countdown Monotonicity

*For any* game session, the timeRemaining value should decrease monotonically (never increase) until it reaches zero or the game ends.

**Validates: Requirements 4.1, 4.6**

### Property 6: Level Completion Condition

*For any* game state, the level should be marked as complete if and only if the number of matched pairs equals half the total number of cards.

**Validates: Requirements 3.4**

### Property 7: Move Counter Increment

*For any* sequence of card flips, the move counter should increment by exactly 1 after every second card flip.

**Validates: Requirements 3.5**

### Property 8: Progress Persistence Round Trip

*For any* valid ProgressData object, saving to LocalStorage and then loading should produce an equivalent ProgressData object with the same completed levels, stars, and settings.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 9: Star Rating Boundaries

*For any* number of moves and level configuration, the calculated star rating should always be 1, 2, or 3, and should decrease (or stay the same) as moves increase.

**Validates: Requirements 6.3, 6.4, 6.5, 6.6**

### Property 10: Level Unlock Progression

*For any* progress state, if level N is unlocked, then all levels 1 through N-1 should also be unlocked.

**Validates: Requirements 5.2, 5.4**

### Property 11: Card Flip State Consistency

*For any* card, if isMatched is true, then isFlipped should also be true (matched cards remain face-up).

**Validates: Requirements 3.2**

### Property 12: Time Allocation by Level Range

*For any* level number, the time limit should be 60 seconds for levels 1-25, 90 seconds for levels 26-60, and 120 seconds for levels 61-100.

**Validates: Requirements 4.2, 4.3, 4.4**

## Error Handling

### LocalStorage Errors

```typescript
// Graceful degradation when LocalStorage is unavailable
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (error) {
  console.warn('LocalStorage unavailable, using in-memory storage');
  // Fall back to in-memory storage
}
```

**Strategy**: When LocalStorage is unavailable (private browsing, quota exceeded), the application should:
1. Log a warning to console
2. Continue functioning with in-memory state
3. Display a notification to user that progress won't be saved
4. Validate: Requirements 7.6

### Image Loading Errors

```typescript
// Handle missing or failed image loads
<img
  src={imagePath}
  alt={projectName}
  onError={(e) => {
    e.currentTarget.src = '/assets/fallback-logo.png';
  }}
/>
```

**Strategy**: When project images fail to load:
1. Display a fallback placeholder image
2. Log error for debugging
3. Game continues to function normally
4. Validate: Requirements 8.1, 8.4

### Timer Edge Cases

**Strategy**: Handle timer edge cases:
1. When timer reaches exactly 0, trigger level failure immediately
2. When level completes with 0 seconds remaining, count as success
3. Prevent negative time values
4. Validate: Requirements 4.5

### Invalid State Recovery

**Strategy**: If game state becomes invalid (corrupted LocalStorage, etc.):
1. Detect invalid state on load
2. Reset to default state
3. Log error for debugging
4. Notify user that progress was reset
5. Validate: Requirements 7.3

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and error conditions using Vitest:

1. **Card Generation**:
   - Test that 4x4 grid generates exactly 16 cards
   - Test that each image appears exactly twice
   - Test edge case: minimum number of available images

2. **Match Detection**:
   - Test matching cards with same imageId
   - Test non-matching cards with different imageId
   - Test edge case: flipping same card twice

3. **Star Calculation**:
   - Test 3 stars for optimal moves
   - Test 2 stars for acceptable moves
   - Test 1 star for excessive moves
   - Test boundary values

4. **LocalStorage**:
   - Test save and load operations
   - Test handling of corrupted data
   - Test fallback when unavailable

5. **Level Configuration**:
   - Test correct grid size for each level range
   - Test correct time limit for each level range
   - Test boundary levels (25, 26, 60, 61)

### Property-Based Testing

Property tests will verify universal properties across all inputs using fast-check library (minimum 100 iterations per test):

1. **Property 1: Card Pair Invariant**
   - Generate random grid sizes and image sets
   - Verify each imageId appears exactly twice
   - **Feature: memory-match-base, Property 1: Card Pair Invariant**

2. **Property 2: Grid Size Consistency**
   - Generate random level numbers (1-100)
   - Verify total cards = gridSize × gridSize
   - Verify total cards is even
   - **Feature: memory-match-base, Property 2: Grid Size Consistency**

3. **Property 3: Shuffle Preserves Content**
   - Generate random card arrays
   - Shuffle multiple times
   - Verify same imageIds and counts
   - **Feature: memory-match-base, Property 3: Shuffle Preserves Content**

4. **Property 8: Progress Persistence Round Trip**
   - Generate random ProgressData objects
   - Save and load from LocalStorage
   - Verify equivalence
   - **Feature: memory-match-base, Property 8: Progress Persistence Round Trip**

5. **Property 9: Star Rating Boundaries**
   - Generate random move counts and configs
   - Verify stars are always 1, 2, or 3
   - Verify monotonic decrease with more moves
   - **Feature: memory-match-base, Property 9: Star Rating Boundaries**

6. **Property 10: Level Unlock Progression**
   - Generate random progress states
   - Verify all levels below unlocked level are also unlocked
   - **Feature: memory-match-base, Property 10: Level Unlock Progression**

7. **Property 11: Card Flip State Consistency**
   - Generate random game states
   - Verify matched cards are always flipped
   - **Feature: memory-match-base, Property 11: Card Flip State Consistency**

8. **Property 12: Time Allocation by Level Range**
   - Generate random level numbers (1-100)
   - Verify correct time limit for each range
   - **Feature: memory-match-base, Property 12: Time Allocation by Level Range**

### Integration Testing

Integration tests will verify component interactions:

1. **Card Click Flow**: Click card → flip animation → match check → state update
2. **Level Completion Flow**: Match all pairs → calculate stars → save progress → show results
3. **Timer Flow**: Start level → timer counts down → reach zero → level fails
4. **Navigation Flow**: Select level → play game → complete → return to level select

### Testing Configuration

- **Test Framework**: Vitest
- **Property Testing Library**: fast-check
- **React Testing**: @testing-library/react
- **Minimum Iterations**: 100 per property test
- **Coverage Target**: 80%+ for business logic

## Implementation Notes

### Performance Considerations

1. **Memoization**: Use React.memo for Card components to prevent unnecessary re-renders
2. **Lazy Loading**: Lazy load images for better initial load time
3. **Debouncing**: Debounce rapid card clicks to prevent state issues

### Accessibility

1. **Keyboard Navigation**: Support Tab, Enter, Space for card selection
2. **ARIA Labels**: Add appropriate ARIA labels for screen readers
3. **Focus Management**: Maintain focus indicators for keyboard users
4. **Color Contrast**: Ensure sufficient contrast for text and UI elements

### Animation Performance

1. Use CSS transforms (translate, scale) instead of position properties
2. Use `will-change` property for animated elements
3. Limit simultaneous animations to prevent jank
4. Use `requestAnimationFrame` for JavaScript animations

### BASE Project Images

Required images (20 minimum):
1. BASE logo
2. Coinbase logo
3. Aerodrome Finance
4. Uniswap
5. Aave V3
6. Compound V3
7. SushiSwap
8. Synthetix
9. Stargate
10. Balancer V2
11. PancakeSwap
12. Curve DEX
13. OpenSea
14. FrenPet
15. BuilderFi
16. Backed Finance
17. Echelon Prime
18. Degen Chain
19. Cartesi
20. MetaStreet

Images should be:
- Format: PNG or SVG
- Size: 200x200px
- Optimized for web
- Stored in `/public/assets/projects/`

### Mini App Configuration

The app requires proper Mini App configuration:

```typescript
// minikit.config.ts
export const minikitConfig = {
  miniapp: {
    version: "1",
    name: "Memory Match BASE",
    subtitle: "Test your memory with BASE projects",
    description: "Classic memory card game featuring BASE blockchain ecosystem projects. Match pairs, complete 100 levels, and master the BASE ecosystem!",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/gameplay.png`,
      `${ROOT_URL}/screenshots/level-select.png`
    ],
    iconUrl: `${ROOT_URL}/icon-512.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0052FF", // BASE blue
    homeUrl: ROOT_URL,
    primaryCategory: "games",
    tags: ["memory", "game", "base", "crypto", "puzzle", "blockchain"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Master the BASE ecosystem through memory!",
    ogTitle: "Memory Match BASE - Blockchain Memory Game",
    ogDescription: "Test your memory with BASE blockchain projects. 100 levels of crypto fun!",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  },
} as const;
```

Required assets for Mini App:
- `icon-512.png`: App icon (512x512px minimum)
- `splash.png`: Splash screen image
- `hero.png`: Hero image for app listing
- `og-image.png`: Open Graph image for social sharing (1200x630px)
- `screenshots/gameplay.png`: Gameplay screenshot
- `screenshots/level-select.png`: Level selection screenshot


---

## Blockchain Integration Architecture

### Overview

The blockchain integration adds Web3 capabilities while maintaining full backward compatibility with the LocalStorage-based implementation. The architecture follows a layered approach with graceful degradation.

### Blockchain Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    OnchainKitProvider                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              WagmiProvider (wagmi config)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  Wallet        │ │  Identity   │ │  Transaction   │
│  Components    │ │  Components │ │  Components    │
└────────────────┘ └─────────────┘ └────────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Sync Manager    │
                │  (LocalStorage ←→ │
                │   Blockchain)     │
                └─────────┬─────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  LocalStorage  │ │  Progress   │ │  Leaderboard   │
│  Manager       │ │  Contract   │ │  Contract      │
└────────────────┘ └─────────────┘ └────────────────┘
```

### Blockchain Types

```typescript
// Wallet connection state
interface WalletState {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  basename: string | null;
}

// On-chain progress data structure
interface OnChainProgress {
  completedLevels: boolean[];  // Array of 100 booleans
  levelStars: number[];        // Array of 100 numbers (0-3)
  totalStars: number;
  lastUpdated: number;         // Timestamp
}

// Sync status
interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number;
  syncError: string | null;
  mode: 'blockchain' | 'localStorage' | 'hybrid';
}

// Leaderboard entry
interface LeaderboardEntry {
  address: `0x${string}`;
  basename: string | null;
  totalStars: number;
  levelsCompleted: number;
  rank: number;
}
```

### Smart Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MemoryMatchProgress {
    struct PlayerProgress {
        bool[100] completedLevels;
        uint8[100] levelStars;
        uint16 totalStars;
        uint32 lastUpdated;
    }
    
    mapping(address => PlayerProgress) public playerProgress;
    
    event ProgressUpdated(
        address indexed player,
        uint8 level,
        uint8 stars,
        uint16 totalStars
    );
    
    function updateLevel(uint8 level, uint8 stars) external {
        require(level > 0 && level <= 100, "Invalid level");
        require(stars >= 1 && stars <= 3, "Invalid stars");
        
        PlayerProgress storage progress = playerProgress[msg.sender];
        
        if (stars > progress.levelStars[level - 1]) {
            uint16 starDiff = stars - progress.levelStars[level - 1];
            progress.totalStars += starDiff;
            progress.levelStars[level - 1] = stars;
        }
        
        if (!progress.completedLevels[level - 1]) {
            progress.completedLevels[level - 1] = true;
        }
        
        progress.lastUpdated = uint32(block.timestamp);
        
        emit ProgressUpdated(msg.sender, level, stars, progress.totalStars);
    }
    
    function batchUpdateLevels(
        uint8[] calldata levels,
        uint8[] calldata stars
    ) external {
        require(levels.length == stars.length, "Array length mismatch");
        require(levels.length <= 100, "Too many levels");
        
        for (uint i = 0; i < levels.length; i++) {
            _updateLevelInternal(levels[i], stars[i]);
        }
    }
    
    function getPlayerProgress(address player) 
        external 
        view 
        returns (PlayerProgress memory) 
    {
        return playerProgress[player];
    }
}
```

### Blockchain Correctness Properties

#### Property 13: Wallet Connection Persistence
*For any* wallet connection, if the connection is established and the page is reloaded, the wallet should remain connected with the same address and chain ID.
**Validates: Requirements 15.4**

#### Property 14: Wallet Disconnection Cleanup
*For any* connected wallet, when disconnected, all wallet state should be cleared and the app should revert to LocalStorage-only mode.
**Validates: Requirements 15.5**

#### Property 15: Basename Resolution Consistency
*For any* Ethereum address, if a Basename exists, the Identity_Provider should resolve and display it; otherwise, display a truncated address.
**Validates: Requirements 16.1, 16.2**

#### Property 16: Identity Update on Wallet Change
*For any* wallet change, the displayed identity should update to match the new wallet's identity.
**Validates: Requirements 16.6**

#### Property 17: Single Level Update
*For any* valid level number (1-100) and star rating (1-3), the Progress_Contract's updateLevel function should successfully update the player's progress.
**Validates: Requirements 19.4**

#### Property 18: Batch Level Update
*For any* array of valid level numbers and corresponding star ratings, the Progress_Contract's batchUpdateLevels function should successfully update all levels.
**Validates: Requirements 19.5**

#### Property 19: Progress Isolation
*For any* player address, that player should only be able to modify their own progress data.
**Validates: Requirements 19.8**

#### Property 20: Progress Update Event Emission
*For any* successful progress update transaction, the Progress_Contract should emit a ProgressUpdated event with correct data.
**Validates: Requirements 18.5, 19.7**

#### Property 21: Progress Sync on Load
*For any* wallet connection at app load, the Sync_Manager should fetch and merge on-chain progress with LocalStorage progress.
**Validates: Requirements 18.2**

#### Property 22: Progress Merge Maximization
*For any* two progress states (LocalStorage and on-chain), the merged result should contain the maximum stars for each level.
**Validates: Requirements 18.3**

#### Property 23: Wallet Switch Progress Update
*For any* wallet switch, the displayed progress should update to reflect the new wallet's on-chain progress.
**Validates: Requirements 18.4**

#### Property 24: On-Chain Progress Storage
*For any* level completion with a connected wallet, the level number and stars earned should be stored on-chain and retrievable.
**Validates: Requirements 18.1**

#### Property 25: Fallback Mode Resilience
*For any* blockchain error, the app should continue functioning in LocalStorage-only mode without blocking gameplay.
**Validates: Requirements 22.3, 22.6**

#### Property 26: Transaction Backup on Failure
*For any* failed on-chain transaction, the progress data should be saved to LocalStorage as a backup.
**Validates: Requirements 22.3**

### Blockchain Error Handling

**Wallet Connection Errors**: Catch rejections, display user-friendly messages, provide retry, never block app.

**Network Mismatch**: Detect unsupported networks, prompt to switch, handle failures, allow LocalStorage mode.

**Transaction Errors**: Catch all errors, parse for user-friendly display, save to LocalStorage backup, provide retry.

**RPC Errors**: Implement exponential backoff (1s, 2s, 4s, 8s, max 30s), fall back to LocalStorage, retry in background.

**Sync Conflicts**: Always keep best progress (maximum stars per level), batch operations, handle partial failures.

### Performance Optimizations

1. **Caching**: Cache Basename resolutions for 5 minutes
2. **Batching**: Batch multiple progress updates into single transaction
3. **Optimistic UI**: Update UI immediately, sync blockchain in background
4. **Lazy Loading**: Lazy load blockchain components
5. **Connection Pooling**: Pool RPC requests
6. **Prefetching**: Prefetch on-chain data during loading screens

### Security Considerations

1. Never request private keys or seed phrases
2. Validate all smart contract inputs
3. Use latest OnchainKit with security patches
4. Implement error boundaries
5. Sanitize all user inputs
6. Access control in smart contracts
7. HTTPS for all API calls
8. No sensitive data in LocalStorage
