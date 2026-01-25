# Requirements Document

## Introduction

Memory Match - это классическая игра на память с тематикой BASE blockchain экосистемы, разработанная как Mini App для BASE App. Игрок переворачивает карты на игровом поле, ищет совпадающие пары логотипов проектов BASE, и проходит 100 уровней с возрастающей сложностью. 

Приложение является социально-ориентированным Mini App с полной интеграцией блокчейна BASE, который:
- Запускается мгновенно без установки
- Работает внутри BASE App и Farcaster Frames
- Использует OnchainKit для интеграции с BASE экосистемой
- Построен на React и TypeScript с использованием OnchainKit компонентов
- Поддерживает социальные функции (лидерборды, шаринг достижений)
- **Интегрирован с Base blockchain** для аутентификации, хранения прогресса и социальных функций
- **Поддерживает Smart Wallet** с passkey аутентификацией (без seed phrases)
- **Использует Basenames** для отображения человекочитаемых имен пользователей
- **Предоставляет gasless транзакции** через paymaster инфраструктуру
- **Хранит достижения on-chain** с синхронизацией LocalStorage
- **Работает offline** с graceful fallback на LocalStorage

## Glossary

### Game Core Terms
- **Game_Board**: Игровое поле с сеткой карт
- **Card**: Игровая карта с изображением логотипа проекта BASE
- **Pair**: Две карты с одинаковым изображением
- **Level**: Игровой уровень с определенной сложностью
- **Timer**: Таймер обратного отсчета для уровня
- **Progress_Manager**: Компонент управления прогрессом игрока
- **Match_System**: Система проверки совпадения карт
- **Animation_Controller**: Контроллер анимаций переворачивания карт
- **Storage_Manager**: Менеджер сохранения данных в LocalStorage

### Blockchain Terms
- **Wallet_Manager**: Component managing wallet connection state and authentication
- **Identity_Provider**: Component resolving and displaying Basenames and addresses
- **Paymaster_Service**: Service handling gas sponsorship for transactions
- **Progress_Contract**: Smart contract storing player achievements on-chain
- **Sync_Manager**: Component synchronizing LocalStorage with on-chain data
- **OnchainKit**: Base's official React component library for blockchain UI
- **Smart_Wallet**: Account abstraction wallet created with passkeys (no seed phrases)
- **Basename**: ENS-like name on Base (e.g., "alice.base.eth")
- **Base_Mainnet**: Base Layer 2 blockchain (chain ID: 8453)
- **Base_Sepolia**: Base testnet for development (chain ID: 84532)

## Testing Framework

**CRITICAL**: Для ВСЕХ тестов (unit tests, property-based tests, integration tests) ДОЛЖЕН использоваться **Vitest**. Никакие другие фреймворки тестирования не допускаются.

- **Test Framework**: Vitest (обязательно для всех типов тестов)
- **Property Testing Library**: fast-check
- **React Testing**: @testing-library/react
- **Test Runner**: Vitest

## Requirements

### Requirement 1: Game Board Management

**User Story:** Как игрок, я хочу видеть игровое поле с картами, чтобы начать игру и искать совпадающие пары.

#### Acceptance Criteria

1. WHEN a level starts, THE Game_Board SHALL display a grid of face-down cards
2. WHEN the level is 1-25, THE Game_Board SHALL display a 4x4 grid (16 cards, 8 pairs)
3. WHEN the level is 26-60, THE Game_Board SHALL display a 6x6 grid (36 cards, 18 pairs)
4. WHEN the level is 61-100, THE Game_Board SHALL display an 8x8 grid (64 cards, 32 pairs)
5. THE Game_Board SHALL shuffle card positions randomly at the start of each level
6. THE Game_Board SHALL display cards in a responsive layout that adapts to screen size

### Requirement 2: Card Flipping Mechanics

**User Story:** Как игрок, я хочу переворачивать карты кликом, чтобы видеть изображения и искать пары.

