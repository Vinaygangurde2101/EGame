import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
