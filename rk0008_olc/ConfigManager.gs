// ConfigManager.gs - 設定管理モジュール（スプレッドシート連携版）

/**
 * スプレッドシートから設定値を取得する拡張CONFIG
 */
const DynamicConfig = {
  /**
   * 設定値を取得（スプレッドシート優先）
   * @param {string} key - 設定キー
   * @param {any} defaultValue - デフォルト値
   * @return {any} 設定値
   */
  get: function(key, defaultValue = null) {
    // まずスプレッドシートから取得を試みる
    const sheetValue = getSetting(key);
    if (sheetValue !== null) {
      return sheetValue;
    }
    
    // スプレッドシートになければCONFIGから取得
    const keys = key.split('.');
    let value = CONFIG;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  },
  
  /**
   * すべての動的設定を取得
   */
  getAll: function() {
    const settings = {};
    
    // CONFIGの値をベースに
    Object.assign(settings, CONFIG);
    
    // スプレッドシートの値で上書き
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
        .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
      
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0]) {
            settings[data[i][0]] = data[i][1];
          }
        }
      }
    } catch (error) {
      console.error("設定読み込みエラー:", error);
    }
    
    return settings;
  }
};

/**
 * 初期設定値をスプレッドシートに展開
 */
function initializeSettings() {
  const settingsSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
  
  if (!settingsSheet) {
    console.error("設定シートが見つかりません");
    return;
  }
  
  // 既存のクリニック情報に加えて、システム設定を追加
  const systemSettings = [
    // API設定
    ["api_model", CONFIG.MODEL, "使用するClaudeモデル", new Date()],
    ["api_max_tokens", CONFIG.MAX_TOKENS, "最大トークン数", new Date()],
    ["api_temperature", CONFIG.TEMPERATURE, "生成温度（0-1）", new Date()],
    ["api_input_cost_per_1k", 0.015, "入力トークン単価（$/1K）", new Date()],
    ["api_output_cost_per_1k", 0.075, "出力トークン単価（$/1K）", new Date()],
    ["api_usd_to_jpy", 150, "為替レート（USD/JPY）", new Date()],
    
    // システム設定
    ["monthly_budget", CONFIG.MONTHLY_BUDGET, "月間予算（円）", new Date()],
    ["cache_duration", CONFIG.CACHE_DURATION, "キャッシュ有効期間（秒）", new Date()],
    ["log_retention_days", CONFIG.LOG_RETENTION_DAYS, "ログ保持期間（日）", new Date()],
    
    // 応答設定
    ["default_greeting", CONFIG.DEFAULT_GREETING, "デフォルト挨拶", new Date()],
    ["default_closing", CONFIG.DEFAULT_CLOSING, "デフォルト締め", new Date()],
    
    // エラーメッセージ
    ["error_api", CONFIG.ERROR_MESSAGES.API_ERROR, "APIエラーメッセージ", new Date()],
    ["error_invalid_input", CONFIG.ERROR_MESSAGES.INVALID_INPUT, "無効入力エラーメッセージ", new Date()],
    ["error_rate_limit", CONFIG.ERROR_MESSAGES.RATE_LIMIT, "レート制限エラーメッセージ", new Date()],
    
    // プロンプトテンプレート
    ["prompt_medicine_info", "{{medicine_name}}について詳しくご説明しますね💊\\n\\n【特徴】\\n{{features}}\\n\\n【服用方法】\\n{{dosage}}\\n\\n【一般的な副作用】\\n{{side_effects}}\\n※個人差がありますので、詳しくは医師にご相談ください😌", "薬剤情報応答テンプレート", new Date()],
    ["prompt_price_info", "{{plan_name}}の料金は{{price}}円（税込・送料無料）です💰\\n\\n{{notes}}", "料金案内テンプレート", new Date()],
    ["prompt_medical_advice", "お薬の効果や副作用につきましては、患者様お一人おひとりの状態により異なりますので、医師から詳しくご説明させていただきますね😌", "医療相談への定型応答", new Date()],
    
    // 通知設定
    ["report_email", Session.getActiveUser().getEmail(), "レポート送信先メールアドレス", new Date()],
    ["alert_threshold", 0.8, "予算アラート閾値（0-1）", new Date()],
    ["enable_daily_report", "TRUE", "日次レポート有効化", new Date()],
    ["enable_weekly_report", "TRUE", "週次レポート有効化", new Date()],
    ["enable_monthly_report", "TRUE", "月次レポート有効化", new Date()],
    
    // 料金プラン表示設定
    ["plan_display_limit", 10, "1薬剤あたりの最大表示プラン数", new Date()],
    ["plan_show_priority_only", "FALSE", "優先度1のプランのみ表示", new Date()],
    ["plan_show_all_for_acarbose", "TRUE", "アカルボースは全プラン表示", new Date()],
    ["plan_show_all_for_rybelsus", "TRUE", "リベルサスは全プラン表示", new Date()]
  ];
  
  // 既存の設定を確認し、なければ追加
  const existingSettings = new Set();
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    existingSettings.add(data[i][0]);
  }
  
  // 新規設定のみ追加
  const newSettings = systemSettings.filter(setting => !existingSettings.has(setting[0]));
  if (newSettings.length > 0) {
    const lastRow = settingsSheet.getLastRow();
    settingsSheet.getRange(lastRow + 1, 1, newSettings.length, newSettings[0].length)
      .setValues(newSettings);
  }
}

