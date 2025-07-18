const net = require('net');
const readline = require('readline');

// Configuration
const TCP_HOST = 'localhost';
const TCP_PORT = process.env.TCP_PORT || 3001;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create TCP client
const client = new net.Socket();
let connected = false;

// Connect to TCP server
client.connect(TCP_PORT, TCP_HOST, () => {
  connected = true;
  console.log(`Connected to TCP server at ${TCP_HOST}:${TCP_PORT}`);
  console.log('You can now type messages. Type "exit" to quit.');
  console.log('---');
  
  // Start listening for user input
  promptForMessage();
});

// Handle data from server
client.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('\n📨 Received message:');
    console.log(`   Type: ${message.type}`);
    console.log(`   Content: ${message.content}`);
    console.log(`   Time: ${new Date(message.timestamp).toLocaleTimeString()}`);
    console.log('---');
    
    if (connected) {
      promptForMessage();
    }
  } catch (error) {
    console.log('\n📨 Received raw data:', data.toString());
    console.log('---');
    
    if (connected) {
      promptForMessage();
    }
  }
});

// Handle connection close
client.on('close', () => {
  console.log('\n🔌 Connection closed');
  connected = false;
  rl.close();
});

// Handle connection error
client.on('error', (error) => {
  console.error('\n❌ Connection error:', error.message);
  connected = false;
  rl.close();
});

// Function to prompt for user message
function promptForMessage() {
  rl.question('Enter message: ', (input) => {
    if (!connected) {
      return;
    }
    
    if (input.toLowerCase() === 'exit') {
      client.end();
      return;
    }
    
    if (input.trim() === '') {
      promptForMessage();
      return;
    }
    
    // Send message to server
    const message = {
      type: 'user-message',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    try {
      client.write(JSON.stringify(message));
      console.log('✅ Message sent');
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  if (connected) {
    client.end();
  }
  rl.close();
  process.exit(0);
});

// Handle readline close
rl.on('close', () => {
  if (connected) {
    client.end();
  }
  process.exit(0);
});

console.log('🚀 TCP Client Test');
console.log(`Connecting to ${TCP_HOST}:${TCP_PORT}...`);