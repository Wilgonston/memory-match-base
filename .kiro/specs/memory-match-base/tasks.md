# Implementation Plan: Memory Match BASE

## Overview

This implementation plan breaks down the Memory Match BASE game with full blockchain integration into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. 

The implementation uses:
- **Frontend**: React with TypeScript, Vite for build tooling, Tailwind CSS for styling
- **Blockchain**: OnchainKit, wagmi, viem for Base blockchain integration
- **Testing**: Vitest for all tests, fast-check for property-based testing

The plan is divided into two major phases:
1. **Tasks 1-24**: Core game implementation (COMPLETED ✅)
2. **Tasks 25-41**: Blockchain integration (NEW 🆕)

All blockchain features are implemented as progressive enhancements with graceful fallback to LocalStorage when blockchain is unavailable.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize Vite + React + TypeScript project
  - Install dependencies: react, react-dom, typescript, tailwindcss, fast-check, vitest, @testing-library/react
  - Configure Tailwind CSS
  - Set up Vitest test configuration
  - Create basic project structure: `/src/components`, `/src/hooks`, `/src/utils`, `/src/types`, `/src/assets`, `/public/assets`
  - Create minikit.config.ts for Mini App configuration
  - Create .well-known/farcaster.json manifest endpoint
  - _Requirements: All, 13.1, 13.2_

- [x] 2. Define core types and interfaces
  - Create `/src/types/game.ts` with Card, GameState, LevelConfig, ProgressData, ProjectImage interfaces
  - Create `/src/types/actions.ts` with GameAction type definitions
  - Export all types from `/src/types/index.ts`
  - _Requirements: All (foundational)_

- [x] 2.1 Write unit tests for type definitions
  - Test that types compile correctly
  - Test type guards if any are created

- [x] 3. Implement utility functions
  - [x] 3.1 Create `/src/utils/shuffle.ts` with Fisher-Yates shuffle algorithm
    - Implement `shuffleArray<T>(array: T[]): T[]` function
    - _Requirements: 1.5_

  - [x] 3.2 Write property test for shuffle function
    - **Property 3: Shuffle Preserves Content**
    - Verify shuffled array contains same elements as original
    - Verify order is different (with high probability)
    - **Validates: Requirements 1.5**
    - **Feature: memory-match-base, Property 3: Shuffle Preserves Content**

  - [x] 3.3 Create `/src/utils/levelConfig.ts` with level configuration logic
    - Implement `getLevelConfig(level: number): LevelConfig` function
    - Return correct gridSize, timeLimit, optimalMoves, acceptableMoves based on level range
    - _Requirements: 1.2, 1.3, 1.4, 4.2, 4.3, 4.4_

  - [x] 3.4 Write property test for level configuration
    - **Property 2: Grid Size Consistency**
    - **Property 12: Time Allocation by Level Range**
    - Verify gridSize × gridSize is always even
    - Verify correct time limits for each level range (1-25: 60s, 26-60: 90s, 61-100: 120s)
    - **Validates: Requirements 1.2, 1.3, 1.4, 4.2, 4.3, 4.4**
    - **Feature: memory-match-base, Property 2: Grid Size Consistency**
    - **Feature: memory-match-base, Property 12: Time Allocation by Level Range**

  - [x] 3.5 Create `/src/utils/cardGenerator.ts` with card generation logic
    - Implement `generateCards(gridSize: number, availableImages: ProjectImage[]): Card[]` function
    - Select random images, create pairs, shuffle
    - _Requirements: 1.1, 1.5, 8.1, 8.3_

  - [x] 3.6 Write property test for card generation
    - **Property 1: Card Pair Invariant**
    - Verify each imageId appears exactly twice
    - Verify total cards equals gridSize × gridSize
    - **Validates: Requirements 1.1, 8.3**
    - **Feature: memory-match-base, Property 1: Card Pair Invariant**

  - [x] 3.7 Create `/src/utils/scoring.ts` with star calculation logic
    - Implement `calculateStars(moves: number, config: LevelConfig): number` function
    - Return 3 stars for optimal, 2 for acceptable, 1 otherwise
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [x] 3.8 Write property test for star calculation
    - **Property 9: Star Rating Boundaries**
    - Verify stars are always 1, 2, or 3
    - Verify stars decrease (or stay same) as moves increase
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**
    - **Feature: memory-match-base, Property 9: Star Rating Boundaries**

  - [x] 3.9 Create `/src/utils/timeFormat.ts` with time formatting
    - Implement `formatTime(seconds: number): string` function to format as MM:SS
    - _Requirements: 4.7_

  - [x] 3.10 Write unit tests for time formatting
    - Test 0 seconds → "00:00"
    - Test 59 seconds → "00:59"
    - Test 60 seconds → "01:00"
    - Test 125 seconds → "02:05"

