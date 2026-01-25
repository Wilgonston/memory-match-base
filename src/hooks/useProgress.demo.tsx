/**
 * Demo component showcasing useProgress hook usage
 * 
 * This demo shows how to:
 * - Display current progress
 * - Complete levels with star ratings
 * - Update progress settings
 * - Reset progress
 */

import { useProgress } from './useProgress';

export function ProgressDemo() {
  const { progress, completeLevel, updateProgress, resetProgress } = useProgress();

  // Calculate total stars earned
  const totalStars = Array.from(progress.levelStars.values()).reduce((sum, stars) => sum + stars, 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Progress Management Demo</h1>

      {/* Current Progress Display */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Current Progress</h2>
        <p><strong>Highest Unlocked Level:</strong> {progress.highestUnlockedLevel}</p>
        <p><strong>Completed Levels:</strong> {progress.completedLevels.size}</p>
        <p><strong>Total Stars:</strong> {totalStars}</p>
        <p><strong>Sound Enabled:</strong> {progress.soundEnabled ? 'Yes' : 'No'}</p>
      </div>

      {/* Completed Levels List */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Completed Levels</h2>
        {progress.completedLevels.size === 0 ? (
          <p>No levels completed yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
            {Array.from(progress.completedLevels).sort((a, b) => a - b).map(level => (
              <div
                key={level}
                style={{
                  padding: '10px',
                  border: '1px solid #0052FF',
                  borderRadius: '4px',
                  textAlign: 'center',
                  backgroundColor: '#f0f8ff',
                }}
              >
                <div><strong>Level {level}</strong></div>
                <div style={{ color: '#FFD700', fontSize: '20px' }}>
                  {'⭐'.repeat(progress.levelStars.get(level) ?? 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Actions</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <h3>Complete Levels</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => completeLevel(1, 3)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Complete Level 1 (3⭐)
            </button>
            <button
              onClick={() => completeLevel(2, 2)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Complete Level 2 (2⭐)
            </button>
            <button
              onClick={() => completeLevel(3, 1)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Complete Level 3 (1⭐)
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>Settings</h3>
          <button
            onClick={() => updateProgress(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Toggle Sound ({progress.soundEnabled ? 'ON' : 'OFF'})
          </button>
        </div>

        <div>
          <h3>Reset</h3>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all progress?')) {
                resetProgress();
              }
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset All Progress
          </button>
        </div>
      </div>

      {/* Level Unlock Status */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Level Unlock Status (First 10 Levels)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
            const isUnlocked = level <= progress.highestUnlockedLevel;
            const isCompleted = progress.completedLevels.has(level);
            const stars = progress.levelStars.get(level) ?? 0;

            return (
              <div
                key={level}
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  textAlign: 'center',
                  backgroundColor: isCompleted ? '#d4edda' : isUnlocked ? '#fff3cd' : '#f8d7da',
                  opacity: isUnlocked ? 1 : 0.5,
                }}
              >
                <div><strong>{level}</strong></div>
                {isCompleted && (
                  <div style={{ color: '#FFD700', fontSize: '16px' }}>
                    {'⭐'.repeat(stars)}
                  </div>
                )}
                {!isUnlocked && <div style={{ fontSize: '12px' }}>🔒</div>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <p>🟢 Green = Completed | 🟡 Yellow = Unlocked | 🔴 Red = Locked</p>
        </div>
      </div>

      {/* Usage Example */}
      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h2>Usage Example</h2>
        <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`import { useProgress } from './hooks/useProgress';

function App() {
  const { progress, completeLevel, updateProgress, resetProgress } = useProgress();

  // Complete a level with 3 stars
  const handleLevelComplete = () => {
    completeLevel(5, 3);
  };

  // Toggle sound setting
  const toggleSound = () => {
    updateProgress(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  // Check if level is unlocked
  const isLevelUnlocked = (level: number) => {
    return level <= progress.highestUnlockedLevel;
  };

  return (
    <div>
      <h1>Level {progress.highestUnlockedLevel}</h1>
      <button onClick={handleLevelComplete}>Complete Level</button>
      <button onClick={toggleSound}>
        Sound: {progress.soundEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export default ProgressDemo;
