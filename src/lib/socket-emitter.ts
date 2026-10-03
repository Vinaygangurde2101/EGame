export function emitGameEvent(gameId: string, eventName: string, payload: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`game_${gameId}`).emit(eventName, payload);
    io.to(`pin_${gameId}`).emit(eventName, payload);
    if (payload?.gameId) {
      io.to(`game_${payload.gameId}`).emit(eventName, payload);
      io.to(`pin_${payload.gameId}`).emit(eventName, payload);
    }
    if (payload?.gamePin) {
      io.to(`game_${payload.gamePin}`).emit(eventName, payload);
      io.to(`pin_${payload.gamePin}`).emit(eventName, payload);
    }
  }
}

export function emitPlayerEvent(participantId: string, eventName: string, payload: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`player_${participantId}`).emit(eventName, payload);
  }
}

