// APIDebugTools.gs - API呼び出しのデバッグ・診断機能

/**
 * 段階的API診断テスト（統合版）
 * runTestChat()がハングする問題を診断するためのメイン関数
 */
function runComprehensiveAPITest() {
  console.log("=== 包括的API診断テスト ===");
  
  try {
    // ステップ1: 設定確認
    console.log("ステップ1: 設定確認");
    if (CONFIG.API_KEY === "your-claude-api-key-here") {
      console.error("❌ APIキーが設定されていません");
      return { success: false, step: "config", error: "APIキー未設定" };
    }
    console.log("✅ APIキー設定確認済み");
    console.log("APIキー形式:", CONFIG.API_KEY ? `${CONFIG.API_KEY.substring(0, 8)}...${CONFIG.API_KEY.substring(CONFIG.API_KEY.length-4)}` : "なし");
    
    // ステップ2: ネットワーク診断
    console.log("\nステップ2: ネットワーク診断");
    const networkResult = diagnoseAPIConnection();
    if (!networkResult.networkOk) {
      console.error("❌ ネットワーク接続に問題があります");
      return { success: false, step: "network", error: "ネットワーク接続失敗" };
    }
    console.log("✅ ネットワーク接続正常");
    
    // ステップ3: API認証テスト（簡易）
    console.log("\nステップ3: 簡易API認証テスト");
    const authResult = testAPIAuthentication();
    if (!authResult.success) {
      console.error("❌ API認証に失敗:", authResult.error);
      return { success: false, step: "auth", error: authResult.error };
    }
    console.log("✅ API認証テスト成功");
    
    // ステップ4: 最小API呼び出し
    console.log("\nステップ4: 最小API呼び出しテスト");
    const minimalResult = testAPIWithTimeout("hello", {}, 10000);
    if (!minimalResult.success) {
      console.error("❌ 最小API呼び出し失敗:", minimalResult.error);
      return { success: false, step: "minimal_api", error: minimalResult.error };
    }
    console.log("✅ 最小API呼び出し成功");
    
    // ステップ5: 実際のプロンプトテスト
    console.log("\nステップ5: 実際のプロンプトテスト");
    const realResult = testAPIWithTimeout("アカルボースの価格を教えて", {}, 30000);
    if (!realResult.success) {
      console.error("❌ 実際のプロンプトテスト失敗:", realResult.error);
      return { success: false, step: "real_prompt", error: realResult.error };
    }
    console.log("✅ 実際のプロンプトテスト成功");
    
    console.log("\n🎉 すべてのテストが成功しました！");
    return { success: true, message: "包括的API診断テスト完了" };
    
  } catch (error) {
    console.error("❌ 予期しないエラー:", error);
    return { success: false, step: "unexpected", error: error.toString() };
  }
}

/**
 * タイムアウト付きAPI呼び出しテスト
 */
