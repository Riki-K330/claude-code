// DataManager.gs - データ管理モジュール

/**
 * スプレッドシートの初期化
 */
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    
    // 必要なシートを作成
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.MEDICINES, createMedicineHeaders());
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.PLANS, createPlanHeaders());
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.QA, createQAHeaders());
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.LOGS, createLogHeaders());
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.API_USAGE, createAPIUsageHeaders());
    ensureSheetExists(spreadsheet, CONFIG.SHEET_NAMES.SETTINGS, createSettingsHeaders());
    
    // 初期データを投入
    insertInitialData();
    
    return true;
  } catch (error) {
    console.error("スプレッドシート初期化エラー:", error);
    return false;
  }
}

/**
 * シートの存在確認と作成
 */
function ensureSheetExists(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#4285F4");
    sheet.getRange(1, 1, 1, headers.length).setFontColor("#FFFFFF");
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * 各シートのヘッダー定義
 */
function createMedicineHeaders() {
  return ["薬剤名", "カテゴリ", "特徴・説明", "服用方法", "副作用", "禁忌事項", "保管方法", "更新日"];
}

function createPlanHeaders() {
  return ["プランID", "薬剤名", "期間", "数量", "価格（税込）", "備考", "表示順", "有効フラグ", "表示優先度", "表示フラグ"];
}

function createQAHeaders() {
  return ["カテゴリ", "質問", "回答", "使用頻度", "タグ", "最終更新日", "更新者"];
}

function createLogHeaders() {
  return ["タイムスタンプ", "ユーザーID", "質問", "意図分類", "回答", "応答時間(ms)", "評価", "エラー"];
}

function createAPIUsageHeaders() {
  return ["タイムスタンプ", "モデル", "入力トークン", "出力トークン", "合計トークン", "コスト（円）", "応答時間(ms)", "月"];
}

function createSettingsHeaders() {
  return ["設定名", "値", "説明", "更新日"];
}

/**
 * スプレッドシートの列を更新（表示優先度・表示フラグ列追加）
 */
function updateSpreadsheetColumns() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const planSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    
    if (!planSheet) {
      console.log("料金プランシートが見つかりません");
      return false;
    }
    
    const headers = planSheet.getRange(1, 1, 1, planSheet.getLastColumn()).getValues()[0];
    console.log("現在のヘッダー:", headers);
    
    // 新しい列が存在しない場合は追加
    if (headers.length < 10) {
      // 表示優先度列を追加
      planSheet.getRange(1, 9).setValue("表示優先度");
      planSheet.getRange(1, 10).setValue("表示フラグ");
      
      // 既存データに初期値を設定
      const lastRow = planSheet.getLastRow();
      if (lastRow > 1) {
        // 全プランに優先度1、表示フラグTRUEを設定
        const priorityRange = planSheet.getRange(2, 9, lastRow - 1, 1);
        const flagRange = planSheet.getRange(2, 10, lastRow - 1, 1);
        
        priorityRange.setValue("1");
        flagRange.setValue("TRUE");
      }
      
      console.log("新しい列を追加しました");
    }
    
    return true;
  } catch (error) {
    console.error("列更新エラー:", error);
    return false;
  }
}

/**
 * 全プランを有効化する（デバッグ用）
 */
