// TestModelFunctions.gs - モデル切り替えテスト用の関数

/**
 * Sonnetモデルでテスト
 */
function testWithSonnet() {
  console.log("=== Sonnetモデルテスト ===");
  
  try {
    changeModel("claude-3-sonnet-20240229");
    return testAPIWithTimeout("アカルボースの価格を教えて", {}, 15000);
  } catch (error) {
    console.error("Sonnetテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Opusモデルでテスト
 */
function testWithOpus() {
  console.log("=== Opusモデルテスト ===");
  
  try {
    changeModel("claude-3-opus-20240229");
    return testAPIWithTimeout("アカルボースの価格を教えて", {}, 30000);
  } catch (error) {
    console.error("Opusテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Haikuモデルでテスト
 */
function testWithHaiku() {
  console.log("=== Haikuモデルテスト ===");
  
  try {
    changeModel("claude-3-haiku-20240307");
    return testAPIWithTimeout("アカルボースの価格を教えて", {}, 10000);
  } catch (error) {
    console.error("Haikuテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 3.5 Sonnetモデルでテスト
 */
function testWithSonnet35() {
  console.log("=== 3.5 Sonnetモデルテスト ===");
  
  try {
    changeModel("claude-3-5-sonnet-20241022");
    return testAPIWithTimeout("アカルボースの価格を教えて", {}, 15000);
  } catch (error) {
    console.error("3.5 Sonnetテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 簡単な速度比較テスト
 */
function quickSpeedTest() {
  console.log("=== 簡単な速度比較テスト ===");
  
  const testModels = [
    "claude-3-haiku-20240307",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229"
  ];
  
  const results = [];
  
  testModels.forEach(model => {
    try {
      console.log(`\n--- ${model} テスト ---`);
      changeModel(model);
      
      const startTime = new Date();
      const result = testAPIWithTimeout("こんにちは", {}, 30000);
      const endTime = new Date();
      
      results.push({
        model: model,
        modelName: AVAILABLE_MODELS[model]?.name || model,
        success: result.success,
        responseTime: endTime - startTime,
        cost: result.usage ? calculateModelCost(result.usage.input_tokens, result.usage.output_tokens, model) : 0
      });
      
    } catch (error) {
      console.error(`${model} エラー:`, error);
      results.push({
        model: model,
        success: false,
        error: error.toString()
      });
    }
  });
  
  // 結果表示
  console.log("\n=== 速度比較結果 ===");
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.modelName}: ${result.responseTime}ms, コスト: ¥${Math.round(result.cost * 100) / 100}`);
    } else {
      console.log(`${result.model}: エラー`);
    }
  });
  
  return results;
}

/**
 * 推奨設定に戻す
 */
function resetToRecommendedModel() {
  console.log("=== 推奨設定に戻す ===");
  
  try {
    const modelInfo = switchToRecommendedModel();
    console.log(`推奨モデル ${modelInfo.name} に変更しました`);
    return { success: true, model: modelInfo };
  } catch (error) {
    console.error("推奨設定への変更エラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 現在のモデル情報を確認
 */
function checkCurrentModel() {
  console.log("=== 現在のモデル情報 ===");
  
  try {
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    
    console.log("現在のモデル:", currentModel);
    console.log("モデル名:", modelInfo.name);
    console.log("説明:", modelInfo.description);
    console.log("最大トークン:", modelInfo.maxTokens);
    console.log("推奨:", modelInfo.recommended ? "はい" : "いいえ");
    console.log("入力コスト:", modelInfo.inputCostPer1K, "$/1000tokens");
    console.log("出力コスト:", modelInfo.outputCostPer1K, "$/1000tokens");
    
    return { success: true, model: currentModel, info: modelInfo };
  } catch (error) {
    console.error("モデル情報確認エラー:", error);
    return { success: false, error: error.toString() };
  }
}