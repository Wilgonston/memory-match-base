// Console logger that saves all console output to a file
(function() {
  const logs = [];
  const maxLogs = 5000;
  
  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  function formatArgs(args) {
    return Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }
  
  function addLog(type, args) {
    const timestamp = new Date().toISOString();
    const message = formatArgs(args);
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    
    logs.push(logEntry);
    if (logs.length > maxLogs) {
      logs.shift();
    }
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem('console_logs', logs.join('\n'));
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  // Override console methods
  console.log = function(...args) {
    addLog('LOG', args);
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    addLog('ERROR', args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    addLog('WARN', args);
    originalWarn.apply(console, args);
  };
  
  console.info = function(...args) {
    addLog('INFO', args);
    originalInfo.apply(console, args);
  };
  
  console.debug = function(...args) {
    addLog('DEBUG', args);
    originalDebug.apply(console, args);
  };
  
  // Add download function
  window.downloadConsoleLogs = function() {
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Console logs downloaded!');
  };
  
  // Add function to send logs to server
  window.saveConsoleLogs = async function() {
    const content = logs.join('\n');
    try {
      const response = await fetch('/api/save-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      });
      if (response.ok) {
        console.log('Logs saved to server!');
      }
    } catch (e) {
      console.error('Failed to save logs:', e);
    }
  };
  
  console.log('Console logger initialized. Use downloadConsoleLogs() to download logs.');
})();
