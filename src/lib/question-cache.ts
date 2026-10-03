import { db } from './db';
import { ensureGameQuestionsExist } from './engines/question-defaults';

export interface CachedQuestion {
  id: string;
  gameId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  category: string;
  difficulty: string;
  explanation: string | null;
  timerSeconds: number;
  orderIndex: number;
}

// In-memory map store: gameId -> array of questions
const questionPoolCache = new Map<string, CachedQuestion[]>();

/**
 * Loads and caches all questions for a given game in memory.
 */
export async function getGameQuestionsFromPool(gameId: string): Promise<CachedQuestion[]> {
  if (questionPoolCache.has(gameId)) {
    return questionPoolCache.get(gameId)!;
  }

  // Fetch questions from database
  let questions = await db.question.findMany({
    where: { gameId },
    orderBy: { orderIndex: 'asc' },
  });

  // Auto-populate default questions if none exist
  if (questions.length === 0) {
    questions = await ensureGameQuestionsExist(gameId);
  }

  questionPoolCache.set(gameId, questions);
  return questions;
}

/**
 * Retrieves a question for a specific round directly from the in-memory pool.
 */
export async function getQuestionForRoundFromPool(gameId: string, roundNumber: number): Promise<CachedQuestion | null> {
  const pool = await getGameQuestionsFromPool(gameId);
  if (!pool || pool.length === 0) return null;
  return pool.find((q) => q.orderIndex === roundNumber) || pool[roundNumber - 1] || null;
}

/**
 * Retrieves a question by its questionId directly from the in-memory pool.
 */
export async function getQuestionByIdFromPool(gameId: string, questionId: string): Promise<CachedQuestion | null> {
  const pool = await getGameQuestionsFromPool(gameId);
  if (!pool || pool.length === 0) return null;
  return pool.find((q) => q.id === questionId) || null;
}

/**
 * Invalidates in-memory question pool cache when questions are added, updated, or deleted.
 */
export function invalidateQuestionPoolCache(gameId: string) {
  questionPoolCache.delete(gameId);
}
