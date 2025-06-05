// SpreadsheetAutoSetup.gs - スプレッドシート自動セットアップ機能

/**
 * すべてのシートに必要な列を追加する総合セットアップ
 */
function setupAllSheetEnhancements() {
  console.log("=== 全シート機能拡張セットアップ開始 ===");
  
  try {
    // 1. Q&Aシートに禁止キーワード列を追加
    console.log("1. Q&Aシート - 禁止キーワード列追加");
    setupQAProhibitedKeywords();
    
    // 2. API使用量シートにメールアドレス列を追加
    console.log("2. API使用量シート - メールアドレス列追加");
    setupAPIUsageEmailColumn();
    
    // 3. 対話履歴シートにメールアドレス列を追加
    console.log("3. 対話履歴シート - メールアドレス列追加");
    setupLogEmailColumn();
    
    // 4. その他のシートに更新者列を追加
    console.log("4. 薬剤・料金プラン等 - 更新者列追加");
    setupUpdatersColumns();
    
    console.log("✅ 全シート機能拡張セットアップ完了");
    
    // セットアップ結果をスプレッドシートに通知
    SpreadsheetApp.getActive().toast(
      "すべてのシートの機能拡張が完了しました", 
      "✅ セットアップ完了", 
      10
    );
    
    return true;
    
  } catch (error) {
    console.error("❌ セットアップエラー:", error);
    SpreadsheetApp.getActive().toast(
      "セットアップ中にエラーが発生しました: " + error.toString(), 
      "❌ エラー", 
      10
    );
    return false;
  }
}

/**
 * Q&Aシートに禁止キーワード列を追加
 */
function setupQAProhibitedKeywords() {
  console.log("=== Q&A禁止キーワード列セットアップ ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return false;
    }
    
    // 現在のヘッダーを確認
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log("現在のヘッダー:", headers);
    
    // 禁止キーワード列が既に存在するか確認
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    if (prohibitedIndex !== -1) {
      console.log("禁止キーワード列は既に存在します");
      return true;
    }
    
    // 新しい列を追加
    const newColumn = sheet.getLastColumn() + 1;
    
    // ヘッダーを設定
    sheet.getRange(1, newColumn).setValue("禁止キーワード");
    sheet.getRange(1, newColumn).setBackground("#FFE6E6");
    sheet.getRange(1, newColumn).setFontWeight("bold");
    sheet.getRange(1, newColumn).setNote("カンマ区切りで複数入力可能\n例: ビデオ通話,オンライン診療");
    
    // 入力例を2行目に追加（もしデータがあれば）
    if (sheet.getLastRow() > 1) {
      const exampleRow = sheet.getRange(2, 1).getValue();
      if (exampleRow && exampleRow.toString().includes("本人確認")) {
        sheet.getRange(2, newColumn).setValue("ビデオ通話,オンライン診療,顔確認,画面越し");
      }
    }
    
    console.log("✅ Q&A禁止キーワード列追加完了");
    return true;
    
  } catch (error) {
    console.error("❌ Q&A禁止キーワード列追加エラー:", error);
    return false;
  }
}

/**
 * API使用量シートにメールアドレス列を追加
 */
function setupAPIUsageEmailColumn() {
  console.log("=== API使用量メールアドレス列セットアップ ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.API_USAGE);
    
    if (!sheet) {
      console.error("API使用量シートが見つかりません");
      return false;
    }
    
    // 現在のヘッダーを確認
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // メールアドレス列が既に存在するか確認
    const emailIndex = headers.indexOf("メールアドレス");
    if (emailIndex !== -1) {
      console.log("メールアドレス列は既に存在します");
      return true;
    }
    
    // 新しい列を追加（月の後に）
    const monthIndex = headers.indexOf("月");
    const newColumn = monthIndex !== -1 ? monthIndex + 2 : sheet.getLastColumn() + 1;
    
    // 既存のデータをシフト（必要な場合）
    if (monthIndex !== -1 && monthIndex < sheet.getLastColumn()) {
      sheet.insertColumnAfter(monthIndex + 1);
    }
    
    // ヘッダーを設定
    sheet.getRange(1, newColumn).setValue("メールアドレス");
    sheet.getRange(1, newColumn).setBackground("#E6F3FF");
    sheet.getRange(1, newColumn).setFontWeight("bold");
    
    console.log("✅ API使用量メールアドレス列追加完了");
    return true;
    
  } catch (error) {
    console.error("❌ API使用量メールアドレス列追加エラー:", error);
    return false;
  }
}

/**
 * 対話履歴シートにメールアドレス列を追加
 */
