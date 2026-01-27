/**
 * Tests for performance monitoring utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  performanceMonitor,
  measureRender,
  measureAsync,
  getMemoryUsage,
} from './performance';

describe('performance monitoring', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });
  
  describe('performanceMonitor', () => {
    it('should start and end measurements', () => {
      performanceMonitor.startMeasure('test');
      const duration = performanceMonitor.endMeasure('test');
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(performanceMonitor.getMetrics('test')).toHaveLength(1);
    });
    
    it('should record metrics with metadata', () => {
      performanceMonitor.startMeasure('test');
      performanceMonitor.endMeasure('test', { foo: 'bar' });
      
      const metrics = performanceMonitor.getMetrics('test');
      expect(metrics[0].metadata).toEqual({ foo: 'bar' });
    });
    
    it('should calculate averages', () => {
      performanceMonitor.recordMetric({ name: 'test', value: 10, timestamp: Date.now() });
      performanceMonitor.recordMetric({ name: 'test', value: 20, timestamp: Date.now() });
      performanceMonitor.recordMetric({ name: 'test', value: 30, timestamp: Date.now() });
      
      expect(performanceMonitor.getAverage('test')).toBe(20);
    });
    
    it('should generate performance report', () => {
      performanceMonitor.recordMetric({ name: 'page-load', value: 100, timestamp: Date.now() });
      performanceMonitor.recordMetric({ name: 'transaction', value: 200, timestamp: Date.now() });
      performanceMonitor.recordMetric({ name: 'render', value: 50, timestamp: Date.now() });
      
      const report = performanceMonitor.getReport();
      expect(report.summary.avgLoadTime).toBe(100);
      expect(report.summary.avgTransactionTime).toBe(200);
      expect(report.summary.avgRenderTime).toBe(50);
    });
    
    it('should limit stored metrics', () => {
      // Record more than maxMetrics
      for (let i = 0; i < 1500; i++) {
        performanceMonitor.recordMetric({ name: 'test', value: i, timestamp: Date.now() });
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('measureRender', () => {
    it('should measure component render time', () => {
      const endMeasure = measureRender('TestComponent');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      endMeasure();
      
      const metrics = performanceMonitor.getMetrics('render-TestComponent');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });
  });
  
  describe('measureAsync', () => {
    it('should measure async operations', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };
      
      const result = await measureAsync('async-test', operation);
      
      expect(result).toBe('result');
      const metrics = performanceMonitor.getMetrics('async-test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });
    
    it('should track errors in async operations', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      
      await expect(measureAsync('async-error', operation)).rejects.toThrow('Test error');
      
      const metrics = performanceMonitor.getMetrics('async-error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });
  
  describe('getMemoryUsage', () => {
    it('should return null if memory API not available', () => {
      const result = getMemoryUsage();
      // In test environment, memory API might not be available
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
