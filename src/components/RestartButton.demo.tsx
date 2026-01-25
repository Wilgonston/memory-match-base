/**
 * RestartButton Component Demo
 * 
 * Visual demonstration of the RestartButton component.
 * Shows the button in different states and contexts.
 */

import React from 'react';
import { RestartButton } from './RestartButton';

export const RestartButtonDemo: React.FC = () => {
  const handleRestart = () => {
    console.log('Level restarted!');
    alert('Level restarted!');
  };

  return (
    <div style={{ padding: '40px', background: '#000D1F', minHeight: '100vh' }}>
      <h1 style={{ color: '#FFFFFF', marginBottom: '40px' }}>RestartButton Component Demo</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Default State */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Default State</h2>
          <RestartButton onRestart={handleRestart} />
        </div>

        {/* Multiple Buttons */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Multiple Buttons</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <RestartButton onRestart={handleRestart} />
            <RestartButton onRestart={handleRestart} />
            <RestartButton onRestart={handleRestart} />
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
            <RestartButton onRestart={handleRestart} />
          </div>
        </div>

        {/* With Pause Button */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>With Other Control Buttons</h2>
          <div style={{ 
            background: 'linear-gradient(135deg, #000D1F 0%, #001A3D 100%)',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: '#FFFFFF' }}>Level 5 | Time: 01:23 | Moves: 12</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <RestartButton onRestart={handleRestart} />
              <button style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0052FF 0%, #0041CC 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Pause
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Demo */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Responsive Sizes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '100%', maxWidth: '320px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Mobile (320px)</p>
              <RestartButton onRestart={handleRestart} />
            </div>
            <div style={{ width: '100%', maxWidth: '768px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Tablet (768px)</p>
              <RestartButton onRestart={handleRestart} />
            </div>
            <div style={{ width: '100%', maxWidth: '1024px' }}>
              <p style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '14px' }}>Desktop (1024px+)</p>
              <RestartButton onRestart={handleRestart} />
            </div>
          </div>
        </div>

        {/* Accessibility Info */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Accessibility Features</h2>
          <ul style={{ color: '#FFFFFF', lineHeight: '1.8' }}>
            <li>✓ Keyboard accessible (Tab to focus, Enter/Space to activate)</li>
            <li>✓ ARIA label: "Restart level"</li>
            <li>✓ Minimum touch target: 44x44px</li>
            <li>✓ Focus indicator visible</li>
            <li>✓ High contrast mode support</li>
            <li>✓ Reduced motion support</li>
          </ul>
        </div>

        {/* Color Scheme */}
        <div>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Color Scheme</h2>
          <p style={{ color: '#FFFFFF', marginBottom: '8px' }}>
            The restart button uses an orange gradient to differentiate it from the blue pause button:
          </p>
          <ul style={{ color: '#FFFFFF', lineHeight: '1.8' }}>
            <li>Primary: #FF6B00 (Orange)</li>
            <li>Secondary: #CC5500 (Dark Orange)</li>
            <li>Hover: Darker shades for visual feedback</li>
            <li>Focus: #00D4FF (Cyan) for accessibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RestartButtonDemo;