#### Acceptance Criteria

1. WHEN a player clicks a face-down card, THE Card SHALL flip to reveal its image
2. WHEN a card is already flipped, THE Card SHALL ignore additional clicks
3. WHEN two cards are flipped, THE Game_Board SHALL prevent flipping additional cards until match check completes
4. THE Card SHALL display a smooth flip animation with duration of 300ms
5. WHEN a card is face-down, THE Card SHALL display a generic back design with BASE branding

### Requirement 3: Pair Matching System

**User Story:** Как игрок, я хочу, чтобы система автоматически проверяла совпадение карт, чтобы я мог продолжать игру.

#### Acceptance Criteria

1. WHEN two cards are flipped, THE Match_System SHALL compare their images
2. WHEN two flipped cards match, THE Match_System SHALL mark them as matched and keep them face-up
3. WHEN two flipped cards do not match, THE Match_System SHALL flip them back face-down after 1 second
4. WHEN all pairs are matched, THE Match_System SHALL trigger level completion
5. THE Match_System SHALL increment the move counter after each pair of flips

### Requirement 4: Timer System

**User Story:** Как игрок, я хочу видеть таймер обратного отсчета, чтобы знать, сколько времени осталось на прохождение уровня.

#### Acceptance Criteria

1. WHEN a level starts, THE Timer SHALL begin counting down from the allocated time
2. WHEN the level is 1-25, THE Timer SHALL allocate 60 seconds
3. WHEN the level is 26-60, THE Timer SHALL allocate 90 seconds
4. WHEN the level is 61-100, THE Timer SHALL allocate 120 seconds
5. WHEN the timer reaches zero, THE Timer SHALL trigger level failure
6. WHEN all pairs are matched, THE Timer SHALL stop
7. THE Timer SHALL display remaining time in MM:SS format

### Requirement 5: Level Progression System

**User Story:** Как игрок, я хочу проходить уровни с возрастающей сложностью, чтобы игра оставалась интересной.

#### Acceptance Criteria

1. THE Progress_Manager SHALL provide 100 unique levels
2. WHEN a level is completed successfully, THE Progress_Manager SHALL unlock the next level
3. WHEN a level fails, THE Progress_Manager SHALL allow the player to retry the same level
4. THE Progress_Manager SHALL display current level number
5. THE Progress_Manager SHALL track which levels have been completed
6. WHEN a player completes level 100, THE Progress_Manager SHALL display a victory screen

### Requirement 6: Score and Statistics Tracking

**User Story:** Как игрок, я хочу видеть свою статистику, чтобы отслеживать прогресс и улучшать результаты.

#### Acceptance Criteria

1. THE Progress_Manager SHALL track the number of moves made in current level
2. THE Progress_Manager SHALL track the time taken to complete each level
3. THE Progress_Manager SHALL calculate and display a star rating (1-3 stars) based on performance
4. WHEN moves are less than optimal threshold, THE Progress_Manager SHALL award 3 stars
5. WHEN moves are within acceptable range, THE Progress_Manager SHALL award 2 stars
6. WHEN moves exceed acceptable range, THE Progress_Manager SHALL award 1 star
7. THE Progress_Manager SHALL display total stars earned across all completed levels

### Requirement 7: Progress Persistence

**User Story:** Как игрок, я хочу, чтобы мой прогресс сохранялся, чтобы продолжить игру позже.

#### Acceptance Criteria

1. WHEN a level is completed, THE Storage_Manager SHALL save the completion status to LocalStorage
2. WHEN a level is completed, THE Storage_Manager SHALL save the star rating to LocalStorage
3. WHEN the game loads, THE Storage_Manager SHALL restore the player's progress from LocalStorage
4. THE Storage_Manager SHALL save the highest unlocked level
5. THE Storage_Manager SHALL persist data using JSON format
6. WHEN LocalStorage is unavailable, THE Storage_Manager SHALL handle the error gracefully and continue with in-memory storage

