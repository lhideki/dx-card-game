
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Card, EvaluationResponse, FinalEvaluationResponse } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseJsonFromText = <T,>(text: string): T => { // Changed: Throws error on failure now
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

export const evaluateCardPlay = async (
  currentChallenge: string, 
  card: Card, 
  themeName: string,
  signal?: AbortSignal 
): Promise<EvaluationResponse> => {
  const prompt = `あなたはゲームマスターです。現在の課題は以下の通りです。
課題: "${currentChallenge}"

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
    if (signal?.aborted) {
      console.log('Card evaluation aborted by signal before attempt:', card.term);
      throw new Error('Operation aborted by signal.');
    }
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      const parsed = parseJsonFromText<EvaluationResponse>(response.text); // Can throw
      if (typeof parsed.newChallenge !== 'string' || typeof parsed.evaluation !== 'string' || typeof parsed.situationImproved !== 'boolean') {
          console.error("Invalid JSON structure received from Gemini for card evaluation:", parsed, "Original Text:", response.text);
          throw new Error("カード評価の解析に失敗しました。結果の形式が正しくありません。");
      }
      return parsed; // Success

    } catch (error: any) {
      lastError = error;
      if (signal?.aborted || error.name === 'AbortError') {
        console.log('Card evaluation aborted or signal was aborted during attempt:', card.term);
        throw error; 
      }
      
      retries++;
      if (retries <= MAX_RETRIES) {
        const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
        console.warn(`カード評価API試行 ${retries}/${MAX_RETRIES}失敗: ${error.message}. ${delayTime}ms後に再試行...`);
        await delay(delayTime);
      }
    }
  }
  // All retries failed
  console.error(`カード評価に失敗しました (${MAX_RETRIES}回リトライ後)。最後の失敗理由:`, lastError);
  throw new Error(`カード評価中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};


export const getAdvice = async (currentChallenge: string, hand: Card[], themeName: string): Promise<string> => {
  const handDescription = hand.map(c => `- ${c.term} (コスト: ${c.cost}, インパクト: ${c.impact}): ${c.description.substring(0,50)}...`).join('\n');
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
      return response.text.trim(); // Success
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
  throw new Error(`アドバイス取得中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};

export const shuffleChallengeEffect = async (currentChallenge: string, themeName: string): Promise<string> => {
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
      return response.text.trim(); // Success
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
  throw new Error(`シャッフル効果取得中にAPIエラーが${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};

export const getFinalEvaluation = async (
  finalChallenge: string, 
  themeName: string, 
  challengeHistory: string[],
  cumulativeCost: number 
): Promise<FinalEvaluationResponse> => {
  const historyString = challengeHistory.map((item, index) => `ステップ${index + 1}: ${item}`).join('\n');
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
      const parsed = parseJsonFromText<FinalEvaluationResponse>(response.text); // Can throw
      if (typeof parsed.evaluationText !== 'string' || typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
        console.error("Invalid JSON structure or score for final evaluation:", parsed, "Original Text:", response.text);
        throw new Error("最終評価の解析に失敗しました。結果の形式が正しくありません。");
      }
      return parsed; // Success
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
    throw lastError; 
  }
  throw new Error(`最終評価の取得中に技術的な問題が${MAX_RETRIES}回のリトライ後も発生しました: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};
