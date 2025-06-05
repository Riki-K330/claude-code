// ProhibitedKeywordFilter.gs - 禁止キーワードフィルター機能

/**
 * Q&A回答から禁止キーワードを含む文を除外
 * @param {string} text - フィルター対象のテキスト
 * @param {string} prohibitedKeywordsStr - カンマ区切りの禁止キーワード
 * @return {string} フィルター後のテキスト
 */
function filterProhibitedKeywords(text, prohibitedKeywordsStr) {
  if (!text || !prohibitedKeywordsStr) {
    return text;
  }
  
  try {
    // 禁止キーワードを配列に変換（前後の空白も除去）
    const prohibitedKeywords = prohibitedKeywordsStr
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    
    if (prohibitedKeywords.length === 0) {
      return text;
    }
    
    console.log("禁止キーワード:", prohibitedKeywords);
    
    // 文章を行単位で分割
    const lines = text.split('\n');
    const filteredLines = [];
    
    // 各行をチェック
    for (const line of lines) {
      let shouldKeep = true;
      
      // 禁止キーワードが含まれているかチェック
      for (const keyword of prohibitedKeywords) {
        if (line.includes(keyword)) {
          console.log(`禁止キーワード「${keyword}」を含む行を除外:`, line);
          shouldKeep = false;
          break;
        }
      }
      
      if (shouldKeep) {
        filteredLines.push(line);
      }
    }
    
    // フィルター後のテキストを結合
    const filteredText = filteredLines.join('\n').trim();
    
    // 空行が連続する場合は1つにまとめる
    return filteredText.replace(/\n\n+/g, '\n\n');
    
  } catch (error) {
    console.error("禁止キーワードフィルターエラー:", error);
    return text; // エラー時は元のテキストを返す
  }
}

/**
 * 関連Q&Aを検索（禁止キーワード対応版）
 */
function searchRelatedQAWithFilter(category, query) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const qaList = [];
    
    // 禁止キーワード列のインデックスを取得
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    console.log("禁止キーワード列インデックス:", prohibitedIndex);
    
    console.log("Q&A検索 - カテゴリ:", category, "クエリ:", query);
    
    for (let i = 1; i < data.length; i++) {
      const qaCategory = data[i][0];
      const qaQuestion = data[i][1];
      const qaAnswer = data[i][2];
      const frequency = data[i][3];
      const prohibitedKeywords = prohibitedIndex !== -1 ? data[i][prohibitedIndex] : "";
      
      // 既存の検索ロジック
      let isMatch = false;
      
      // カテゴリ完全一致
      if (qaCategory === category) {
        isMatch = true;
      }
      // クエリに質問の内容が含まれる
      else if (qaQuestion && query.includes(qaQuestion)) {
        isMatch = true;
      }
      // 質問にクエリのキーワードが含まれる
      else if (qaQuestion && qaQuestion.includes("医療費控除") && query.includes("医療費控除")) {
        isMatch = true;
      }
      // 支払い関連のキーワード検索
      else if (qaQuestion && (
        (query.includes("支払") && qaQuestion.includes("支払")) ||
        (query.includes("解約") && qaQuestion.includes("解約")) ||
        (query.includes("定期") && qaQuestion.includes("定期")) ||
        (query.includes("本人確認") && qaQuestion.includes("本人確認"))
      )) {
        isMatch = true;
      }
      
      if (isMatch && qaQuestion && qaAnswer) {
        // 禁止キーワードフィルターを適用
        const filteredAnswer = filterProhibitedKeywords(qaAnswer, prohibitedKeywords);
        
        qaList.push({
          category: qaCategory,
          question: qaQuestion,
          answer: filteredAnswer, // フィルター済みの回答
          frequency: frequency,
          originalAnswer: qaAnswer, // デバッグ用に元の回答も保持
          prohibitedKeywords: prohibitedKeywords
        });
        console.log(`Q&A一致: ${qaQuestion}`);
        if (prohibitedKeywords) {
          console.log(`禁止キーワード適用: ${prohibitedKeywords}`);
        }
      }
    }
    
    // 使用頻度でソート
    qaList.sort((a, b) => {
      const freqOrder = { "高": 3, "中": 2, "低": 1 };
      return (freqOrder[b.frequency] || 0) - (freqOrder[a.frequency] || 0);
    });
    
    console.log(`Q&A検索結果: ${qaList.length}件`);
    return qaList.slice(0, 3); // 上位3件を返す
    
  } catch (error) {
    console.error("Q&A検索エラー:", error);
    return [];
  }
}

