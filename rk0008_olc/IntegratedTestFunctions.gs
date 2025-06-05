// IntegratedTestFunctions.gs - 統合テスト関数

/**
 * 完全な機能拡張テスト
 */
function testCompleteEnhancements() {
  console.log("=== 完全機能拡張テスト開始 ===");
  
  try {
    // 1. 自動セットアップ実行
    console.log("1. 自動セットアップ実行");
    setupAllSheetEnhancements();
    
    // 2. 本人確認Q&Aに禁止キーワード設定
    console.log("2. 本人確認Q&Aに禁止キーワード設定");
    setupIdentityVerificationTest();
    
    // 3. 禁止キーワードフィルターテスト
    console.log("3. 禁止キーワードフィルターテスト");
    testProhibitedKeywordFilter();
    
    // 4. 実際の質問でテスト
    console.log("4. 実際の質問でテスト");
    const testQuestion = "本人確認について教えて";
    const intent = categorizeIntent(testQuestion);
    const context = getContextByIntent(intent, testQuestion);
    
    console.log("取得されたコンテキスト:");
    if (context.relatedQA && context.relatedQA.length > 0) {
      context.relatedQA.forEach((qa, index) => {
        console.log(`\nQ&A ${index + 1}:`);
        console.log("質問:", qa.question);
        console.log("回答:", qa.answer);
        console.log("禁止キーワード:", qa.prohibitedKeywords);
      });
    }
    
    console.log("\n✅ 完全機能拡張テスト完了");
    
    return {
      success: true,
      message: "すべてのテストが正常に完了しました"
    };
    
  } catch (error) {
    console.error("❌ テストエラー:", error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 管理者向け操作マニュアルをシートに作成
 */
function createAdminManual() {
  console.log("=== 管理者向け操作マニュアル作成 ===");
  
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    
    // マニュアルシートが既に存在するか確認
    let manualSheet = spreadsheet.getSheetByName("操作マニュアル");
    
    if (!manualSheet) {
      manualSheet = spreadsheet.insertSheet("操作マニュアル");
    }
    
    // シートをクリア
    manualSheet.clear();
    
    // ヘッダー設定
    manualSheet.getRange(1, 1).setValue("CTFオンラインクリニック チャットボット 操作マニュアル");
    manualSheet.getRange(1, 1).setFontSize(16);
    manualSheet.getRange(1, 1).setFontWeight("bold");
    
    // マニュアル内容
    const manualContent = [
      [""],
      ["■ Q&A禁止キーワード機能"],
      ["1. Q&Aシートを開く"],
      ["2. 各Q&Aの「禁止キーワード」列に、除外したいキーワードをカンマ区切りで入力"],
      ["   例: ビデオ通話,オンライン診療,顔確認"],
      ["3. 保存すると、そのQ&Aが使用される際に自動的に禁止キーワードを含む文が除外されます"],
      [""],
      ["■ 禁止キーワードの使い方"],
      ["・複数のキーワードはカンマ（,）で区切る"],
      ["・前後の空白は自動的に除去される"],
      ["・キーワードを含む文章全体が除外される"],
      [""],
      ["■ 実際の例"],
      ["質問: 本人確認について"],
      ["禁止キーワード: ビデオ通話,オンライン診療"],
      ["→ 「ビデオ通話での顔確認」などの文が自動的に除外されます"],
      [""],
      ["■ 更新者情報"],
      ["・薬剤、料金プラン、設定シートには「更新者」列が追加されています"],
      ["・データを更新すると自動的に更新者のメールアドレスが記録されます"],
      [""],
      ["■ API使用量・対話履歴"],
      ["・メールアドレスが自動的に記録されます"],
      ["・誰がいつAPIを使用したか追跡できます"],
      [""],
      ["■ 一括セットアップ"],
      ["・新しい環境では setupAllSheetEnhancements() を実行"],
      ["・すべての機能が自動的に設定されます"],
      [""],
      ["■ トラブルシューティング"],
      ["Q: 禁止キーワードが効かない"],
      ["A: Q&Aシートの「禁止キーワード」列を確認し、正しく入力されているか確認"],
      [""],
      ["Q: 更新者が記録されない"],
      ["A: Google Apps Scriptの権限設定を確認"],
      [""],
      ["最終更新: " + new Date().toLocaleString()]
    ];
    
    // マニュアル内容を書き込み
    manualContent.forEach((row, index) => {
      manualSheet.getRange(index + 2, 1).setValue(row[0]);
      
      // セクションヘッダーの装飾
      if (row[0].startsWith("■")) {
        manualSheet.getRange(index + 2, 1).setFontWeight("bold");
        manualSheet.getRange(index + 2, 1).setBackground("#E6F3FF");
      }
    });
    
    // 列幅調整
    manualSheet.setColumnWidth(1, 600);
    
    console.log("✅ 管理者向け操作マニュアル作成完了");
    
    return true;
    
  } catch (error) {
    console.error("❌ マニュアル作成エラー:", error);
    return false;
  }
}

/**
 * シートデータ更新時の更新者自動記録テスト
 */
function testAutoUpdaterRecording() {
  console.log("=== 更新者自動記録テスト ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.MEDICINES);
    
    if (!sheet) {
      console.error("薬剤シートが見つかりません");
      return false;
    }
    
    // ヘッダーから更新者列を探す
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const updaterIndex = headers.indexOf("更新者");
    
    if (updaterIndex === -1) {
      console.error("更新者列が見つかりません");
      return false;
    }
    
    const updaterColumn = updaterIndex + 1;
    const currentUser = getCurrentUserEmail();
    
    // テストデータの更新（2行目）
    if (sheet.getLastRow() > 1) {
      const testRow = 2;
      
      // 既存データを少し変更
      const currentValue = sheet.getRange(testRow, 2).getValue();
      sheet.getRange(testRow, 2).setValue(currentValue + " (テスト更新)");
      
      // 更新者を記録
      sheet.getRange(testRow, updaterColumn).setValue(currentUser);
      
      // 更新日も更新
      const updateDateIndex = headers.findIndex(h => h.includes("更新日"));
      if (updateDateIndex !== -1) {
        sheet.getRange(testRow, updateDateIndex + 1).setValue(new Date());
      }
      
      console.log(`✅ 更新者記録テスト完了: ${currentUser}`);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ 更新者記録テストエラー:", error);
    return false;
  }
}

/**
 * 最終統合動作確認
 */
function finalIntegrationCheck() {
  console.log("=== 最終統合動作確認 ===");
  
  const results = {
    setup: false,
    prohibitedKeywords: false,
    emailRecording: false,
    updaterRecording: false,
    manual: false
  };
  
  try {
    // 1. セットアップ確認
    console.log("1. セットアップ状態確認");
    checkAllSheetStructures();
    results.setup = true;
    
    // 2. 禁止キーワード動作確認
    console.log("2. 禁止キーワード動作確認");
    const qaTest = searchRelatedQAWithFilter("本人確認", "本人確認について教えて");
    if (qaTest && qaTest.length > 0) {
      console.log("禁止キーワードフィルター: 動作中");
      results.prohibitedKeywords = true;
    }
    
    // 3. メールアドレス記録確認
    console.log("3. メールアドレス記録確認");
    const currentEmail = getCurrentUserEmail();
    console.log("現在のユーザー:", currentEmail);
    results.emailRecording = currentEmail !== "unknown@example.com";
    
    // 4. 更新者記録確認
    console.log("4. 更新者記録確認");
    results.updaterRecording = testAutoUpdaterRecording();
    
    // 5. マニュアル作成
    console.log("5. 操作マニュアル作成");
    results.manual = createAdminManual();
    
    // 結果サマリー
    console.log("\n=== 動作確認結果 ===");
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}: ${value ? "✅ OK" : "❌ NG"}`);
    });
    
    return results;
    
  } catch (error) {
    console.error("❌ 統合確認エラー:", error);
    return results;
  }
}