- [x] 4. Implement storage manager
  - [x] 4.1 Create `/src/utils/storage.ts` with StorageManager class
    - Implement `saveProgress(progress: ProgressData): void` method
    - Implement `loadProgress(): ProgressData` method
    - Implement `getDefaultProgress(): ProgressData` private method
    - Handle LocalStorage errors gracefully with try-catch
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 4.2 Write property test for storage persistence
    - **Property 8: Progress Persistence Round Trip**
    - Generate random ProgressData, save and load, verify equivalence
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
    - **Feature: memory-match-base, Property 8: Progress Persistence Round Trip**

  - [x] 4.3 Write unit test for LocalStorage error handling
    - Mock localStorage to throw error
    - Verify app continues with in-memory storage
    - _Requirements: 7.6_

- [x] 5. Create BASE project images data
  - Create `/src/data/projects.ts` with array of ProjectImage objects
  - Include all 20 BASE ecosystem projects (BASE, Coinbase, Aerodrome, Uniswap, Aave, etc.)
  - Add placeholder image paths (actual images to be added later)
  - _Requirements: 8.1, 8.2_

- [x] 6. Implement game state reducer
  - [x] 6.1 Create `/src/reducers/gameReducer.ts` with game state management
    - Implement `gameReducer(state: GameState, action: GameAction): GameState` function
    - Handle all action types: START_LEVEL, FLIP_CARD, MATCH_FOUND, NO_MATCH, TICK_TIMER, PAUSE_GAME, RESUME_GAME, RESTART_LEVEL, COMPLETE_LEVEL, FAIL_LEVEL
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.5, 4.6_

  - [x] 6.2 Write property test for match detection
    - **Property 4: Match Detection Correctness**
    - Verify cards with same imageId are marked as matched
    - Verify cards with different imageId are not matched
    - **Validates: Requirements 3.1, 3.2**
    - **Feature: memory-match-base, Property 4: Match Detection Correctness**

  - [x] 6.3 Write property test for card flip state consistency
    - **Property 11: Card Flip State Consistency**
    - Verify matched cards are always flipped
    - **Validates: Requirements 3.2**
    - **Feature: memory-match-base, Property 11: Card Flip State Consistency**

  - [x] 6.4 Write property test for move counter
    - **Property 7: Move Counter Increment**
    - Verify moves increment by 1 after every second card flip
    - **Validates: Requirements 3.5**
    - **Feature: memory-match-base, Property 7: Move Counter Increment**

  - [x] 6.5 Write unit tests for game reducer edge cases
    - Test flipping already flipped card (should be ignored)
    - Test level completion when all pairs matched
    - Test level failure when timer reaches zero
    - _Requirements: 2.2, 3.4, 4.5_

- [x] 7. Create Card component
  - [x] 7.1 Create `/src/components/Card.tsx`
    - Accept CardProps: card, onClick, disabled
    - Render card with flip animation (CSS class based on isFlipped)
    - Display project image when flipped, back design when face-down
    - Handle click events (call onClick with cardId)
    - Add CSS classes for matched state
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 9.1_

  - [x] 7.2 Create `/src/components/Card.css` with flip animations
    - Implement 3D flip animation using CSS transforms
    - Add matched card animation
    - Add shake animation for non-matching cards
    - Use transitions with 300ms duration
    - _Requirements: 2.4, 9.1, 9.2, 9.3_

  - [x] 7.3 Write unit tests for Card component
    - Test card renders correctly
    - Test onClick is called when clicked
    - Test disabled cards don't trigger onClick
    - Test correct CSS classes applied based on state

- [x] 8. Create Grid component
  - Create `/src/components/Grid.tsx`
  - Accept cards array and onCardClick callback
  - Render grid of Card components
  - Apply responsive grid layout (CSS Grid with dynamic columns based on gridSize)
  - Use React.memo for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 10.1, 10.2, 10.3_

- [x] 8.1 Write unit tests for Grid component
  - Test correct number of cards rendered
  - Test grid layout classes applied correctly

- [x] 9. Create Header component
  - Create `/src/components/Header.tsx`
  - Accept HeaderProps: level, moves, timeRemaining
  - Display level number, formatted time, and move counter
  - Apply responsive styling
  - _Requirements: 4.7, 5.4, 6.1, 11.1_

