// TestAutoSwitching.gs - 自動モデル切り替えのテスト関数

/**
 * 自動モデル切り替えシステムの完全テスト
 */
function testCompleteAutoSwitching() {
  console.log("=== 自動モデル切り替えシステム完全テスト ===");
  
  try {
    // 1. システムセットアップ
    console.log("1. システムセットアップ");
    const setupResult = setupCompleteModelSwitchingSystem();
    
    if (!setupResult) {
      console.error("❌ システムセットアップに失敗しました");
      return false;
    }
    
    // 2. 初期モデル確認
    console.log("2. 初期モデル確認");
    const initialModel = getCurrentModel();
    const initialInfo = getModelInfo(initialModel);
    console.log(`現在のモデル: ${initialInfo.name} (${initialModel})`);
    
    // 3. コスト計算テスト
    console.log("3. コスト計算テスト");
    const testInputTokens = 1000;
    const testOutputTokens = 500;
    
    Object.keys(AVAILABLE_MODELS).forEach(modelId => {
      const cost = calculateModelCost(testInputTokens, testOutputTokens, modelId);
      const modelInfo = getModelInfo(modelId);
      console.log(`${modelInfo.name}: ${testInputTokens}入力 + ${testOutputTokens}出力 = ¥${Math.round(cost * 100) / 100}`);
    });
    
    // 4. モデル切り替えテスト
    console.log("4. モデル切り替えテスト");
    const testModels = ["claude-4-sonnet-20250514", "claude-4-opus-20250514", "claude-3-5-sonnet-20241022"];
    
    for (const modelId of testModels) {
      console.log(`\n--- ${AVAILABLE_MODELS[modelId].name} への切り替えテスト ---`);
      
      try {
        changeModel(modelId);
        const currentInfo = getModelInfo(getCurrentModel());
        console.log(`✅ 切り替え成功: ${currentInfo.name}`);
        
        // モデル情報更新テスト
        updateCurrentModelInfo();
        console.log("✅ モデル情報更新完了");
        
      } catch (error) {
        console.error(`❌ ${modelId} への切り替えエラー:`, error);
      }
    }
    
    // 5. 推奨モデルに戻す
    console.log("5. 推奨モデルに戻す");
    switchToClaude4();
    
    console.log("✅ 自動モデル切り替えシステムテスト完了");
    return true;
    
  } catch (error) {
    console.error("❌ テストエラー:", error);
    return false;
  }
}

/**
 * コスト計算の精度をテスト
 */
function testModelCostCalculation() {
  console.log("=== モデル別コスト計算テスト ===");
  
  const testCases = [
    { input: 1000, output: 500, description: "通常の会話" },
    { input: 5000, output: 2000, description: "長い回答" },
    { input: 100, output: 50, description: "短い質問" }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n--- ${testCase.description} (入力: ${testCase.input}, 出力: ${testCase.output}) ---`);
    
    Object.keys(AVAILABLE_MODELS).forEach(modelId => {
      const cost = calculateModelCost(testCase.input, testCase.output, modelId);
      const modelInfo = getModelInfo(modelId);
      const costPerToken = cost / (testCase.input + testCase.output);
      
      console.log(`${modelInfo.name.padEnd(20)} ¥${Math.round(cost * 100) / 100} (¥${Math.round(costPerToken * 10000) / 10000}/token)`);
    });
  });
  
  console.log("\n✅ コスト計算テスト完了");
}

/**
 * スプレッドシートのドロップダウン設定をテスト
 */
function testDropdownSetup() {
  console.log("=== ドロップダウン設定テスト ===");
  
  try {
    const result = setupModelDropdown();
    
    if (result) {
      console.log("✅ ドロップダウン設定成功");
      
      // 現在のモデル情報表示
      const currentModel = getCurrentModel();
      const modelInfo = getModelInfo(currentModel);
      console.log(`現在のモデル: ${modelInfo.name}`);
      console.log(`説明: ${modelInfo.description}`);
      console.log(`コスト: 入力$${modelInfo.inputCostPer1K}/1K 出力$${modelInfo.outputCostPer1K}/1K`);
      
      return true;
    } else {
      console.error("❌ ドロップダウン設定に失敗しました");
      return false;
    }
    
  } catch (error) {
    console.error("❌ ドロップダウンテストエラー:", error);
    return false;
  }
}

/**
 * 利用可能なモデル一覧の表示とテスト
 */
function testAvailableModels() {
  console.log("=== 利用可能モデル一覧テスト ===");
  
  try {
    const models = getAvailableModels();
    
    console.log(`利用可能なモデル数: ${models.length}`);
    console.log("\nモデル詳細:");
    
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.id})`);
      console.log(`   世代: ${model.generation}`);
      console.log(`   説明: ${model.description}`);
      console.log(`   推奨: ${model.recommended ? "はい" : "いいえ"}`);
      console.log(`   最大トークン: ${model.maxTokens}`);
      console.log(`   コスト: 入力$${model.inputCostPer1K}/1K 出力$${model.outputCostPer1K}/1K`);
      console.log("");
    });
    
    // Claude 4モデルの確認
    const claude4Models = models.filter(model => model.generation === 4);
    console.log(`Claude 4モデル数: ${claude4Models.length}`);
    claude4Models.forEach(model => {
      console.log(`  - ${model.name}: ${model.description}`);
    });
    
    console.log("✅ モデル一覧テスト完了");
    return true;
    
  } catch (error) {
    console.error("❌ モデル一覧テストエラー:", error);
    return false;
  }
}