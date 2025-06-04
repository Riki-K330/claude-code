// UIDebugFunctions.gs - デバッグ機能のUIメニュー用関数

/**
 * クイック診断実行（UIメニュー用）
 */
function runQuickDiagnosis() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '🔍 クイック診断実行',
    'ハング問題の基本的な原因を診断します...',
    ui.ButtonSet.OK
  );
  
  try {
    const result = quickDiagnoseHangingIssue();
    
    let message = "クイック診断結果:\n\n";
    message += `設定チェック: ${result.configCheck ? "✅" : "❌"}\n`;
    message += `ネットワークチェック: ${result.networkCheck ? "✅" : "❌"}\n`;
    message += `ペイロードチェック: ${result.payloadCheck ? "✅" : "❌"}\n\n`;
    
    if (result.recommendations && result.recommendations.length > 0) {
      message += "推奨対応:\n";
      result.recommendations.forEach((rec, i) => {
        message += `${i + 1}. ${rec}\n`;
      });
    } else {
      message += "基本設定に問題なし。\n包括的API診断を実行することを推奨します。";
    }
    
    ui.alert('🔍 クイック診断結果', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ 診断エラー',
      `エラーが発生しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * ネットワーク診断実行（UIメニュー用）
 */
function runNetworkDiagnosis() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '🌐 ネットワーク診断実行',
    'API接続の問題を診断します...',
    ui.ButtonSet.OK
  );
  
  try {
    const result = diagnoseAPIConnection();
    
    let message = "ネットワーク診断結果:\n\n";
    message += `基本ネットワーク接続: ${result.networkOk ? "✅ 正常" : "❌ 異常"}\n`;
    message += `API接続: ${result.apiEndpointAccessible ? "✅ 正常" : "❌ 異常"}\n`;
    message += `ステータスコード: ${result.statusCode || "不明"}\n\n`;
    
    if (result.error) {
      message += `エラー詳細: ${result.error}`;
    } else if (result.networkOk && result.apiEndpointAccessible) {
      message += "ネットワーク接続は正常です。\nAPI認証の問題の可能性があります。";
    } else {
      message += "ネットワーク接続に問題があります。\nインターネット接続を確認してください。";
    }
    
    ui.alert('🌐 ネットワーク診断結果', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ 診断エラー',
      `エラーが発生しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * 包括的API診断実行（UIメニュー用）
 */
function runComprehensiveAPITestUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🔧 包括的API診断',
    'この診断には時間がかかる場合があります。\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  ui.alert(
    '🔧 診断実行中',
    '包括的API診断を実行しています...\nしばらくお待ちください。',
    ui.ButtonSet.OK
  );
  
  try {
    const result = runComprehensiveAPITest();
    
    let message = "包括的API診断結果:\n\n";
    
    if (result.success) {
      message += "✅ すべてのテストが成功しました！\n";
      message += "API呼び出し機能は正常に動作しています。";
    } else {
      message += `❌ ${result.step}ステップで失敗しました。\n\n`;
      message += `エラー詳細: ${result.error}\n\n`;
      
      // ステップ別の対応策
      switch (result.step) {
        case "config":
          message += "対応策: Config.gsファイルでAPIキーを正しく設定してください。";
          break;
        case "network":
          message += "対応策: インターネット接続を確認してください。";
          break;
        case "auth":
          message += "対応策: APIキーが正しいか確認してください。";
          break;
        case "minimal_api":
          message += "対応策: APIの制限や一時的な問題の可能性があります。時間をおいて再試行してください。";
          break;
        case "real_prompt":
          message += "対応策: プロンプトやコンテキストデータが大きすぎる可能性があります。";
          break;
        default:
          message += "対応策: 予期しないエラーです。ログを確認してください。";
      }
    }
    
    ui.alert('🔧 包括的API診断結果', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ 診断エラー',
      `予期しないエラーが発生しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * APIペイロード診断実行（UIメニュー用）
 */
function runPayloadDiagnosis() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '📊 ペイロード診断実行',
    'API呼び出しのペイロードサイズを確認します...',
    ui.ButtonSet.OK
  );
  
  try {
    const result = diagnoseAPIPayload();
    
    let message = "ペイロード診断結果:\n\n";
    message += `意図分類: ${result.intentClassification}\n`;
    message += `コンテキストサイズ:\n`;
    message += `  薬剤情報: ${result.contextSize.medicines}件\n`;
    message += `  料金プラン: ${result.contextSize.plans}件\n`;
    message += `  Q&A: ${result.contextSize.qa}件\n\n`;
    message += `プロンプト長:\n`;
    message += `  システム: ${result.promptLength.system}文字\n`;
    message += `  コンテキスト: ${result.promptLength.contextual}文字\n`;
    message += `  合計: ${result.promptLength.total}文字\n\n`;
    message += `ペイロードサイズ: ${result.payloadSize}bytes\n\n`;
    
    if (result.payloadSize > 100000) {
      message += "⚠️ ペイロードサイズが大きすぎます。\nコンテキストデータを削減することを検討してください。";
    } else {
      message += "✅ ペイロードサイズは適切です。";
    }
    
    ui.alert('📊 ペイロード診断結果', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ 診断エラー',
      `エラーが発生しました:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}