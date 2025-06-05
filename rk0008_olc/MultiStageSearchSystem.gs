// MultiStageSearchSystem.gs - 多段階検索システム

/**
 * 検索設定（調整可能）
 */
const SEARCH_CONFIG = {
  // Q&A関連
  qa_initial_count: 10,      // 初期Q&A取得数
  qa_ai_filter_count: 5,     // AIフィルター前の候補数
  qa_final_count: 3,         // 最終的に使用するQ&A数
  
  // 料金プラン関連
  price_plan_initial: 10,    // 初期料金プラン取得数
  price_plan_final: 5,       // 最終使用数
  
  // 薬剤情報関連
  medicine_count: 5,         // 薬剤情報取得数
  
  // システム設定
  enable_ai_filter: true,    // AI絞り込みのON/OFF
  enable_search_log: true,   // 検索ログのON/OFF
  max_tokens_per_filter: 200 // フィルター処理の最大トークン数
};

/**
 * 多段階検索の実行
 */
function executeMultiStageSearch(userMessage) {
  const searchLog = {
    timestamp: new Date(),
    originalQuery: userMessage,
    stages: {},
    totalTokens: 0,
    totalCost: 0
  };
  
  try {
    console.log("=== 多段階検索開始 ===");
    console.log("質問:", userMessage);
    
    // Stage 1: 意図解析（軽量AI）
    const stage1Result = analyzeUserIntent(userMessage, searchLog);
    if (!stage1Result.success) {
      throw new Error("意図解析に失敗しました");
    }
    
    // Stage 2: 各シートから候補データ取得
    const stage2Result = gatherCandidateData(stage1Result.intents, userMessage, searchLog);
    
    // Stage 3: AIフィルターで絞り込み（設定でON/OFFできる）
    let stage3Result;
    if (SEARCH_CONFIG.enable_ai_filter && needsFiltering(stage2Result)) {
      stage3Result = filterWithAI(stage2Result, stage1Result.intents, searchLog);
    } else {
      stage3Result = stage2Result; // フィルターなし
    }
    
    // Stage 4: 最終コンテキスト作成
    const finalContext = buildFinalContext(stage3Result, searchLog);
    
    // ログ出力
    if (SEARCH_CONFIG.enable_search_log) {
      logSearchProcess(searchLog);
    }
    
    return {
      success: true,
      context: finalContext,
      searchLog: searchLog
    };
    
  } catch (error) {
    console.error("多段階検索エラー:", error);
    searchLog.error = error.toString();
    
    return {
      success: false,
      error: error.toString(),
      searchLog: searchLog
    };
  }
}

/**
 * Stage 1: ユーザーの意図を解析（軽量AI使用）
 */
