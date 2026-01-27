/**
 * Local Webhook Test Script (без ngrok)
 * 
 * Тестирует webhook endpoint локально без ngrok
 * 
 * Usage:
 *   node test-webhook-local.js
 */

const crypto = require('crypto');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function generateSignature(body, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return hmac.digest('hex');
}

function sendWebhookRequest(port, signature, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Farcaster-Signature': signature
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function testWebhook(port, webhookSecret, eventType, eventData) {
  console.log(`\n🧪 Testing: ${eventType}`);
  console.log('─'.repeat(50));

  const body = JSON.stringify({
    event: eventType,
    data: eventData
  });

  const signature = generateSignature(body, webhookSecret);

  console.log(`📝 Event: ${eventType}`);
  console.log(`📦 Data: ${JSON.stringify(eventData)}`);
  console.log(`🔐 Signature: ${signature.substring(0, 20)}...`);

  try {
    const response = await sendWebhookRequest(port, signature, body);

    console.log(`\n✅ Response: ${response.statusCode} ${response.statusMessage}`);
    console.log(`📄 Body: ${response.body}`);

    return response.statusCode === 200;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(`💡 Убедись что dev server запущен: npm run dev`);
    return false;
  }
}

async function testInvalidSignature(port) {
  console.log(`\n🧪 Testing: Invalid Signature`);
  console.log('─'.repeat(50));

  const body = JSON.stringify({
    event: 'miniapp.open',
    data: { fid: 12345, timestamp: 1234567890 }
  });

  try {
    const response = await sendWebhookRequest(port, 'invalid_signature', body);

    console.log(`\n✅ Response: ${response.statusCode} ${response.statusMessage}`);
    console.log(`📄 Body: ${response.body}`);

    return response.statusCode === 401;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔧 Local Webhook Test Script (без ngrok)\n');

  // Get port
  const portInput = await prompt('Enter dev server port (default: 3000): ');
  const port = portInput || '3000';

  // Get webhook secret
  const webhookSecret = await prompt('Enter your WEBHOOK_SECRET from .env: ');
  
  if (!webhookSecret) {
    console.error('❌ Error: WEBHOOK_SECRET is required');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting tests...\n');
  console.log('💡 Убедись что dev server запущен: npm run dev\n');

  const results = [];

  // Test 1: miniapp.install
  results.push({
    name: 'miniapp.install',
    passed: await testWebhook(port, webhookSecret, 'miniapp.install', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 2: miniapp.uninstall
  results.push({
    name: 'miniapp.uninstall',
    passed: await testWebhook(port, webhookSecret, 'miniapp.uninstall', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 3: miniapp.open
  results.push({
    name: 'miniapp.open',
    passed: await testWebhook(port, webhookSecret, 'miniapp.open', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 4: frame.button
  results.push({
    name: 'frame.button',
    passed: await testWebhook(port, webhookSecret, 'frame.button', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000),
      buttonIndex: 1
    })
  });

  // Test 5: Invalid signature
  results.push({
    name: 'Invalid signature (should return 401)',
    passed: await testInvalidSignature(port)
  });

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Test Summary');
  console.log('═'.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log('\n' + '─'.repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('─'.repeat(50));

  if (passed === total) {
    console.log('\n🎉 All tests passed! Webhook is working correctly.');
    console.log('\n✅ Phase 2 Complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Webhook работает локально ✅');
    console.log('   2. Можешь пропустить ngrok тестирование');
    console.log('   3. Переходи к Production Deployment');
    console.log('   4. См. NEXT_STEPS.md → Phase 5');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check that dev server is running (npm run dev)');
    console.log('   2. Check that WEBHOOK_SECRET matches .env');
    console.log('   3. Check server logs for errors');
    console.log('   4. Try restarting dev server');
  }

  console.log('\n');
  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
