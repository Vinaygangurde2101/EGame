import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateQuestionPoolCache } from '@/lib/question-cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId parameter required' }, { status: 400 });
    }

    const game = await db.game.findFirst({
      where: { OR: [{ id: gameId }, { gamePin: gameId }] },
    });

    if (!game) {
      return NextResponse.json({ success: true, questions: [] });
    }

    const questions = await db.question.findMany({
      where: { gameId: game.id },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      gameId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      category = 'General',
      difficulty = 'Medium',
      explanation,
      timerSeconds = 30,
      orderIndex = 1,
    } = body;

    if (!gameId || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json({ success: false, error: 'All question fields are required.' }, { status: 400 });
    }

    const game = await db.game.findFirst({
      where: { OR: [{ id: gameId }, { gamePin: gameId }] },
    });

    if (!game) {
      return NextResponse.json({ success: false, error: 'Target game not found' }, { status: 404 });
    }

    const question = await db.question.create({
      data: {
        gameId: game.id,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswer.toUpperCase(),
        category,
        difficulty,
        explanation,
        timerSeconds,
        orderIndex,
      },
    });

    // Invalidate in-memory question pool cache
    invalidateQuestionPoolCache(game.id);

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'questionId required' }, { status: 400 });
    }

    const question = await db.question.delete({
      where: { id: questionId },
      select: { gameId: true },
    });

    if (question?.gameId) {
      invalidateQuestionPoolCache(question.gameId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