### Requirement 8: Card Theme Management

**User Story:** Как игрок, я хочу видеть логотипы проектов BASE экосистемы, чтобы узнавать о проектах во время игры.

#### Acceptance Criteria

1. THE Game_Board SHALL use images from a predefined set of BASE ecosystem projects
2. THE Game_Board SHALL include at least 20 unique project images
3. THE Game_Board SHALL select appropriate number of unique images based on grid size
4. WHEN displaying cards, THE Card SHALL show project logo at 200x200px resolution
5. THE Game_Board SHALL support PNG and SVG image formats

### Requirement 9: Animation System

**User Story:** Как игрок, я хочу видеть плавные анимации, чтобы игра была визуально приятной.

#### Acceptance Criteria

1. WHEN a card flips, THE Animation_Controller SHALL display a 3D flip animation
2. WHEN cards match, THE Animation_Controller SHALL display a success animation
3. WHEN cards don't match, THE Animation_Controller SHALL display a shake animation before flipping back
4. WHEN a level is completed, THE Animation_Controller SHALL display a celebration animation
5. THE Animation_Controller SHALL use CSS transitions with duration between 200-500ms

### Requirement 10: Responsive Design

**User Story:** Как игрок, я хочу играть на разных устройствах, чтобы иметь доступ к игре везде.

#### Acceptance Criteria

1. THE Game_Board SHALL adapt layout for mobile devices (320px - 767px width)
2. THE Game_Board SHALL adapt layout for tablet devices (768px - 1023px width)
3. THE Game_Board SHALL adapt layout for desktop devices (1024px+ width)
4. WHEN screen size changes, THE Game_Board SHALL maintain card aspect ratio
5. THE Game_Board SHALL ensure cards are touchable on mobile devices with minimum 44x44px touch target

### Requirement 11: User Interface Components

**User Story:** Как игрок, я хочу видеть понятный интерфейс, чтобы легко управлять игрой.

#### Acceptance Criteria

1. THE Game_Board SHALL display a header with level number, timer, and move counter
2. THE Game_Board SHALL provide a pause button to pause the game
3. THE Game_Board SHALL provide a restart button to restart current level
4. THE Game_Board SHALL provide a level selection screen to choose unlocked levels
5. WHEN the game is paused, THE Game_Board SHALL display a pause overlay with resume option
6. THE Game_Board SHALL display a level completion screen with statistics and next level button

### Requirement 12: Sound Effects (Optional Feature)

**User Story:** Как игрок, я хочу слышать звуковые эффекты, чтобы получить дополнительную обратную связь.

#### Acceptance Criteria

1. WHERE sound is enabled, WHEN a card flips, THE Game_Board SHALL play a flip sound
2. WHERE sound is enabled, WHEN cards match, THE Game_Board SHALL play a success sound
3. WHERE sound is enabled, WHEN cards don't match, THE Game_Board SHALL play a mismatch sound
4. WHERE sound is enabled, WHEN a level is completed, THE Game_Board SHALL play a victory sound
5. THE Game_Board SHALL provide a toggle button to enable/disable sound effects
6. THE Storage_Manager SHALL persist sound preference to LocalStorage

### Requirement 13: Mini App Integration

**User Story:** Как разработчик, я хочу интегрировать игру с BASE Mini Apps платформой, чтобы пользователи могли запускать её из BASE App.

#### Acceptance Criteria

1. THE App SHALL provide a minikit.config.ts configuration file with app metadata
2. THE App SHALL serve a manifest at /.well-known/farcaster.json
3. THE App SHALL include app name, description, icon, and screenshots in manifest
4. THE App SHALL set primaryCategory as "games"
5. THE App SHALL include appropriate tags: ["memory", "game", "base", "crypto", "puzzle"]
6. THE App SHALL be accessible via HTTPS
7. THE App SHALL provide OG meta tags for social sharing
8. THE App SHALL include splashImageUrl and iconUrl (512x512px minimum)

