# Base Compliance and Improvements - Tasks

## Task Status Legend
- `[ ]` Not started
- `[~]` Queued
- `[-]` In progress
- `[x]` Completed
- `[ ]*` Optional task

## 1. OnchainKit Provider Configuration

### 1.1 Fix Wallet Connector Configuration
- [ ] 1.1.1 Update `src/config/wagmi.ts` to show all wallet options
- [ ] 1.1.2 Change coinbaseWallet preference from 'smartWalletOnly' to 'all'
- [ ] 1.1.3 Test that multiple wallet options appear in connection modal
- [ ] 1.1.4 Verify Coinbase Wallet, MetaMask, and WalletConnect all work

**Details:**
- Current issue: Only Coinbase Wallet shows up due to 'smartWalletOnly' preference
- Need to allow users to choose between different wallets
- Keep Smart Wallet as default but allow other options
- Ensure all connectors are properly configured

**Acceptance Criteria:**
- Multiple wallet options visible in connection modal
- User can choose between Coinbase Wallet, MetaMask, WalletConnect
- All wallet types can connect successfully
- Smart Wallet is still prioritized but not exclusive

### 1.2 Update OnchainKitProvider Configuration
- [ ] 1.2.1 Update `src/config/onchainkit.ts` with proper wallet modal configuration
- [ ] 1.2.2 Add appearance configuration with Base theme
- [ ] 1.2.3 Add terms and privacy URLs
- [ ] 1.2.4 Update `src/main.tsx` to use new configuration
- [ ] 1.2.5 Test provider configuration loads correctly

**Details:**
- Configure wallet display mode as 'modal'
- Set theme to 'base' for consistent branding
- Add proper app name and logo
- Ensure all required fields are present

**Acceptance Criteria:**
- Provider initializes without errors
- Wallet modal configuration is applied
- Base theme is visible in UI
- Terms and privacy links work

## 2. Wallet Component Replacement

### 2.1 Create New Wallet Components File
- [ ] 2.1.1 Create `src/components/WalletComponents.tsx`
- [ ] 2.1.2 Import OnchainKit wallet components
- [ ] 2.1.3 Implement `<Wallet>` wrapper component
- [ ] 2.1.4 Implement `<ConnectWallet>` button with Avatar and Name
- [ ] 2.1.5 Implement `<WalletDropdown>` with Identity components
- [ ] 2.1.6 Add `<WalletDropdownDisconnect>` button
- [ ] 2.1.7 Export WalletComponents

**Details:**
- Use OnchainKit's Wallet, ConnectWallet, WalletDropdown components
- Include Identity, Avatar, Name, Address, EthBalance in dropdown
- Add hasCopyAddressOnClick to Address component
- Style with OnchainKit theme colors

**Acceptance Criteria:**
- Wallet button displays when disconnected
- Wallet dropdown displays when connected
- Identity shows Basename or address
- Copy address functionality works
- Disconnect button works

### 2.2 Replace WalletButton Usage
- [ ] 2.2.1 Update `src/components/LoginScreen.tsx` to use WalletComponents
- [ ] 2.2.2 Update `src/components/Header.tsx` to use WalletComponents (if exists)
- [ ] 2.2.3 Remove old `src/components/WalletButton.tsx` file
- [ ] 2.2.4 Remove old `src/components/WalletButton.css` file
- [ ] 2.2.5 Update all imports throughout codebase
- [ ] 2.2.6 Test wallet connection in all screens

**Details:**
- Replace all instances of WalletButton with WalletComponents
- Ensure styling is consistent
- Test in LoginScreen, Header, and other locations
- Verify no broken imports remain

**Acceptance Criteria:**
- No references to old WalletButton remain
- Wallet works in all screens
- No console errors
- Styling is consistent

## 3. Identity Display Component

