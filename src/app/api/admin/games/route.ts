import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { invalidateQuestionPoolCache } from '@/lib/question-cache';

export async function GET() {
  try {
    const games = await db.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
            questions: true,
            rounds: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, games });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId parameter is required.' }, { status: 400 });
    }

    const game = await db.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
    }

    await db.game.delete({
      where: { id: gameId },
    });

    cache.invalidatePattern(gameId);
    invalidateQuestionPoolCache(gameId);

    return NextResponse.json({ success: true, message: 'Game deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

