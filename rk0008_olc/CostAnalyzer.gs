// CostAnalyzer.gs - API料金分析モジュール

/**
 * 日別のAPI使用料金を集計
 * @param {Date} targetDate - 対象日（省略時は本日）
 * @return {object} 集計結果
 */
function getDailyCostSummary(targetDate = new Date()) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
    
    if (!sheet) {
      throw new Error("API使用量シートが見つかりません");
    }
    
    const data = sheet.getDataRange().getValues();
    const targetDateStr = Utilities.formatDate(targetDate, "JST", "yyyy-MM-dd");
    
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let callCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = Utilities.formatDate(data[i][0], "JST", "yyyy-MM-dd");
      if (rowDate === targetDateStr) {
        totalCost += data[i][5] || 0;
        totalInputTokens += data[i][2] || 0;
        totalOutputTokens += data[i][3] || 0;
        callCount++;
      }
    }
    
    return {
      date: targetDateStr,
      totalCost: Math.round(totalCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      callCount,
      avgCostPerCall: callCount > 0 ? Math.round((totalCost / callCount) * 100) / 100 : 0
    };
  } catch (error) {
    console.error("日別集計エラー:", error);
    return null;
  }
}

/**
 * 週別のAPI使用料金を集計
 * @param {Date} targetDate - 対象週の任意の日（省略時は今週）
 * @return {object} 集計結果
 */
function getWeeklyCostSummary(targetDate = new Date()) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
    
    if (!sheet) {
      throw new Error("API使用量シートが見つかりません");
    }
    
    // 週の開始日（月曜日）と終了日（日曜日）を計算
    const weekStart = new Date(targetDate);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を基準に
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const data = sheet.getDataRange().getValues();
    
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let callCount = 0;
    const dailyBreakdown = {};
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = new Date(data[i][0]);
      if (rowDate >= weekStart && rowDate <= weekEnd) {
        const dayStr = Utilities.formatDate(rowDate, "JST", "yyyy-MM-dd");
        
        totalCost += data[i][5] || 0;
        totalInputTokens += data[i][2] || 0;
        totalOutputTokens += data[i][3] || 0;
        callCount++;
        
        // 日別の内訳
        if (!dailyBreakdown[dayStr]) {
          dailyBreakdown[dayStr] = { cost: 0, calls: 0 };
        }
        dailyBreakdown[dayStr].cost += data[i][5] || 0;
        dailyBreakdown[dayStr].calls++;
      }
    }
    
    return {
      weekStart: Utilities.formatDate(weekStart, "JST", "yyyy-MM-dd"),
      weekEnd: Utilities.formatDate(weekEnd, "JST", "yyyy-MM-dd"),
      totalCost: Math.round(totalCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      callCount,
      avgCostPerCall: callCount > 0 ? Math.round((totalCost / callCount) * 100) / 100 : 0,
      dailyBreakdown
    };
  } catch (error) {
    console.error("週別集計エラー:", error);
    return null;
  }
}

/**
 * 月別のAPI使用料金を集計
 * @param {number} year - 年（省略時は今年）
 * @param {number} month - 月（1-12、省略時は今月）
 * @return {object} 集計結果
 */
