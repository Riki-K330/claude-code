// UI.gs - ユーザーインターフェース管理

/**
 * カスタムメニューの作成
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🤖 CTFチャットボット')
    .addItem('💬 チャット画面を開く', 'showChatSidebar')
    .addItem('⚙️ 設定', 'showSettings')
    .addSeparator()
    .addItem('📊 使用状況レポート', 'showUsageReport')
    .addSubMenu(ui.createMenu('💰 コスト分析')
      .addItem('日別レポート', 'showDailyCostReport')
      .addItem('週別レポート', 'showWeeklyCostReport')
      .addItem('月別レポート', 'showMonthlyCostReport'))
    .addItem('🧪 テスト実行', 'runTestChat')
    .addSeparator()
    .addItem('🔧 初期設定', 'initializeSystem')
    .addItem('❓ ヘルプ', 'showHelp')
    .addToUi();
}

/**
 * チャットサイドバーを表示
 */
function showChatSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('CTFクリニック チャット')
    .setWidth(400);
  
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * 設定画面を表示
 */
function showSettings() {
  const html = HtmlService.createHtmlOutputFromFile('Settings')
    .setTitle('設定')
    .setWidth(400)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ CTFチャットボット設定');
}

/**
 * 使用状況レポートを表示
 */
function showUsageReport() {
  const report = generateUsageReport();
  
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h2 { color: #1a73e8; }
      .metric { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
      .metric-label { font-weight: bold; color: #5f6368; }
      .metric-value { font-size: 1.2em; color: #1a73e8; }
      .warning { color: #ea4335; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border: 1px solid #dadce0; padding: 8px; text-align: left; }
      th { background-color: #f8f9fa; }
    </style>
    
    <h2>📊 使用状況レポート</h2>
    <p>期間: ${report.period}</p>
    
    <div class="metric">
      <span class="metric-label">総問い合わせ数:</span>
      <span class="metric-value">${report.totalQueries}</span>
    </div>
    
    <div class="metric">
      <span class="metric-label">平均応答時間:</span>
      <span class="metric-value">${report.avgResponseTime}ms</span>
    </div>
    
    <div class="metric">
      <span class="metric-label">API使用料金:</span>
      <span class="metric-value ${report.costWarning ? 'warning' : ''}">¥${report.totalCost}</span>
      ${report.costWarning ? '<br><small class="warning">⚠️ 月間予算を超過しています</small>' : ''}
    </div>
    
    <h3>よくある質問TOP5</h3>
    <table>
      <tr><th>順位</th><th>カテゴリ</th><th>件数</th></tr>
      ${report.topCategories.map((cat, i) => 
        `<tr><td>${i + 1}</td><td>${cat.category}</td><td>${cat.count}</td></tr>`
      ).join('')}
    </table>
    
    <h3>エラー発生状況</h3>
    <div class="metric">
      <span class="metric-label">エラー率:</span>
      <span class="metric-value ${report.errorRate > 5 ? 'warning' : ''}">${report.errorRate}%</span>
    </div>
  `)
  .setWidth(600)
  .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '📊 使用状況レポート');
}

/**
 * ヘルプ画面を表示
 */
function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
      h2 { color: #1a73e8; }
      h3 { color: #5f6368; margin-top: 20px; }
      code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
      .section { margin: 20px 0; }
      .tip { background: #e8f0fe; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
    
    <h2>❓ CTFチャットボット ヘルプ</h2>
    
    <div class="section">
      <h3>🚀 はじめに</h3>
      <p>CTFオンラインクリニックのAIチャットボットシステムへようこそ。<br>
      このシステムは、薬剤情報の提供や手続きサポートを自動化します。</p>
    </div>
    
    <div class="section">
      <h3>💬 チャット機能の使い方</h3>
      <ol>
        <li>メニューから「チャット画面を開く」を選択</li>
        <li>サイドバーに表示される入力欄に質問を入力</li>
        <li>「送信」ボタンをクリック</li>
        <li>AIからの回答が表示されます</li>
      </ol>
    </div>
    
    <div class="section">
      <h3>⚙️ 初期設定</h3>
      <p>初めて使用する場合は、以下の手順で設定してください：</p>
      <ol>
        <li><code>Config.gs</code>ファイルを開く</li>
        <li>Claude APIキーを設定</li>
        <li>スプレッドシートIDを設定</li>
        <li>メニューから「初期設定」を実行</li>
      </ol>
    </div>
    
    <div class="tip">
      <strong>💡 ヒント:</strong> APIキーは<a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>から取得できます。
    </div>
    
    <div class="section">
      <h3>📊 データ管理</h3>
      <p>以下のシートでデータを管理します：</p>
      <ul>
        <li><strong>薬剤情報</strong> - 取り扱い薬剤の詳細情報</li>
        <li><strong>料金プラン</strong> - 各種プランと価格</li>
        <li><strong>Q&A</strong> - よくある質問と回答</li>
        <li><strong>対話履歴</strong> - チャットログ（自動記録）</li>
        <li><strong>API使用量</strong> - コスト管理（自動記録）</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>🔧 トラブルシューティング</h3>
      <p><strong>エラーが発生する場合：</strong></p>
      <ul>
        <li>APIキーが正しく設定されているか確認</li>
        <li>スプレッドシートIDが正しいか確認</li>
        <li>必要な権限があるか確認</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>📞 サポート</h3>
      <p>技術的な問題や質問がある場合は、システム管理者にお問い合わせください。</p>
    </div>
  `)
  .setWidth(700)
  .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '❓ ヘルプ');
}

/**
 * システム初期化
 */
function initializeSystem() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🔧 システム初期化',
    'スプレッドシートを初期化しますか？\\n必要なシートとデータが作成されます。',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const result = initializeSpreadsheet();
    
    if (result) {
      ui.alert('✅ 初期化完了', 'システムの初期化が完了しました。', ui.ButtonSet.OK);
    } else {
      ui.alert('❌ エラー', '初期化中にエラーが発生しました。ログを確認してください。', ui.ButtonSet.OK);
    }
  }
}

/**
 * テストチャット実行
 */
function runTestChat() {
  const testQueries = [
    "アカルボースの価格を教えてください",
    "マンジャロの副作用は？",
    "解約したいです",
    "支払い方法を変更したい"
  ];
  
  const randomQuery = testQueries[Math.floor(Math.random() * testQueries.length)];
  
  SpreadsheetApp.getUi().alert(
    '🧪 テスト実行',
    `テストクエリ: "${randomQuery}"\\n\\n実行中...`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  const result = processUserMessage(randomQuery, "test-user");
  
  const responsePreview = result.response ? result.response.substring(0, 200) : "エラーが発生しました";
  
  SpreadsheetApp.getUi().alert(
    '🧪 テスト結果',
    `クエリ: ${randomQuery}\\n\\n` +
    `意図分類: ${result.intent}\\n` +
    `成功: ${result.success}\\n` +
    `応答時間: ${result.responseTime}ms\\n\\n` +
    `回答: ${responsePreview}...`
  );
}

/**
 * 使用状況レポートの生成
 */
function generateUsageReport() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // 対話ログから統計を取得
  const logsSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.LOGS);
  const logsData = logsSheet.getDataRange().getValues();
  
  let totalQueries = 0;
  let totalResponseTime = 0;
  let errorCount = 0;
  const categoryCount = {};
  
  for (let i = 1; i < logsData.length; i++) {
    const timestamp = logsData[i][0];
    if (timestamp >= startOfMonth) {
      totalQueries++;
      totalResponseTime += logsData[i][5] || 0;
      
      if (logsData[i][7]) { // エラー列
        errorCount++;
      }
      
      const category = logsData[i][3]; // 意図分類列
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  }
  
  // API使用量から料金を計算
  const usageSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
  const usageData = usageSheet.getDataRange().getValues();
  
  let totalCost = 0;
  for (let i = 1; i < usageData.length; i++) {
    const timestamp = usageData[i][0];
    if (timestamp >= startOfMonth) {
      totalCost += usageData[i][5] || 0;
    }
  }
  
  // カテゴリランキング
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
  
  return {
    period: `${startOfMonth.getFullYear()}年${startOfMonth.getMonth() + 1}月`,
    totalQueries,
    avgResponseTime: totalQueries > 0 ? Math.round(totalResponseTime / totalQueries) : 0,
    totalCost: Math.round(totalCost),
    costWarning: totalCost > CONFIG.MONTHLY_BUDGET,
    topCategories,
    errorCount,
    errorRate: totalQueries > 0 ? Math.round((errorCount / totalQueries) * 100) : 0
  };
}

/**
 * 日別コストレポートを表示
 */
function showDailyCostReport() {
  const report = generateCostReport("daily", { date: new Date() });
  const html = HtmlService.createHtmlOutput(report)
    .setWidth(600)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, '💰 日別コストレポート');
}

/**
 * 週別コストレポートを表示
 */
function showWeeklyCostReport() {
  const report = generateCostReport("weekly", { date: new Date() });
  const html = HtmlService.createHtmlOutput(report)
    .setWidth(700)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '💰 週別コストレポート');
}

/**
 * 月別コストレポートを表示
 */
function showMonthlyCostReport() {
  const now = new Date();
  const report = generateCostReport("monthly", { 
    year: now.getFullYear(), 
    month: now.getMonth() + 1 
  });
  const html = HtmlService.createHtmlOutput(report)
    .setWidth(800)
    .setHeight(700);
  
  SpreadsheetApp.getUi().showModalDialog(html, '💰 月別コストレポート');
}

/**
 * 全設定を取得（Settings.html用）
 */
function getAllSettings() {
  if (typeof DynamicConfig !== 'undefined') {
    return DynamicConfig.getAll();
  }
  
  // DynamicConfigがない場合は通常の設定を返す
  const settings = {};
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
  
  return settings;
}

/**
 * 設定を保存（Settings.html用）
 */
function saveSettings(settings) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      setSetting(key, value);
    }
    
    // 設定変更を通知
    if (typeof onSettingsChange === 'function') {
      onSettingsChange();
    }
    
    return true;
  } catch (error) {
    console.error("設定保存エラー:", error);
    throw error;
  }
}