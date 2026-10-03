export function emitGameEvent(gameId: string, eventName: string, payload: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`game_${gameId}`).emit(eventName, payload);
  }
}

export function emitPlayerEvent(participantId: string, eventName: string, payload: any) {
  const io = (global as any).io;
  if (io) {
    io.to(`player_${participantId}`).emit(eventName, payload);
  }
}