/**
 * 禁止キーワードフィルターのテスト
 */
function testProhibitedKeywordFilter() {
  console.log("=== 禁止キーワードフィルターテスト ===");
  
  // テストケース1: 本人確認の例
  const testText1 = `本人確認についてお問い合わせいただき、ありがとうございます✨

当クリニックでは、安全な診療のために以下の本人確認を行っております📋

【初回診療時の本人確認】
・身分証明書の提出（運転免許証、保険証、マイナンバーカードなど）
・お名前、生年月日、ご住所の確認
・緊急連絡先の登録

【オンライン診療での確認】
・ビデオ通話での顔確認
・登録情報との照合
・必要に応じて追加の身分証確認

【お薬配送時の確認】
・配送先住所と登録住所の一致確認
・受取時のお名前確認（配送業者による）`;
  
  const prohibitedKeywords1 = "ビデオ通話,オンライン診療,顔確認,画面越し";
  
  console.log("【テスト1: 本人確認】");
  console.log("禁止キーワード:", prohibitedKeywords1);
  const filtered1 = filterProhibitedKeywords(testText1, prohibitedKeywords1);
  console.log("フィルター後:\n", filtered1);
  console.log("");
  
  // テストケース2: 禁止キーワードなし
  const testText2 = "これは通常のテキストです。\n特に問題ない内容です。";
  const prohibitedKeywords2 = "";
  
  console.log("【テスト2: 禁止キーワードなし】");
  const filtered2 = filterProhibitedKeywords(testText2, prohibitedKeywords2);
  console.log("フィルター後:\n", filtered2);
  console.log("");
  
  // テストケース3: 実際のQ&A検索テスト
  console.log("【テスト3: 実際のQ&A検索】");
  const qaResults = searchRelatedQAWithFilter("本人確認", "本人確認について教えて");
  qaResults.forEach((qa, index) => {
    console.log(`\n結果${index + 1}:`);
    console.log("質問:", qa.question);
    console.log("禁止キーワード:", qa.prohibitedKeywords);
    console.log("フィルター後の回答:", qa.answer);
  });
  
  console.log("\n=== テスト完了 ===");
}

/**
 * 本人確認Q&Aに禁止キーワードを設定するテスト
 */
function setupIdentityVerificationTest() {
  console.log("=== 本人確認Q&A禁止キーワード設定テスト ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    
    if (prohibitedIndex === -1) {
      console.error("禁止キーワード列が見つかりません。setupQAProhibitedKeywords()を実行してください。");
      return false;
    }
    
    const prohibitedColumn = prohibitedIndex + 1;
    
    // 本人確認関連のQ&Aを検索して禁止キーワードを設定
    for (let i = 1; i < data.length; i++) {
      const question = data[i][1];
      
      if (question && question.includes("本人確認")) {
        console.log(`本人確認Q&A発見（行${i + 1}）:`, question);
        
        // 禁止キーワードを設定
        sheet.getRange(i + 1, prohibitedColumn).setValue("ビデオ通話,オンライン診療,顔確認,画面越しに");
        console.log("禁止キーワード設定完了");
      }
    }
    
    console.log("✅ 本人確認Q&A設定完了");
    return true;
    
  } catch (error) {
    console.error("❌ 設定エラー:", error);
    return false;
  }
}