### 3.1 Create IdentityDisplay Component
- [ ] 3.1.1 Create `src/components/IdentityDisplay.tsx`
- [ ] 3.1.2 Import OnchainKit identity components
- [ ] 3.1.3 Implement IdentityDisplay with props interface
- [ ] 3.1.4 Add Avatar component
- [ ] 3.1.5 Add Name component with Badge
- [ ] 3.1.6 Add Address component (conditional)
- [ ] 3.1.7 Add proper TypeScript types
- [ ] 3.1.8 Export component

**Details:**
- Accept address, className, showBadge, showAddress props
- Use OnchainKit's Identity, Avatar, Name, Address, Badge
- Handle case when no address provided
- Support both connected and external addresses

**Acceptance Criteria:**
- Component renders with address
- Basename displays if available
- Avatar displays correctly
- Badge shows verification status
- Address is optional

### 3.2 Add IdentityDisplay Tests
- [ ] 3.2.1 Create `src/components/IdentityDisplay.test.tsx`
- [ ] 3.2.2 Test rendering with address
- [ ] 3.2.3 Test rendering without address
- [ ] 3.2.4 Test with Basename
- [ ] 3.2.5 Test without Basename
- [ ] 3.2.6 Test showBadge prop
- [ ] 3.2.7 Test showAddress prop
- [ ] 3.2.8 Ensure all tests pass

**Details:**
- Use testing-library for component tests
- Mock OnchainKit components
- Test all prop combinations
- Verify correct rendering

**Acceptance Criteria:**
- All tests pass
- Coverage > 90%
- Edge cases handled
- No console warnings

### 3.3 Add IdentityDisplay Property Tests
- [ ] 3.3.1 Create `src/components/IdentityDisplay.property.test.tsx`
- [ ] 3.3.2 Write property: Component must render with valid address
- [ ] 3.3.3 Write property: Component must handle null address
- [ ] 3.3.4 Write property: Component must display Basename or address
- [ ] 3.3.5 Run property tests and verify they pass

**Details:**
- Use fast-check for property-based testing
- Generate random valid addresses
- Test invariants across many inputs
- Verify properties hold

**Acceptance Criteria:**
- Property tests pass
- Properties are well-defined
- Edge cases discovered and handled

## 4. Paymaster Integration Fix

### 4.1 Fix Paymaster URL Configuration
- [ ] 4.1.1 Update `src/config/onchainkit.ts` Paymaster URL format
- [ ] 4.1.2 Remove old VITE_PAYMASTER_URL from .env.example
- [ ] 4.1.3 Test Paymaster URL is correctly formatted

**Details:**
- Use format: `https://api.developer.coinbase.com/rpc/v1/base/{API_KEY}`
- Remove redundant environment variables
- Ensure API key is properly interpolated
- Add validation for API key format

**Acceptance Criteria:**
- Paymaster URL follows ERC-7677 standard
- URL is correctly formatted
- API key is properly included
- No redundant configuration

### 4.2 Update SaveProgressButton with Proper Paymaster
- [ ] 4.2.1 Update `src/components/SaveProgressButton.tsx`
- [ ] 4.2.2 Import useCapabilities from wagmi/experimental
- [ ] 4.2.3 Implement proper capabilities check
- [ ] 4.2.4 Configure paymasterService in capabilities
- [ ] 4.2.5 Update writeContracts call with capabilities
- [ ] 4.2.6 Add hasPaymaster indicator in UI
- [ ] 4.2.7 Update error handling for Paymaster failures
- [ ] 4.2.8 Test gas-free transactions

**Details:**
- Check for paymasterService capability
- Configure with correct Paymaster URL
- Show "Gas-free" indicator when Paymaster available
- Handle case when Paymaster unavailable
- Provide clear error messages

**Acceptance Criteria:**
- Paymaster capabilities are checked
- Gas-free transactions work
- UI shows gas-free indicator
- Fallback works when Paymaster unavailable
- Error messages are clear

### 4.3 Update Batch Update with Paymaster
- [ ] 4.3.1 Update `src/hooks/useBatchUpdateLevels.ts`
- [ ] 4.3.2 Add useCapabilities hook
- [ ] 4.3.3 Configure paymasterService capabilities
- [ ] 4.3.4 Update writeContracts call
- [ ] 4.3.5 Add validation for input arrays
- [ ] 4.3.6 Add progress indication
- [ ] 4.3.7 Test batch updates with Paymaster