- [x] 10. Create control buttons components
  - [x] 10.1 Create `/src/components/PauseButton.tsx`
    - Accept onPause callback
    - Render pause icon button
    - _Requirements: 11.2_

  - [x] 10.2 Create `/src/components/RestartButton.tsx`
    - Accept onRestart callback
    - Render restart icon button
    - _Requirements: 11.3_

- [x] 11. Create PauseOverlay component
  - Create `/src/components/PauseOverlay.tsx`
  - Accept isPaused boolean and onResume callback
  - Display overlay with resume button when paused
  - Prevent interaction with game board when visible
  - _Requirements: 11.5_

- [x] 12. Create ResultScreen component
  - Create `/src/components/ResultScreen.tsx`
  - Accept ResultScreenProps: level, moves, timeElapsed, stars, callbacks
  - Display level completion statistics
  - Show star rating (1-3 stars)
  - Provide buttons: Next Level, Retry, Level Select
  - Add celebration animation
  - _Requirements: 5.2, 6.2, 6.3, 9.4, 11.6_

- [x] 12.1 Write unit tests for ResultScreen component
  - Test correct statistics displayed
  - Test star rating rendered correctly
  - Test button callbacks work

- [x] 13. Create GameBoard component
  - [x] 13.1 Create `/src/components/GameBoard.tsx`
    - Accept GameBoardProps: gameState, callbacks
    - Render Header, Grid, control buttons
    - Render PauseOverlay when paused
    - Render ResultScreen when game complete
    - Implement card click handler with match checking logic
    - Use useEffect for timer countdown (setInterval)
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.6, 11.1, 11.2, 11.3_

  - [x] 13.2 Write integration tests for GameBoard
    - Test card flip flow: click → flip → match check → state update
    - Test timer countdown
    - Test pause/resume functionality
    - _Requirements: 2.1, 3.1, 4.1_

- [x] 14. Create LevelSelect component
  - Create `/src/components/LevelSelect.tsx`
  - Accept LevelSelectProps: progressData, onLevelSelect
  - Display grid of level buttons (1-100)
  - Show locked/unlocked state for each level
  - Show star rating for completed levels
  - Disable locked levels
  - Apply responsive grid layout
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.7, 11.4_

- [x] 14.1 Write property test for level unlock progression
  - **Property 10: Level Unlock Progression**
  - Verify if level N is unlocked, all levels 1 to N-1 are unlocked
  - **Validates: Requirements 5.2, 5.4**
  - **Feature: memory-match-base, Property 10: Level Unlock Progression**

- [x] 14.2 Write unit tests for LevelSelect component
  - Test locked levels are disabled
  - Test completed levels show stars
  - Test onLevelSelect callback works

- [x] 15. Create custom hooks
  - [x] 15.1 Create `/src/hooks/useGameState.ts`
    - Implement custom hook using useReducer for game state
    - Provide game state and dispatch actions
    - _Requirements: All game state management_

  - [x] 15.2 Create `/src/hooks/useProgress.ts`
    - Implement custom hook for progress management
    - Load progress on mount, save on updates
    - Provide progress data and update functions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 15.3 Create `/src/hooks/useTimer.ts`
    - Implement custom hook for timer logic
    - Handle countdown, pause, resume
    - Call callback when timer reaches zero
    - _Requirements: 4.1, 4.5, 4.6_

- [x] 16. Implement main App component
  - [x] 16.1 Create `/src/App.tsx`
    - Manage app-level state: current screen (level-select, game, result)
    - Use useProgress hook for progress management
    - Use useGameState hook for game state
    - Render LevelSelect or GameBoard based on current screen
    - Handle level selection, level start, level completion
    - _Requirements: All_

  - [x] 16.2 Write integration tests for App component
    - Test navigation flow: level select → game → result → level select
    - Test progress persistence across level completions
    - _Requirements: 5.2, 7.1, 7.2, 7.3_

- [x] 17. Add styling and responsive design
  - [x] 17.1 Create `/src/index.css` with Tailwind imports and global styles
    - Import Tailwind base, components, utilities
    - Add custom CSS variables for theme colors (BASE blue, etc.)
    - Add global animations
    - _Requirements: 9.5_

  - [x] 17.2 Add responsive breakpoints to all components
    - Ensure mobile (320px+), tablet (768px+), desktop (1024px+) layouts work
    - Test card grid adapts to screen size
    - Ensure minimum touch target size (44x44px) on mobile
    - _Requirements: 1.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 18. Add image assets
  - Create `/public/assets/projects/` directory
  - Add placeholder images for all 20 BASE projects (200x200px PNG/SVG)
  - Add card back design image with BASE branding
  - Add fallback image for error handling
  - Create Mini App assets: icon-512.png, splash.png, hero.png, og-image.png (1200x630px)
  - Create screenshots: gameplay.png, level-select.png
  - _Requirements: 2.5, 8.1, 8.2, 8.4, 13.8_

