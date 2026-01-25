# BASE Projects Data

This directory contains the data for all BASE ecosystem projects used in the Memory Match game.

## Files

- `projects.ts` - Main data file containing all 20 BASE ecosystem projects
- `projects.test.ts` - Unit tests for the projects data

## Usage

### Import the projects data

```typescript
import { projects, getRandomProjects, getProjectById } from './data/projects';
```

### Get all projects

```typescript
// Get all 20 projects
const allProjects = projects;
console.log(`Total projects: ${allProjects.length}`);
```

### Get random projects

```typescript
// Get 8 random projects for a 4x4 grid
const randomProjects = getRandomProjects(8);
```

### Get a specific project by ID

```typescript
// Get the BASE project
const baseProject = getProjectById('base');
console.log(baseProject?.name); // "BASE"
```

### Use with card generator

```typescript
import { generateCards } from '../utils/cardGenerator';
import { projects } from '../data/projects';

// Generate cards for a 4x4 grid using all available projects
const cards = generateCards(4, projects);
```

## Project List

The following 20 BASE ecosystem projects are included:

1. BASE - The BASE blockchain
2. Coinbase - Cryptocurrency exchange
3. Aerodrome Finance - DEX on BASE
4. Uniswap - Decentralized exchange
5. Aave V3 - Lending protocol
6. Compound V3 - Lending protocol
7. SushiSwap - DEX and DeFi platform
8. Synthetix - Synthetic assets protocol
9. Stargate - Cross-chain bridge
10. Balancer V2 - Automated portfolio manager
11. PancakeSwap - DEX
12. Curve DEX - Stablecoin exchange
13. OpenSea - NFT marketplace
14. FrenPet - BASE gaming project
15. BuilderFi - DeFi platform
16. Backed Finance - Tokenized securities
17. Echelon Prime - Gaming ecosystem
18. Degen Chain - Meme coin ecosystem
19. Cartesi - Application-specific rollups
20. MetaStreet - NFT liquidity protocol

## Image Assets

Images for these projects should be placed in `/public/assets/projects/` with the following naming convention:

- `/public/assets/projects/base.png`
- `/public/assets/projects/coinbase.png`
- `/public/assets/projects/aerodrome.png`
- etc.

All images should be:
- Format: PNG or SVG
- Size: 200x200px
- Optimized for web
- Transparent background (recommended)

## Requirements

This data file satisfies the following requirements:

- **Requirement 8.1**: Use images from a predefined set of BASE ecosystem projects
- **Requirement 8.2**: Include at least 20 unique project images