**Details:**
- Validate levels and stars arrays have same length
- Validate arrays are not empty
- Use Paymaster if available
- Show progress during batch update
- Handle errors gracefully

**Acceptance Criteria:**
- Batch updates work with Paymaster
- Input validation prevents errors
- Progress is indicated
- Errors are handled
- Tests pass

### 4.4 Add Paymaster Tests
- [ ] 4.4.1 Update `src/components/SaveProgressButton.test.tsx`
- [ ] 4.4.2 Test capabilities check
- [ ] 4.4.3 Test transaction with Paymaster
- [ ] 4.4.4 Test transaction without Paymaster
- [ ] 4.4.5 Test error handling
- [ ] 4.4.6 Ensure all tests pass

**Details:**
- Mock useCapabilities hook
- Test both Paymaster available and unavailable
- Test error scenarios
- Verify UI updates correctly

**Acceptance Criteria:**
- All tests pass
- Both scenarios tested
- Error handling verified
- UI behavior correct

## 5. Basename Integration

### 5.1 Create useBasename Hook
- [ ] 5.1.1 Create `src/hooks/useBasename.ts`
- [ ] 5.1.2 Import useQuery from react-query
- [ ] 5.1.3 Import usePublicClient from wagmi
- [ ] 5.1.4 Implement Basename lookup logic
- [ ] 5.1.5 Add caching configuration (5 min stale, 10 min gc)
- [ ] 5.1.6 Add error handling
- [ ] 5.1.7 Export hook

**Details:**
- Use publicClient.getEnsName for reverse lookup
- Cache results for 5 minutes
- Return null if no Basename
- Handle errors gracefully
- Only query when address provided

**Acceptance Criteria:**
- Hook returns Basename or null
- Caching works correctly
- Errors are handled
- Performance is good

### 5.2 Add useBasename Tests
- [ ] 5.2.1 Create `src/hooks/useBasename.test.ts`
- [ ] 5.2.2 Test with valid address that has Basename
- [ ] 5.2.3 Test with valid address without Basename
- [ ] 5.2.4 Test with invalid address
- [ ] 5.2.5 Test caching behavior
- [ ] 5.2.6 Test error handling
- [ ] 5.2.7 Ensure all tests pass

**Details:**
- Mock publicClient
- Test all scenarios
- Verify caching
- Check error handling

**Acceptance Criteria:**
- All tests pass
- All scenarios covered
- Caching verified
- Errors handled

### 5.3 Add useBasename Property Tests
- [ ] 5.3.1 Create `src/hooks/useBasename.property.test.tsx`
- [ ] 5.3.2 Write property: Hook must return string or null
- [ ] 5.3.3 Write property: Hook must cache results
- [ ] 5.3.4 Write property: Hook must handle errors gracefully
- [ ] 5.3.5 Run property tests and verify they pass

**Details:**
- Use fast-check for property testing
- Generate random addresses
- Test invariants
- Verify properties hold

**Acceptance Criteria:**
- Property tests pass
- Properties well-defined
- Edge cases handled

### 5.4 Integrate Basename in Identity Components
- [ ] 5.4.1 Verify OnchainKit's Name component handles Basename automatically
- [ ] 5.4.2 Verify Basename displays in WalletDropdown
- [ ] 5.4.3 Verify Basename displays in Header
- [ ] 5.4.4 Test with addresses that have Basenames
- [ ] 5.4.5 Test with addresses without Basenames

**Details:**
- OnchainKit's Name component automatically resolves Basenames
- Verify it works in all locations
- Test both scenarios
- Ensure fallback to address works

**Acceptance Criteria:**
- Basename displays when available
- Address displays when no Basename
- Works in all components
- No errors

## 6. Mini App Manifest Configuration