- [x] 19. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation (Tab, Enter, Space)
  - Add focus indicators for keyboard users
  - Ensure color contrast meets WCAG standards
  - Test with screen reader
  - _Requirements: Accessibility (implicit)_

- [ ] 20. Add sound effects (optional)
  - [ ] 20.1 Create `/src/utils/sound.ts` with sound manager
    - Implement `playSound(soundType: string): void` function
    - Check soundEnabled preference before playing
    - Handle audio loading errors gracefully
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 20.2 Add sound toggle to UI
    - Add sound toggle button to header or settings
    - Save preference to LocalStorage
    - _Requirements: 12.5, 12.6_

  - [ ] 20.3 Add sound files
    - Add flip.mp3, match.mp3, mismatch.mp3, victory.mp3 to `/public/assets/sounds/`
    - Use royalty-free or create simple sound effects
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 21. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify all 12 correctness properties pass
  - Fix any failing tests
  - Ensure test coverage is adequate
  - Ask the user if questions arise

- [ ] 22. Final integration and polish
  - [x] 22.1 Test complete game flow end-to-end
    - Play through multiple levels
    - Test level completion and failure
    - Test progress persistence (close and reopen)
    - Test on different screen sizes
    - _Requirements: All_

  - [ ] 22.2 Add victory screen for completing level 100
    - Create special celebration for completing all levels
    - Display total stats (total stars, total time, etc.)
    - _Requirements: 5.6_

  - [ ] 22.3 Performance optimization
    - Add React.memo to prevent unnecessary re-renders
    - Optimize image loading (lazy loading, preloading)
    - Minimize bundle size
    - Test performance on mobile devices

  - [ ] 22.4 Add error boundaries
    - Wrap app in error boundary component
    - Display friendly error message if app crashes
    - Log errors for debugging

- [ ] 23. Final checkpoint - Complete testing and deployment preparation
  - Run full test suite one final time
  - Build production bundle with Vite
  - Test production build locally
  - Verify all assets load correctly
  - Verify Mini App manifest is accessible at /.well-known/farcaster.json
  - Test HTTPS deployment
  - Verify OG meta tags for social sharing
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All, 13.3, 13.6, 13.7_

- [ ] 24. Add social features (optional)
  - [ ] 24.1 Create share functionality
    - Add share button to ResultScreen
    - Generate shareable message with level and stars
    - Integrate with Farcaster Frame for social sharing
    - _Requirements: 14.1, 14.2, 14.5_

  - [ ] 24.2 Add leaderboard (optional)
    - Create global leaderboard component
    - Display top players
    - Show friends' progress
    - _Requirements: 14.3, 14.4_

---

## Blockchain Integration Tasks

- [x] 25. Set up blockchain infrastructure
  - Install dependencies: @coinbase/onchainkit, wagmi, viem, @tanstack/react-query
  - Create wagmi configuration with Base Mainnet and Base Sepolia
  - Create OnchainKit configuration with API key and theme
  - Wrap app in OnchainKitProvider and WagmiProvider
  - Set up environment variables for API keys and contract addresses
  - _Requirements: 15.1, 15.2, 15.3, 20.1, 20.2, 20.4_

- [x] 26. Implement wallet connection components
  - [x] 26.1 Create WalletButton component using OnchainKit's Wallet components
    - Use ConnectWallet, Wallet, WalletDropdown components
    - Include Avatar, Name, Address in dropdown
    - Add WalletDropdownBasename for Basename management
    - Add WalletDropdownDisconnect for disconnection
    - _Requirements: 15.1, 15.2, 15.3, 15.5, 16.3_

  - [x] 26.2 Write unit tests for WalletButton component
    - Test component renders correctly
    - Test wallet modal opens on click
    - Test dropdown displays when connected

  - [x] 26.3 Integrate WalletButton into game header
    - Add WalletButton to existing Header component
    - Position prominently in top-right corner
    - Ensure responsive layout on mobile
    - _Requirements: 15.6, 16.4_

  - [x] 26.4 Write property test for wallet connection persistence
    - **Property 13: Wallet Connection Persistence**
    - Connect wallet, reload page, verify still connected
    - **Validates: Requirements 15.4**
    - **Feature: memory-match-base, Property 13: Wallet Connection Persistence**

  - [x] 26.5 Write property test for wallet disconnection cleanup
    - **Property 14: Wallet Disconnection Cleanup**
    - Disconnect wallet, verify all state cleared
    - **Validates: Requirements 15.5**
    - **Feature: memory-match-base, Property 14: Wallet Disconnection Cleanup**