function testAPIWithTimeout(message, context, timeoutMs) {
  const startTime = new Date();
  console.log(`API呼び出し開始（タイムアウト: ${timeoutMs}ms）...`);
  console.log(`テストメッセージ: "${message}"`);
  
  try {
    // プログレス表示のためのログ
    console.log("ステータス: API呼び出し実行中...");
    
    // Google Apps Scriptでは直接的なタイムアウト設定は困難なため、
    // UrlFetchAppのデフォルトタイムアウトに依存
    const result = callClaudeAPI(message, context);
    
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`API呼び出し完了。実行時間: ${duration}ms`);
    
    if (duration > timeoutMs) {
      console.warn(`⚠️ タイムアウト閾値（${timeoutMs}ms）を超過: ${duration}ms`);
    }
    
    // レスポンス内容の簡易表示
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
 * API接続のネットワーク診断
 */
function diagnoseAPIConnection() {
  console.log("=== API接続診断 ===");
  
  try {
    // 1. 基本的なネットワーク接続テスト
    console.log("1. ネットワーク接続テスト");
    const testUrl = "https://httpbin.org/get";
    const testResponse = UrlFetchApp.fetch(testUrl, { muteHttpExceptions: true });
    const networkOk = testResponse.getResponseCode() === 200;
    console.log("ネットワーク接続:", networkOk ? "正常" : "異常");
    
    // 2. Anthropic APIエンドポイントへのアクセステスト
    console.log("2. Anthropic APIエンドポイント接続テスト");
    const apiTestResponse = UrlFetchApp.fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "invalid-key-test",
          "anthropic-version": CONFIG.ANTHROPIC_VERSION
        },
        payload: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10
        }),
        muteHttpExceptions: true
      }
    );
    
    const statusCode = apiTestResponse.getResponseCode();
    console.log("API接続ステータス:", statusCode);
    console.log("レスポンス:", apiTestResponse.getContentText().substring(0, 200));
    
    // 401はAPIキーエラー（接続は成功）、その他は接続問題の可能性
    const apiEndpointAccessible = statusCode === 401;
    if (apiEndpointAccessible) {
      console.log("✅ APIエンドポイントへの接続は正常（認証エラーは期待通り）");
    } else {
      console.log("⚠️ APIエンドポイントへの接続に問題がある可能性");
    }
    
    return {
      networkOk: networkOk,
      apiEndpointAccessible: apiEndpointAccessible,
      statusCode: statusCode
    };
    
  } catch (error) {
    console.error("診断エラー:", error);
    return {
      networkOk: false,
      apiEndpointAccessible: false,
      error: error.toString()
    };
  }
}

/**
 * API認証のみをテスト（レスポンスは期待しない）
 */
