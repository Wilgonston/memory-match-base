import { writeFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logs = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `console-logs-${timestamp}.txt`;
    const filepath = join(process.cwd(), 'logs', filename);

    // Create logs directory if it doesn't exist
    const { mkdirSync } = await import('fs');
    try {
      mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Write logs to file
    writeFileSync(filepath, logs, 'utf-8');

    return res.status(200).json({ 
      success: true, 
      message: 'Logs saved successfully',
      filename 
    });
  } catch (error) {
    console.error('Error saving logs:', error);
    return res.status(500).json({ 
      error: 'Failed to save logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