function activateAllPlans() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const planSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    
    if (!planSheet) {
      console.log("料金プランシートが見つかりません");
      return false;
    }
    
    const lastRow = planSheet.getLastRow();
    console.log("最終行:", lastRow);
    
    if (lastRow > 1) {
      // 各行を個別に処理
      for (let i = 2; i <= lastRow; i++) {
        planSheet.getRange(i, 8).setValue("TRUE");  // 有効フラグ
        planSheet.getRange(i, 9).setValue("1");     // 表示優先度
        planSheet.getRange(i, 10).setValue("TRUE"); // 表示フラグ
      }
      
      console.log("全プランを有効化しました");
      
      // 確認のため最初の数行を読み込み
      const checkData = planSheet.getRange(2, 1, Math.min(5, lastRow - 1), 10).getValues();
      console.log("更新確認 - 最初の5行:");
      checkData.forEach((row, index) => {
        console.log(`行${index + 2}: ${row[0]} - 有効フラグ: ${row[7]} - 優先度: ${row[8]} - 表示フラグ: ${row[9]}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error("プラン有効化エラー:", error);
    return false;
  }
}

/**
 * スプレッドシートの実際のデータを確認（デバッグ用）
 */
function checkActualSpreadsheetData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const planSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    
    if (!planSheet) {
      console.log("料金プランシートが見つかりません");
      return false;
    }
    
    console.log("=== スプレッドシートの実際のデータ確認 ===");
    
    const data = planSheet.getDataRange().getValues();
    console.log("ヘッダー:", data[0]);
    
    // アカルボースの行のみ確認
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === "アカルボース") {
        console.log(`${data[i][0]}: 薬剤=${data[i][1]}, 有効フラグ=${data[i][7]} (type: ${typeof data[i][7]}), 優先度=${data[i][8]}, 表示フラグ=${data[i][9]}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("データ確認エラー:", error);
    return false;
  }
}

/**
 * 初期データの投入
 */
function insertInitialData() {
  // 薬剤情報の初期データ（CSVから取得）
  const medicineData = [
    ["アカルボース", "糖吸収抑制薬", "腸での糖質吸収を穏やかにし、食後血糖値の急上昇を抑える。使用実績50年以上。", "お食事の直前（第一口目の直前）に服用", "お腹の張り・ガス・下痢・腹痛・消化不良など（服用初期、2週間程度で軽減）", "妊娠中・授乳中の方", "直射日光・高温多湿を避け、涼しい場所でPTPシートのまま保管", new Date()],
    ["リベルサス", "GLP-1受容体作動薬", "血糖値を下げるホルモンの分泌を促進。食欲抑制効果もある経口薬。", "朝起きてすぐの空腹時に、コップ半分以下の水で服用", "吐き気・下痢・便秘・頭痛など", "妊娠中・授乳中の方、膵炎の既往歴がある方", "冷蔵庫保管不要、室温保管可", new Date()],
    ["マンジャロ", "GIP/GLP-1受容体作動薬", "週1回の注射で食欲を抑え、血糖値を安定させる新しいお薬。体重減少効果が期待できる。", "週1回、同じ曜日に皮下注射", "吐き気・下痢・便秘・注射部位反応など", "妊娠中・授乳中の方、膵炎の既往歴がある方", "冷蔵庫（2-8℃）で保管", new Date()]
  ];
  
  const medicineSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.MEDICINES);
  if (medicineSheet && medicineSheet.getLastRow() === 1) {
    medicineSheet.getRange(2, 1, medicineData.length, medicineData[0].length).setValues(medicineData);
  }
  
  // 料金プランの初期データ（表示優先度・表示フラグ追加）
  const planData = [
    // アカルボース（全て表示）
    ["A001", "アカルボース", "1ヶ月毎", "50mg×60錠", "5,980", "送料無料", 1, "TRUE", "1", "TRUE"],
    ["A002", "アカルボース", "3ヶ月毎", "50mg×180錠", "14,940", "送料無料", 2, "TRUE", "1", "TRUE"],
    ["A003", "アカルボース", "6ヶ月毎", "50mg×360錠", "23,880", "送料無料", 3, "TRUE", "1", "TRUE"],
    ["A004", "アカルボース", "1ヶ月毎", "100mg×30錠", "5,980", "送料無料", 4, "TRUE", "1", "TRUE"],
    ["A005", "アカルボース", "3ヶ月毎", "100mg×90錠", "14,940", "送料無料", 5, "TRUE", "1", "TRUE"],
    ["A006", "アカルボース", "6ヶ月毎", "100mg×180錠", "23,880", "送料無料", 6, "TRUE", "1", "TRUE"],
    
    // マンジャロ（主要プランのみ表示）
    ["M001", "マンジャロ", "1ヶ月毎", "2.5mg×4本", "19,980", "送料無料", 7, "TRUE", "1", "TRUE"],
    ["M002", "マンジャロ", "2ヶ月毎", "2.5mg×8本", "37,960", "送料無料", 8, "TRUE", "2", "FALSE"],
    ["M003", "マンジャロ", "3ヶ月毎", "2.5mg×12本", "53,940", "送料無料", 9, "TRUE", "1", "TRUE"],
    ["M004", "マンジャロ", "1ヶ月毎", "5mg×4本", "36,800", "送料無料", 10, "TRUE", "1", "TRUE"],
    ["M005", "マンジャロ", "2ヶ月毎", "5mg×8本", "69,920", "送料無料", 11, "TRUE", "2", "FALSE"],
    ["M006", "マンジャロ", "3ヶ月毎", "5mg×12本", "99,360", "送料無料", 12, "TRUE", "1", "TRUE"],
    ["M007", "マンジャロ", "1ヶ月毎", "7.5mg×4本", "53,600", "送料無料", 13, "TRUE", "2", "FALSE"],
    ["M008", "マンジャロ", "2ヶ月毎", "7.5mg×8本", "101,920", "送料無料", 14, "TRUE", "2", "FALSE"],
    ["M009", "マンジャロ", "3ヶ月毎", "7.5mg×12本", "144,720", "送料無料", 15, "TRUE", "2", "FALSE"],
    ["M010", "マンジャロ", "1ヶ月毎", "10mg×4本", "66,400", "送料無料", 16, "TRUE", "1", "TRUE"],
    ["M011", "マンジャロ", "2ヶ月毎", "10mg×8本", "126,160", "送料無料", 17, "TRUE", "2", "FALSE"],
    ["M012", "マンジャロ", "3ヶ月毎", "10mg×12本", "179,280", "送料無料", 18, "TRUE", "1", "TRUE"],
    ["M013", "マンジャロ", "1ヶ月毎", "12.5mg×4本", "79,200", "送料無料", 19, "TRUE", "2", "FALSE"],
    ["M014", "マンジャロ", "2ヶ月毎", "12.5mg×8本", "150,480", "送料無料", 20, "TRUE", "2", "FALSE"],
    ["M015", "マンジャロ", "3ヶ月毎", "12.5mg×12本", "213,840", "送料無料", 21, "TRUE", "2", "FALSE"],
    ["M016", "マンジャロ", "1ヶ月毎", "15mg×4本", "88,000", "送料無料", 22, "TRUE", "2", "FALSE"],
    ["M017", "マンジャロ", "2ヶ月毎", "15mg×8本", "167,200", "送料無料", 23, "TRUE", "2", "FALSE"],
    ["M018", "マンジャロ", "3ヶ月毎", "15mg×12本", "237,600", "送料無料", 24, "TRUE", "2", "FALSE"],
    ["M_Try", "マンジャロ", "2週間", "2.5mg×2本", "9,980", "お試し価格（通常10,800円）", 25, "TRUE", "1", "TRUE"],
    
    // リベルサス（全て表示）
    ["R001", "リベルサス", "1ヶ月毎", "3mg×30錠", "8,800", "送料無料", 26, "TRUE", "1", "TRUE"],
    ["R002", "リベルサス", "3ヶ月毎", "3mg×90錠", "24,900", "送料無料", 27, "TRUE", "1", "TRUE"],
    ["R003", "リベルサス", "6ヶ月毎", "3mg×180錠", "46,200", "送料無料", 28, "TRUE", "1", "TRUE"],
    ["R004", "リベルサス", "1ヶ月毎", "7mg×30錠", "19,800", "送料無料", 29, "TRUE", "1", "TRUE"],
    ["R005", "リベルサス", "3ヶ月毎", "7mg×90錠", "56,100", "送料無料", 30, "TRUE", "1", "TRUE"],
    ["R006", "リベルサス", "6ヶ月毎", "7mg×180錠", "104,280", "送料無料", 31, "TRUE", "1", "TRUE"],
    ["R007", "リベルサス", "1ヶ月毎", "14mg×30錠", "36,300", "送料無料", 32, "TRUE", "1", "TRUE"],
    ["R008", "リベルサス", "3ヶ月毎", "14mg×90錠", "102,960", "送料無料", 33, "TRUE", "1", "TRUE"],
    ["R009", "リベルサス", "6ヶ月毎", "14mg×180錠", "191,400", "送料無料", 34, "TRUE", "1", "TRUE"]
  ];
  
  const planSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  if (planSheet && planSheet.getLastRow() === 1) {
    planSheet.getRange(2, 1, planData.length, planData[0].length).setValues(planData);
  }
  
  // クリニック情報を設定シートに追加
  const clinicSettings = [
    ["clinic_name", "CTFオンラインクリニック", "クリニック名", new Date()],
    ["partner_clinic", "中野トータルヘルスケアクリニック", "提携医療機関", new Date()],
    ["greeting_1", "CTFオンラインクリニック事務局です😊", "事務局挨拶1", new Date()],
    ["greeting_2", "お問い合わせありがとうございます！CTFオンラインクリニック事務局です✨", "事務局挨拶2", new Date()]
  ];
  
  const settingsSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() === 1) {
    settingsSheet.getRange(2, 1, clinicSettings.length, clinicSettings[0].length).setValues(clinicSettings);
  }
  
  // Q&Aデータを追加（手続き・その他情報から）
  const qaData = [
    ["支払い", "どのような支払い方法がありますか？", "クレジットカード（VISA、MasterCard、JCB、AMEX、Diners）、銀行振込、後払い（コンビニ払い、銀行・郵便局ATM）、atone翌月払いがご利用いただけます💳", "高", "支払い方法", new Date(), "システム"],
    ["定期コース", "定期コースの解約方法は？", "次回お届け予定日の10日前までにLINEでご連絡ください。回数縛りはございませんので、いつでも解約可能です😊", "高", "解約", new Date(), "システム"],
    ["医療費控除", "医療費控除の対象になりますか？", "医師が高血糖・糖尿病治療目的で処方した場合、医療費控除の対象となる場合があります。詳しくは税務署または税理士にご確認ください。領収書は毎回のお薬お届け時に同封しています📄", "中", "税金", new Date(), "システム"],
    ["診察", "本人確認はどのように行いますか？", "保険証、運転免許証、マイナンバーカード、パスポートのいずれかで確認させていただきます。オンライン診察時に画面越しに提示していただく形となります📱", "中", "本人確認", new Date(), "システム"],
    ["薬剤", "アカルボースを飲み忘れたらどうすればいいですか？", "お食事の後に気づいた場合は、その回はスキップし、次のお食事直前から再開してください😌 まとめて服用することは避けてください。", "高", "服用方法", new Date(), "システム"]
  ];
  
  const qaSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAMES.QA);
  if (qaSheet && qaSheet.getLastRow() === 1) {
    qaSheet.getRange(2, 1, qaData.length, qaData[0].length).setValues(qaData);
  }
  
  // 設定値の初期化（ConfigManagerがある場合）
  if (typeof initializeSettings === 'function') {
    initializeSettings();
  }
}

