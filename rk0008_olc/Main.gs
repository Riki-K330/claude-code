// Main.gs - メイン処理モジュール

/**
 * ユーザーメッセージを処理してAI応答を生成
 * @param {string} userMessage - ユーザーからのメッセージ
 * @param {string} userId - ユーザーID（セッション管理用）
 * @return {object} 処理結果
 */
function processUserMessage(userMessage, userId = "anonymous") {
  const startTime = new Date();
  
  try {
    // 入力検証
    if (!userMessage || userMessage.trim().length === 0) {
      return {
        success: false,
        response: CONFIG.ERROR_MESSAGES.INVALID_INPUT,
        intent: "invalid",
        responseTime: 0
      };
    }
    
    // 意図分類
    const intent = categorizeIntent(userMessage);
    
    // コンテキスト情報の収集
    const context = getContextByIntent(intent, userMessage);
    
    // 会話履歴を追加（最新3件）
    context.conversationHistory = getRecentConversations(userId, 3);
    
    // Claude APIを呼び出し
    const apiResult = callClaudeAPI(userMessage, context);
    
    const endTime = new Date();
    const responseTime = endTime - startTime;
    
    // 対話ログを記録
    logConversation(
      userId,
      userMessage,
      intent,
      apiResult.content,
      responseTime,
      "",
      apiResult.success ? "" : apiResult.error
    );
    
    return {
      success: apiResult.success,
      response: apiResult.content,
      intent: intent,
      responseTime: responseTime
    };
    
  } catch (error) {
    console.error("メッセージ処理エラー:", error);
    
    const endTime = new Date();
    const responseTime = endTime - startTime;
    
    // エラーログを記録
    logConversation(
      userId,
      userMessage,
      "error",
      CONFIG.ERROR_MESSAGES.API_ERROR,
      responseTime,
      "",
      error.toString()
    );
    
    return {
      success: false,
      response: CONFIG.ERROR_MESSAGES.API_ERROR,
      intent: "error",
      responseTime: responseTime
    };
  }
}

/**
 * 最近の会話履歴を取得
 */
function getRecentConversations(userId, limit = 3) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.LOGS);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const conversations = [];
    
    // 逆順でループして最新の会話を取得
    for (let i = data.length - 1; i >= 1 && conversations.length < limit; i--) {
      if (data[i][1] === userId && !data[i][7]) { // エラーでない会話のみ
        conversations.unshift({
          user: data[i][2],
          assistant: data[i][4]
        });
      }
    }
    
    return conversations;
  } catch (error) {
    console.error("会話履歴取得エラー:", error);
    return [];
  }
}

/**
 * よくある質問への即座の応答（キャッシュ的な役割）
 */
function getQuickResponse(userMessage) {
  const quickResponses = {
    "こんにちは": "CTFオンラインクリニック事務局です😊\nご用件をお聞かせください。お薬の情報や手続きについて、何でもお答えします💌",
    "ありがとう": "どういたしまして😊\n他にもご不明な点がございましたら、お気軽にお問い合わせくださいませ💌",
    "営業時間": "お問い合わせは24時間受け付けております📱\nただし、18時以降・休業日のお問い合わせは翌診療日以降の対応となります。",
    "電話番号": "申し訳ございません。お問い合わせはLINEでのみ承っております📱\nこちらのチャットで何でもお聞きください😊"
  };
  
  for (const [key, response] of Object.entries(quickResponses)) {
    if (userMessage.includes(key)) {
      return response;
    }
  }
  
  return null;
}

/**
 * 手続き関連の情報を取得
 */
function getProcedureInfo(query) {
  const procedures = {
    "解約": {
      title: "解約手続き",
      steps: [
        "次回お届け予定日の10日前までにご連絡ください",
        "LINEでご連絡いただければ手続きいたします",
        "回数縛りはございません",
        "解約後も再開は可能です"
      ],
      notes: "解約理由をお聞かせいただければ、今後のサービス改善に活用させていただきます🙏"
    },
    "変更": {
      title: "プラン変更・お届け日変更",
      steps: [
        "次回お届け予定日の10日前までにご連絡ください",
        "プラン変更・配送日変更を承ります",
        "変更内容をLINEでお知らせください"
      ],
      notes: "変更手数料は無料です😊"
    },
    "支払": {
      title: "お支払い方法",
      options: [
        "クレジットカード（VISA/Master/JCB/AMEX）",
        "銀行振込",
        "後払い（コンビニ/銀行ATM）",
        "atone翌月払い"
      ],
      notes: "お支払い方法の変更も承っております💳"
    }
  };
  
  for (const [key, info] of Object.entries(procedures)) {
    if (query.includes(key)) {
      return info;
    }
  }
  
  return null;
}

/**
 * 配送情報を取得
 */
function getDeliveryInfo() {
  return {
    standard: "ご注文確定後、3-5営業日でお届け",
    areas: "全国送料無料でお届けします🚚",
    tracking: "発送時に追跡番号をお知らせします",
    packaging: "プライバシーに配慮した梱包でお届けします"
  };
}

/**
 * 副作用情報を取得
 */
function getSideEffectInfo(query) {
  const sideEffects = {
    "アカルボース": {
      common: "お腹の張り、ガス、下痢（服用初期に多く、2週間程度で改善）",
      rare: "腹痛、消化不良",
      advice: "症状が続く場合は、量を調整したり整腸剤を併用する方法もあります"
    },
    "リベルサス": {
      common: "吐き気、下痢、便秘",
      rare: "頭痛、めまい",
      advice: "空腹時に服用し、服用後30分は飲食を控えてください"
    },
    "マンジャロ": {
      common: "吐き気、下痢、便秘、注射部位反応",
      rare: "低血糖（他の糖尿病薬併用時）",
      advice: "注射部位は毎回変更してください"
    }
  };
  
  for (const [medicine, info] of Object.entries(sideEffects)) {
    if (query.includes(medicine)) {
      return info;
    }
  }
  
  return null;
}

