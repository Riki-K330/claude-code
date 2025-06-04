// SetupModelSettings.gs - モデル設定の一括セットアップ

/**
 * 利用可能なClaudeモデル定義（Claude 4を含む最新版）
 */
const AVAILABLE_MODELS = {
  "claude-4-sonnet-20250514": {
    name: "Claude 4 Sonnet",
    description: "最新世代・超高性能（応答時間: 2-5秒）",
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.025,
    maxTokens: 8192,
    recommended: true,
    generation: 4
  },
  "claude-4-opus-20250514": {
    name: "Claude 4 Opus",
    description: "最高峰・究極品質（応答時間: 8-15秒）",
    inputCostPer1K: 0.025,
    outputCostPer1K: 0.125,
    maxTokens: 8192,
    recommended: false,
    generation: 4
  },
  "claude-3-5-sonnet-20241022": {
    name: "Claude 3.5 Sonnet",
    description: "前世代最高性能（応答時間: 3-8秒）",
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 8192,
    recommended: false,
    generation: 3.5
  },
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    description: "前世代高品質（応答時間: 15-20秒）",
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    maxTokens: 4096,
    recommended: false,
    generation: 3
  },
  "claude-3-sonnet-20240229": {
    name: "Claude 3 Sonnet",
    description: "前世代バランス型（応答時間: 5-10秒）",
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 4096,
    recommended: false,
    generation: 3
  },
  "claude-3-haiku-20240307": {
    name: "Claude 3 Haiku",
    description: "前世代高速（応答時間: 1-3秒）",
    inputCostPer1K: 0.00025,
    outputCostPer1K: 0.00125,
    maxTokens: 4096,
    recommended: false,
    generation: 3
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
 * モデル設定を初期化
 */
function initializeModelSettings() {
  console.log("=== モデル設定初期化 ===");
  
  const settings = [
    {
      key: "api_model",
      value: "claude-4-sonnet-20250514",
      description: "使用するClaudeモデル（推奨: Claude 4 Sonnet）"
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
 * タイムアウト付きAPI呼び出しテスト（統合版）
 */
function testAPIWithTimeout(message, context, timeoutMs) {
  const startTime = new Date();
  console.log(`API呼び出し開始（タイムアウト: ${timeoutMs}ms）...`);
  console.log(`テストメッセージ: "${message}"`);
  
  try {
    console.log("ステータス: API呼び出し実行中...");
    
    const result = callClaudeAPI(message, context);
    
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`API呼び出し完了。実行時間: ${duration}ms`);
    
    if (duration > timeoutMs) {
      console.warn(`⚠️ タイムアウト閾値（${timeoutMs}ms）を超過: ${duration}ms`);
    }
    
    if (result.success && result.content) {
      console.log("レスポンス内容（最初の100文字）:", result.content.substring(0, 100) + "...");
    }
    
    return result;
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.error(`API呼び出しエラー（${duration}ms後）:`, error);
    
    return {
      success: false,
      error: error.toString(),
      duration: duration,
      timedOut: duration > timeoutMs
    };
  }
}

/**
 * モデル管理システムの完全セットアップ
 */
function setupCompleteModelSystem() {
  console.log("=== モデル管理システム完全セットアップ ===");
  
  try {
    // 1. モデル設定の初期化
    console.log("1. モデル設定初期化");
    initializeModelSettings();
    
    // 2. スプレッドシートにモデル設定を追加
    console.log("2. スプレッドシート設定追加");
    addModelSettingsToSheet();
    
    // 3. 推奨モデルに設定
    console.log("3. 推奨モデルに設定");
    switchToRecommendedModel();
    
    // 4. 設定確認
    console.log("4. 設定確認");
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    
    console.log("✅ セットアップ完了");
    console.log(`現在のモデル: ${modelInfo.name}`);
    console.log(`応答時間: ${modelInfo.description}`);
    
    return { 
      success: true, 
      currentModel: currentModel,
      modelInfo: modelInfo
    };
    
  } catch (error) {
    console.error("❌ セットアップエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * スプレッドシートにモデル設定を追加
 */
function addModelSettingsToSheet() {
  console.log("スプレッドシートにモデル設定を追加中...");
  
  try {
    const modelSettings = [
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
      },
      {
        key: "model_auto_optimize",
        value: "TRUE",
        description: "コストと品質を自動最適化"
      },
      {
        key: "model_performance_mode",
        value: "balanced",
        description: "パフォーマンスモード（fast/balanced/quality）"
      }
    ];
    
    // 既存の設定を確認し、新しい設定のみ追加
    modelSettings.forEach(setting => {
      const existingValue = getSetting(setting.key);
      if (existingValue === null) {
        setSetting(setting.key, setting.value, setting.description);
        console.log(`追加: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`既存: ${setting.key} = ${existingValue}`);
      }
    });
    
    console.log("モデル設定追加完了");
    return true;
    
  } catch (error) {
    console.error("モデル設定追加エラー:", error);
    return false;
  }
}

/**
 * 利用可能なモデル一覧を表示
 */
function showAvailableModels() {
  console.log("=== 利用可能なモデル一覧 ===");
  
  const models = getAvailableModels();
  
  models.forEach((model, index) => {
    console.log(`${index + 1}. ${model.name} (${model.id})`);
    console.log(`   ${model.description}`);
    console.log(`   推奨: ${model.recommended ? "はい" : "いいえ"}`);
    console.log(`   最大トークン: ${model.maxTokens}`);
    console.log(`   コスト: 入力$${model.inputCostPer1K}/1K, 出力$${model.outputCostPer1K}/1K`);
    console.log("");
  });
  
  return models;
}

/**
 * モデル設定のバックアップ
 */
function backupModelSettings() {
  console.log("=== モデル設定バックアップ ===");
  
  try {
    const currentSettings = {
      model: getCurrentModel(),
      maxTokens: DynamicConfig.get("api_max_tokens", CONFIG.MAX_TOKENS),
      temperature: DynamicConfig.get("api_temperature", CONFIG.TEMPERATURE),
      autoOptimize: DynamicConfig.get("model_auto_optimize", "TRUE"),
      performanceMode: DynamicConfig.get("model_performance_mode", "balanced"),
      timestamp: new Date()
    };
    
    // バックアップをログに出力
    console.log("現在の設定:");
    console.log(JSON.stringify(currentSettings, null, 2));
    
    // 設定シートにバックアップを保存
    setSetting("model_settings_backup", JSON.stringify(currentSettings), "モデル設定バックアップ");
    
    console.log("✅ バックアップ完了");
    return currentSettings;
    
  } catch (error) {
    console.error("❌ バックアップエラー:", error);
    return null;
  }
}

/**
 * モデル設定の復元
 */
function restoreModelSettings() {
  console.log("=== モデル設定復元 ===");
  
  try {
    const backupData = getSetting("model_settings_backup");
    
    if (!backupData) {
      console.log("バックアップデータが見つかりません");
      return false;
    }
    
    const settings = JSON.parse(backupData);
    console.log("復元する設定:");
    console.log(JSON.stringify(settings, null, 2));
    
    // 設定を復元
    changeModel(settings.model);
    setSetting("api_max_tokens", settings.maxTokens);
    setSetting("api_temperature", settings.temperature);
    setSetting("model_auto_optimize", settings.autoOptimize);
    setSetting("model_performance_mode", settings.performanceMode);
    
    console.log("✅ 復元完了");
    return true;
    
  } catch (error) {
    console.error("❌ 復元エラー:", error);
    return false;
  }
}

/**
 * 最適なモデルを自動選択
 */
function autoSelectOptimalModel() {
  console.log("=== 最適モデル自動選択 ===");
  
  try {
    const performanceMode = DynamicConfig.get("model_performance_mode", "balanced");
    let selectedModel;
    
    switch (performanceMode) {
      case "fast":
        selectedModel = "claude-3-haiku-20240307";
        console.log("高速モード: Haikuを選択");
        break;
      case "quality":
        selectedModel = "claude-3-opus-20240229";
        console.log("高品質モード: Opusを選択");
        break;
      case "balanced":
      default:
        selectedModel = "claude-3-sonnet-20240229";
        console.log("バランスモード: Sonnetを選択");
        break;
    }
    
    changeModel(selectedModel);
    const modelInfo = getModelInfo(selectedModel);
    
    console.log(`✅ 最適モデル選択完了: ${modelInfo.name}`);
    return { success: true, model: selectedModel, info: modelInfo };
    
  } catch (error) {
    console.error("❌ 最適モデル選択エラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Sonnetモデルでテスト（実行しやすい関数）
 */
function testSonnetModel() {
  console.log("=== Sonnetモデルテスト ===");
  
  try {
    // 設定を確認
    console.log("現在のモデル:", getCurrentModel());
    
    // Sonnetに変更
    changeModel("claude-3-sonnet-20240229");
    console.log("Sonnetモデルに変更しました");
    
    // テスト実行
    const result = testAPIWithTimeout("アカルボースの価格を簡潔に教えて", {}, 20000);
    
    console.log("✅ Sonnetテスト完了");
    return result;
    
  } catch (error) {
    console.error("❌ Sonnetテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 高速モード切り替え（実行しやすい関数）
 */
function switchToFastMode() {
  console.log("=== 高速モードに切り替え ===");
  
  try {
    changeModel("claude-3-haiku-20240307");
    const modelInfo = getModelInfo("claude-3-haiku-20240307");
    
    console.log(`✅ ${modelInfo.name}に変更しました`);
    console.log(`応答時間: ${modelInfo.description}`);
    
    return { success: true, model: "claude-3-haiku-20240307", info: modelInfo };
    
  } catch (error) {
    console.error("❌ 高速モード切り替えエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Claude 4 Sonnetでテスト
 */
function testClaude4Sonnet() {
  console.log("=== Claude 4 Sonnetテスト ===");
  
  try {
    changeModel("claude-4-sonnet-20250514");
    console.log("Claude 4 Sonnetに変更しました");
    
    const result = testAPIWithTimeout("アカルボースの価格を簡潔に教えて", {}, 15000);
    
    console.log("✅ Claude 4 Sonnetテスト完了");
    return result;
    
  } catch (error) {
    console.error("❌ Claude 4 Sonnetテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Claude 4 Opusでテスト
 */
function testClaude4Opus() {
  console.log("=== Claude 4 Opusテスト ===");
  
  try {
    changeModel("claude-4-opus-20250514");
    console.log("Claude 4 Opusに変更しました");
    
    const result = testAPIWithTimeout("アカルボースの価格を詳しく教えて", {}, 25000);
    
    console.log("✅ Claude 4 Opusテスト完了");
    return result;
    
  } catch (error) {
    console.error("❌ Claude 4 Opusテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * スプレッドシートにモデル選択用のプルダウンを設定
 */
function setupModelDropdown() {
  console.log("=== モデル選択プルダウン設定 ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    if (!sheet) {
      console.error("設定シートが見つかりません");
      return false;
    }
    
    // api_modelの行を探す
    const data = sheet.getDataRange().getValues();
    let modelRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "api_model") {
        modelRow = i + 1; // スプレッドシートは1ベース
        break;
      }
    }
    
    if (modelRow === -1) {
      console.log("api_model設定が見つかりません。追加します。");
      const newRow = sheet.getLastRow() + 1;
      sheet.getRange(newRow, 1, 1, 4).setValues([
        ["api_model", "claude-4-sonnet-20250514", "使用するClaudeモデル", new Date()]
      ]);
      modelRow = newRow;
    }
    
    // プルダウンのオプションを作成
    const modelOptions = Object.keys(AVAILABLE_MODELS).map(key => {
      const model = AVAILABLE_MODELS[key];
      return `${key} | ${model.name} | Gen${model.generation} | ${model.description}`;
    });
    
    // データ検証ルールを設定
    const range = sheet.getRange(modelRow, 2); // B列（値の列）
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(Object.keys(AVAILABLE_MODELS), true)
      .setAllowInvalid(false)
      .setHelpText("利用可能なClaudeモデルから選択してください")
      .build();
    
    range.setDataValidation(rule);
    
    // ヘルプ情報を追加
    const helpRange = sheet.getRange(modelRow, 3);
    helpRange.setValue("Claudeモデル選択（プルダウン）");
    
    // 現在のモデル情報を隣のセルに表示
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    const infoRange = sheet.getRange(modelRow, 5); // E列に情報表示
    infoRange.setValue(`現在: ${modelInfo.name} | ${modelInfo.description} | コスト: 入力$${modelInfo.inputCostPer1K}/1K 出力$${modelInfo.outputCostPer1K}/1K`);
    
    console.log("✅ プルダウン設定完了");
    console.log(`現在のモデル: ${modelInfo.name}`);
    
    return true;
    
  } catch (error) {
    console.error("❌ プルダウン設定エラー:", error);
    return false;
  }
}

/**
 * 現在のモデル情報をスプレッドシートに表示
 */
function updateCurrentModelInfo() {
  console.log("=== 現在のモデル情報更新 ===");
  
  try {
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    // api_modelの行を探す
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "api_model") {
        const infoRange = sheet.getRange(i + 1, 5); // E列
        infoRange.setValue(`現在: ${modelInfo.name} | ${modelInfo.description} | コスト: 入力$${modelInfo.inputCostPer1K}/1K 出力$${modelInfo.outputCostPer1K}/1K`);
        break;
      }
    }
    
    console.log(`✅ モデル情報更新完了: ${modelInfo.name}`);
    return modelInfo;
    
  } catch (error) {
    console.error("❌ モデル情報更新エラー:", error);
    return null;
  }
}

/**
 * Claude 4推奨モードに切り替え
 */
function switchToClaude4() {
  console.log("=== Claude 4推奨モードに切り替え ===");
  
  try {
    changeModel("claude-4-sonnet-20250514");
    const modelInfo = getModelInfo("claude-4-sonnet-20250514");
    updateCurrentModelInfo();
    
    console.log(`✅ ${modelInfo.name}に変更しました`);
    console.log(`応答時間: ${modelInfo.description}`);
    
    return { success: true, model: "claude-4-sonnet-20250514", info: modelInfo };
    
  } catch (error) {
    console.error("❌ Claude 4切り替えエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * スプレッドシートの変更を監視して自動でモデルを切り替え
 */
function setupAutoModelSwitch() {
  console.log("=== 自動モデル切り替え設定 ===");
  
  try {
    // 既存のトリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onModelSettingChange') {
        ScriptApp.deleteTrigger(trigger);
        console.log("既存のトリガーを削除しました");
      }
    });
    
    // 新しいトリガーを作成（編集時トリガー）
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const trigger = ScriptApp.newTrigger('onModelSettingChange')
      .onEdit()
      .create();
    
    console.log("✅ 自動切り替え設定完了");
    console.log("🎯 スプレッドシートでモデルを変更すると自動的に反映されます");
    console.log("📋 対象: 設定シートのapi_modelセル（B列）");
    
    return true;
    
  } catch (error) {
    console.error("❌ 自動切り替え設定エラー:", error);
    console.log("📝 手動設定の手順:");
    console.log("1. Google Apps Scriptエディタで「トリガー」を開く");
    console.log("2. 「+ トリガーを追加」をクリック");
    console.log("3. 関数: onModelSettingChange");
    console.log("4. イベントソース: スプレッドシートから");
    console.log("5. イベントタイプ: 編集時");
    console.log("6. 保存");
    return false;
  }
}

/**
 * 簡単な自動切り替えセットアップ（手動設定不要）
 */
function setupSimpleAutoSwitch() {
  console.log("=== 簡単自動切り替え設定 ===");
  
  try {
    // 設定シートに説明を追加
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    // api_modelの行を探す
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "api_model") {
        // F列に操作説明を追加
        const instructionRange = sheet.getRange(i + 1, 6);
        instructionRange.setValue("プルダウンで選択後、syncCurrentModel()を実行");
        break;
      }
    }
    
    console.log("✅ 簡単切り替え設定完了");
    console.log("🎯 使用方法:");
    console.log("1. スプレッドシートでモデルを選択");
    console.log("2. syncCurrentModel()関数を実行");
    console.log("3. 自動でモデル情報が更新されます");
    
    return true;
    
  } catch (error) {
    console.error("❌ 簡単切り替え設定エラー:", error);
    return false;
  }
}

/**
 * スプレッドシート編集時の自動処理（トリガー関数）
 */
function onModelSettingChange(e) {
  try {
    // 設定シートの変更かチェック
    if (e.source.getActiveSheet().getName() !== CONFIG.SHEET_NAMES.SETTINGS) {
      return;
    }
    
    // api_modelの変更かチェック
    const range = e.range;
    const editedRow = range.getRow();
    const editedCol = range.getColumn();
    
    // B列（値の列）でapi_modelの行かチェック
    if (editedCol === 2) {
      const keyCell = e.source.getActiveSheet().getRange(editedRow, 1);
      const key = keyCell.getValue();
      
      if (key === "api_model") {
        const newModel = range.getValue();
        console.log(`モデル変更検出: ${newModel}`);
        
        // モデルが有効かチェック
        if (AVAILABLE_MODELS[newModel]) {
          console.log(`✅ ${AVAILABLE_MODELS[newModel].name}に自動切り替え`);
          updateCurrentModelInfo();
          
          // 通知（オプション）
          showModelChangeNotification(newModel);
        } else {
          console.error(`❌ 無効なモデル: ${newModel}`);
          // 無効なモデルの場合、推奨モデルに戻す
          const recommendedModel = "claude-4-sonnet-20250514";
          range.setValue(recommendedModel);
          updateCurrentModelInfo();
          showModelChangeNotification(recommendedModel);
        }
      }
    }
    
  } catch (error) {
    console.error("自動切り替えエラー:", error);
  }
}

/**
 * モデル変更通知の表示
 */
function showModelChangeNotification(modelId) {
  try {
    const modelInfo = getModelInfo(modelId);
    const message = `モデルが ${modelInfo.name} に変更されました\n\n${modelInfo.description}\n\nコスト: 入力$${modelInfo.inputCostPer1K}/1K 出力$${modelInfo.outputCostPer1K}/1K`;
    
    // 通知をトーストで表示
    SpreadsheetApp.getActive().toast(message, "🔄 モデル変更", 5);
    
  } catch (error) {
    console.error("通知エラー:", error);
  }
}

/**
 * 現在の設定値から最新のモデル情報を同期
 */
function syncCurrentModel() {
  console.log("=== 現在のモデル同期 ===");
  
  try {
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    
    console.log(`現在のモデル: ${modelInfo.name}`);
    console.log(`応答時間: ${modelInfo.description}`);
    console.log(`コスト: 入力$${modelInfo.inputCostPer1K}/1K 出力$${modelInfo.outputCostPer1K}/1K`);
    
    // スプレッドシートの情報も更新
    updateCurrentModelInfo();
    
    return { success: true, model: currentModel, info: modelInfo };
    
  } catch (error) {
    console.error("❌ モデル同期エラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * モデル別のAPIコスト計算
 */
function calculateModelCost(inputTokens, outputTokens, modelName = null) {
  const model = modelName || getCurrentModel();
  const modelInfo = getModelInfo(model);
  
  if (!modelInfo) {
    console.error(`モデル情報が見つかりません: ${model}`);
    // フォールバック: デフォルトのClaude 3 Sonnet料金を使用
    const usdToJpy = parseFloat(getSetting("api_usd_to_jpy", "150"));
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    return (inputCost + outputCost) * usdToJpy;
  }
  
  const usdToJpy = parseFloat(getSetting("api_usd_to_jpy", "150"));
  
  const inputCost = (inputTokens / 1000) * modelInfo.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * modelInfo.outputCostPer1K;
  
  return (inputCost + outputCost) * usdToJpy;
}

/**
 * 完全なモデル切り替えシステムのセットアップ
 */
function setupCompleteModelSwitchingSystem() {
  console.log("=== 完全なモデル切り替えシステムセットアップ ===");
  
  try {
    // 1. モデルドロップダウンの設定
    console.log("1. モデルドロップダウン設定");
    setupModelDropdown();
    
    // 2. 自動切り替えトリガーの設定
    console.log("2. 自動切り替えトリガー設定");
    setupAutoModelSwitch();
    
    // 3. Claude 4を推奨モデルに設定
    console.log("3. Claude 4推奨モデルに設定");
    switchToClaude4();
    
    // 4. 現在のモデル情報を更新
    console.log("4. モデル情報更新");
    updateCurrentModelInfo();
    
    console.log("✅ 完全なモデル切り替えシステムセットアップ完了");
    console.log("🎯 使用方法: スプレッドシートのapi_modelセルでモデルを選択すると自動的に切り替わります");
    
    return true;
    
  } catch (error) {
    console.error("❌ システムセットアップエラー:", error);
    return false;
  }
}