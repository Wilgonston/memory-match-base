/**
 * BASE Ecosystem Project Images
 * 
 * This file contains the data for all BASE ecosystem projects used in the Memory Match game.
 * Images are stored in /public/assets/projects/ directory.
 * 
 * Requirements: 8.1, 8.2
 */

import { ProjectImage } from '../types/game';

/**
 * Array of all BASE ecosystem project images
 * Includes 20 unique projects from the BASE blockchain ecosystem
 */
export const projects: ProjectImage[] = [
  {
    id: 'base',
    name: 'BASE',
    imagePath: '/assets/projects/base.svg',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    imagePath: '/assets/projects/coinbase.svg',
  },
  {
    id: 'aerodrome',
    name: 'Aerodrome Finance',
    imagePath: '/assets/projects/aerodrome.svg',
  },
  {
    id: 'uniswap',
    name: 'Uniswap',
    imagePath: '/assets/projects/uniswap.svg',
  },
  {
    id: 'aave',
    name: 'Aave V3',
    imagePath: '/assets/projects/aave.svg',
  },
  {
    id: 'compound',
    name: 'Compound V3',
    imagePath: '/assets/projects/compound.svg',
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    imagePath: '/assets/projects/sushiswap.svg',
  },
  {
    id: 'synthetix',
    name: 'Synthetix',
    imagePath: '/assets/projects/synthetix.svg',
  },
  {
    id: 'stargate',
    name: 'Stargate',
    imagePath: '/assets/projects/stargate.svg',
  },
  {
    id: 'balancer',
    name: 'Balancer V2',
    imagePath: '/assets/projects/balancer.svg',
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    imagePath: '/assets/projects/pancakeswap.svg',
  },
  {
    id: 'curve',
    name: 'Curve DEX',
    imagePath: '/assets/projects/curve.svg',
  },
  {
    id: 'opensea',
    name: 'OpenSea',
    imagePath: '/assets/projects/opensea.svg',
  },
  {
    id: 'frenpet',
    name: 'FrenPet',
    imagePath: '/assets/projects/frenpet.svg',
  },
  {
    id: 'builderfi',
    name: 'BuilderFi',
    imagePath: '/assets/projects/builderfi.svg',
  },
  {
    id: 'backed',
    name: 'Backed Finance',
    imagePath: '/assets/projects/backed.svg',
  },
  {
    id: 'echelon',
    name: 'Echelon Prime',
    imagePath: '/assets/projects/echelon.svg',
  },
  {
    id: 'degen',
    name: 'Degen Chain',
    imagePath: '/assets/projects/degen.svg',
  },
  {
    id: 'cartesi',
    name: 'Cartesi',
    imagePath: '/assets/projects/cartesi.svg',
  },
  {
    id: 'metastreet',
    name: 'MetaStreet',
    imagePath: '/assets/projects/metastreet.svg',
  },
];

/**
 * Get a random selection of project images
 * @param count Number of unique images to select
 * @returns Array of randomly selected ProjectImage objects
 */
export function getRandomProjects(count: number): ProjectImage[] {
  if (count > projects.length) {
    throw new Error(`Cannot select ${count} projects, only ${projects.length} available`);
  }
  
  // Create a copy and shuffle
  const shuffled = [...projects].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a project by ID
 * @param id Project ID
 * @returns ProjectImage object or undefined if not found
 */
export function getProjectById(id: string): ProjectImage | undefined {
  return projects.find(project => project.id === id);
}

/**
 * Total number of available projects
 */
export const TOTAL_PROJECTS = projects.length;
