import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Card } from '../../../types';
const modelName = 'gemini-2.5-flash-preview-04-17';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable not set. Please ensure it\'s available.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const { currentChallenge, hand, themeName } = await request.json();

    const handDescription = hand.map((c: Card) => `- ${c.term} (コスト: ${c.cost}, インパクト: ${c.impact}): ${c.description.substring(0,50)}...`).join('\n');

    const prompt = `あなたは経験豊富なDXコンサルタント兼ゲームマスターです。
現在の課題: "${currentChallenge}"
プレイヤーの手札:
${handDescription}
ゲームのテーマ: 「${themeName}」

プレイヤーに、現在の課題と手札を考慮して、次にどのカードを使うべきか、または一般的な戦略について具体的なアドバイスを100字以内で提供してください。特にコストとインパクトのバランスも考慮してアドバイスしてください。`;

    let retries = 0;
    let lastError: any = null;

    while(retries <= MAX_RETRIES) {
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        return NextResponse.json({ advice: (response.text || '').trim() });
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries <= MAX_RETRIES) {
          const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
          console.warn(`アドバイス取得API試行 ${retries}/${MAX_RETRIES}失敗: ${error.message}. ${delayTime}ms後に再試行...`);
          await delay(delayTime);
        }
      }
    }

    console.error(`アドバイス取得に失敗しました (${MAX_RETRIES}回リトライ後)。最後の失敗理由:`, lastError);
    return NextResponse.json(
      { error: `アドバイス取得中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}` },
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