### 6.1 Create Farcaster Manifest
- [ ] 6.1.1 Create `public/.well-known/farcaster.json`
- [ ] 6.1.2 Add miniapp configuration
- [ ] 6.1.3 Add all required metadata fields
- [ ] 6.1.4 Add screenshot URLs
- [ ] 6.1.5 Add icon and splash URLs
- [ ] 6.1.6 Validate JSON structure

**Details:**
- Follow Mini App manifest specification
- Include all required fields
- Use absolute URLs
- Ensure all assets exist
- Set proper categories and tags

**Acceptance Criteria:**
- Manifest is valid JSON
- All required fields present
- All URLs are absolute
- All assets exist

### 6.2 Add Account Association (Optional)
- [ ]* 6.2.1 Generate account association signature
- [ ]* 6.2.2 Add accountAssociation to manifest
- [ ]* 6.2.3 Validate account association
- [ ]* 6.2.4 Test in Farcaster client

**Details:**
- Follow Farcaster account association spec
- Generate proper signature
- Add to manifest
- Test in actual Farcaster client

**Acceptance Criteria:**
- Account association is valid
- Signature verifies
- Works in Farcaster client

### 6.3 Update minikit.config.ts
- [ ] 6.3.1 Update `minikit.config.ts` with production URLs
- [ ] 6.3.2 Ensure consistency with farcaster.json
- [ ] 6.3.3 Add webhook URL configuration
- [ ] 6.3.4 Validate configuration

**Details:**
- Use production domain
- Match farcaster.json configuration
- Add webhook URL
- Ensure all URLs are correct

**Acceptance Criteria:**
- Configuration is complete
- URLs are correct
- Consistent with manifest
- No errors

## 7. Testing and Validation

### 7.1 Run All Tests
- [ ] 7.1.1 Run `npm test` and ensure all tests pass
- [ ] 7.1.2 Fix any failing tests
- [ ] 7.1.3 Run property tests
- [ ] 7.1.4 Verify test coverage > 90%

**Details:**
- All 502+ tests must pass
- Property tests must pass
- Coverage should be high
- No console errors

**Acceptance Criteria:**
- All tests pass
- Property tests pass
- Coverage > 90%
- No errors

### 7.2 Manual Testing
- [ ] 7.2.1 Test wallet connection flow
- [ ] 7.2.2 Test wallet disconnection
- [ ] 7.2.3 Test Basename display
- [ ] 7.2.4 Test gas-free transactions
- [ ] 7.2.5 Test batch updates
- [ ] 7.2.6 Test in different browsers
- [ ] 7.2.7 Test on mobile devices

**Details:**
- Test all major features
- Test in Chrome, Firefox, Safari
- Test on iOS and Android
- Verify all functionality works

**Acceptance Criteria:**
- All features work
- No console errors
- Works in all browsers
- Mobile responsive

### 7.3 Integration Testing
- [ ] 7.3.1 Test complete game flow
- [ ] 7.3.2 Test progress saving
- [ ] 7.3.3 Test progress loading
- [ ] 7.3.4 Test level completion
- [ ] 7.3.5 Test star calculation
- [ ] 7.3.6 Verify blockchain sync

**Details:**
- Play through multiple levels
- Verify progress saves
- Verify progress loads
- Check star calculations
- Confirm blockchain updates

**Acceptance Criteria:**
- Complete flow works
- Progress persists
- Stars calculated correctly
- Blockchain syncs

## 8. Performance Optimization

### 8.1 Optimize Bundle Size
- [ ] 8.1.1 Analyze bundle size with `npm run build`
- [ ] 8.1.2 Identify large dependencies
- [ ] 8.1.3 Implement code splitting if needed
- [ ] 8.1.4 Optimize images
- [ ] 8.1.5 Verify bundle size < 500KB

**Details:**
- Check build output
- Look for optimization opportunities
- Use dynamic imports if beneficial
- Compress images
- Aim for small bundle

**Acceptance Criteria:**
- Bundle size reasonable
- No unnecessary dependencies
- Images optimized
- Load time < 2s

