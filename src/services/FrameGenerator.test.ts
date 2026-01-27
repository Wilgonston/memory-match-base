/**
 * Unit Tests for FrameGenerator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FrameImageGenerator,
  generateLevelFrame,
  generateFrameMetaTags,
  addFrameMetaToHead,
  removeFrameMetaFromHead,
  generateShareUrl,
  type LevelCompletionFrame,
  type FrameMetadata,
} from './FrameGenerator';

describe('FrameImageGenerator', () => {
  let generator: FrameImageGenerator;

  beforeEach(() => {
    generator = new FrameImageGenerator();
  });

  describe('generateImage', () => {
    it('should generate SVG with level number', () => {
      const data: LevelCompletionFrame = {
        level: 5,
        stars: 3,
        moves: 20,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('Level 5 Complete!');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should generate correct star display for 3 stars', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 3,
        moves: 10,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('⭐⭐⭐');
    });

    it('should generate correct star display for 2 stars', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 2,
        moves: 15,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('⭐⭐☆');
    });

    it('should generate correct star display for 1 star', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 1,
        moves: 25,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('⭐☆☆');
    });

    it('should generate correct star display for 0 stars', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 0,
        moves: 50,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('☆☆☆');
    });

    it('should include moves count', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 3,
        moves: 42,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('42 moves');
    });

    it('should include username when provided', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 3,
        moves: 20,
        timestamp: Date.now(),
        username: 'alice.base.eth',
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('by alice.base.eth');
    });

    it('should not include username section when not provided', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 3,
        moves: 20,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).not.toContain('by ');
    });

    it('should include Memory Match BASE branding', () => {
      const data: LevelCompletionFrame = {
        level: 1,
        stars: 3,
        moves: 20,
        timestamp: Date.now(),
      };

      const svg = generator.generateImage(data);

      expect(svg).toContain('Memory Match BASE');
    });
  });

  describe('svgToDataUrl', () => {
    it('should convert SVG to data URL', () => {
      const svg = '<svg><rect /></svg>';
      const dataUrl = generator.svgToDataUrl(svg);

      expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
      expect(dataUrl).toContain('svg');
    });

    it('should properly encode special characters', () => {
      const svg = '<svg><text>Test & "quotes"</text></svg>';
      const dataUrl = generator.svgToDataUrl(svg);

      expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
      // Should be URL encoded
      expect(dataUrl).toContain('%');
    });
  });
});

describe('generateLevelFrame', () => {
  it('should generate frame metadata with correct structure', () => {
    const completion: LevelCompletionFrame = {
      level: 5,
      stars: 3,
      moves: 20,
      timestamp: Date.now(),
    };

    const frame = generateLevelFrame(completion, 'https://example.com');

    expect(frame.version).toBe('vNext');
    expect(frame.image).toMatch(/^data:image\/svg\+xml,/);
    expect(frame.imageAspectRatio).toBe('1.91:1');
    expect(frame.button).toBeDefined();
    expect(frame.button?.title).toBe('Play This Level');
    expect(frame.button?.action).toBe('link');
    expect(frame.button?.target).toBe('https://example.com?level=5');
    expect(frame.postUrl).toBe('https://example.com/api/frame');
  });

  it('should use window.location.origin when baseUrl not provided', () => {
    const completion: LevelCompletionFrame = {
      level: 10,
      stars: 2,
      moves: 30,
      timestamp: Date.now(),
    };

    const frame = generateLevelFrame(completion);

    expect(frame.button?.target).toContain('?level=10');
    expect(frame.postUrl).toContain('/api/frame');
  });

  it('should generate different images for different levels', () => {
    const completion1: LevelCompletionFrame = {
      level: 1,
      stars: 3,
      moves: 20,
      timestamp: Date.now(),
    };

    const completion2: LevelCompletionFrame = {
      level: 2,
      stars: 3,
      moves: 20,
      timestamp: Date.now(),
    };

    const frame1 = generateLevelFrame(completion1, 'https://example.com');
    const frame2 = generateLevelFrame(completion2, 'https://example.com');

    expect(frame1.image).not.toBe(frame2.image);
    expect(frame1.button?.target).toContain('level=1');
    expect(frame2.button?.target).toContain('level=2');
  });
});

describe('generateFrameMetaTags', () => {
  it('should generate basic meta tags', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
    };

    const tags = generateFrameMetaTags(metadata);

    expect(tags).toContain('<meta property="fc:frame" content="vNext" />');
    expect(tags).toContain('<meta property="fc:frame:image" content="https://example.com/image.png" />');
  });

  it('should include aspect ratio when provided', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
      imageAspectRatio: '1.91:1',
    };

    const tags = generateFrameMetaTags(metadata);

    expect(tags).toContain('<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />');
  });

  it('should include button tags when provided', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
      button: {
        title: 'Click Me',
        action: 'link',
        target: 'https://example.com/target',
      },
    };

    const tags = generateFrameMetaTags(metadata);

    expect(tags).toContain('<meta property="fc:frame:button:1" content="Click Me" />');
    expect(tags).toContain('<meta property="fc:frame:button:1:action" content="link" />');
    expect(tags).toContain('<meta property="fc:frame:button:1:target" content="https://example.com/target" />');
  });

  it('should include input tags when provided', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
      input: {
        text: 'Enter your name',
      },
    };

    const tags = generateFrameMetaTags(metadata);

    expect(tags).toContain('<meta property="fc:frame:input:text" content="Enter your name" />');
  });

  it('should include post URL when provided', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
      postUrl: 'https://example.com/api/frame',
    };

    const tags = generateFrameMetaTags(metadata);

    expect(tags).toContain('<meta property="fc:frame:post_url" content="https://example.com/api/frame" />');
  });
});

describe('addFrameMetaToHead and removeFrameMetaFromHead', () => {
  afterEach(() => {
    // Clean up after each test
    removeFrameMetaFromHead();
  });

  it('should add frame meta tags to document head', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
    };

    addFrameMetaToHead(metadata);

    const frameTags = document.querySelectorAll('meta[property^="fc:frame"]');
    expect(frameTags.length).toBeGreaterThan(0);
  });

  it('should remove frame meta tags from document head', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
    };

    addFrameMetaToHead(metadata);
    let frameTags = document.querySelectorAll('meta[property^="fc:frame"]');
    expect(frameTags.length).toBeGreaterThan(0);

    removeFrameMetaFromHead();
    frameTags = document.querySelectorAll('meta[property^="fc:frame"]');
    expect(frameTags.length).toBe(0);
  });

  it('should add multiple meta tags', () => {
    const metadata: FrameMetadata = {
      version: 'vNext',
      image: 'https://example.com/image.png',
      imageAspectRatio: '1.91:1',
      button: {
        title: 'Click Me',
        action: 'link',
        target: 'https://example.com/target',
      },
    };

    addFrameMetaToHead(metadata);

    const frameTags = document.querySelectorAll('meta[property^="fc:frame"]');
    expect(frameTags.length).toBeGreaterThanOrEqual(5);
  });
});

describe('generateShareUrl', () => {
  it('should generate share URL with all parameters', () => {
    const completion: LevelCompletionFrame = {
      level: 5,
      stars: 3,
      moves: 20,
      timestamp: 1234567890,
    };

    const url = generateShareUrl(completion, 'https://example.com');

    expect(url).toContain('https://example.com/share?');
    expect(url).toContain('level=5');
    expect(url).toContain('stars=3');
    expect(url).toContain('moves=20');
    expect(url).toContain('timestamp=1234567890');
  });

  it('should use window.location.origin when baseUrl not provided', () => {
    const completion: LevelCompletionFrame = {
      level: 10,
      stars: 2,
      moves: 30,
      timestamp: Date.now(),
    };

    const url = generateShareUrl(completion);

    expect(url).toContain('/share?');
    expect(url).toContain('level=10');
  });

  it('should properly encode URL parameters', () => {
    const completion: LevelCompletionFrame = {
      level: 1,
      stars: 3,
      moves: 15,
      timestamp: 1234567890,
    };

    const url = generateShareUrl(completion, 'https://example.com');

    // URL should be properly formatted
    expect(() => new URL(url)).not.toThrow();
  });
});
