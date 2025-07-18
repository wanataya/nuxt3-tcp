# Nuxt 3 TCP Communication Project

this project shows off how to get a Nuxt 3 web app talking in real-time with a Node.js TCP server. basically, it lets a web client and a TCP client chat back and forth through the server.

## Features

- **TCP Server**: a Node.js server that handles TCP connections
- **Web Interface**: a responsive Nuxt 3 app for the user interface
- **Real-time Communication**: uses Socket.IO for instant communication.
- **Multiple TCP Clients**: can handle connections from many TCP clients at once
- **Message Broadcasting**: can send a message out to all connected clients at the same time

## Architecture

```
Web Client (Nuxt 3) <---> Socket.IO Server <---> TCP Server <---> TCP Clients
```

## Port Configuration

- **Nuxt App**: `http://localhost:3000`
- **TCP Server**: Port `3001`
- **Socket.IO Server**: Port `3002`

you can customize the port using environment variables:

```powershell
$env:TCP_PORT=3001; $env:SOCKET_PORT=3002; npm run tcp-server
```

## Message Format

### TCP Messages

```json
{
  "type": "user-message",
  "content": "Hello from TCP client",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Web Messages

```json
{
  "type": "web-message",
  "content": "Hello from web client",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Development

### Custom TCP Client

to create a custom tcp client:

```javascript
const net = require("net");

const client = new net.Socket();
client.connect(3001, "localhost", () => {
  console.log("Connected to TCP server");

  // Send message
  client.write(
    JSON.stringify({
      type: "user-message",
      content: "Hello from custom client",
      timestamp: new Date().toISOString(),
    })
  );
});

client.on("data", (data) => {
  const message = JSON.parse(data.toString());
  console.log("Received:", message);
});
```

### Extending Functionality

1. **Add Authentication**: implement user authentication for TCP clients
2. **Message Persistence**: store messages in database
3. **File Transfer**: add file transfer capability
4. **Encryption**: implement message encryption for security

## Troubleshooting

### Common Issues

1. **Port Already in Use**:

   - change port in environment variables
   - kill process using the port: `Get-Process -Port 3001 | Stop-Process`

2. **Connection Refused**:

   - ensure TCP server is running
   - check firewall settings
   - verify port configuration

3. **Socket.IO Not Connecting**:
   - check if Socket.IO server is running
   - verify CORS settings
   - check browser console for errors

### Debug Mode

enable debug logging:

```powershell
$env:DEBUG="socket.io*"; npm run tcp-server
```

## Production Deployment

1. **Build Nuxt app**:

```powershell
npm run build
```

2. **Use PM2 for process management**:

```powershell
npm install -g pm2
pm2 start server/tcp-server.js --name tcp-server
pm2 start npm --name nuxt-app -- run preview
```

3. **Configure reverse proxy** (nginx) untuk production setup.

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - feel free to use this project for learning and development.
