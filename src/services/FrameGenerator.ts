/**
 * Farcaster Frame Generator
 * 
 * This module generates Farcaster Frame metadata for sharing game progress
 * on the Farcaster social network. Frames are interactive components that
 * can be embedded in Farcaster feeds.
 * 
 * Frame Specification: https://docs.farcaster.xyz/reference/frames/spec
 */

/**
 * Frame metadata structure following Farcaster Frame specification
 */
export interface FrameMetadata {
  /** Frame version */
  version: 'vNext';
  /** URL to frame image */
  image: string;
  /** Image aspect ratio */
  imageAspectRatio?: '1.91:1' | '1:1';
  /** Button configuration */
  button?: {
    title: string;
    action: 'post' | 'post_redirect' | 'link' | 'mint';
    target?: string;
  };
  /** Input field configuration */
  input?: {
    text: string;
  };
  /** URL to handle frame actions */
  postUrl?: string;
}

/**
 * Level completion data for frame generation
 */
export interface LevelCompletionFrame {
  /** Level number (1-100) */
  level: number;
  /** Stars earned (0-3) */
  stars: number;
  /** Number of moves taken */
  moves: number;
  /** Completion timestamp */
  timestamp: number;
  /** Optional user address */
  userAddress?: string;
  /** Optional username/basename */
  username?: string;
}

/**
 * Frame image generator for creating SVG images
 */
export class FrameImageGenerator {
  /**
   * Generate SVG image for level completion frame
   * @param data - Level completion data
   * @returns SVG string
   */
  generateImage(data: LevelCompletionFrame): string {
    const { level, stars, moves, username } = data;
    
    // Generate star display
    const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    
    // Format username display
    const userDisplay = username ? `by ${username}` : '';
    
    // Create SVG with game-themed styling
    return `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0052FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0033CC;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Title -->
        <text x="600" y="150" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">
          Level ${level} Complete! 🎉
        </text>
        
        <!-- Stars -->
        <text x="600" y="280" font-family="Arial, sans-serif" font-size="96" text-anchor="middle">
          ${starDisplay}
        </text>
        
        <!-- Moves -->
        <text x="600" y="380" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">
          ${moves} moves
        </text>
        
        <!-- User -->
        ${userDisplay ? `
        <text x="600" y="480" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          ${userDisplay}
        </text>
        ` : ''}
        
        <!-- Footer -->
        <text x="600" y="570" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)" text-anchor="middle">
          Memory Match BASE
        </text>
      </svg>
    `.trim();
  }

  /**
   * Convert SVG to data URL for embedding
   * @param svg - SVG string
   * @returns Data URL
   */
  svgToDataUrl(svg: string): string {
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml,${encoded}`;
  }
}

/**
 * Generate Farcaster Frame metadata for level completion
 * @param completion - Level completion data
 * @param baseUrl - Base URL of the application
 * @returns Frame metadata
 */
export function generateLevelFrame(
  completion: LevelCompletionFrame,
  baseUrl: string = window.location.origin
): FrameMetadata {
  const imageGenerator = new FrameImageGenerator();
  const svg = imageGenerator.generateImage(completion);
  const imageUrl = imageGenerator.svgToDataUrl(svg);

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    button: {
      title: 'Play This Level',
      action: 'link',
      target: `${baseUrl}?level=${completion.level}`,
    },
    postUrl: `${baseUrl}/api/frame`,
  };
}

/**
 * Generate Frame metadata tags for HTML head
 * @param metadata - Frame metadata
 * @returns HTML meta tags as string
 */
export function generateFrameMetaTags(metadata: FrameMetadata): string {
  const tags: string[] = [
    `<meta property="fc:frame" content="${metadata.version}" />`,
    `<meta property="fc:frame:image" content="${metadata.image}" />`,
  ];

  if (metadata.imageAspectRatio) {
    tags.push(`<meta property="fc:frame:image:aspect_ratio" content="${metadata.imageAspectRatio}" />`);
  }

  if (metadata.button) {
    tags.push(`<meta property="fc:frame:button:1" content="${metadata.button.title}" />`);
    tags.push(`<meta property="fc:frame:button:1:action" content="${metadata.button.action}" />`);
    
    if (metadata.button.target) {
      tags.push(`<meta property="fc:frame:button:1:target" content="${metadata.button.target}" />`);
    }
  }

  if (metadata.input) {
    tags.push(`<meta property="fc:frame:input:text" content="${metadata.input.text}" />`);
  }

  if (metadata.postUrl) {
    tags.push(`<meta property="fc:frame:post_url" content="${metadata.postUrl}" />`);
  }

  return tags.join('\n');
}

/**
 * Add Frame metadata to document head
 * @param metadata - Frame metadata
 */
export function addFrameMetaToHead(metadata: FrameMetadata): void {
  const tags = generateFrameMetaTags(metadata);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = tags;

  // Add each meta tag to head
  Array.from(tempDiv.children).forEach((tag) => {
    document.head.appendChild(tag);
  });
}

/**
 * Remove Frame metadata from document head
 */
export function removeFrameMetaFromHead(): void {
  const frameTags = document.querySelectorAll('meta[property^="fc:frame"]');
  frameTags.forEach((tag) => tag.remove());
}

/**
 * Generate shareable Frame URL
 * @param completion - Level completion data
 * @param baseUrl - Base URL of the application
 * @returns Shareable URL
 */
export function generateShareUrl(
  completion: LevelCompletionFrame,
  baseUrl: string = window.location.origin
): string {
  const params = new URLSearchParams({
    level: completion.level.toString(),
    stars: completion.stars.toString(),
    moves: completion.moves.toString(),
    timestamp: completion.timestamp.toString(),
  });

  return `${baseUrl}/share?${params.toString()}`;
}
