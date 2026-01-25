/**
 * Unit tests for BASE project images data
 */

import { describe, it, expect } from 'vitest';
import { projects, getRandomProjects, getProjectById, TOTAL_PROJECTS } from './projects';

describe('BASE Projects Data', () => {
  describe('projects array', () => {
    it('should contain exactly 20 projects', () => {
      expect(projects).toHaveLength(20);
      expect(TOTAL_PROJECTS).toBe(20);
    });

    it('should have all required properties for each project', () => {
      projects.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('imagePath');
        
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(typeof project.imagePath).toBe('string');
        
        expect(project.id.length).toBeGreaterThan(0);
        expect(project.name.length).toBeGreaterThan(0);
        expect(project.imagePath).toMatch(/^\/assets\/projects\/.+\.(png|svg)$/);
      });
    });

    it('should have unique IDs for all projects', () => {
      const ids = projects.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(projects.length);
    });

    it('should have unique names for all projects', () => {
      const names = projects.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(projects.length);
    });

    it('should include all required BASE ecosystem projects', () => {
      const requiredProjects = [
        'base',
        'coinbase',
        'aerodrome',
        'uniswap',
        'aave',
        'compound',
        'sushiswap',
        'synthetix',
        'stargate',
        'balancer',
        'pancakeswap',
        'curve',
        'opensea',
        'frenpet',
        'builderfi',
        'backed',
        'echelon',
        'degen',
        'cartesi',
        'metastreet',
      ];

      const projectIds = projects.map(p => p.id);
      requiredProjects.forEach(requiredId => {
        expect(projectIds).toContain(requiredId);
      });
    });
  });

  describe('getRandomProjects', () => {
    it('should return requested number of projects', () => {
      const result = getRandomProjects(5);
      expect(result).toHaveLength(5);
    });

    it('should return unique projects', () => {
      const result = getRandomProjects(10);
      const ids = result.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should throw error if requesting more projects than available', () => {
      expect(() => getRandomProjects(25)).toThrow();
    });

    it('should return all projects when requesting exactly 20', () => {
      const result = getRandomProjects(20);
      expect(result).toHaveLength(20);
    });

    it('should return different selections on multiple calls (probabilistic)', () => {
      const result1 = getRandomProjects(5);
      const result2 = getRandomProjects(5);
      
      // Convert to ID strings for comparison
      const ids1 = result1.map(p => p.id).sort().join(',');
      const ids2 = result2.map(p => p.id).sort().join(',');
      
      // With 5 out of 20, there's a very high probability they'll be different
      // This test might occasionally fail due to randomness, but it's very unlikely
      // If it fails consistently, there's a problem with the randomization
      expect(ids1).not.toBe(ids2);
    });
  });

  describe('getProjectById', () => {
    it('should return project when ID exists', () => {
      const project = getProjectById('base');
      expect(project).toBeDefined();
      expect(project?.id).toBe('base');
      expect(project?.name).toBe('BASE');
    });

    it('should return undefined when ID does not exist', () => {
      const project = getProjectById('nonexistent');
      expect(project).toBeUndefined();
    });

    it('should find all projects by their IDs', () => {
      projects.forEach(originalProject => {
        const foundProject = getProjectById(originalProject.id);
        expect(foundProject).toEqual(originalProject);
      });
    });
  });
});
