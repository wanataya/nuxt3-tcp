const net = require('net');
const { Server } = require('socket.io');
const http = require('http');

// Configuration
const TCP_PORT = process.env.TCP_PORT || 3001;
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;

// Storage for TCP clients
const tcpClients = new Map();
let clientIdCounter = 0;

// Create HTTP server for Socket.IO
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Create TCP server
const tcpServer = net.createServer((socket) => {
  const clientId = ++clientIdCounter;
  const clientInfo = {
    id: clientId,
    socket: socket,
    address: socket.remoteAddress,
    port: socket.remotePort,
    connectedAt: new Date()
  };
  
  tcpClients.set(clientId, clientInfo);
  
  console.log(`TCP Client ${clientId} connected from ${socket.remoteAddress}:${socket.remotePort}`);
  
  // Broadcast connection status to web clients
  broadcastTcpStatus();
  
  // Handle data from TCP client
  socket.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Message from TCP Client ${clientId}:`, message);
      
      // Forward message to web clients via Socket.IO
      io.emit('tcp-message', {
        clientId: clientId,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        type: message.type || 'user-message'
      });
    } catch (error) {
      console.error(`Error parsing message from TCP Client ${clientId}:`, error);
    }
  });
  
  // Handle TCP client disconnect
  socket.on('close', () => {
    console.log(`TCP Client ${clientId} disconnected`);
    tcpClients.delete(clientId);
    broadcastTcpStatus();
  });
  
  // Handle TCP client error
  socket.on('error', (error) => {
    console.error(`TCP Client ${clientId} error:`, error);
    tcpClients.delete(clientId);
    broadcastTcpStatus();
  });
  
  // Send welcome message to new TCP client
  const welcomeMessage = {
    type: 'system',
    content: `Welcome! You are connected as client ${clientId}`,
    timestamp: new Date().toISOString()
  };
  
  socket.write(JSON.stringify(welcomeMessage));
});

// TCP server event handlers
tcpServer.on('listening', () => {
  console.log(`TCP Server listening on port ${TCP_PORT}`);
});

tcpServer.on('error', (error) => {
  console.error('TCP Server error:', error);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Web client connected via Socket.IO');
  
  // Send current TCP status to new web client
  broadcastTcpStatus();
  
  // Handle message from web client to TCP clients
  socket.on('send-to-tcp', (data) => {
    console.log('Message from web client:', data);
    
    const message = {
      type: 'web-message',
      content: data.content,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    // Broadcast to all TCP clients
    tcpClients.forEach((client, clientId) => {
      try {
        client.socket.write(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending to TCP Client ${clientId}:`, error);
        // Remove failed client
        tcpClients.delete(clientId);
      }
    });
    
    // Confirm message sent to web client
    socket.emit('message-sent', {
      content: data.content,
      timestamp: message.timestamp
    });
    
    // Update TCP status after potential client cleanup
    broadcastTcpStatus();
  });
  
  // Handle web client disconnect
  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// Helper function to broadcast TCP status
function broadcastTcpStatus() {
  const status = {
    connected: tcpClients.size > 0,
    clientCount: tcpClients.size,
    clients: Array.from(tcpClients.values()).map(client => ({
      id: client.id,
      address: client.address,
      port: client.port,
      connectedAt: client.connectedAt
    }))
  };
  
  io.emit('tcp-status', status);
}

// Start servers
tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP Server started on port ${TCP_PORT}`);
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO Server started on port ${SOCKET_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  // Close all TCP connections
  tcpClients.forEach((client) => {
    client.socket.end();
  });
  
  // Close servers
  tcpServer.close(() => {
    console.log('TCP Server closed');
  });
  
  httpServer.close(() => {
    console.log('Socket.IO Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});