function analyzeUserIntent(userMessage, searchLog) {
  console.log("Stage 1: 意図解析");
  
  const startTime = new Date();
  
  try {
    // 軽量プロンプト
    const prompt = `質問から検索すべき項目を簡潔に抽出してください。
質問: "${userMessage}"

形式（各行に1項目）:
項目1: 内容
項目2: 内容

例:
項目1: マンジャロ5mg価格
項目2: アカルボース解約`;

    // 実際のAI呼び出し（軽量版）
    const response = callClaudeAPILightweight(prompt);
    
    // レスポンス解析
    const intents = parseIntentResponse(response.content);
    
    // ログ記録
    const endTime = new Date();
    searchLog.stages.stage1 = {
      description: "意図解析",
      startTime: startTime,
      endTime: endTime,
      duration: endTime - startTime,
      tokens: response.usage?.total_tokens || 100,
      result: intents
    };
    
    searchLog.totalTokens += response.usage?.total_tokens || 100;
    
    return {
      success: true,
      intents: intents
    };
    
  } catch (error) {
    console.error("意図解析エラー:", error);
    searchLog.stages.stage1 = {
      error: error.toString()
    };
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Stage 2: 各シートから候補データを収集
 */
function gatherCandidateData(intents, userMessage, searchLog) {
  console.log("Stage 2: 候補データ収集");
  
  const startTime = new Date();
  const candidates = {
    medicines: [],
    pricePlans: [],
    qaItems: [],
    totalCount: 0
  };
  
  try {
    // 各意図に基づいてデータ収集
    intents.forEach(intent => {
      console.log(`意図「${intent}」のデータ収集中...`);
      
      // キーワード抽出
      const keywords = extractKeywordsFromIntent(intent);
      
      // 薬剤情報検索
      if (needsMedicineSearch(intent)) {
        const medicines = searchMedicinesWithKeywords(keywords, SEARCH_CONFIG.medicine_count);
        candidates.medicines.push(...medicines);
      }
      
      // 料金プラン検索
      if (needsPriceSearch(intent)) {
        const plans = searchPricePlansWithKeywords(keywords, SEARCH_CONFIG.price_plan_initial);
        candidates.pricePlans.push(...plans);
      }
      
      // Q&A検索（類似度ベース）
      const qaItems = searchQAWithSimilarity(intent, userMessage, SEARCH_CONFIG.qa_initial_count);
      candidates.qaItems.push(...qaItems);
    });
    
    // 重複除去
    candidates.medicines = removeDuplicates(candidates.medicines, 'name');
    candidates.pricePlans = removeDuplicates(candidates.pricePlans, 'planId');
    candidates.qaItems = removeDuplicates(candidates.qaItems, 'question');
    
    candidates.totalCount = 
      candidates.medicines.length + 
      candidates.pricePlans.length + 
      candidates.qaItems.length;
    
    // ログ記録
    const endTime = new Date();
    searchLog.stages.stage2 = {
      description: "候補データ収集",
      startTime: startTime,
      endTime: endTime,
      duration: endTime - startTime,
      result: {
        medicineCount: candidates.medicines.length,
        priceCount: candidates.pricePlans.length,
        qaCount: candidates.qaItems.length,
        totalCount: candidates.totalCount
      }
    };
    
    console.log(`候補データ収集完了: 合計${candidates.totalCount}件`);
    
    return candidates;
    
  } catch (error) {
    console.error("データ収集エラー:", error);
    searchLog.stages.stage2 = {
      error: error.toString()
    };
    
    return candidates;
  }
}

/**
 * Stage 3: AIフィルターで関連データを絞り込み
 */
function filterWithAI(candidates, intents, searchLog) {
  console.log("Stage 3: AIフィルター");
  
  const startTime = new Date();
  const filtered = {
    medicines: candidates.medicines,
    pricePlans: candidates.pricePlans,
    qaItems: candidates.qaItems
  };
  
  try {
    // Q&Aのフィルタリング（数が多い場合のみ）
    if (candidates.qaItems.length > SEARCH_CONFIG.qa_final_count) {
      const qaFilterPrompt = buildQAFilterPrompt(
        intents, 
        candidates.qaItems, 
        SEARCH_CONFIG.qa_final_count
      );
      
      const qaResponse = callClaudeAPILightweight(qaFilterPrompt);
      const selectedQAIds = parseFilterResponse(qaResponse.content);
      
      filtered.qaItems = candidates.qaItems.filter((qa, index) => 
        selectedQAIds.includes(index)
      );
      
      searchLog.totalTokens += qaResponse.usage?.total_tokens || 150;
    }
    
    // 料金プランのフィルタリング（必要に応じて）
    if (candidates.pricePlans.length > SEARCH_CONFIG.price_plan_final) {
      const planFilterPrompt = buildPlanFilterPrompt(
        intents,
        candidates.pricePlans,
        SEARCH_CONFIG.price_plan_final
      );
      
      const planResponse = callClaudeAPILightweight(planFilterPrompt);
      const selectedPlanIds = parseFilterResponse(planResponse.content);
      
      filtered.pricePlans = candidates.pricePlans.filter((plan, index) => 
        selectedPlanIds.includes(index)
      );
      
      searchLog.totalTokens += planResponse.usage?.total_tokens || 100;
    }
    
    // ログ記録
    const endTime = new Date();
    searchLog.stages.stage3 = {
      description: "AIフィルター",
      startTime: startTime,
      endTime: endTime,
      duration: endTime - startTime,
      tokens: searchLog.totalTokens - (searchLog.stages.stage1?.tokens || 0),
      result: {
        filteredQA: filtered.qaItems.length,
        filteredPlans: filtered.pricePlans.length
      }
    };
    
    console.log("AIフィルター完了");
    
    return filtered;
    
  } catch (error) {
    console.error("フィルターエラー:", error);
    searchLog.stages.stage3 = {
      error: error.toString()
    };
    
    return candidates; // エラー時は元のデータを返す
  }
}

/**
 * Stage 4: 最終コンテキストの構築
 */
function buildFinalContext(filteredData, searchLog) {
  console.log("Stage 4: 最終コンテキスト構築");
  
  const context = {
    relatedMedicines: filteredData.medicines || [],
    pricePlans: filteredData.pricePlans || [],
    relatedQA: filteredData.qaItems || []
  };
  
  searchLog.stages.stage4 = {
    description: "最終コンテキスト構築",
    result: {
      medicineCount: context.relatedMedicines.length,
      priceCount: context.pricePlans.length,
      qaCount: context.relatedQA.length
    }
  };
  
  // コスト計算
  searchLog.totalCost = calculateSearchCost(searchLog.totalTokens);
  
  return context;
}

/**
 * 軽量版Claude API呼び出し
 */
function callClaudeAPILightweight(prompt) {
  // 実際のAI呼び出しをシミュレート（本番環境では実際のAPI呼び出しに置き換える）
  // 開発中は固定レスポンスを返す
  console.log("軽量AIプロンプト:", prompt);
  
  if (prompt.includes("質問から検索すべき項目を簡潔に抽出")) {
    // 意図解析のシミュレート
    const userQuery = prompt.match(/"([^"]+)"/)?.[1] || "";
    const intents = [];
    
    if (userQuery.includes("マンジャロ") && userQuery.includes("5")) {
      intents.push("項目1: マンジャロ5mg情報");
    }
    if (userQuery.includes("マンジャロ") && userQuery.includes("2.5")) {
      intents.push("項目2: マンジャロ2.5mg用量相談");
    }
    if (userQuery.includes("価格") || userQuery.includes("値段")) {
      intents.push("項目3: 価格問い合わせ");
    }
    if (userQuery.includes("アカルボース")) {
      intents.push("項目1: アカルボース情報");
    }
    // アカルボースの価格検索を明示的に追加
    if (userQuery.includes("アカルボース") && (userQuery.includes("価格") || userQuery.includes("値段"))) {
      intents.push("項目2: アカルボース料金プラン");
    }
    
    return {
      content: intents.join("\n") || "項目1: 一般的な質問",
      usage: { total_tokens: 100 }
    };
  }
  
  if (prompt.includes("以下のQ&Aから")) {
    // Q&Aフィルタリングのシミュレート
    // プロンプトから候補数を抽出
    const items = prompt.match(/\d+:/g)?.length || 0;
    const targetCount = parseInt(prompt.match(/最も関連する(\d+)つ/)?.[1] || "3");
    
    // ランダムに選択（実際にはAIが関連性で選択）
    const selected = [];
    for (let i = 0; i < Math.min(targetCount, items); i++) {
      selected.push(i);
    }
    
    return {
      content: selected.join(","),
      usage: { total_tokens: 150 }
    };
  }
  
  if (prompt.includes("以下の料金プランから")) {
    // 料金プランフィルタリングのシミュレート
    const items = prompt.match(/\d+:/g)?.length || 0;
    const targetCount = parseInt(prompt.match(/最も関連する(\d+)つ/)?.[1] || "3");
    
    const selected = [];
    for (let i = 0; i < Math.min(targetCount, items); i++) {
      selected.push(i);
    }
    
    return {
      content: selected.join(","),
      usage: { total_tokens: 100 }
    };
  }
  
  // デフォルトレスポンス
  return {
    content: "項目1: デフォルト応答",
    usage: { total_tokens: 50 }
  };
}

/**
 * 意図レスポンスの解析
 */
function parseIntentResponse(responseText) {
  const intents = [];
  const lines = responseText.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/項目\d+:\s*(.+)/);
    if (match) {
      intents.push(match[1].trim());
    }
  });
  
  return intents.length > 0 ? intents : ["一般的な質問"];
}