### 8.2 Optimize Caching
- [ ] 8.2.1 Verify Basename caching works
- [ ] 8.2.2 Verify contract read caching works
- [ ] 8.2.3 Verify wallet capabilities caching works
- [ ] 8.2.4 Adjust cache times if needed

**Details:**
- Check React Query cache
- Verify cache TTLs
- Monitor cache hit rates
- Optimize as needed

**Acceptance Criteria:**
- Caching works correctly
- Cache TTLs appropriate
- Performance improved
- No stale data

## 9. Deployment

### 9.1 Prepare for Deployment
- [ ] 9.1.1 Update version in package.json
- [ ] 9.1.2 Create production build
- [ ] 9.1.3 Test production build locally
- [ ] 9.1.4 Verify all environment variables set

**Details:**
- Bump version number
- Build for production
- Test build
- Check env vars

**Acceptance Criteria:**
- Version updated
- Build succeeds
- Build works locally
- Env vars ready

### 9.2 Deploy to Vercel
- [ ] 9.2.1 Push code to GitHub
- [ ] 9.2.2 Configure Vercel project
- [ ] 9.2.3 Set environment variables in Vercel
- [ ] 9.2.4 Deploy to production
- [ ] 9.2.5 Verify deployment successful

**Details:**
- Push to main branch
- Configure Vercel settings
- Add all env vars
- Deploy
- Check deployment

**Acceptance Criteria:**
- Code pushed
- Vercel configured
- Env vars set
- Deployment successful
- Site accessible

### 9.3 Post-Deployment Verification
- [ ] 9.3.1 Test wallet connection on production
- [ ] 9.3.2 Test gas-free transactions on production
- [ ] 9.3.3 Test Basename resolution on production
- [ ] 9.3.4 Test Mini App in Farcaster client
- [ ] 9.3.5 Monitor for errors

**Details:**
- Test all major features
- Verify Paymaster works
- Check Basename resolution
- Test in Farcaster
- Monitor logs

**Acceptance Criteria:**
- All features work
- No errors
- Paymaster works
- Mini App works
- Monitoring active

## 10. Git and Version Control

### 10.1 Commit Changes
- [ ] 10.1.1 Stage all changes
- [ ] 10.1.2 Commit with descriptive message
- [ ] 10.1.3 Push to GitHub
- [ ] 10.1.4 Create pull request if needed
- [ ] 10.1.5 Merge to main branch

**Details:**
- Use conventional commits
- Write clear commit messages
- Push to remote
- Create PR for review
- Merge when approved

**Acceptance Criteria:**
- Changes committed
- Messages clear
- Code pushed
- PR created/merged
- Main branch updated

### 10.2 Tag Release
- [ ] 10.2.1 Create git tag for version
- [ ] 10.2.2 Push tag to GitHub
- [ ] 10.2.3 Create GitHub release
- [ ] 10.2.4 Add release notes

**Details:**
- Tag with version number
- Push tag
- Create release on GitHub
- Document changes

**Acceptance Criteria:**
- Tag created
- Tag pushed
- Release created
- Notes complete

## Task Summary

**Total Tasks:** 10 major sections, 90+ individual tasks
**Estimated Time:** 2-3 days for full implementation
**Priority Order:**
1. OnchainKit Provider Configuration (Critical)
2. Wallet Component Replacement (Critical)
3. Paymaster Integration Fix (Critical)
4. Identity Display Component (High)
5. Basename Integration (High)
6. Mini App Manifest (Medium)
7. Testing and Validation (High)
8. Performance Optimization (Low)
9. Deployment (Critical)
10. Git and Version Control (Critical)

**Dependencies:**
- Tasks 1-3 must be completed first (foundation)
- Tasks 4-5 depend on tasks 1-3
- Task 6 can be done in parallel
- Task 7 must be done before deployment
- Tasks 8-10 are final steps

**Success Criteria:**
- All critical and high priority tasks completed
- All tests passing (502+)
- Paymaster working for gas-free transactions
- OnchainKit components properly integrated
- Successfully deployed to production
- No critical bugs or errors