- [x] 27. Implement identity display components
  - [x] 27.1 Create useBasename custom hook
    - Use OnchainKit's useName hook for Basename resolution
    - Implement address truncation logic (0x1234...5678)
    - Return basename, displayName, and loading state
    - Cache resolutions for 5 minutes
    - _Requirements: 16.1, 16.2, 28.1_

  - [x] 27.2 Write property test for Basename resolution
    - **Property 15: Basename Resolution Consistency**
    - Generate addresses with and without Basenames
    - Verify correct display format
    - **Validates: Requirements 16.1, 16.2**
    - **Feature: memory-match-base, Property 15: Basename Resolution Consistency**

  - [x] 27.3 Create IdentityDisplay component
    - Use OnchainKit's Identity, Avatar, Name, Address components
    - Display in header next to wallet button
    - Add tooltip showing full address on hover
    - Update display when wallet changes
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 27.4 Write property test for identity update on wallet change
    - **Property 16: Identity Update on Wallet Change**
    - Switch wallets, verify identity updates
    - **Validates: Requirements 16.6**
    - **Feature: memory-match-base, Property 16: Identity Update on Wallet Change**

- [x] 28. Develop and deploy smart contracts
  - [x] 28.1 Write MemoryMatchProgress smart contract
    - Implement PlayerProgress struct with completedLevels and levelStars arrays
    - Implement updateLevel function with validation
    - Implement batchUpdateLevels function
    - Implement view functions (getPlayerProgress, getTotalStars, etc.)
    - Emit ProgressUpdated events
    - Add access control (msg.sender only modifies own data)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

  - [x] 28.2 Write unit tests for smart contract
    - Test updateLevel with valid inputs
    - Test updateLevel rejects invalid inputs (level 0, 101, stars 0, 4)
    - Test batchUpdateLevels with multiple levels
    - Test progress isolation (can't modify other player's data)
    - Test event emission
    - Test view functions return correct data
    - _Requirements: 19.4, 19.5, 19.8_

  - [x] 28.3 Write property test for single level update
    - **Property 17: Single Level Update**
    - Generate random valid level/star combinations
    - Verify all updates succeed
    - **Validates: Requirements 19.4**
    - **Feature: memory-match-base, Property 17: Single Level Update**

  - [x] 28.4 Write property test for batch level update
    - **Property 18: Batch Level Update**
    - Generate random arrays of levels and stars
    - Verify batch updates succeed
    - **Validates: Requirements 19.5**
    - **Feature: memory-match-base, Property 18: Batch Level Update**

  - [x] 28.5 Write property test for progress isolation
    - **Property 19: Progress Isolation**
    - Generate random player addresses
    - Verify players can only modify own progress
    - **Validates: Requirements 19.8**
    - **Feature: memory-match-base, Property 19: Progress Isolation**

  - [x] 28.6 Write property test for event emission
    - **Property 20: Progress Update Event Emission**
    - Generate random progress updates
    - Verify events emitted with correct data
    - **Validates: Requirements 18.5, 19.7**
    - **Feature: memory-match-base, Property 20: Progress Update Event Emission**

  - [x] 28.7 Deploy contract to Base Sepolia testnet
    - Compile contract with Hardhat or Foundry
    - Deploy to Base Sepolia
    - Verify contract on Basescan
    - Test all functions with test wallet
    - Update .env with contract address
    - _Requirements: 20.2_

  - [x] 28.8 Deploy contract to Base Mainnet
    - Audit contract for security issues
    - Deploy to Base Mainnet
    - Verify contract on Basescan
    - Update production .env with contract address
    - _Requirements: 20.1_

- [x] 29. Checkpoint - Verify blockchain infrastructure
  - Ensure wallet connection works on both networks
  - Verify smart contract functions work correctly
  - Test identity display with multiple wallets
  - Ensure all tests pass, ask the user if questions arise

