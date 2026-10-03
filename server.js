const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 25000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6, // 1MB payload buffer
    perMessageDeflate: {
      threshold: 1024, // Compress WebSocket broadcasts above 1KB
    },
  });

  // Store io instance globally so Next.js API routes can emit events
  global.io = io;

  io.on('connection', (socket) => {
    // Join game room
    socket.on('join_game', ({ gameId, gamePin, role, participantId }) => {
      if (gameId) socket.join(`game_${gameId}`);
      if (gamePin) socket.join(`pin_${gamePin}`);
      if (role === 'admin') socket.join(`admin_${gameId}`);
      if (role === 'arena') socket.join(`arena_${gameId}`);
      if (participantId) socket.join(`player_${participantId}`);

      console.log(`Socket ${socket.id} joined role=${role || 'player'} for gameId=${gameId}`);
    });

    socket.on('leave_game', ({ gameId, participantId }) => {
      if (gameId) socket.leave(`game_${gameId}`);
      if (participantId) socket.leave(`player_${participantId}`);
    });

    socket.on('disconnect', () => {
      // Disconnection handling
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Knowledge Exchange Server Ready on http://${hostname}:${port}`);
    console.log(`> Realtime Socket.IO initialized.`);
  });
});
