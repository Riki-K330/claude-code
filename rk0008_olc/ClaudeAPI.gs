// ClaudeAPI.gs - Claude API連携モジュール

/**
 * Claude APIを呼び出してAI応答を生成
 * @param {string} userMessage - ユーザーからの質問
 * @param {object} context - 追加コンテキスト情報
 * @return {object} API応答結果
 */
function callClaudeAPI(userMessage, context = {}) {
  try {
    // デバッグ用ログ
    console.log("API_KEY確認:", CONFIG.API_KEY ? "設定済み" : "未設定");
    console.log("SHEET_ID確認:", CONFIG.SHEET_ID ? "設定済み" : "未設定");
    
    // 一時的にvalidateConfigをスキップしてテスト
    // validateConfig();
    
    // プロンプトの構築（動的設定対応）
    const systemPrompt = getDynamicSystemPrompt ? getDynamicSystemPrompt() : getSystemPrompt();
    const contextualPrompt = buildContextualPrompt(userMessage, context);
    
    // 動的モデル設定の取得
    const currentModel = getCurrentModel ? getCurrentModel() : CONFIG.MODEL;
    const modelInfo = getModelInfo ? getModelInfo(currentModel) : null;
    const maxTokens = DynamicConfig.get("api_max_tokens_auto", "TRUE") === "TRUE" && modelInfo
      ? Math.min(modelInfo.maxTokens, parseInt(DynamicConfig.get("api_max_tokens", CONFIG.MAX_TOKENS)))
      : parseInt(DynamicConfig.get("api_max_tokens", CONFIG.MAX_TOKENS));
    
    // APIリクエストペイロード
    const payload = {
      model: currentModel,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: contextualPrompt
        }
      ],
      max_tokens: maxTokens,
      temperature: parseFloat(DynamicConfig.get("api_temperature", CONFIG.TEMPERATURE))
    };
    
    // APIリクエストオプション
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CONFIG.API_KEY,
        "anthropic-version": CONFIG.ANTHROPIC_VERSION
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    // API呼び出し
    const startTime = new Date();
    const response = UrlFetchApp.fetch(
      "https://api.anthropic.com/v1/messages",
      options
    );
    const endTime = new Date();
    
    // レスポンス処理
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      console.error("Claude API Error:", responseText);
      throw new Error(`API Error: ${responseCode}`);
    }
    
    const result = JSON.parse(responseText);
    
    // 使用量トラッキング（モデル別コスト計算）
    trackAPIUsage(
      result.usage?.input_tokens || 0,
      result.usage?.output_tokens || 0,
      endTime - startTime,
      currentModel
    );
    
    return {
      success: true,
      content: result.content[0].text,
      usage: result.usage,
      responseTime: endTime - startTime
    };
    
  } catch (error) {
    console.error("Claude API Error:", error);
    return {
      success: false,
      error: error.toString(),
      content: CONFIG.ERROR_MESSAGES.API_ERROR
    };
  }
}

/**
 * コンテキストを含むプロンプトを構築
 */
function buildContextualPrompt(userMessage, context) {
  let prompt = userMessage;
  
  // 関連する薬剤情報を追加
  if (context.relatedMedicines && context.relatedMedicines.length > 0) {
    prompt += "\n\n【関連薬剤情報】\n";
    context.relatedMedicines.forEach(med => {
      prompt += `- ${med.name}: ${med.description}\n`;
    });
  }
  
  // 関連する料金プランを追加
  if (context.pricePlans && context.pricePlans.length > 0) {
    prompt += "\n\n【料金プラン情報】\n";
    prompt += "※以下の料金情報のみを使用してください。これ以外の価格は絶対に使用しないでください。\n";
    context.pricePlans.forEach(plan => {
      prompt += `- ${plan.planId}: ${plan.medicine} ${plan.period} ${plan.quantity} = ${plan.price}円（${plan.notes}）\n`;
    });
    prompt += "※上記の料金プラン情報に記載されている金額以外は回答に使用しないでください。\n";
  }
  
  // 関連するQ&Aを追加
  if (context.relatedQA && context.relatedQA.length > 0) {
    prompt += "\n\n【参考Q&A】\n";
    context.relatedQA.forEach(qa => {
      prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
    });
  }
  
  // 会話履歴を追加
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    prompt += "\n\n【直前の会話】\n";
    context.conversationHistory.forEach(conv => {
      prompt += `ユーザー: ${conv.user}\nアシスタント: ${conv.assistant}\n\n`;
    });
  }
  
  // デバッグ用ログ
  console.log("構築されたプロンプト:", prompt);
  
  return prompt;
}

/**
 * API使用量を記録
 */
function trackAPIUsage(inputTokens, outputTokens, responseTime, modelName = null) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
    
    if (!sheet) {
      console.error("API使用量シートが見つかりません");
      return;
    }
    
    const timestamp = new Date();
    const usedModel = modelName || getCurrentModel() || CONFIG.MODEL;
    const cost = calculateModelCost ? 
      calculateModelCost(inputTokens, outputTokens, usedModel) : 
      calculateAPICost(inputTokens, outputTokens);
    
    // メールアドレスを取得
    const userEmail = getCurrentUserEmail ? getCurrentUserEmail() : "unknown@example.com";
    
    sheet.appendRow([
      timestamp,
      usedModel,
      inputTokens,
      outputTokens,
      inputTokens + outputTokens,
      cost,
      responseTime,
      Utilities.formatDate(timestamp, "JST", "yyyy-MM"),
      userEmail
    ]);
    
    // 月間予算チェック
    checkMonthlyBudget(sheet);
    
  } catch (error) {
    console.error("使用量トラッキングエラー:", error);
  }
}

/**
 * API使用コストを計算（概算）
 */
function calculateAPICost(inputTokens, outputTokens) {
  // 動的設定がある場合はそちらを使用
  if (typeof calculateDynamicAPICost === 'function') {
    return calculateDynamicAPICost(inputTokens, outputTokens);
  }
  
  // Claude-3-Opusの料金（2024年6月時点の概算）
  const inputCostPer1K = 0.015; // $0.015 per 1K tokens
  const outputCostPer1K = 0.075; // $0.075 per 1K tokens
  const usdToJpy = 150; // 為替レート（要更新）
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return (inputCost + outputCost) * usdToJpy;
}

/**
 * 月間予算をチェックしてアラート
 */
function checkMonthlyBudget(sheet) {
  const currentMonth = Utilities.formatDate(new Date(), "JST", "yyyy-MM");
  const data = sheet.getDataRange().getValues();
  
  let monthlyTotal = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === currentMonth) {
      monthlyTotal += data[i][5]; // コスト列
    }
  }
  
  if (monthlyTotal > CONFIG.MONTHLY_BUDGET) {
    sendBudgetAlert(monthlyTotal);
  }
}