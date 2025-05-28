import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FinalEvaluationResponse } from '../../../types';
const modelName = 'gemini-2.5-flash-preview-04-17';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseJsonFromText = <T,>(text: string): T => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original string for parsing:", jsonStr, "Original text from API:", text);
    try {
        const fixedJsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixedJsonStr) as T;
    } catch (e2) {
        console.error("Failed to parse JSON after attempting to fix:", e2);
        throw new Error(`JSON解析に失敗しました: ${e2 instanceof Error ? e2.message : String(e2)}. 元の文字列: ${jsonStr}`);
    }
  }
};

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

    const { finalChallenge, themeName, challengeHistory, cumulativeCost } = await request.json();

    const historyString = challengeHistory.map((item: string, index: number) => `ステップ${index + 1}: ${item}`).join('\n');
    const prompt = `あなたはゲームマスターです。DX用語解決ゲームが終了しました。
最終的な課題の状況: "${finalChallenge}"
ゲームのテーマ: 「${themeName}」
課題の変遷:
${historyString}
累計コスト: ${cumulativeCost}

プレイヤーが初期の課題をどの程度解決できたか、総合的な最終評価を行い、以下のJSON形式で応答してください。他のテキストは含めないでください。
{
  "evaluationText": "プレイヤーの総合的な最終評価と戦略的コメント（200字以内）",
  "score": 課題解決度と費やした累計コスト(${cumulativeCost})を総合的に判断し、0から100の整数で評価した点数。コストパフォーマンスも考慮してください（例：低いコストで高い成果なら高評価）。"
}`;

    let retries = 0;
    let lastError: any = null;

    while(retries <= MAX_RETRIES) {
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        const responseText = response.text || '';
        const parsed = parseJsonFromText<FinalEvaluationResponse>(responseText);
        if (typeof parsed.evaluationText !== 'string' || typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
          console.error("Invalid JSON structure or score for final evaluation:", parsed, "Original Text:", responseText);
          throw new Error("最終評価の解析に失敗しました。結果の形式が正しくありません。");
        }
        return NextResponse.json(parsed);
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries <= MAX_RETRIES) {
          const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
          console.warn(`最終評価取得API試行 ${retries}/${MAX_RETRIES}失敗: ${error.message}. ${delayTime}ms後に再試行...`);
          await delay(delayTime);
        }
      }
    }

    console.error(`最終評価取得に失敗しました (${MAX_RETRIES}回リトライ後)。最後の失敗理由:`, lastError);
    if (lastError instanceof Error && lastError.message.startsWith("最終評価の解析に失敗しました")) {
      return NextResponse.json({ error: lastError.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: `最終評価の取得中に技術的な問題が${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}` },
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
