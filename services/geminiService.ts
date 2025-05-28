import type { Card, EvaluationResponse, FinalEvaluationResponse } from '../types';

export async function evaluateCardPlay(
  currentChallenge: string,
  card: Card,
  themeName: string,
  signal?: AbortSignal
): Promise<EvaluationResponse> {
  const response = await fetch('/api/evaluate-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentChallenge,
      card,
      themeName
    }),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to evaluate card');
  }

  return response.json();
}

export async function getAdvice(
  currentChallenge: string,
  hand: Card[],
  themeName: string
): Promise<string> {
  const response = await fetch('/api/get-advice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentChallenge,
      hand,
      themeName
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get advice');
  }

  const data = await response.json();
  return data.advice;
}

export async function shuffleChallengeEffect(
  currentChallenge: string,
  themeName: string
): Promise<string> {
  const response = await fetch('/api/shuffle-challenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentChallenge,
      themeName
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get shuffle effect');
  }

  const data = await response.json();
  return data.newChallenge;
}

export async function getFinalEvaluation(
  finalChallenge: string,
  themeName: string,
  challengeHistory: string[],
  cumulativeCost: number
): Promise<FinalEvaluationResponse> {
  const response = await fetch('/api/final-evaluation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      finalChallenge,
      themeName,
      challengeHistory,
      cumulativeCost
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get final evaluation');
  }

  return response.json();
}