/**
 * システムヘルスチェック
 */
function performHealthCheck() {
  const checks = {
    apiKey: !!CONFIG.API_KEY && CONFIG.API_KEY !== "your-claude-api-key-here",
    spreadsheetId: !!CONFIG.SHEET_ID,
    sheets: {},
    apiConnection: false
  };
  
  // スプレッドシートの確認
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    for (const sheetName of Object.values(CONFIG.SHEET_NAMES)) {
      checks.sheets[sheetName] = !!spreadsheet.getSheetByName(sheetName);
    }
  } catch (error) {
    console.error("スプレッドシート確認エラー:", error);
  }
  
  // API接続テスト
  try {
    const testResult = callClaudeAPI("テスト", {});
    checks.apiConnection = testResult.success;
  } catch (error) {
    console.error("API接続テストエラー:", error);
  }
  
  return checks;
}

/**
 * 設定値を強制更新
 */
function updatePlanSettings() {
  console.log("=== 設定値強制更新 ===");
  
  try {
    // 設定を直接更新
    setSetting("plan_show_all_for_acarbose", "TRUE", "アカルボースは全プラン表示");
    setSetting("plan_show_priority_only", "FALSE", "優先度1のプランのみ表示");
    setSetting("plan_show_all_for_rybelsus", "TRUE", "リベルサスは全プラン表示");
    
    console.log("設定を更新しました");
    
    // 更新後の確認
    console.log("更新後の設定値:");
    console.log("- plan_show_all_for_acarbose:", getSetting("plan_show_all_for_acarbose"));
    console.log("- plan_show_priority_only:", getSetting("plan_show_priority_only"));
    
    return true;
  } catch (error) {
    console.error("設定更新エラー:", error);
    return false;
  }
}

/**
 * 設定値確認テスト
 */
function testSettings() {
  console.log("=== 設定値確認テスト ===");
  
  // 設定シートの内容確認
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      console.log("設定シートの行数:", data.length);
      console.log("設定内容:");
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].includes("plan_")) {
          console.log(`- ${data[i][0]}: ${data[i][1]}`);
        }
      }
    }
  } catch (error) {
    console.error("設定確認エラー:", error);
  }
  
  // DynamicConfig経由での取得テスト
  console.log("DynamicConfig経由での設定値:");
  console.log("- plan_show_all_for_acarbose:", DynamicConfig.get("plan_show_all_for_acarbose", "FALSE"));
  console.log("- plan_show_priority_only:", DynamicConfig.get("plan_show_priority_only", "TRUE"));
}

/**
 * Q&A機能のテスト（デバッグ用）
 */
function testQAFunctionality() {
  console.log("=== Q&A機能テスト ===");
  
  const query = "医療費控除について教えて";
  console.log("テストクエリ:", query);
  
  // 意図分類
  const intent = categorizeIntent(query);
  console.log("意図:", intent);
  
  // Q&A検索
  const qaResults = searchRelatedQA("医療費控除", query);
  console.log("Q&A検索結果:", qaResults);
  
  // スプレッドシートから直接Q&Aデータを確認
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      console.log("Q&Aシートのデータ行数:", data.length);
      console.log("Q&Aヘッダー:", data[0]);
      
      // 医療費控除関連を検索
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] && data[i][1].includes("医療費控除")) {
          console.log(`Q&A発見: ${data[i][1]} -> ${data[i][2]}`);
        }
      }
    }
  } catch (error) {
    console.error("Q&Aシート確認エラー:", error);
  }
  
  return qaResults;
}

/**
 * 簡単なデータ取得テスト（デバッグ用）
 */
function testPriceDataRetrieval() {
  console.log("=== 価格データ取得テスト ===");
  
  const query = "アカルボースの価格";
  console.log("テストクエリ:", query);
  
  // 意図分類
  const intent = categorizeIntent(query);
  console.log("意図:", intent);
  
  // 料金プラン取得
  const plans = getPricePlans(query);
  console.log("取得したプラン数:", plans.length);
  console.log("プランの内容:");
  plans.forEach(plan => {
    console.log(`- ${plan.planId}: ${plan.medicine} ${plan.quantity} ${plan.price}円`);
  });
  
  return plans;
}

/**
 * 月次レポートの自動送信
 */
function sendMonthlyReport() {
  const report = generateUsageReport();
  const recipient = getSetting("report_email", Session.getActiveUser().getEmail());
  
  const subject = `CTFチャットボット月次レポート - ${report.period}`;
  const body = `
CTFオンラインクリニック チャットボット
月次レポート

期間: ${report.period}

【利用状況】
- 総問い合わせ数: ${report.totalQueries}件
- 平均応答時間: ${report.avgResponseTime}ms
- エラー率: ${report.errorRate}%

【コスト】
- API使用料金: ¥${report.totalCost}
- 予算比: ${Math.round((report.totalCost / CONFIG.MONTHLY_BUDGET) * 100)}%

【よくある質問TOP5】
${report.topCategories.map((cat, i) => 
  `${i + 1}. ${cat.category}: ${cat.count}件`
).join('\n')}

詳細はスプレッドシートをご確認ください。
  `;
  
  MailApp.sendEmail(recipient, subject, body);
}