function getMonthlyCostSummary(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
    
    if (!sheet) {
      throw new Error("API使用量シートが見つかりません");
    }
    
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    const data = sheet.getDataRange().getValues();
    
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let callCount = 0;
    const weeklyBreakdown = {};
    const modelBreakdown = {};
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][7] === targetMonth) { // 月列を使用
        totalCost += data[i][5] || 0;
        totalInputTokens += data[i][2] || 0;
        totalOutputTokens += data[i][3] || 0;
        callCount++;
        
        // 週別の内訳
        const weekNum = getWeekOfMonth(new Date(data[i][0]));
        const weekKey = `第${weekNum}週`;
        if (!weeklyBreakdown[weekKey]) {
          weeklyBreakdown[weekKey] = { cost: 0, calls: 0 };
        }
        weeklyBreakdown[weekKey].cost += data[i][5] || 0;
        weeklyBreakdown[weekKey].calls++;
        
        // モデル別の内訳
        const model = data[i][1] || "unknown";
        if (!modelBreakdown[model]) {
          modelBreakdown[model] = { cost: 0, calls: 0, tokens: 0 };
        }
        modelBreakdown[model].cost += data[i][5] || 0;
        modelBreakdown[model].calls++;
        modelBreakdown[model].tokens += (data[i][2] || 0) + (data[i][3] || 0);
      }
    }
    
    // 予算に対する使用率
    const budgetUsageRate = (totalCost / CONFIG.MONTHLY_BUDGET) * 100;
    
    return {
      yearMonth: targetMonth,
      totalCost: Math.round(totalCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      callCount,
      avgCostPerCall: callCount > 0 ? Math.round((totalCost / callCount) * 100) / 100 : 0,
      budgetUsageRate: Math.round(budgetUsageRate * 10) / 10,
      remainingBudget: Math.round((CONFIG.MONTHLY_BUDGET - totalCost) * 100) / 100,
      weeklyBreakdown,
      modelBreakdown
    };
  } catch (error) {
    console.error("月別集計エラー:", error);
    return null;
  }
}

/**
 * 月の第何週かを計算
 */