/**
 * 動的にAPI料金を計算（スプレッドシートの設定を使用）
 */
function calculateDynamicAPICost(inputTokens, outputTokens) {
  const inputCostPer1K = parseFloat(DynamicConfig.get("api_input_cost_per_1k", 0.015));
  const outputCostPer1K = parseFloat(DynamicConfig.get("api_output_cost_per_1k", 0.075));
  const usdToJpy = parseFloat(DynamicConfig.get("api_usd_to_jpy", 150));
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return (inputCost + outputCost) * usdToJpy;
}

/**
 * 動的なシステムプロンプトを取得
 */
function getDynamicSystemPrompt() {
  const clinicName = DynamicConfig.get("clinic_name", "CTFオンラインクリニック");
  const partnerClinic = DynamicConfig.get("partner_clinic", "中野トータルヘルスケアクリニック");
  const greeting1 = DynamicConfig.get("greeting_1", CONFIG.DEFAULT_GREETING);
  const medicalAdvice = DynamicConfig.get("prompt_medical_advice", "");
  
  return `あなたは「${clinicName}事務局」の担当者として、オンラインでのダイエット薬やクリニックの利用に関するお問い合わせに対応するAIアシスタントです。
以下のルール・前提を踏まえ、利用者（ユーザー）からの質問・相談に対して一度のメッセージで完結する回答を行ってください。

## ルール・前提

### 役割・クリニック情報
- あなたの役割: ${clinicName}事務局の担当者
- 提供する主な情報:
  - ダイエット薬の案内（取り扱い種類・料金・購入・配送プロセス）
  - クリニック利用に関する手続き（お支払い方法・解約など）
- 名乗りフレーズ例:
  - 「${greeting1}」
  - 「${DynamicConfig.get("greeting_2", "")}」
- クリニックの基本情報:
  - ${partnerClinic}が提携医療機関
- お問い合わせ窓口（LINE）:
  - 順次返信。18時以降・休業日のお問い合わせは翌診療日以降に対応

### 回答スタイルの基本
- LINE上でのやり取りを想定し、改行を多めに使用して読みやすくする
- 適度に絵文字を使用し、明るく親しみやすい印象を与える（😊✨🙌💊🚚💳）
- 共感の言葉は毎回同じにならないようにし、具体的に
- 効果・副作用の問い合わせには:
  ${medicalAdvice}
- 体調不良時の案内:
  「もし体調にご不安な点がある場合は、無理なさらず、かかりつけ医や専門医にご相談くださいね🏥」

## お薬の取り扱い状況

【取扱いあり】
- アカルボース
- リベルサス
- マンジャロ
- 整腸剤（医療用ビオフェルミン錠剤＋ミヤBM配合錠）

【取扱いなし】
- フォシーガ
- 防風通聖散（漢方）
※お問い合わせがあれば「貴重なご意見ありがとうございます。今後の参考にさせていただきますね🙏」と回答

## 応答の基本構成
1. 冒頭あいさつ & 共感
2. 具体的な情報提供（薬の種類・料金・手続きなど）
3. 必要に応じて支払い・配送・解約などの案内
4. 安心感のある締め & 医師との連携案内`;
}

/**
 * プロンプトテンプレートを適用
 */
function applyPromptTemplate(templateKey, variables) {
  let template = DynamicConfig.get(templateKey, "");
  
  if (!template) {
    return "";
  }
  
  // 変数を置換
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }
  
  return template;
}

/**
 * 設定変更の監視とキャッシュクリア
 */
function onSettingsChange() {
  // キャッシュをクリア
  CacheService.getScriptCache().removeAll(['system_prompt', 'dynamic_config']);
  
  // 必要に応じて再初期化
  console.log("設定が変更されました。キャッシュをクリアしました。");
}