### Requirement 14: Social Features (Optional Feature)

**User Story:** Как игрок, я хочу делиться своими достижениями, чтобы соревноваться с друзьями.

#### Acceptance Criteria

1. WHERE level is completed, THE App SHALL provide a share button
2. WHEN share button is clicked, THE App SHALL generate a shareable message with level number and stars
3. THE App SHALL display a global leaderboard showing top players (optional)
4. THE App SHALL allow players to see friends' progress (optional)
5. THE App SHALL support Farcaster Frame integration for social sharing

---

## Blockchain Integration Requirements

### Requirement 15: Wallet Connection and Authentication

**User Story:** As a player, I want to connect my wallet to the game, so that I can access blockchain features and store my progress on-chain.

#### Acceptance Criteria

1. WHEN a user clicks the connect wallet button, THE Wallet_Manager SHALL display OnchainKit's WalletModal
2. WHEN a user has no wallet, THE Wallet_Manager SHALL offer Smart Wallet creation with passkey authentication
3. WHEN a user has an existing wallet, THE Wallet_Manager SHALL support connection via MetaMask, Coinbase Wallet, and WalletConnect-compatible wallets
4. WHEN a wallet is connected, THE Wallet_Manager SHALL persist the connection state across browser sessions
5. WHEN a user disconnects their wallet, THE Wallet_Manager SHALL clear the connection state and revert to LocalStorage-only mode
6. THE Wallet_Manager SHALL display the connection status prominently in the UI
7. WHEN wallet connection fails, THE Wallet_Manager SHALL display a user-friendly error message and allow retry

### Requirement 16: Basename Identity Display

**User Story:** As a player, I want to see my Basename displayed in the game, so that I can be identified by my human-readable name instead of a hex address.

#### Acceptance Criteria

1. WHEN a connected wallet has a Basename, THE Identity_Provider SHALL resolve and display the Basename (e.g., "alice.base.eth")
2. WHEN a connected wallet has no Basename, THE Identity_Provider SHALL display a truncated address (e.g., "0x1234...5678")
3. THE Identity_Provider SHALL use OnchainKit's Identity components (Avatar, Name, Address) for consistent styling
4. THE Identity_Provider SHALL display the identity in the header or profile area
5. WHEN hovering over the displayed identity, THE Identity_Provider SHALL show the full address in a tooltip
6. THE Identity_Provider SHALL update the display when the connected wallet changes

### Requirement 17: Gas Sponsorship via Paymasters

**User Story:** As a player, I want to interact with blockchain features without paying gas fees, so that I can enjoy the game without worrying about transaction costs.

#### Acceptance Criteria

1. WHEN a user performs an on-chain transaction, THE Paymaster_Service SHALL sponsor the gas fees
2. THE Paymaster_Service SHALL use Base's paymaster infrastructure for gas sponsorship
3. WHEN paymaster sponsorship fails, THE Paymaster_Service SHALL fall back to user-paid gas with clear notification
4. WHEN paymaster sponsorship fails, THE Paymaster_Service SHALL log the error for debugging
5. THE Paymaster_Service SHALL display a loading indicator during transaction processing
6. WHEN a transaction is confirmed, THE Paymaster_Service SHALL display a success message with transaction hash
7. WHEN a transaction fails, THE Paymaster_Service SHALL display an error message and allow retry

### Requirement 18: On-Chain Progress Storage

**User Story:** As a player, I want my game progress stored on the blockchain, so that my achievements are permanent and verifiable.

#### Acceptance Criteria

1. WHEN a level is completed with a wallet connected, THE Progress_Contract SHALL store the level number and stars earned on-chain
2. WHEN the game loads with a wallet connected, THE Sync_Manager SHALL read progress from the Progress_Contract
3. WHEN on-chain progress differs from LocalStorage, THE Sync_Manager SHALL merge the data, keeping the best results
4. WHEN a user switches wallets, THE Sync_Manager SHALL load progress for the new wallet address
5. THE Progress_Contract SHALL emit events when progress is updated
6. THE Progress_Contract SHALL allow reading progress data without gas fees (view functions)
7. WHEN blockchain is unavailable, THE Sync_Manager SHALL fall back to LocalStorage-only mode