- [x] 30. Implement contract interaction hooks
  - [x] 30.1 Generate contract ABI and types
    - Use wagmi CLI to generate TypeScript types from contract ABI
    - Export contract address and ABI
    - _Requirements: 19.1_

  - [x] 30.2 Create usePlayerProgress hook
    - Use wagmi's useReadContract to fetch player progress
    - Enable caching with 30-second stale time
    - Return progress data and loading state
    - _Requirements: 18.2, 18.6_

  - [x] 30.3 Create useUpdateLevel hook
    - Use wagmi's useWriteContract for single level updates
    - Return updateLevel function, transaction hash, and status
    - Handle errors gracefully
    - _Requirements: 19.4_

  - [x] 30.4 Create useBatchUpdateLevels hook
    - Use wagmi's useWriteContract for batch updates
    - Return batchUpdate function, transaction hash, and status
    - Handle errors gracefully
    - _Requirements: 19.5_

  - [x] 30.5 Write unit tests for contract hooks
    - Test usePlayerProgress fetches data correctly
    - Test useUpdateLevel sends transactions
    - Test useBatchUpdateLevels sends batch transactions
    - Test error handling

- [x] 31. Implement progress synchronization
  - [x] 31.1 Create data transformation utilities
    - Implement localToOnChain function (ProgressData → OnChainProgress)
    - Implement onChainToLocal function (OnChainProgress → ProgressData)
    - Handle data format conversions correctly
    - _Requirements: 18.1, 18.2_

  - [x] 31.2 Write unit tests for data transformation
    - Test localToOnChain conversion
    - Test onChainToLocal conversion
    - Test round-trip conversion preserves data

  - [x] 31.3 Create useSyncManager hook
    - Implement syncToBlockchain function (LocalStorage → blockchain)
    - Implement mergeFromBlockchain function (blockchain → LocalStorage)
    - Implement merge logic (keep maximum stars for each level)
    - Track sync status (isSyncing, lastSyncTime, syncError, mode)
    - Auto-sync on wallet connection
    - _Requirements: 18.2, 18.3, 18.4, 18.7_

  - [x] 31.4 Write property test for progress sync on load
    - **Property 21: Progress Sync on Load**
    - Generate random progress states
    - Load with wallet, verify sync occurs
    - **Validates: Requirements 18.2**
    - **Feature: memory-match-base, Property 21: Progress Sync on Load**

  - [x] 31.5 Write property test for progress merge
    - **Property 22: Progress Merge Maximization**
    - Generate random pairs of progress states
    - Verify merged result has maximum stars for each level
    - **Validates: Requirements 18.3**
    - **Feature: memory-match-base, Property 22: Progress Merge Maximization**

  - [x] 31.6 Write property test for wallet switch progress update
    - **Property 23: Wallet Switch Progress Update**
    - Generate random wallet switches with different progress
    - Verify progress updates to new wallet's data
    - **Validates: Requirements 18.4**
    - **Feature: memory-match-base, Property 23: Wallet Switch Progress Update**

  - [x] 31.7 Integrate useSyncManager into App component
    - Call useSyncManager hook in App
    - Trigger sync on wallet connection
    - Display sync status in UI
    - Handle sync errors gracefully
    - _Requirements: 18.2, 18.3, 18.4_

- [x] 32. Implement transaction UI components
  - [x] 32.1 Create SaveProgressButton component
    - Use OnchainKit's Transaction, TransactionButton, TransactionStatus components
    - Call useUpdateLevel hook for single level save
    - Display loading state during transaction
    - Display success message with transaction hash
    - Display error message on failure
    - Provide retry button on failure
    - _Requirements: 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

  - [x] 32.2 Write unit tests for SaveProgressButton
    - Test button renders correctly
    - Test loading state during transaction
    - Test success message display
    - Test error message display
    - Test retry functionality

  - [x] 32.3 Write property test for on-chain progress storage
    - **Property 24: On-Chain Progress Storage**
    - Generate random level completions
    - Verify data stored and retrievable on-chain
    - **Validates: Requirements 18.1**
    - **Feature: memory-match-base, Property 24: On-Chain Progress Storage**

  - [x] 32.4 Integrate SaveProgressButton into ResultScreen
    - Add "Save to Blockchain" button to ResultScreen component
    - Show button only when wallet is connected
    - Disable button while transaction is pending
    - Update UI after successful save
    - _Requirements: 18.1, 21.1_

- [x] 33. Implement paymaster integration
  - [x] 33.1 Configure paymaster in OnchainKitProvider
    - Add paymaster URL from Coinbase Developer Platform
    - Configure gas sponsorship policy
    - Set up for Base Sepolia and Base Mainnet
    - _Requirements: 17.1, 17.2_

  - [x] 33.2 Test gas sponsorship
    - Verify transactions are sponsored (user pays no gas)
    - Test fallback to user-paid gas when sponsorship fails
    - Display clear notification on fallback
    - Log sponsorship failures for debugging
    - _Requirements: 17.1, 17.3, 17.4_

  - [x] 33.3 Write unit tests for paymaster integration
    - Test sponsored transactions succeed
    - Test fallback to user-paid gas
    - Test error notifications

