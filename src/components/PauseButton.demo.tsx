/**
 * PauseButton Component Demo
 * 
 * Visual demonstration of the PauseButton component.
 * Shows the button in different states and contexts.
 */

import React from 'react';
import { PauseButton } from './PauseButton';

export const PauseButtonDemo: React.FC = () => {
  const handlePause = () => {
    console.log('Game paused!');
    alert('Game paused!');
  };

  return (
    <div style={{ padding: '40px', background: '#000D1F', minHeight: '100vh' }}>
      <h1 style={{ color: '#FFFFFF', marginBottom: '40px' }}>PauseButton Component Demo</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Default State */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Default State</h2>
          <PauseButton onPause={handlePause} />
        </div>

        {/* Multiple Buttons */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Multiple Buttons</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <PauseButton onPause={handlePause} />
            <PauseButton onPause={handlePause} />
            <PauseButton onPause={handlePause} />
          </div>
        </div>

        {/* In a Game Header Context */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>In Game Header Context</h2>
          <div style={{ 
            background: 'linear-gradient(135deg, #000D1F 0%, #001A3D 100%)',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: '#FFFFFF' }}>Level 5 | Time: 01:23 | Moves: 12</div>
            <PauseButton onPause={handlePause} />
          </div>
        </div>

        {/* Responsive Demo */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Responsive Sizes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '100%', maxWidth: '320px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Mobile (320px)</p>
              <PauseButton onPause={handlePause} />
            </div>
            <div style={{ width: '100%', maxWidth: '768px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Tablet (768px)</p>
              <PauseButton onPause={handlePause} />
            </div>
            <div style={{ width: '100%', maxWidth: '1024px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Desktop (1024px+)</p>
              <PauseButton onPause={handlePause} />
            </div>
          </div>
        </div>

        {/* Accessibility Info */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Accessibility Features</h2>
          <ul style={{ color: '#FFFFFF', lineHeight: '1.8' }}>
            <li>✓ Keyboard accessible (Tab to focus, Enter/Space to activate)</li>
            <li>✓ ARIA label: "Pause game"</li>
            <li>✓ Minimum touch target: 44x44px</li>
            <li>✓ Focus indicator visible</li>
            <li>✓ High contrast mode support</li>
            <li>✓ Reduced motion support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PauseButtonDemo;
