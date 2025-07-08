// WebSocket reconnection configuration
const MAX_RECONNECT_INTERVAL = 60000; // Maximum delay: 1 minute
let reconnectInterval = 1000; // Initial delay: 1 second
let socket;

// Connect to WebSocket server with automatic reconnection
const connect = () => {
  socket = new WebSocket('ws://localhost:4321');

  // Reset reconnection delay on successful connection
  socket.addEventListener('open', () => {
    console.log('[ws] connected');
    reconnectInterval = 1000;
  });

  // Handle incoming messages
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[ws]', data);

      window.location.reload();
    } catch (error) {
      console.error('[ws] error with the message', error, event.data);
    }
  });

  // Reconnect with exponential backoff when connection closes
  socket.addEventListener('close', () => {
    console.log(`[ws] disconnected, reconnecting in ${reconnectInterval}ms`);

    setTimeout(connect, reconnectInterval);
    // Increase reconnection delay (exponential backoff) up to the maximum
    reconnectInterval = Math.min(reconnectInterval * 2, MAX_RECONNECT_INTERVAL);
  });

  socket.addEventListener('error', (error) => {
    console.error('[ws] error:', error);
  });
};

// Start the WebSocket connection
connect();
