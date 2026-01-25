/**
 * Header Component Demo
 * 
 * Visual demonstration of the Header component with different states.
 * This file is for development/testing purposes only.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './Header';

export const HeaderDemo: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);

  // Simulate timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000D1F' }}>
      <h1 style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
        Header Component Demo
      </h1>

      {/* Live Demo */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Live Demo (Timer Counting Down)
        </h2>
        <Header level={level} moves={moves} timeRemaining={timeRemaining} />
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setMoves(moves + 1)}
            style={{
              padding: '10px 20px',
              margin: '5px',
              background: '#0052FF',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Increment Moves
          </button>
          <button
            onClick={() => setLevel(level + 1)}
            style={{
              padding: '10px 20px',
              margin: '5px',
              background: '#0052FF',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Next Level
          </button>
          <button
            onClick={() => {
              setTimeRemaining(60);
              setMoves(0);
              setLevel(1);
            }}
            style={{
              padding: '10px 20px',
              margin: '5px',
              background: '#FF4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Static Examples */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Level 1 - Start of Game
        </h2>
        <Header level={1} moves={0} timeRemaining={60} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Level 25 - Mid Game
        </h2>
        <Header level={25} moves={15} timeRemaining={30} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Level 50 - Time Warning (≤10 seconds)
        </h2>
        <Header level={50} moves={42} timeRemaining={8} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Level 100 - Final Level
        </h2>
        <Header level={100} moves={99} timeRemaining={120} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Time Running Out
        </h2>
        <Header level={10} moves={20} timeRemaining={3} />
      </div>
    </div>
  );
};
