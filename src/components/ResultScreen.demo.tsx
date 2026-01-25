/**
 * Demo file for ResultScreen component
 * 
 * Demonstrates different states of the ResultScreen component.
 * This file can be used for visual testing and development.
 */

import React, { useState } from 'react';
import { ResultScreen } from './ResultScreen';

export const ResultScreenDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<'3stars' | '2stars' | '1star' | 'final'>('3stars');

  const demos = {
    '3stars': {
      level: 5,
      moves: 10,
      timeElapsed: 35,
      stars: 3,
    },
    '2stars': {
      level: 15,
      moves: 22,
      timeElapsed: 52,
      stars: 2,
    },
    '1star': {
      level: 45,
      moves: 38,
      timeElapsed: 78,
      stars: 1,
    },
    final: {
      level: 100,
      moves: 45,
      timeElapsed: 110,
      stars: 3,
    },
  };

  const currentProps = demos[currentDemo];

  return (
    <div style={{ padding: '20px', background: '#000D1F', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setCurrentDemo('3stars')}
          style={{
            padding: '10px 20px',
            background: currentDemo === '3stars' ? '#0052FF' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          3 Stars
        </button>
        <button
          onClick={() => setCurrentDemo('2stars')}
          style={{
            padding: '10px 20px',
            background: currentDemo === '2stars' ? '#0052FF' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          2 Stars
        </button>
        <button
          onClick={() => setCurrentDemo('1star')}
          style={{
            padding: '10px 20px',
            background: currentDemo === '1star' ? '#0052FF' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          1 Star
        </button>
        <button
          onClick={() => setCurrentDemo('final')}
          style={{
            padding: '10px 20px',
            background: currentDemo === 'final' ? '#0052FF' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Final Level (100)
        </button>
      </div>

      <ResultScreen
        {...currentProps}
        onNextLevel={() => console.log('Next Level clicked')}
        onRetry={() => console.log('Retry clicked')}
        onLevelSelect={() => console.log('Level Select clicked')}
      />
    </div>
  );
};

export default ResultScreenDemo;