- [x] 34. Implement error handling and fallback modes
  - [x] 34.1 Create error handling utilities
    - Implement parseTransactionError function
    - Implement formatErrorMessage function for user-friendly messages
    - Implement exponential backoff for RPC retries
    - _Requirements: 26.1, 26.2, 26.3, 26.4_

  - [x] 34.2 Implement fallback mode detection
    - Detect when blockchain is unavailable
    - Switch to LocalStorage-only mode
    - Display notification about offline mode
    - Retry connection in background
    - Resume blockchain features when available
    - _Requirements: 22.1, 22.2, 22.4, 22.5_

  - [x] 34.3 Write property test for fallback mode resilience
    - **Property 25: Fallback Mode Resilience**
    - Generate random blockchain errors
    - Verify app continues functioning
    - **Validates: Requirements 22.3, 22.6**
    - **Feature: memory-match-base, Property 25: Fallback Mode Resilience**

  - [x] 34.4 Write property test for transaction backup on failure
    - **Property 26: Transaction Backup on Failure**
    - Generate random transaction failures
    - Verify LocalStorage backup occurs
    - **Validates: Requirements 22.3**
    - **Feature: memory-match-base, Property 26: Transaction Backup on Failure**

  - [x] 34.5 Add error boundaries
    - Wrap app in React error boundary
    - Display friendly error message on crash
    - Log errors for debugging
    - Provide reset button
    - _Requirements: 27.4_

  - [x] 34.6 Write integration tests for error handling
    - Test wallet connection rejection
    - Test transaction rejection
    - Test RPC unavailability
    - Test network mismatch
    - Test fallback to LocalStorage mode
    - _Requirements: 26.1, 26.2, 26.3_

- [x] 35. Checkpoint - Verify core blockchain features
  - Test wallet connection and disconnection
  - Test progress saving to blockchain
  - Test progress syncing from blockchain
  - Test fallback mode when blockchain unavailable
  - Test gas sponsorship
  - Ensure all tests pass, ask the user if questions arise

