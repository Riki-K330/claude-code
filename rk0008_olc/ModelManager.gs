// ModelManager.gs - APIモデル管理モジュール

/**
 * 利用可能なClaudeモデル定義
 */
const AVAILABLE_MODELS = {
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    description: "最高品質・最も詳細な回答（応答時間: 15-20秒）",
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    maxTokens: 4096,
    recommended: false
  },
  "claude-3-sonnet-20240229": {
    name: "Claude 3 Sonnet",
    description: "高品質・バランス型（応答時間: 3-8秒）",
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 4096,
    recommended: true
  },
  "claude-3-5-sonnet-20241022": {
    name: "Claude 3.5 Sonnet",
    description: "最新・高性能（応答時間: 3-8秒）",
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 8192,
    recommended: true
  },
  "claude-3-haiku-20240307": {
    name: "Claude 3 Haiku",
    description: "高速・軽量（応答時間: 1-3秒）",
    inputCostPer1K: 0.00025,
    outputCostPer1K: 0.00125,
    maxTokens: 4096,
    recommended: false
  }
};

/**
 * 現在使用中のモデルを取得
 */
function getCurrentModel() {
  const modelFromSheet = DynamicConfig.get("api_model", CONFIG.MODEL);
  
  // 利用可能なモデルかチェック
  if (AVAILABLE_MODELS[modelFromSheet]) {
    return modelFromSheet;
  }
  
  // 利用可能でない場合はデフォルトを返す
  console.warn(`指定されたモデル ${modelFromSheet} は利用できません。デフォルトモデルを使用します。`);
  return CONFIG.MODEL;
}

/**
 * モデルを変更
 */
function changeModel(newModel) {
  if (!AVAILABLE_MODELS[newModel]) {
    throw new Error(`指定されたモデル ${newModel} は利用できません。利用可能なモデル: ${Object.keys(AVAILABLE_MODELS).join(', ')}`);
  }
  
  setSetting("api_model", newModel, `${AVAILABLE_MODELS[newModel].name}に変更`);
  console.log(`モデルを ${AVAILABLE_MODELS[newModel].name} に変更しました`);
  
  return AVAILABLE_MODELS[newModel];
}

/**
 * モデル情報を取得
 */
function getModelInfo(modelName = null) {
  const model = modelName || getCurrentModel();
  return AVAILABLE_MODELS[model] || null;
}

/**
 * 利用可能なモデル一覧を取得
 */
function getAvailableModels() {
  return Object.keys(AVAILABLE_MODELS).map(key => ({
    id: key,
    ...AVAILABLE_MODELS[key]
  }));
}

/**
 * モデル比較テスト
 */
function testModelComparison() {
  console.log("=== モデル比較テスト ===");
  
  const testMessage = "アカルボースの価格を簡潔に教えて";
  const models = ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"];
  
  const results = [];
  
  for (const model of models) {
    try {
      console.log(`\n--- ${AVAILABLE_MODELS[model].name} テスト ---`);
      
      // 一時的にモデルを変更
      const originalModel = getCurrentModel();
      setSetting("api_model", model);
      
      const startTime = new Date();
      const result = testAPIWithTimeout(testMessage, {}, 30000);
      const endTime = new Date();
      
      results.push({
        model: model,
        name: AVAILABLE_MODELS[model].name,
        success: result.success,
        responseTime: endTime - startTime,
        contentLength: result.content ? result.content.length : 0,
        preview: result.content ? result.content.substring(0, 100) + "..." : "エラー"
      });
      
      // 元のモデルに戻す
      setSetting("api_model", originalModel);
      
    } catch (error) {
      console.error(`${model} テストエラー:`, error);
      results.push({
        model: model,
        name: AVAILABLE_MODELS[model].name,
        success: false,
        error: error.toString()
      });
    }
  }
  
  // 結果表示
  console.log("\n=== テスト結果 ===");
  results.forEach(result => {
    console.log(`${result.name}:`);
    console.log(`  成功: ${result.success}`);
    if (result.success) {
      console.log(`  応答時間: ${result.responseTime}ms`);
      console.log(`  応答長: ${result.contentLength}文字`);
      console.log(`  内容: ${result.preview}`);
    } else {
      console.log(`  エラー: ${result.error}`);
    }
    console.log("");
  });
  
  return results;
}

/**
 * モデル設定を初期化
 */
function initializeModelSettings() {
  console.log("=== モデル設定初期化 ===");
  
  const settings = [
    {
      key: "api_model",
      value: "claude-3-sonnet-20240229",
      description: "使用するClaudeモデル（推奨: Sonnet）"
    },
    {
      key: "api_max_tokens_auto",
      value: "TRUE",
      description: "モデルに応じてmax_tokensを自動調整"
    },
    {
      key: "api_temperature",
      value: "0.7",
      description: "応答のランダム性（0.0-1.0）"
    },
    {
      key: "model_switch_enabled",
      value: "TRUE",
      description: "UIからのモデル切り替えを許可"
    }
  ];
  
  settings.forEach(setting => {
    const existingValue = getSetting(setting.key);
    if (existingValue === null) {
      setSetting(setting.key, setting.value, setting.description);
      console.log(`設定追加: ${setting.key} = ${setting.value}`);
    }
  });
  
  console.log("モデル設定初期化完了");
}

/**
 * 動的なAPIコスト計算（モデル別）
 */
function calculateModelCost(inputTokens, outputTokens, modelName = null) {
  const model = modelName || getCurrentModel();
  const modelInfo = getModelInfo(model);
  
  if (!modelInfo) {
    console.error(`モデル情報が見つかりません: ${model}`);
    return 0;
  }
  
  const usdToJpy = parseFloat(DynamicConfig.get("api_usd_to_jpy", 150));
  
  const inputCost = (inputTokens / 1000) * modelInfo.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * modelInfo.outputCostPer1K;
  
  return (inputCost + outputCost) * usdToJpy;
}

/**
 * 推奨モデルの切り替え
 */
function switchToRecommendedModel() {
  const recommendedModels = Object.keys(AVAILABLE_MODELS)
    .filter(key => AVAILABLE_MODELS[key].recommended);
  
  if (recommendedModels.length > 0) {
    const newModel = recommendedModels[0]; // 最初の推奨モデル
    changeModel(newModel);
    return AVAILABLE_MODELS[newModel];
  }
  
  throw new Error("推奨モデルが見つかりません");
}

/**
 * 高速モードに切り替え
 */
function switchToFastMode() {
  const fastModel = "claude-3-haiku-20240307";
  changeModel(fastModel);
  return AVAILABLE_MODELS[fastModel];
}

/**
 * 高品質モードに切り替え
 */
function switchToHighQualityMode() {
  const qualityModel = "claude-3-opus-20240229";
  changeModel(qualityModel);
  return AVAILABLE_MODELS[qualityModel];
}