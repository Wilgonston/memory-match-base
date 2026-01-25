/**
 * Demo component for useTimer hook
 * 
 * This demo showcases the timer functionality including:
 * - Starting a countdown timer
 * - Pausing and resuming the timer
 * - Stopping the timer
 * - Resetting to a new time
 * - Callback when timer reaches zero
 */

import { useState } from 'react';
import { useTimer } from './useTimer';
import { formatTime } from '../utils/timeFormat';

export function UseTimerDemo() {
  const [message, setMessage] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('10');

  const timer = useTimer({
    onTimerEnd: () => {
      setMessage('⏰ Time is up!');
    }
  });

  const handleStart = () => {
    const time = parseInt(customTime) || 10;
    timer.startTimer(time);
    setMessage(`Started ${time} second timer`);
  };

  const handlePause = () => {
    timer.pauseTimer();
    setMessage('Timer paused');
  };

  const handleResume = () => {
    timer.resumeTimer();
    setMessage('Timer resumed');
  };

  const handleStop = () => {
    timer.stopTimer();
    setMessage('Timer stopped');
  };

  const handleReset = () => {
    const time = parseInt(customTime) || 10;
    timer.resetTimer(time);
    setMessage(`Timer reset to ${time} seconds`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>useTimer Hook Demo</h2>
      
      <div style={{ 
        fontSize: '48px', 
        fontWeight: 'bold', 
        margin: '20px 0',
        color: timer.timeRemaining <= 5 ? '#ef4444' : '#3b82f6'
      }}>
        {formatTime(timer.timeRemaining)}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div>
          <strong>Status:</strong>{' '}
          {timer.isRunning ? (
            timer.isPaused ? (
              <span style={{ color: '#f59e0b' }}>⏸️ Paused</span>
            ) : (
              <span style={{ color: '#10b981' }}>▶️ Running</span>
            )
          ) : (
            <span style={{ color: '#6b7280' }}>⏹️ Stopped</span>
          )}
        </div>
        {message && (
          <div style={{ marginTop: '10px', color: '#6b7280' }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Time (seconds):{' '}
          <input
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            min="1"
            max="999"
            style={{ 
              padding: '5px', 
              marginLeft: '10px',
              width: '80px'
            }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleStart}
          disabled={timer.isRunning && !timer.isPaused}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: timer.isRunning && !timer.isPaused ? 'not-allowed' : 'pointer',
            opacity: timer.isRunning && !timer.isPaused ? 0.5 : 1
          }}
        >
          Start
        </button>

        <button
          onClick={handlePause}
          disabled={!timer.isRunning || timer.isPaused}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !timer.isRunning || timer.isPaused ? 'not-allowed' : 'pointer',
            opacity: !timer.isRunning || timer.isPaused ? 0.5 : 1
          }}
        >
          Pause
        </button>

        <button
          onClick={handleResume}
          disabled={!timer.isPaused}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !timer.isPaused ? 'not-allowed' : 'pointer',
            opacity: !timer.isPaused ? 0.5 : 1
          }}
        >
          Resume
        </button>

        <button
          onClick={handleStop}
          disabled={!timer.isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !timer.isRunning ? 'not-allowed' : 'pointer',
            opacity: !timer.isRunning ? 0.5 : 1
          }}
        >
          Stop
        </button>

        <button
          onClick={handleReset}
          disabled={!timer.isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !timer.isRunning ? 'not-allowed' : 'pointer',
            opacity: !timer.isRunning ? 0.5 : 1
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f3f4f6',
        borderRadius: '5px'
      }}>
        <h3>Usage Example:</h3>
        <pre style={{ 
          backgroundColor: '#1f2937', 
          color: '#f9fafb', 
          padding: '15px',
          borderRadius: '5px',
          overflow: 'auto'
        }}>
{`const timer = useTimer({
  onTimerEnd: () => {
    console.log('Time is up!');
  }
});

// Start a 60 second countdown
timer.startTimer(60);

// Pause the timer
timer.pauseTimer();

// Resume the timer
timer.resumeTimer();

// Stop the timer
timer.stopTimer();

// Reset to new time
timer.resetTimer(30);`}
        </pre>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#dbeafe',
        borderRadius: '5px'
      }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ Countdown from any initial time</li>
          <li>✅ Pause and resume functionality</li>
          <li>✅ Stop timer completely</li>
          <li>✅ Reset to new time while running</li>
          <li>✅ Callback when timer reaches zero</li>
          <li>✅ Automatic cleanup on unmount</li>
          <li>✅ Prevents negative time values</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fef3c7',
        borderRadius: '5px'
      }}>
        <h3>Requirements Validated:</h3>
        <ul>
          <li><strong>4.1:</strong> Timer countdown from allocated time</li>
          <li><strong>4.5:</strong> Trigger callback when timer reaches zero</li>
          <li><strong>4.6:</strong> Stop timer when game ends</li>
        </ul>
      </div>
    </div>
  );
}

export default UseTimerDemo;
