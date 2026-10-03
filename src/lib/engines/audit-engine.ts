import { db } from '../db';

export async function logAuditEvent({
  gameId,
  participantId,
  roundId,
  eventType,
  metadata,
}: {
  gameId: string;
  participantId?: string;
  roundId?: string;
  eventType: string;
  metadata?: Record<string, any>;
}) {
  try {
    await db.auditLog.create({
      data: {
        gameId,
        participantId,
        roundId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
