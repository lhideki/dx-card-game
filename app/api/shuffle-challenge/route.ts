import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set. Please ensure it\'s available.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { currentChallenge, themeName } = await request.json();

    const prompt = `あなたはゲームマスターです。プレイヤーがカードをシャッフルした結果、予期せぬイベントが発生しました。
現在の課題: "${currentChallenge}"
ゲームのテーマ: 「${themeName}」

このシャッフルにより、課題の状況がどのようにランダムに（多くの場合、少し悪化する方向に）変化したか、100字程度で説明してください。新しい状況は現在の課題と関連性を保ちつつも、明確に異なるものにしてください。`;

    let retries = 0;
    let lastError: any = null;

    while(retries <= MAX_RETRIES) {
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        return NextResponse.json({ newChallenge: (response.text || '').trim() });
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries <= MAX_RETRIES) {
          const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
          console.warn(`シャッフル効果取得API試行 ${retries}/${MAX_RETRIES}失敗: ${error.message}. ${delayTime}ms後に再試行...`);
          await delay(delayTime);
        }
      }
    }

    console.error(`シャッフル効果取得に失敗しました (${MAX_RETRIES}回リトライ後)。最後の失敗理由:`, lastError);
    return NextResponse.json(
      { error: `シャッフル効果取得中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}` },
      { status: 500 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
