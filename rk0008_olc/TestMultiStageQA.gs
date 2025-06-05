// TestMultiStageQA.gs - 多段階検索システムのQ&Aテスト

/**
 * Q&Aシートに特定のテストデータを追加
 */
function addTestQAData() {
  console.log("=== Q&Aテストデータ追加 ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return false;
    }
    
    // テスト用Q&Aデータ
    const testQAData = [
      ["薬剤", "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？", 
       "マンジャロは2.5mg、5mg、7.5mg、10mg、12.5mg、15mgの6種類の用量があります。医師が患者様の状態に合わせて適切な用量を処方いたします。通常は2.5mgから開始し、効果と副作用を見ながら必要に応じて増量していきます。", 
       "高", "薬剤,用量", new Date(), "システム"],
      
      ["薬剤", "アカルボースの50mgと100mgはどう違いますか？", 
       "アカルボースは50mgと100mgの2種類があります。50mgは1日3回（1回2錠）、100mgは1日3回（1回1錠）の服用となります。効果は同じですが、錠剤数が異なります。", 
       "高", "薬剤,用量", new Date(), "システム"],
      
      ["価格", "マンジャロ5mgの価格を教えてください", 
       "マンジャロ5mgの価格は、1ヶ月分（4本）で36,800円、3ヶ月分（12本）で99,360円となっております。送料は無料です。", 
       "高", "価格,マンジャロ", new Date(), "システム"]
    ];
    
    // 既存のQ&Aと重複していないか確認
    const existingData = sheet.getDataRange().getValues();
    const existingQuestions = existingData.slice(1).map(row => row[1]);
    
    testQAData.forEach(qa => {
      if (!existingQuestions.includes(qa[1])) {
        sheet.appendRow(qa);
        console.log(`追加: ${qa[1]}`);
      } else {
        console.log(`既存: ${qa[1]}`);
      }
    });
    
    console.log("✅ テストデータ追加完了");
    return true;
    
  } catch (error) {
    console.error("テストデータ追加エラー:", error);
    return false;
  }
}

/**
 * 多段階検索システムのQ&A取得テスト
 */
