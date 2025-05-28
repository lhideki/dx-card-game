import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Card, EvaluationResponse } from '../../../types';
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

    const { currentChallenge, card, themeName } = await request.json();

    const prompt = `あなたはゲームマスターです。現在の課題は以下の通りです。
課題: "${currentChallenge}"
ゲームのテーマ: 「${themeName}」

プレイヤーが選択したDX用語カードは以下の通りです。
カード名: ${card.term}
ユースケース: ${card.useCase}
説明: ${card.description}
インパクト: ${card.impact}
コスト: ${card.cost}

このカードの選択が、現在の課題（テーマ「${themeName}」）に対してどのような影響を与えるか評価してください。
評価のポイント：
1. カードが課題解決に貢献するか？（カードのインパクトとコストを考慮してください）
2. 課題の状況が具体的にどう変化したか？（カードのインパクトとコストが変化の大きさに影響します。ポジティブにもネガティブにもなり得ます）
3. プレイヤーの選択は適切だったか？（コストに見合う効果が得られそうか、なども考慮してください）

以下のJSON形式で応答してください。他のテキストは含めないでください。
{
  "newChallenge": "カード使用後の新しい課題状況（150字以内）",
  "evaluation": "プレイヤーの選択に対する評価と、状況変化の理由（インパクトとコストを考慮した内容。100字以内）",
  "situationImproved": trueかfalse (課題解決に向けて状況が改善した場合はtrue、悪化または停滞した場合はfalse)
}`;

    let retries = 0;
    let lastError: any = null;

    while (retries <= MAX_RETRIES) {
      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || '';
        const parsed = parseJsonFromText<EvaluationResponse>(responseText);
        if (typeof parsed.newChallenge !== 'string' || typeof parsed.evaluation !== 'string' || typeof parsed.situationImproved !== 'boolean') {
            console.error("Invalid JSON structure received from Gemini for card evaluation:", parsed, "Original Text:", responseText);
            throw new Error("カード評価の解析に失敗しました。結果の形式が正しくありません。");
        }
        return NextResponse.json(parsed);

      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries <= MAX_RETRIES) {
          const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
          console.warn(`カード評価API試行 ${retries}/${MAX_RETRIES}失敗: ${error.message}. ${delayTime}ms後に再試行...`);
          await delay(delayTime);
        }
      }
    }

    console.error(`カード評価に失敗しました (${MAX_RETRIES}回リトライ後)。最後の失敗理由:`, lastError);
    return NextResponse.json(
      { error: `カード評価中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}` },
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