/**
 * 対話ログを記録
 */
function logConversation(userId, userMessage, intent, botResponse, responseTime, evaluation = "", error = "") {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.LOGS);
    
    if (!sheet) return;
    
    const timestamp = new Date();
    const maskedUser = maskPersonalInfo(userMessage);
    const maskedBot = maskPersonalInfo(botResponse);
    
    sheet.appendRow([
      timestamp,
      userId || "anonymous",
      maskedUser,
      intent,
      maskedBot,
      responseTime,
      evaluation,
      error
    ]);
    
    // 古いログの削除
    cleanOldLogs(sheet);
    
  } catch (error) {
    console.error("ログ記録エラー:", error);
  }
}

/**
 * 個人情報のマスキング
 */
function maskPersonalInfo(text) {
  if (!text) return "";
  
  // 電話番号のマスキング
  text = text.replace(/\d{3,4}-?\d{3,4}-?\d{4}/g, "***-****-****");
  
  // メールアドレスのマスキング
  text = text.replace(/[\w\.\-]+@[\w\.\-]+\.\w+/g, "****@****.***");
  
  // クレジットカード番号のマスキング
  text = text.replace(/\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g, "****-****-****-****");
  
  return text;
}

/**
 * 古いログの削除
 */
function cleanOldLogs(sheet) {
  try {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - CONFIG.LOG_RETENTION_DAYS);
    
    const data = sheet.getDataRange().getValues();
    let rowsToDelete = [];
    
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][0] < retentionDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // 削除は逆順で実行
    rowsToDelete.forEach(row => {
      sheet.deleteRow(row);
    });
    
  } catch (error) {
    console.error("ログクリーンアップエラー:", error);
  }
}

/**
 * 設定値の取得
 */
function getSetting(settingName, defaultValue = null) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    if (!sheet) return defaultValue;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === settingName) {
        return data[i][1];
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error("設定取得エラー:", error);
    return defaultValue;
  }
}

/**
 * 設定値の保存
 */
function setSetting(settingName, value, description = "") {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    
    if (!sheet) return false;
    
    const data = sheet.getDataRange().getValues();
    let updated = false;
    
    // 既存の設定を更新
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === settingName) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 4).setValue(new Date());
        updated = true;
        break;
      }
    }
    
    // 新規設定を追加
    if (!updated) {
      sheet.appendRow([settingName, value, description, new Date()]);
    }
    
    return true;
  } catch (error) {
    console.error("設定保存エラー:", error);
    return false;
  }
}