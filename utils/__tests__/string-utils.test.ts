/**
 * Auto-generated test file for string-utils
 * Source: utils/string-utils.ts
 * Framework: Jest
 */

import { describe, it, expect } from '@jest/globals';
import { reverseString, capitalizeWords, truncate } from '../string-utils';

describe('string-utils', () => {
  describe('reverseString', () => {
    it('should reverse a string', () => {
      expect(reverseString('hello')).toBe('olleh');
      expect(reverseString('typescript')).toBe('tpircsetyp');
    });

    it('should handle empty string', () => {
      expect(reverseString('')).toBe('');
    });

    it('should handle single character', () => {
      expect(reverseString('a')).toBe('a');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('typescript jest')).toBe('TypeScript Jest');
    });

    it('should handle single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalizeWords('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate string exceeding length', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
      expect(truncate('typescript', 4)).toBe('type...');
    });

    it('should not truncate string within length', () => {
      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hi', 5)).toBe('hi');
    });

    it('should handle exact length match', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });
});