### Requirement 19: Smart Contract Implementation

**User Story:** As a developer, I want a secure smart contract to store player progress, so that achievements are tamper-proof and verifiable.

#### Acceptance Criteria

1. THE Progress_Contract SHALL store a mapping of player addresses to their progress data
2. THE Progress_Contract SHALL store level completion status (boolean array for levels 1-100)
3. THE Progress_Contract SHALL store star ratings for each completed level (uint8 array)
4. THE Progress_Contract SHALL provide a function to update progress for a single level
5. THE Progress_Contract SHALL provide a function to batch update multiple levels
6. THE Progress_Contract SHALL provide view functions to read player progress without gas
7. THE Progress_Contract SHALL emit a ProgressUpdated event when progress changes
8. THE Progress_Contract SHALL prevent players from modifying other players' progress

### Requirement 20: Network Configuration

**User Story:** As a developer, I want to support both Base Mainnet and Base Sepolia testnet, so that I can develop and test before deploying to production.

#### Acceptance Criteria

1. THE Wallet_Manager SHALL support Base Mainnet (chain ID: 8453) for production
2. THE Wallet_Manager SHALL support Base Sepolia (chain ID: 84532) for development
3. WHEN connected to the wrong network, THE Wallet_Manager SHALL prompt the user to switch networks
4. THE Wallet_Manager SHALL use environment variables to determine the target network
5. THE Wallet_Manager SHALL display the current network name in the UI
6. WHEN network switching fails, THE Wallet_Manager SHALL display an error message

### Requirement 21: Transaction UI and Feedback

**User Story:** As a player, I want clear feedback during blockchain transactions, so that I understand what's happening and can troubleshoot issues.

#### Acceptance Criteria

1. WHEN a transaction is initiated, THE Wallet_Manager SHALL display a loading state with descriptive text
2. WHEN a transaction requires user confirmation, THE Wallet_Manager SHALL display a modal with transaction details
3. WHEN a transaction is pending, THE Wallet_Manager SHALL show a pending indicator with estimated time
4. WHEN a transaction is confirmed, THE Wallet_Manager SHALL display a success message with a link to the block explorer
5. WHEN a transaction fails, THE Wallet_Manager SHALL display the error reason and suggest solutions
6. THE Wallet_Manager SHALL allow users to dismiss transaction notifications
7. THE Wallet_Manager SHALL maintain a transaction history visible in the UI

### Requirement 22: Offline and Fallback Behavior

**User Story:** As a player, I want to play the game even when blockchain features are unavailable, so that I can always enjoy the game.

#### Acceptance Criteria

1. WHEN no wallet is connected, THE App SHALL function normally using LocalStorage for progress
2. WHEN blockchain RPC is unavailable, THE App SHALL fall back to LocalStorage-only mode
3. WHEN a transaction fails, THE App SHALL save progress to LocalStorage as backup
4. THE App SHALL display a notification when operating in fallback mode
5. WHEN blockchain becomes available again, THE Sync_Manager SHALL attempt to sync LocalStorage data to on-chain
6. THE App SHALL never block gameplay due to blockchain issues

### Requirement 23: On-Chain Leaderboard

**User Story:** As a player, I want to see a leaderboard of top players, so that I can compare my progress with others.

#### Acceptance Criteria

1. THE Progress_Contract SHALL provide a function to query top players by total stars
2. THE App SHALL display a leaderboard screen showing top 10 players
3. THE App SHALL display each player's Basename (or truncated address), total stars, and levels completed
4. THE App SHALL update the leaderboard when new progress is recorded on-chain
5. THE App SHALL allow filtering leaderboard by time period (all-time, weekly, daily)
6. WHEN a player is in the top 10, THE App SHALL highlight their position
7. THE App SHALL cache leaderboard data to minimize RPC calls