function testMultiStageQARetrieval() {
  console.log("=== 多段階検索Q&A取得テスト ===");
  
  // テストケース
  const testCases = [
    {
      name: "マンジャロ用量質問",
      query: "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？",
      expectedKeywords: ["マンジャロ", "5.0ミリ", "2.5ミリ"]
    },
    {
      name: "アカルボース価格質問",
      query: "アカルボースの価格を教えて",
      expectedKeywords: ["アカルボース", "価格"]
    },
    {
      name: "マンジャロ5mg価格",
      query: "マンジャロ5mgの値段はいくらですか",
      expectedKeywords: ["マンジャロ", "5mg", "値段"]
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- テストケース${index + 1}: ${testCase.name} ---`);
    console.log(`質問: ${testCase.query}`);
    
    try {
      // 多段階検索実行
      const result = executeMultiStageSearch(testCase.query);
      
      if (result.success) {
        console.log("検索成功！");
        
        // Q&A結果の詳細表示
        if (result.context.relatedQA && result.context.relatedQA.length > 0) {
          console.log(`\n関連Q&A: ${result.context.relatedQA.length}件`);
          result.context.relatedQA.forEach((qa, i) => {
            console.log(`\n[Q&A ${i+1}]`);
            console.log(`カテゴリ: ${qa.category}`);
            console.log(`質問: ${qa.question}`);
            console.log(`回答: ${qa.answer.substring(0, 100)}...`);
            if (qa.similarityScore) {
              console.log(`類似度スコア: ${qa.similarityScore}`);
            }
          });
        } else {
          console.log("❌ Q&Aが取得されませんでした");
        }
        
        // 料金プラン結果
        if (result.context.pricePlans && result.context.pricePlans.length > 0) {
          console.log(`\n料金プラン: ${result.context.pricePlans.length}件`);
          result.context.pricePlans.forEach((plan, i) => {
            console.log(`[プラン${i+1}] ${plan.medicine} ${plan.quantity} - ${plan.price}円`);
          });
        }
        
        // 薬剤情報結果
        if (result.context.relatedMedicines && result.context.relatedMedicines.length > 0) {
          console.log(`\n薬剤情報: ${result.context.relatedMedicines.length}件`);
          result.context.relatedMedicines.forEach((med, i) => {
            console.log(`[薬剤${i+1}] ${med.name}`);
          });
        }
        
        // 検索ログの表示
        if (result.searchLog) {
          console.log(`\n検索統計:`);
          console.log(`総トークン数: ${result.searchLog.totalTokens}`);
          console.log(`推定コスト: ¥${result.searchLog.totalCost}`);
        }
        
      } else {
        console.log("❌ 検索失敗:", result.error);
      }
      
    } catch (error) {
      console.error("テストエラー:", error);
    }
  });
  
  console.log("\n=== テスト完了 ===");
}

/**
 * 従来の検索と多段階検索の比較テスト
 */
function compareSearchMethods() {
  console.log("=== 検索方式比較テスト ===");
  
  const testQuery = "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？";
  
  console.log("テスト質問:", testQuery);
  console.log("\n--- 従来の検索方式 ---");
  
  // 従来の検索を実行
  const intent = categorizeIntent(testQuery);
  console.log("意図分類:", intent);
  
  // 一時的に多段階検索を無効化
  const originalConfig = SEARCH_CONFIG.enable_ai_filter;
  SEARCH_CONFIG.enable_ai_filter = false;
  
  const traditionalContext = getContextByIntent(intent, testQuery);
  
  console.log("取得結果:");
  console.log(`薬剤: ${traditionalContext.relatedMedicines?.length || 0}件`);
  console.log(`料金: ${traditionalContext.pricePlans?.length || 0}件`);
  console.log(`Q&A: ${traditionalContext.relatedQA?.length || 0}件`);
  
  if (traditionalContext.relatedQA && traditionalContext.relatedQA.length > 0) {
    console.log("\n従来方式のQ&A:");
    traditionalContext.relatedQA.forEach((qa, i) => {
      console.log(`${i+1}. ${qa.question}`);
    });
  }
  
  // 多段階検索を再有効化
  SEARCH_CONFIG.enable_ai_filter = originalConfig;
  
  console.log("\n--- 多段階検索方式 ---");
  const multiStageResult = executeMultiStageSearch(testQuery);
  
  if (multiStageResult.success) {
    console.log("取得結果:");
    console.log(`薬剤: ${multiStageResult.context.relatedMedicines?.length || 0}件`);
    console.log(`料金: ${multiStageResult.context.pricePlans?.length || 0}件`);
    console.log(`Q&A: ${multiStageResult.context.relatedQA?.length || 0}件`);
    
    if (multiStageResult.context.relatedQA && multiStageResult.context.relatedQA.length > 0) {
      console.log("\n多段階検索のQ&A:");
      multiStageResult.context.relatedQA.forEach((qa, i) => {
        console.log(`${i+1}. ${qa.question} (スコア: ${qa.similarityScore})`);
      });
    }
  }
  
  console.log("\n=== 比較完了 ===");
}

/**
 * Q&A検索精度の詳細分析
 */
function analyzeQASearchAccuracy() {
  console.log("=== Q&A検索精度分析 ===");
  
  const testQuery = "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？";
  
  // Stage 1: 意図解析の確認
  console.log("Stage 1: 意図解析");
  const intents = ["マンジャロ5mg", "マンジャロ2.5mg", "用量相談"];
  console.log("抽出された意図:", intents);
  
  // Stage 2: Q&A候補の収集
  console.log("\nStage 2: Q&A候補収集");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    console.log(`Q&Aシート総行数: ${data.length - 1}`);
    
    // マンジャロ関連のQ&Aを探す
    const manjuroQAs = [];
    for (let i = 1; i < data.length; i++) {
      const question = data[i][1];
      const answer = data[i][2];
      
      if (question && (question.includes("マンジャロ") || answer.includes("マンジャロ"))) {
        manjuroQAs.push({
          row: i + 1,
          category: data[i][0],
          question: question,
          answer: answer.substring(0, 100) + "..."
        });
      }
    }
    
    console.log(`\nマンジャロ関連Q&A: ${manjuroQAs.length}件`);
    manjuroQAs.forEach((qa, i) => {
      console.log(`${i+1}. [行${qa.row}] ${qa.question}`);
    });
    
    // 類似度計算のテスト
    console.log("\n類似度計算テスト:");
    manjuroQAs.forEach(qa => {
      const score = calculateSimilarity(testQuery, qa.question);
      console.log(`「${qa.question}」スコア: ${score}`);
    });
    
  } catch (error) {
    console.error("分析エラー:", error);
  }
  
  console.log("\n=== 分析完了 ===");
}

/**
 * 完全な統合テスト
 */
function runFullMultiStageTest() {
  console.log("=== 多段階検索完全テスト開始 ===");
  
  // 1. テストデータの追加
  console.log("\n1. テストデータ追加");
  addTestQAData();
  
  // 2. Q&A取得テスト
  console.log("\n2. Q&A取得テスト");
  testMultiStageQARetrieval();
  
  // 3. 検索方式の比較
  console.log("\n3. 検索方式比較");
  compareSearchMethods();
  
  // 4. 精度分析
  console.log("\n4. 精度分析");
  analyzeQASearchAccuracy();
  
  console.log("\n=== 全テスト完了 ===");
}