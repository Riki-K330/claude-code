// Config.gs - CTFオンラインクリニック チャットボット設定

const CONFIG = {
  // Claude API設定
  API_KEY: "your-claude-api-key-here", // ← 実際のAPIキーに置き換えてください
  MODEL: "claude-3-opus-20240229",
  ANTHROPIC_VERSION: "2023-06-01",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  
  // スプレッドシート設定
  SHEET_ID: "your-spreadsheet-id-here", // ← スプレッドシートIDを設定
  SHEET_NAMES: {
    MEDICINES: "薬剤情報",
    PLANS: "料金プラン",
    QA: "Q&A",
    LOGS: "対話履歴",
    API_USAGE: "API使用量",
    SETTINGS: "設定"
  },
  
  // システム設定
  MONTHLY_BUDGET: 50000, // 月間予算（円）
  CACHE_DURATION: 3600, // キャッシュ有効期間（秒）
  LOG_RETENTION_DAYS: 90, // ログ保持期間（日）
  
  // 応答設定
  DEFAULT_GREETING: "CTFオンラインクリニック事務局です😊",
  DEFAULT_CLOSING: "ご不明な点がございましたら、お気軽にお問い合わせくださいませ💌",
  
  // エラーメッセージ
  ERROR_MESSAGES: {
    API_ERROR: "申し訳ございません。システムエラーが発生しました。しばらくしてから再度お試しください。",
    INVALID_INPUT: "申し訳ございません。ご質問の内容が理解できませんでした。もう一度お聞かせください。",
    RATE_LIMIT: "現在多くのお問い合わせをいただいております。少しお待ちいただけますでしょうか。"
  }
};

// 環境チェック
function validateConfig() {
  if (!CONFIG.API_KEY || CONFIG.API_KEY === "your-claude-api-key-here") {
    throw new Error("Claude APIキーが設定されていません");
  }
  
  if (!CONFIG.SHEET_ID) {
    throw new Error("スプレッドシートIDが設定されていません");
  }
  
  return true;
}