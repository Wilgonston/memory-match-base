/**
 * Webhook Test Script
 * 
 * Тестирует webhook endpoint локально с ngrok
 * 
 * Usage:
 *   node test-webhook.js
 */

const crypto = require('crypto');
const https = require('https');
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

function sendWebhookRequest(url, signature, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Farcaster-Signature': signature
      }
    };

    const req = https.request(options, (res) => {
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

async function testWebhook(ngrokUrl, webhookSecret, eventType, eventData) {
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
    const response = await sendWebhookRequest(
      `${ngrokUrl}/api/webhook`,
      signature,
      body
    );

    console.log(`\n✅ Response: ${response.statusCode} ${response.statusMessage}`);
    console.log(`📄 Body: ${response.body}`);

    return response.statusCode === 200;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function testInvalidSignature(ngrokUrl) {
  console.log(`\n🧪 Testing: Invalid Signature`);
  console.log('─'.repeat(50));

  const body = JSON.stringify({
    event: 'miniapp.open',
    data: { fid: 12345, timestamp: 1234567890 }
  });

  try {
    const response = await sendWebhookRequest(
      `${ngrokUrl}/api/webhook`,
      'invalid_signature',
      body
    );

    console.log(`\n✅ Response: ${response.statusCode} ${response.statusMessage}`);
    console.log(`📄 Body: ${response.body}`);

    return response.statusCode === 401;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔧 Webhook Test Script\n');

  // Get ngrok URL
  const ngrokUrl = await prompt('Enter your ngrok URL (e.g., https://abc123.ngrok.io): ');
  
  if (!ngrokUrl.startsWith('https://')) {
    console.error('❌ Error: ngrok URL must start with https://');
    rl.close();
    return;
  }

  // Get webhook secret
  const webhookSecret = await prompt('Enter your WEBHOOK_SECRET from .env: ');
  
  if (!webhookSecret) {
    console.error('❌ Error: WEBHOOK_SECRET is required');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting tests...\n');

  const results = [];

  // Test 1: miniapp.install
  results.push({
    name: 'miniapp.install',
    passed: await testWebhook(ngrokUrl, webhookSecret, 'miniapp.install', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 2: miniapp.uninstall
  results.push({
    name: 'miniapp.uninstall',
    passed: await testWebhook(ngrokUrl, webhookSecret, 'miniapp.uninstall', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 3: miniapp.open
  results.push({
    name: 'miniapp.open',
    passed: await testWebhook(ngrokUrl, webhookSecret, 'miniapp.open', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  });

  // Test 4: frame.button
  results.push({
    name: 'frame.button',
    passed: await testWebhook(ngrokUrl, webhookSecret, 'frame.button', {
      fid: 12345,
      timestamp: Math.floor(Date.now() / 1000),
      buttonIndex: 1
    })
  });

  // Test 5: Invalid signature
  results.push({
    name: 'Invalid signature (should return 401)',
    passed: await testInvalidSignature(ngrokUrl)
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
    console.log('📝 Next: Deploy to production (see NEXT_STEPS.md)');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check that dev server is running (npm run dev)');
    console.log('   2. Check that ngrok is running (ngrok http 3000)');
    console.log('   3. Check that WEBHOOK_SECRET matches .env');
    console.log('   4. Check server logs for errors');
  }

  console.log('\n');
  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