### Requirement 24: Farcaster Social Integration

**User Story:** As a player, I want to share my achievements on Farcaster, so that I can show off my progress to friends.

#### Acceptance Criteria

1. WHEN a level is completed, THE App SHALL provide a "Share on Farcaster" button
2. WHEN the share button is clicked, THE App SHALL generate a Farcaster Frame with level number, stars, and player Basename
3. THE App SHALL include an image showing the level completion screen in the Frame
4. THE App SHALL provide a deep link back to the game in the Frame
5. THE App SHALL display a preview of the Frame before sharing
6. WHEN sharing fails, THE App SHALL display an error message and allow retry

### Requirement 25: Achievement NFTs (Optional)

**User Story:** As a player, I want to earn NFT badges for completing milestones, so that I have collectible proof of my achievements.

#### Acceptance Criteria

1. WHERE achievement NFTs are enabled, WHEN a player completes level 25, THE App SHALL mint a "Quarter Master" NFT
2. WHERE achievement NFTs are enabled, WHEN a player completes level 50, THE App SHALL mint a "Half Way Hero" NFT
3. WHERE achievement NFTs are enabled, WHEN a player completes level 75, THE App SHALL mint a "Three Quarter Champion" NFT
4. WHERE achievement NFTs are enabled, WHEN a player completes level 100, THE App SHALL mint a "Memory Master" NFT
5. WHERE achievement NFTs are enabled, THE App SHALL display owned NFTs in a trophy case
6. WHERE achievement NFTs are enabled, THE App SHALL use ERC-1155 standard for NFTs
7. WHERE achievement NFTs are enabled, THE Paymaster_Service SHALL sponsor NFT minting gas fees

### Requirement 26: Error Handling and Edge Cases

**User Story:** As a player, I want the app to handle errors gracefully, so that I'm never stuck or confused.

#### Acceptance Criteria

1. WHEN a wallet connection is rejected, THE App SHALL display a friendly message and allow retry
2. WHEN a transaction is rejected, THE App SHALL save progress to LocalStorage as backup
3. WHEN RPC rate limits are hit, THE App SHALL implement exponential backoff and retry
4. WHEN smart contract calls fail, THE App SHALL log detailed error information for debugging
5. WHEN the user has insufficient funds for gas (in non-sponsored scenarios), THE App SHALL display a clear message
6. WHEN network congestion causes slow transactions, THE App SHALL display estimated wait time
7. THE App SHALL never lose player progress due to blockchain errors

### Requirement 27: Security and Best Practices

**User Story:** As a developer, I want to follow security best practices, so that player data and funds are protected.

#### Acceptance Criteria

1. THE App SHALL never request private keys or seed phrases from users
2. THE App SHALL validate all smart contract inputs before sending transactions
3. THE App SHALL use the latest version of OnchainKit with security patches
4. THE App SHALL implement proper error boundaries to prevent app crashes
5. THE App SHALL sanitize all user inputs before displaying or processing
6. THE Progress_Contract SHALL include access control to prevent unauthorized modifications
7. THE App SHALL use HTTPS for all API calls and RPC requests
8. THE App SHALL not store sensitive data in LocalStorage (only progress data)

### Requirement 28: Performance Optimization

**User Story:** As a player, I want the blockchain features to be fast and responsive, so that they don't slow down the game.

#### Acceptance Criteria

1. THE App SHALL cache Basename resolutions to minimize RPC calls
2. THE App SHALL batch multiple progress updates into a single transaction when possible
3. THE App SHALL use optimistic UI updates (update UI before transaction confirms)
4. THE App SHALL lazy load blockchain components to reduce initial bundle size
5. THE App SHALL implement connection pooling for RPC requests
6. THE App SHALL prefetch on-chain data during loading screens
7. THE App SHALL display cached data immediately while fetching fresh data in background