/**
 * フィルタリングが必要かどうかの判定
 */
function needsFiltering(candidates) {
  return candidates.qaItems.length > SEARCH_CONFIG.qa_final_count ||
         candidates.pricePlans.length > SEARCH_CONFIG.price_plan_final;
}

/**
 * 検索プロセスのログ出力
 */
function logSearchProcess(searchLog) {
  console.log("\n=== 多段階検索ログ ===");
  console.log("元の質問:", searchLog.originalQuery);
  
  Object.entries(searchLog.stages).forEach(([stage, data]) => {
    console.log(`\n${stage}: ${data.description || stage}`);
    if (data.duration) {
      console.log(`  実行時間: ${data.duration}ms`);
    }
    if (data.tokens) {
      console.log(`  使用トークン: ${data.tokens}`);
    }
    if (data.result) {
      console.log(`  結果:`, data.result);
    }
    if (data.error) {
      console.log(`  エラー:`, data.error);
    }
  });
  
  console.log(`\n合計トークン: ${searchLog.totalTokens}`);
  console.log(`推定コスト: ¥${searchLog.totalCost}`);
  console.log("===================\n");
}

/**
 * 検索コストの計算
 */
function calculateSearchCost(totalTokens) {
  // Claude 4 Sonnetの料金で計算（入力のみと仮定）
  const costPer1K = 0.005;
  const usdToJpy = 150;
  return Math.round((totalTokens / 1000) * costPer1K * usdToJpy * 100) / 100;
}