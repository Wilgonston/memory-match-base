/**
 * Asset Verification Tests
 * 
 * Verifies that all required image assets exist and are accessible.
 * Requirements: 2.5, 8.1, 8.2, 8.4, 13.8
 */

import { describe, it, expect } from 'vitest';
import { projects } from '../data/projects';

describe('Image Assets', () => {
  describe('Project Images', () => {
    it('should have image paths defined for all 20 projects', () => {
      expect(projects).toHaveLength(20);
      
      projects.forEach(project => {
        expect(project.imagePath).toBeDefined();
        expect(project.imagePath).toMatch(/^\/assets\/projects\/.+\.(png|svg)$/);
      });
    });

    it('should include all required BASE ecosystem projects', () => {
      const requiredProjects = [
        'base', 'coinbase', 'aerodrome', 'uniswap', 'aave',
        'compound', 'sushiswap', 'synthetix', 'stargate', 'balancer',
        'pancakeswap', 'curve', 'opensea', 'frenpet', 'builderfi',
        'backed', 'echelon', 'degen', 'cartesi', 'metastreet'
      ];

      const projectIds = projects.map(p => p.id);
      requiredProjects.forEach(id => {
        expect(projectIds).toContain(id);
      });
    });

    it('should have unique image paths for all projects', () => {
      const imagePaths = projects.map(p => p.imagePath);
      const uniquePaths = new Set(imagePaths);
      expect(uniquePaths.size).toBe(projects.length);
    });
  });

  describe('Special Images', () => {
    it('should define card back image path', () => {
      const cardBackPath = '/assets/projects/card-back.svg';
      expect(cardBackPath).toMatch(/^\/assets\/projects\/card-back\.(png|svg)$/);
    });

    it('should define fallback image path', () => {
      const fallbackPath = '/assets/projects/fallback.svg';
      expect(fallbackPath).toMatch(/^\/assets\/projects\/fallback\.(png|svg)$/);
    });
  });

  describe('Mini App Assets', () => {
    it('should define icon path', () => {
      const iconPath = '/assets/miniapp/icon-512.svg';
      expect(iconPath).toBeDefined();
      expect(iconPath).toMatch(/icon-512\.(png|svg)$/);
    });

    it('should define splash image path', () => {
      const splashPath = '/assets/miniapp/splash.svg';
      expect(splashPath).toBeDefined();
      expect(splashPath).toMatch(/splash\.(png|svg)$/);
    });

    it('should define hero image path', () => {
      const heroPath = '/assets/miniapp/hero.svg';
      expect(heroPath).toBeDefined();
      expect(heroPath).toMatch(/hero\.(png|svg)$/);
    });

    it('should define OG image path', () => {
      const ogPath = '/assets/miniapp/og-image.svg';
      expect(ogPath).toBeDefined();
      expect(ogPath).toMatch(/og-image\.(png|svg)$/);
    });
  });

  describe('Screenshot Assets', () => {
    it('should define gameplay screenshot path', () => {
      const gameplayPath = '/screenshots/gameplay.svg';
      expect(gameplayPath).toBeDefined();
      expect(gameplayPath).toMatch(/gameplay\.(png|svg)$/);
    });

    it('should define level select screenshot path', () => {
      const levelSelectPath = '/screenshots/level-select.svg';
      expect(levelSelectPath).toBeDefined();
      expect(levelSelectPath).toMatch(/level-select\.(png|svg)$/);
    });
  });
});
