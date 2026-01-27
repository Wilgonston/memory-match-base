/**
 * Sound Manager
 * 
 * Manages sound effects for game events and blockchain transactions.
 * Handles preloading, playback, and mute/unmute functionality.
 * 
 * Features:
 * - Preloads sound files on initialization
 * - Plays sounds for game events (flip, match, level complete)
 * - Plays sounds for blockchain events (transaction submitted, confirmed)
 * - Respects user mute preference
 * - Persists mute preference in localStorage
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

type SoundType = 
  | 'flip'
  | 'match'
  | 'mismatch'
  | 'victory'
  | 'transaction-submitted'
  | 'transaction-confirmed';

interface SoundConfig {
  path: string;
  volume: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  flip: {
    path: '/assets/sounds/flip.mp3',
    volume: 0.3,
  },
  match: {
    path: '/assets/sounds/match.mp3',
    volume: 0.5,
  },
  mismatch: {
    path: '/assets/sounds/mismatch.mp3',
    volume: 0.4,
  },
  victory: {
    path: '/assets/sounds/victory.mp3',
    volume: 0.6,
  },
  'transaction-submitted': {
    path: '/assets/sounds/flip.mp3', // Reuse flip sound
    volume: 0.4,
  },
  'transaction-confirmed': {
    path: '/assets/sounds/match.mp3', // Reuse match sound
    volume: 0.5,
  },
};

const MUTE_STORAGE_KEY = 'memory-match-sound-muted';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private muted: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Load mute preference from localStorage
    const storedMute = localStorage.getItem(MUTE_STORAGE_KEY);
    this.muted = storedMute === 'true';
  }

  /**
   * Initialize and preload all sound files
   * Should be called once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
      
      if (isTestEnvironment) {
        this.initialized = true;
        console.log('Sound Manager initialized in test mode (audio disabled)');
        return;
      }

      const loadPromises = Object.entries(SOUND_CONFIGS).map(
        async ([type, config]) => {
          try {
            const audio = new Audio(config.path);
            audio.volume = config.volume;
            audio.preload = 'auto';
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
              }, 5000);

              audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve();
              }, { once: true });
              
              audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(e);
              }, { once: true });
              
              audio.load();
            });
            
            this.sounds.set(type as SoundType, audio);
          } catch (error) {
            console.warn(`Failed to load sound ${type}:`, error);
          }
        }
      );

      await Promise.allSettled(loadPromises);
      this.initialized = true;
      console.log(`Sound Manager initialized (${this.sounds.size}/${Object.keys(SOUND_CONFIGS).length} sounds loaded)`);
    } catch (error) {
      console.error('Failed to initialize Sound Manager:', error);
      this.initialized = true;
    }
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType): void {
    if (this.muted || !this.initialized) {
      return;
    }

    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return;
    }

    // Clone the audio element to allow overlapping sounds
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = sound.volume;
    
    // Play the sound
    clone.play().catch((error) => {
      console.warn(`Failed to play sound ${type}:`, error);
    });
  }

  /**
   * Mute all sounds
   */
  mute(): void {
    this.muted = true;
    localStorage.setItem(MUTE_STORAGE_KEY, 'true');
  }

  /**
   * Unmute all sounds
   */
  unmute(): void {
    this.muted = false;
    localStorage.setItem(MUTE_STORAGE_KEY, 'false');
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.muted;
  }

  /**
   * Check if sounds are muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Set volume for a specific sound type
   */
  setVolume(type: SoundType, volume: number): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playSound = (type: SoundType) => soundManager.play(type);
export const toggleSound = () => soundManager.toggleMute();
export const isSoundMuted = () => soundManager.isMuted();
export const initializeSounds = () => soundManager.initialize();