function testAPIAuthentication() {
  console.log("API認証テスト開始...");
  
  try {
    const response = UrlFetchApp.fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CONFIG.API_KEY,
          "anthropic-version": CONFIG.ANTHROPIC_VERSION
        },
        payload: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1
        }),
        muteHttpExceptions: true
      }
    );
    
    const statusCode = response.getResponseCode();
    console.log("認証テストステータス:", statusCode);
    console.log("レスポンス:", response.getContentText().substring(0, 100));
    
    if (statusCode === 200) {
      console.log("✅ 認証成功");
      return { success: true };
    } else if (statusCode === 401) {
      console.log("❌ 認証失敗（APIキーが無効）");
      return { success: false, error: "Invalid API key" };
    } else if (statusCode === 400) {
      console.log("✅ 認証成功（リクエストエラーは期待通り）");
      return { success: true };
    } else {
      console.log("⚠️ 予期しないステータス:", statusCode);
      return { success: false, error: `Unexpected status: ${statusCode}` };
    }
    
  } catch (error) {
    console.error("認証テストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * API呼び出しのペイロード診断
 */
function diagnoseAPIPayload() {
  console.log("=== APIペイロード診断 ===");
  
  try {
    const testMessage = "アカルボースの価格を教えて";
    const intent = categorizeIntent(testMessage);
    const context = getContextByIntent(intent, testMessage);
    
    console.log("意図分類:", intent);
    console.log("コンテキストサイズ:");
    console.log("- 薬剤情報:", context.relatedMedicines ? context.relatedMedicines.length : 0);
    console.log("- 料金プラン:", context.pricePlans ? context.pricePlans.length : 0);
    console.log("- Q&A:", context.relatedQA ? context.relatedQA.length : 0);
    
    // プロンプト構築
    const systemPrompt = getSystemPrompt();
    const contextualPrompt = buildContextualPrompt(testMessage, context);
    
    console.log("システムプロンプト長:", systemPrompt.length);
    console.log("コンテキストプロンプト長:", contextualPrompt.length);
    console.log("合計プロンプト長:", systemPrompt.length + contextualPrompt.length);
    
    // ペイロードサイズ計算
    const payload = {
      model: CONFIG.MODEL,
      system: systemPrompt,
      messages: [{ role: "user", content: contextualPrompt }],
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    };
    
    const payloadSize = JSON.stringify(payload).length;
    console.log("ペイロードサイズ:", payloadSize, "bytes");
    
    // 大きすぎるペイロードの警告
    if (payloadSize > 100000) { // 100KB
      console.warn("⚠️ ペイロードサイズが大きすぎる可能性があります:", payloadSize, "bytes");
    }
    
    return {
      intentClassification: intent,
      contextSize: {
        medicines: context.relatedMedicines ? context.relatedMedicines.length : 0,
        plans: context.pricePlans ? context.pricePlans.length : 0,
        qa: context.relatedQA ? context.relatedQA.length : 0
      },
      promptLength: {
        system: systemPrompt.length,
        contextual: contextualPrompt.length,
        total: systemPrompt.length + contextualPrompt.length
      },
      payloadSize: payloadSize
    };
    
  } catch (error) {
    console.error("ペイロード診断エラー:", error);
    return { error: error.toString() };
  }
}

/**
 * 実際のチャットテスト（30秒タイムアウト）
 */
function testActualChat() {
  console.log("=== 実際のチャットテスト ===");
  
  try {
    const query = "アカルボースの価格を教えて";
    const intent = categorizeIntent(query);
    const context = getContextByIntent(intent, query);
    
    return testAPIWithTimeout(query, context, 30000);
  } catch (error) {
    console.error("実際のチャットテストエラー:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 簡単なチャットテスト（15秒タイムアウト）
 */
function testSimpleChat() {
  console.log("=== 簡単なチャットテスト ===");
  return testAPIWithTimeout("こんにちは", {}, 15000);
}

/**
 * 最小限のチャットテスト（10秒タイムアウト）
 */
function testMinimalChat() {
  console.log("=== 最小限のチャットテスト ===");
  return testAPIWithTimeout("hello", {}, 10000);
}

/**
 * 問題の原因を特定するためのクイック診断
 */
function quickDiagnoseHangingIssue() {
  console.log("=== ハング問題クイック診断 ===");
  
  const results = {
    configCheck: false,
    networkCheck: false,
    authCheck: false,
    payloadCheck: false,
    recommendations: []
  };
  
  try {
    // 1. 設定チェック
    console.log("1. 設定チェック");
    if (CONFIG.API_KEY !== "your-claude-api-key-here" && CONFIG.API_KEY.length > 10) {
      results.configCheck = true;
      console.log("✅ 設定OK");
    } else {
      console.log("❌ 設定NG");
      results.recommendations.push("Config.gsでAPIキーを正しく設定してください");
    }
    
    // 2. ネットワークチェック
    console.log("2. ネットワークチェック");
    const networkResult = diagnoseAPIConnection();
    if (networkResult.networkOk && networkResult.apiEndpointAccessible) {
      results.networkCheck = true;
      console.log("✅ ネットワークOK");
    } else {
      console.log("❌ ネットワークNG");
      results.recommendations.push("ネットワーク接続を確認してください");
    }
    
    // 3. ペイロードサイズチェック
    console.log("3. ペイロードサイズチェック");
    const payloadResult = diagnoseAPIPayload();
    if (payloadResult.payloadSize && payloadResult.payloadSize < 100000) {
      results.payloadCheck = true;
      console.log("✅ ペイロードサイズOK");
    } else {
      console.log("❌ ペイロードサイズNG");
      results.recommendations.push("プロンプトまたはコンテキストデータが大きすぎる可能性があります");
    }
    
    // 4. 推奨対応
    console.log("\n=== 推奨対応 ===");
    if (results.recommendations.length === 0) {
      console.log("基本的な設定に問題はありません。");
      console.log("推奨: runComprehensiveAPITest()を実行して詳細診断を行ってください。");
    } else {
      results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error("クイック診断エラー:", error);
    return { error: error.toString() };
  }
}