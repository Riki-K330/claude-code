// ModelUIFunctions.gs - モデル管理のUI関数

/**
 * 現在のモデル情報を表示
 */
function showCurrentModelInfo() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const currentModel = getCurrentModel();
    const modelInfo = getModelInfo(currentModel);
    
    let message = `現在のモデル設定:\n\n`;
    message += `モデル: ${modelInfo.name}\n`;
    message += `ID: ${currentModel}\n`;
    message += `説明: ${modelInfo.description}\n`;
    message += `最大トークン: ${modelInfo.maxTokens}\n`;
    message += `推奨: ${modelInfo.recommended ? "はい" : "いいえ"}\n\n`;
    message += `コスト（1000トークンあたり）:\n`;
    message += `- 入力: $${modelInfo.inputCostPer1K}\n`;
    message += `- 出力: $${modelInfo.outputCostPer1K}`;
    
    ui.alert('📊 現在のモデル情報', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ エラー',
      `モデル情報の取得に失敗しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * モデル切り替えメニュー
 */
function showModelSwitchMenu() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const models = getAvailableModels();
    const currentModel = getCurrentModel();
    
    let message = "使用するモデルを選択してください:\n\n";
    
    models.forEach((model, index) => {
      const current = model.id === currentModel ? " ★現在" : "";
      const recommended = model.recommended ? " 🔥推奨" : "";
      message += `${index + 1}. ${model.name}${current}${recommended}\n`;
      message += `   ${model.description}\n\n`;
    });
    
    const response = ui.prompt(
      '🔄 モデル切り替え',
      message + '番号を入力してください（1-' + models.length + '）:',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.OK) {
      const selection = parseInt(response.getResponseText());
      
      if (selection >= 1 && selection <= models.length) {
        const selectedModel = models[selection - 1];
        changeModel(selectedModel.id);
        
        ui.alert(
          '✅ モデル変更完了',
          `${selectedModel.name} に変更しました。\n\n${selectedModel.description}`,
          ui.ButtonSet.OK
        );
      } else {
        ui.alert('❌ エラー', '無効な番号です。', ui.ButtonSet.OK);
      }
    }
    
  } catch (error) {
    ui.alert(
      '❌ エラー',
      `モデル切り替えに失敗しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * 推奨モードに切り替え
 */
function switchToRecommendedModeUI() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const modelInfo = switchToRecommendedModel();
    
    ui.alert(
      '✅ 推奨モードに切り替え',
      `${modelInfo.name} に変更しました。\n\n${modelInfo.description}\n\nバランスの取れた高品質な応答を提供します。`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert(
      '❌ エラー',
      `推奨モードへの切り替えに失敗しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * 高速モードに切り替え
 */
function switchToFastModeUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚡ 高速モードに切り替え',
    '高速モード（Haiku）に切り替えますか？\n\n• 応答時間: 1-3秒\n• 品質: 標準\n• コスト: 最安',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      const modelInfo = switchToFastMode();
      
      ui.alert(
        '✅ 高速モードに切り替え完了',
        `${modelInfo.name} に変更しました。\n\n${modelInfo.description}\n\n高速で軽量な応答を提供します。`,
        ui.ButtonSet.OK
      );
      
    } catch (error) {
      ui.alert(
        '❌ エラー',
        `高速モードへの切り替えに失敗しました:\n${error.toString()}`,
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * 高品質モードに切り替え
 */
function switchToHighQualityModeUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '👑 高品質モードに切り替え',
    '高品質モード（Opus）に切り替えますか？\n\n• 応答時間: 15-20秒\n• 品質: 最高\n• コスト: 最高',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      const modelInfo = switchToHighQualityMode();
      
      ui.alert(
        '✅ 高品質モードに切り替え完了',
        `${modelInfo.name} に変更しました。\n\n${modelInfo.description}\n\n最高品質で詳細な応答を提供します。`,
        ui.ButtonSet.OK
      );
      
    } catch (error) {
      ui.alert(
        '❌ エラー',
        `高品質モードへの切り替えに失敗しました:\n${error.toString()}`,
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * モデル比較テスト実行
 */
function runModelComparisonUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚖️ モデル比較テスト',
    'すべてのモデルで同じ質問をテストし、応答時間と品質を比較します。\n\n注意: このテストには時間がかかり、APIコストが発生します。\n\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    ui.alert(
      '⚖️ テスト実行中',
      'モデル比較テストを実行しています...\nしばらくお待ちください。',
      ui.ButtonSet.OK
    );
    
    try {
      const results = testModelComparison();
      
      let message = "モデル比較テスト結果:\n\n";
      
      results.forEach(result => {
        message += `${result.name}:\n`;
        if (result.success) {
          message += `  ✅ 成功 - ${result.responseTime}ms\n`;
          message += `  文字数: ${result.contentLength}\n`;
        } else {
          message += `  ❌ 失敗\n`;
        }
        message += "\n";
      });
      
      message += "詳細はログを確認してください。";
      
      ui.alert('⚖️ モデル比較テスト結果', message, ui.ButtonSet.OK);
      
    } catch (error) {
      ui.alert(
        '❌ テストエラー',
        `比較テストに失敗しました:\n${error.toString()}`,
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * モデル設定の初期化実行
 */
function initializeModelSettingsUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🔧 モデル設定初期化',
    'モデル管理に必要な設定を初期化します。\n既存の設定は保持されます。\n\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      initializeModelSettings();
      
      ui.alert(
        '✅ 初期化完了',
        'モデル設定の初期化が完了しました。\n\n設定シートで詳細な調整が可能です。',
        ui.ButtonSet.OK
      );
      
    } catch (error) {
      ui.alert(
        '❌ 初期化エラー',
        `初期化に失敗しました:\n${error.toString()}`,
        ui.ButtonSet.OK
      );
    }
  }
}