- [ ] 36. Implement leaderboard feature
  - [ ] 36.1 Add leaderboard query functions to smart contract
    - Implement getTopPlayers function (returns top N players by total stars)
    - Implement getPlayerRank function (returns player's rank)
    - Optimize for gas efficiency
    - _Requirements: 23.1_

  - [ ] 36.2 Create useLeaderboard hook
    - Fetch top players from contract
    - Resolve Basenames for each player
    - Cache leaderboard data for 1 minute
    - Return leaderboard entries with rank, address, basename, stars
    - _Requirements: 23.2, 23.3, 23.7_

  - [ ] 36.3 Create Leaderboard component
    - Display top 10 players in a table
    - Show rank, Basename/address, total stars, levels completed
    - Highlight current player if in top 10
    - Add filter for time period (all-time, weekly, daily)
    - Make responsive for mobile
    - _Requirements: 23.2, 23.3, 23.4, 23.5, 23.6_

  - [ ] 36.4 Add leaderboard navigation
    - Add "Leaderboard" button to main menu
    - Create leaderboard screen route
    - Add back button to return to game
    - _Requirements: 23.2_

  - [ ] 36.5 Write unit tests for leaderboard
    - Test leaderboard fetches data correctly
    - Test Basename resolution for players
    - Test ranking display
    - Test filtering by time period

- [ ] 37. Implement Farcaster social integration
  - [ ] 37.1 Create Farcaster Frame metadata
    - Add Frame meta tags to HTML head
    - Configure frame image, buttons, and actions
    - Set up deep link back to game
    - _Requirements: 24.3, 24.4_

  - [ ] 37.2 Create frame image generation endpoint
    - Generate dynamic image showing level completion
    - Include player Basename and stats
    - Add BASE branding
    - Include call-to-action
    - _Requirements: 24.3_

  - [ ] 37.3 Create ShareOnFarcaster component
    - Add "Share on Farcaster" button to ResultScreen
    - Generate shareable message with level, stars, and Basename
    - Create Frame with completion image
    - Display preview before sharing
    - Handle sharing errors gracefully
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_

  - [ ] 37.4 Write unit tests for Farcaster integration
    - Test Frame metadata generation
    - Test share message formatting
    - Test Frame image generation
    - Test error handling

- [ ] 38. Implement achievement NFTs (optional)
  - [ ] 38.1 Create AchievementNFT smart contract (ERC-1155)
    - Implement NFT minting for milestones (levels 25, 50, 75, 100)
    - Add metadata URIs for each achievement
    - Implement access control (only game contract can mint)
    - Add view functions to check owned NFTs
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.6_

  - [ ] 38.2 Deploy AchievementNFT contract
    - Deploy to Base Sepolia for testing
    - Deploy to Base Mainnet for production
    - Verify contracts on Basescan
    - Update environment variables
    - _Requirements: 25.6_

  - [ ] 38.3 Create useMintAchievement hook
    - Use wagmi's useWriteContract for NFT minting
    - Trigger minting on milestone completion
    - Use paymaster for gas sponsorship
    - Handle minting errors gracefully
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.7_

  - [ ] 38.4 Create TrophyCase component
    - Display owned achievement NFTs
    - Show NFT images and descriptions
    - Add "locked" state for unearned achievements
    - Make responsive for mobile
    - _Requirements: 25.5_

  - [ ] 38.5 Integrate achievement minting into game flow
    - Check for milestone completion after each level
    - Trigger NFT minting automatically
    - Display minting success notification
    - Add "View Trophy Case" button to main menu
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

  - [ ] 38.6 Write unit tests for achievement NFTs
    - Test NFT minting at milestones
    - Test NFT ownership queries
    - Test trophy case display
    - Test gas sponsorship for minting

- [x] 39. Implement security best practices
  - [x] 39.1 Add input validation
    - Validate all inputs before sending to smart contract
    - Sanitize user inputs before display
    - Implement rate limiting for RPC calls
    - _Requirements: 27.2, 27.5, 27.8_

  - [x] 39.2 Add security headers
    - Configure Content Security Policy
    - Add X-Frame-Options header
    - Add X-Content-Type-Options header
    - Test security headers with online tools
    - _Requirements: 27.7_

  - [x] 39.3 Audit smart contracts
    - Review contracts for common vulnerabilities
    - Test access control thoroughly
    - Verify no reentrancy issues
    - Check for integer overflow/underflow
    - _Requirements: 27.6_

  - [x] 39.4 Write security tests
    - Test input validation rejects invalid data
    - Test access control prevents unauthorized access
    - Test rate limiting works correctly
    - Test error boundaries catch crashes

- [x] 40. Final integration and polish
  - [x] 40.1 Test complete blockchain flow end-to-end
    - Connect wallet → complete level → save to blockchain → verify on-chain
    - Disconnect wallet → complete level → save to LocalStorage
    - Reconnect wallet → verify sync from blockchain
    - Switch wallets → verify progress updates
    - Test on Base Sepolia and Base Mainnet
    - _Requirements: All_

  - [x] 40.2 Optimize performance
    - Implement caching for Basename resolutions
    - Batch progress updates when possible
    - Use optimistic UI updates
    - Minimize RPC calls
    - Test performance on mobile devices
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7_

  - [x] 40.3 Add loading states and animations
    - Add skeleton loaders for blockchain data
    - Add transaction pending animations
    - Add success/error animations
    - Ensure smooth transitions
    - _Requirements: 21.1, 21.2, 21.3_

  - [x] 40.4 Test error scenarios comprehensively
    - Test wallet connection rejection
    - Test transaction rejection
    - Test RPC unavailability
    - Test network mismatch
    - Test contract call failures
    - Test paymaster failures
    - Verify graceful degradation in all cases
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_

- [x] 41. Final checkpoint - Complete testing and deployment
  - Run full test suite (unit, property, integration)
  - Verify all 26 correctness properties pass (12 game + 14 blockchain)
  - Test on multiple browsers and devices
  - Test on both Base Sepolia and Base Mainnet
  - Verify gas sponsorship works correctly
  - Test leaderboard and social features
  - Verify Base Mini App compliance
  - Build production bundle
  - Deploy to production
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions
- **12 game correctness properties** (Properties 1-12) from the original design
- **14 blockchain correctness properties** (Properties 13-26) for blockchain integration
- **Total: 26 correctness properties** covering all functionality
- Sound effects (task 20) and achievement NFTs (task 38) are optional features
- The implementation follows React best practices with hooks and functional components
- TypeScript provides type safety throughout the application
- Tailwind CSS enables rapid styling with utility classes
- **Blockchain features are progressive enhancements** that never block gameplay
- **Full backward compatibility** maintained with LocalStorage-based game
- **Graceful fallback** to offline mode when blockchain unavailable