function setupLogEmailColumn() {
  console.log("=== 対話履歴メールアドレス列セットアップ ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.LOGS);
    
    if (!sheet) {
      console.error("対話履歴シートが見つかりません");
      return false;
    }
    
    // 現在のヘッダーを確認
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // メールアドレス列が既に存在するか確認
    const emailIndex = headers.indexOf("メールアドレス");
    if (emailIndex !== -1) {
      console.log("メールアドレス列は既に存在します");
      return true;
    }
    
    // 新しい列を追加（ユーザーIDの後に）
    const userIdIndex = headers.indexOf("ユーザーID");
    const newColumn = userIdIndex !== -1 ? userIdIndex + 2 : 3;
    
    // 既存のデータをシフト
    if (userIdIndex !== -1 && userIdIndex < sheet.getLastColumn()) {
      sheet.insertColumnAfter(userIdIndex + 1);
    }
    
    // ヘッダーを設定
    sheet.getRange(1, newColumn).setValue("メールアドレス");
    sheet.getRange(1, newColumn).setBackground("#E6F3FF");
    sheet.getRange(1, newColumn).setFontWeight("bold");
    
    console.log("✅ 対話履歴メールアドレス列追加完了");
    return true;
    
  } catch (error) {
    console.error("❌ 対話履歴メールアドレス列追加エラー:", error);
    return false;
  }
}

/**
 * 他のシートに更新者列を追加
 */
function setupUpdatersColumns() {
  console.log("=== 更新者列セットアップ ===");
  
  const sheetsToUpdate = [
    CONFIG.SHEET_NAMES.MEDICINES,
    CONFIG.SHEET_NAMES.PLANS,
    CONFIG.SHEET_NAMES.SETTINGS
  ];
  
  sheetsToUpdate.forEach(sheetName => {
    try {
      console.log(`${sheetName}シートの更新者列追加中...`);
      
      const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
        .getSheetByName(sheetName);
      
      if (!sheet) {
        console.warn(`${sheetName}シートが見つかりません`);
        return;
      }
      
      // 現在のヘッダーを確認
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // 更新者列が既に存在するか確認
      const updaterIndex = headers.indexOf("更新者");
      if (updaterIndex !== -1) {
        console.log(`${sheetName}シート: 更新者列は既に存在します`);
        return;
      }
      
      // 新しい列を追加（更新日の後に）
      const updateDateIndex = headers.findIndex(h => 
        h.includes("更新日") || h.includes("日付") || h === "timestamp"
      );
      
      let newColumn;
      if (updateDateIndex !== -1) {
        newColumn = updateDateIndex + 2;
        if (updateDateIndex < sheet.getLastColumn()) {
          sheet.insertColumnAfter(updateDateIndex + 1);
        }
      } else {
        newColumn = sheet.getLastColumn() + 1;
      }
      
      // ヘッダーを設定
      sheet.getRange(1, newColumn).setValue("更新者");
      sheet.getRange(1, newColumn).setBackground("#FFF0E6");
      sheet.getRange(1, newColumn).setFontWeight("bold");
      
      console.log(`✅ ${sheetName}シート: 更新者列追加完了`);
      
    } catch (error) {
      console.error(`❌ ${sheetName}シート更新者列追加エラー:`, error);
    }
  });
  
  return true;
}

/**
 * 現在のユーザーのメールアドレスを取得
 */
function getCurrentUserEmail() {
  try {
    const email = Session.getActiveUser().getEmail();
    return email || "unknown@example.com";
  } catch (error) {
    console.error("メールアドレス取得エラー:", error);
    return "error@example.com";
  }
}

/**
 * シートの列構造を確認（デバッグ用）
 */
function checkAllSheetStructures() {
  console.log("=== 全シート構造確認 ===");
  
  const sheets = [
    CONFIG.SHEET_NAMES.QA,
    CONFIG.SHEET_NAMES.API_USAGE,
    CONFIG.SHEET_NAMES.LOGS,
    CONFIG.SHEET_NAMES.MEDICINES,
    CONFIG.SHEET_NAMES.PLANS,
    CONFIG.SHEET_NAMES.SETTINGS
  ];
  
  sheets.forEach(sheetName => {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
        .getSheetByName(sheetName);
      
      if (!sheet) {
        console.log(`${sheetName}: シートが見つかりません`);
        return;
      }
      
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      console.log(`\n${sheetName}シートのヘッダー:`);
      headers.forEach((header, index) => {
        console.log(`  ${index + 1}: ${header}`);
      });
      
    } catch (error) {
      console.error(`${sheetName}シートエラー:`, error);
    }
  });
}

/**
 * Q&Aに禁止キーワードのサンプルデータを設定
 */
function setupSampleProhibitedKeywords() {
  console.log("=== 禁止キーワードサンプルデータ設定 ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return false;
    }
    
    // 禁止キーワード列を探す
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    
    if (prohibitedIndex === -1) {
      console.error("禁止キーワード列が見つかりません");
      return false;
    }
    
    const prohibitedColumn = prohibitedIndex + 1;
    
    // Q&Aデータを確認し、サンプルを設定
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const category = data[i][0];
      const question = data[i][1];
      
      // 本人確認関連
      if (question && question.toString().includes("本人確認")) {
        sheet.getRange(i + 1, prohibitedColumn).setValue("ビデオ通話,オンライン診療,顔確認,画面越しに");
      }
      // 診察関連
      else if (category === "診察" && !data[i][prohibitedColumn - 1]) {
        sheet.getRange(i + 1, prohibitedColumn).setValue("ビデオ通話,オンライン診療");
      }
    }
    
    console.log("✅ 禁止キーワードサンプルデータ設定完了");
    return true;
    
  } catch (error) {
    console.error("❌ サンプルデータ設定エラー:", error);
    return false;
  }
}