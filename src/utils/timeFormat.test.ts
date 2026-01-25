import { describe, it, expect } from 'vitest';
import { formatTime } from './timeFormat';

describe('formatTime', () => {
  it('should format 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 59 seconds as "00:59"', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('should format 60 seconds as "01:00"', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('should format 125 seconds as "02:05"', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('should format single digit seconds with leading zero', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });

  it('should format single digit minutes with leading zero', () => {
    expect(formatTime(120)).toBe('02:00');
    expect(formatTime(540)).toBe('09:00');
  });

  it('should handle minutes exceeding 59', () => {
    expect(formatTime(3661)).toBe('61:01');
    expect(formatTime(7200)).toBe('120:00');
  });

  it('should handle negative values by treating them as 0', () => {
    expect(formatTime(-1)).toBe('00:00');
    expect(formatTime(-100)).toBe('00:00');
  });

  it('should floor fractional seconds', () => {
    expect(formatTime(59.9)).toBe('00:59');
    expect(formatTime(60.5)).toBe('01:00');
    expect(formatTime(125.7)).toBe('02:05');
  });

  it('should handle edge case of exactly 1 minute', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('should handle typical game timer values', () => {
    // Level 1-25: 60 seconds
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(1)).toBe('00:01');
    
    // Level 26-60: 90 seconds
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(45)).toBe('00:45');
    
    // Level 61-100: 120 seconds
    expect(formatTime(120)).toBe('02:00');
    expect(formatTime(75)).toBe('01:15');
  });

  it('should handle large time values', () => {
    expect(formatTime(599)).toBe('09:59');
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });
});
