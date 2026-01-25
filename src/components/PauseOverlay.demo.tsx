/**
 * PauseOverlay Component Demo
 * 
 * Demonstrates the PauseOverlay component in different states.
 * This file is for development and testing purposes.
 */

import React, { useState } from 'react';
import { PauseOverlay } from './PauseOverlay';

export const PauseOverlayDemo: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f0f0' }}>
      <h1>PauseOverlay Component Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#0052FF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          {isPaused ? 'Hide Overlay' : 'Show Overlay'}
        </button>
      </div>

      <div style={{ 
        padding: '40px', 
        background: 'white', 
        borderRadius: '8px',
        position: 'relative',
        minHeight: '400px'
      }}>
        <h2>Game Board Area</h2>
        <p>This represents the game board that would be covered by the pause overlay.</p>
        <p>Click the button above to toggle the pause overlay.</p>
        
        {/* Simulate some game content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          marginTop: '20px'
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                background: '#0052FF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* PauseOverlay Component */}
      <PauseOverlay 
        isPaused={isPaused} 
        onResume={() => setIsPaused(false)} 
      />
    </div>
  );
};

export default PauseOverlayDemo;