function getWeekOfMonth(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

/**
 * コスト分析レポートを生成
 * @param {string} period - 期間タイプ（"daily", "weekly", "monthly"）
 * @param {Date|object} params - パラメータ
 * @return {string} HTMLレポート
 */
function generateCostReport(period = "monthly", params = {}) {
  let summary;
  
  switch (period) {
    case "daily":
      summary = getDailyCostSummary(params.date);
      break;
    case "weekly":
      summary = getWeeklyCostSummary(params.date);
      break;
    case "monthly":
      summary = getMonthlyCostSummary(params.year, params.month);
      break;
    default:
      return "無効な期間タイプです";
  }
  
  if (!summary) {
    return "データの取得に失敗しました";
  }
  
  // HTMLレポートの生成
  let html = `
    <style>
      .report { font-family: Arial, sans-serif; padding: 20px; }
      .header { color: #1a73e8; margin-bottom: 20px; }
      .metric { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
      .metric-label { font-weight: bold; color: #5f6368; }
      .metric-value { font-size: 1.2em; color: #1a73e8; }
      .warning { color: #ea4335; }
      .success { color: #34a853; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border: 1px solid #dadce0; padding: 8px; text-align: left; }
      th { background-color: #f8f9fa; }
    </style>
    
    <div class="report">
  `;
  
  if (period === "daily") {
    html += `
      <h2 class="header">📊 日別API使用料金レポート</h2>
      <p>対象日: ${summary.date}</p>
      
      <div class="metric">
        <span class="metric-label">総コスト:</span>
        <span class="metric-value">¥${summary.totalCost.toLocaleString()}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">API呼び出し回数:</span>
        <span class="metric-value">${summary.callCount}回</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">平均コスト/回:</span>
        <span class="metric-value">¥${summary.avgCostPerCall}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">総トークン数:</span>
        <span class="metric-value">${summary.totalTokens.toLocaleString()}</span>
        <br><small>（入力: ${summary.totalInputTokens.toLocaleString()} / 出力: ${summary.totalOutputTokens.toLocaleString()}）</small>
      </div>
    `;
  } else if (period === "weekly") {
    html += `
      <h2 class="header">📊 週別API使用料金レポート</h2>
      <p>期間: ${summary.weekStart} 〜 ${summary.weekEnd}</p>
      
      <div class="metric">
        <span class="metric-label">総コスト:</span>
        <span class="metric-value">¥${summary.totalCost.toLocaleString()}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">API呼び出し回数:</span>
        <span class="metric-value">${summary.callCount}回</span>
      </div>
      
      <h3>日別内訳</h3>
      <table>
        <tr><th>日付</th><th>コスト</th><th>呼び出し回数</th></tr>
        ${Object.entries(summary.dailyBreakdown).map(([date, data]) => 
          `<tr><td>${date}</td><td>¥${Math.round(data.cost)}</td><td>${data.calls}回</td></tr>`
        ).join('')}
      </table>
    `;
  } else if (period === "monthly") {
    const budgetClass = summary.budgetUsageRate > 100 ? 'warning' : 
                       summary.budgetUsageRate > 80 ? 'warning' : 'success';
    
    html += `
      <h2 class="header">📊 月別API使用料金レポート</h2>
      <p>対象月: ${summary.yearMonth}</p>
      
      <div class="metric">
        <span class="metric-label">総コスト:</span>
        <span class="metric-value">¥${summary.totalCost.toLocaleString()}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">予算使用率:</span>
        <span class="metric-value ${budgetClass}">${summary.budgetUsageRate}%</span>
        <br><small>残り予算: ¥${summary.remainingBudget.toLocaleString()}</small>
      </div>
      
      <div class="metric">
        <span class="metric-label">API呼び出し回数:</span>
        <span class="metric-value">${summary.callCount}回</span>
      </div>
      
      <h3>週別内訳</h3>
      <table>
        <tr><th>週</th><th>コスト</th><th>呼び出し回数</th></tr>
        ${Object.entries(summary.weeklyBreakdown).map(([week, data]) => 
          `<tr><td>${week}</td><td>¥${Math.round(data.cost)}</td><td>${data.calls}回</td></tr>`
        ).join('')}
      </table>
      
      <h3>モデル別内訳</h3>
      <table>
        <tr><th>モデル</th><th>コスト</th><th>呼び出し回数</th><th>トークン数</th></tr>
        ${Object.entries(summary.modelBreakdown).map(([model, data]) => 
          `<tr><td>${model}</td><td>¥${Math.round(data.cost)}</td><td>${data.calls}回</td><td>${data.tokens.toLocaleString()}</td></tr>`
        ).join('')}
      </table>
    `;
  }
  
  html += `
    </div>
  `;
  
  return html;
}

/**
 * コストレポートをメールで送信
 */
function sendCostReportByEmail(period = "monthly", recipient = null) {
  try {
    const report = generateCostReport(period);
    const now = new Date();
    
    let subject;
    switch (period) {
      case "daily":
        subject = `CTFチャットボット 日次コストレポート - ${Utilities.formatDate(now, "JST", "yyyy/MM/dd")}`;
        break;
      case "weekly":
        subject = `CTFチャットボット 週次コストレポート - ${Utilities.formatDate(now, "JST", "yyyy/MM/dd")}週`;
        break;
      case "monthly":
        subject = `CTFチャットボット 月次コストレポート - ${Utilities.formatDate(now, "JST", "yyyy年MM月")}`;
        break;
    }
    
    const emailRecipient = recipient || getSetting("report_email", Session.getActiveUser().getEmail());
    
    MailApp.sendEmail({
      to: emailRecipient,
      subject: subject,
      htmlBody: report
    });
    
    return true;
  } catch (error) {
    console.error("レポート送信エラー:", error);
    return false;
  }
}

/**
 * 定期レポートのトリガー設定
 */
function setupCostReportTriggers() {
  // 既存のトリガーを削除
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction().includes("CostReport")) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 日次レポート（毎日午前9時）
  ScriptApp.newTrigger("sendDailyCostReport")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  // 週次レポート（毎週月曜日午前9時）
  ScriptApp.newTrigger("sendWeeklyCostReport")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  
  // 月次レポート（毎月1日午前9時）
  ScriptApp.newTrigger("sendMonthlyCostReport")
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .create();
}

// トリガー用関数
function sendDailyCostReport() {
  sendCostReportByEmail("daily");
}

function sendWeeklyCostReport() {
  sendCostReportByEmail("weekly");
}

function sendMonthlyCostReport() {
  sendCostReportByEmail("monthly");
}