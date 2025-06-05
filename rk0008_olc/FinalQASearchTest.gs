// FinalQASearchTest.gs - Q&A検索の最終統合テスト

/**
 * Q&A検索精度向上の最終テスト
 */
function finalQASearchTest() {
  console.log("=== Q&A検索精度向上 最終テスト ===");
  console.log("実行日時:", new Date().toLocaleString());
  
  // まず必要なQ&Aデータが存在することを確認
  ensureTestQAData();
  
  // テストケース定義
  const testCases = [
    {
      name: "マンジャロ用量相談（ユーザーの実例）",
      query: "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？",
      expectedInAnswer: ["2.5mg", "5mg", "用量", "医師"]
    },
    {
      name: "アカルボース価格質問",
      query: "アカルボースの価格を教えて",
      expectedInAnswer: ["50mg", "100mg", "5,980円", "14,940円", "23,880円"]
    },
    {
      name: "解約手続き",
      query: "定期コースを解約したいです",
      expectedInAnswer: ["次回お届け予定日の10日前", "LINE", "いつでも解約可能"]
    }
  ];
  
  console.log("\n【多段階検索システムの動作確認】");
  console.log("現在の設定:");
  console.log(`  AIフィルター: ${SEARCH_CONFIG.enable_ai_filter ? "有効" : "無効"}`);
  console.log(`  検索ログ: ${SEARCH_CONFIG.enable_search_log ? "有効" : "無効"}`);
  console.log(`  初期Q&A取得数: ${SEARCH_CONFIG.qa_initial_count}`);
  console.log(`  最終Q&A使用数: ${SEARCH_CONFIG.qa_final_count}`);
  
  // 各テストケースを実行
  testCases.forEach((testCase, index) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`テスト ${index + 1}: ${testCase.name}`);
    console.log(`質問: "${testCase.query}"`);
    console.log(`${'='.repeat(70)}`);
    
    // 意図分類（従来方式）
    const intent = categorizeIntent(testCase.query);
    console.log("\n【従来の意図分類】");
    console.log(`分類結果: ${intent}`);
    
    // 多段階検索実行
    console.log("\n【多段階検索実行】");
    const searchResult = executeMultiStageSearch(testCase.query);
    
    if (searchResult.success) {
      console.log("✅ 検索成功");
      
      // Q&A結果の詳細確認
      const qaResults = searchResult.context.relatedQA || [];
      console.log(`\n取得したQ&A: ${qaResults.length}件`);
      
      if (qaResults.length > 0) {
        qaResults.forEach((qa, i) => {
          console.log(`\n--- Q&A ${i + 1} ---`);
          console.log(`カテゴリ: ${qa.category}`);
          console.log(`質問: ${qa.question}`);
          console.log(`回答: ${qa.answer}`);
          
          // 期待される内容が含まれているかチェック
          const containsExpected = testCase.expectedInAnswer.some(keyword => 
            qa.answer.includes(keyword)
          );
          
          if (containsExpected) {
            console.log(`✅ 期待される内容が含まれています`);
          } else {
            console.log(`⚠️ 期待される内容が見つかりません`);
          }
          
          if (qa.similarityScore) {
            console.log(`類似度スコア: ${qa.similarityScore}`);
          }
        });
      } else {
        console.log("❌ Q&Aが取得されませんでした");
      }
      
      // 料金プラン結果
      const pricePlans = searchResult.context.pricePlans || [];
      if (pricePlans.length > 0) {
        console.log(`\n取得した料金プラン: ${pricePlans.length}件`);
        pricePlans.forEach((plan, i) => {
          console.log(`  ${i + 1}. ${plan.medicine} ${plan.quantity} - ${plan.price}円`);
        });
      }
      
      // 検索統計
      if (searchResult.searchLog) {
        console.log("\n【検索統計】");
        console.log(`総トークン数: ${searchResult.searchLog.totalTokens}`);
        console.log(`推定コスト: ¥${searchResult.searchLog.totalCost}`);
        
        // 各ステージの詳細
        Object.entries(searchResult.searchLog.stages).forEach(([stage, data]) => {
          if (data.duration) {
            console.log(`${stage}: ${data.duration}ms`);
          }
        });
      }
      
    } else {
      console.log("❌ 検索失敗");
      console.log(`エラー: ${searchResult.error}`);
    }
  });
  
  console.log(`\n\n${'='.repeat(70)}`);
  console.log("最終テスト完了");
  console.log(`${'='.repeat(70)}`);
}

/**
 * テスト用Q&Aデータの確保
 */
function ensureTestQAData() {
  console.log("\n【テスト用Q&Aデータ確認】");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return;
    }
    
    // 必須のQ&Aデータ
    const requiredQA = [
      {
        category: "薬剤",
        question: "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？",
        answer: "マンジャロは2.5mg、5mg、7.5mg、10mg、12.5mg、15mgの6種類の用量があります。医師が患者様の状態に合わせて適切な用量を処方いたします。通常は2.5mgから開始し、効果と副作用を見ながら必要に応じて増量していきます。どの用量も正しく使用すれば安全にご利用いただけますので、処方された用量でご安心ください。",
        frequency: "高",
        tags: "マンジャロ,用量,2.5mg,5mg"
      },
      {
        category: "価格",
        question: "アカルボースの価格を教えてください",
        answer: "アカルボースの価格は以下の通りです：\n【50mg】1ヶ月分（60錠）5,980円、3ヶ月分（180錠）14,940円、6ヶ月分（360錠）23,880円\n【100mg】1ヶ月分（30錠）5,980円、3ヶ月分（90錠）14,940円、6ヶ月分（180錠）23,880円\nすべて送料無料でお届けいたします。",
        frequency: "高",
        tags: "アカルボース,価格,料金"
      }
    ];
    
    // 既存データの確認
    const existingData = sheet.getDataRange().getValues();
    const existingQuestions = existingData.slice(1).map(row => row[1]);
    
    // 必要なQ&Aを追加
    requiredQA.forEach(qa => {
      if (!existingQuestions.includes(qa.question)) {
        sheet.appendRow([
          qa.category,
          qa.question,
          qa.answer,
          qa.frequency,
          qa.tags || "",
          new Date(),
          "システム"
        ]);
        console.log(`✅ 追加: ${qa.question.substring(0, 30)}...`);
      } else {
        console.log(`既存: ${qa.question.substring(0, 30)}...`);
      }
    });
    
  } catch (error) {
    console.error("Q&Aデータ確認エラー:", error);
  }
}

/**
 * 検索方式の比較分析
 */
function compareSearchMethods() {
  console.log("\n=== 従来方式 vs 多段階検索 比較分析 ===");
  
  const testQuery = "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？";
  
  // 一時的に多段階検索を無効化
  const originalSetting = SEARCH_CONFIG.enable_ai_filter;
  
  console.log("\n【従来の検索方式】");
  SEARCH_CONFIG.enable_ai_filter = false;
  
  const intent = categorizeIntent(testQuery);
  const traditionalContext = getContextByIntent(intent, testQuery);
  
  console.log(`意図分類: ${intent}`);
  console.log(`Q&A取得数: ${traditionalContext.relatedQA?.length || 0}`);
  
  if (traditionalContext.relatedQA && traditionalContext.relatedQA.length > 0) {
    console.log("取得したQ&A:");
    traditionalContext.relatedQA.forEach((qa, i) => {
      console.log(`  ${i + 1}. ${qa.question}`);
    });
  }
  
  // 多段階検索を有効化
  console.log("\n【多段階検索方式】");
  SEARCH_CONFIG.enable_ai_filter = originalSetting;
  
  const multiStageResult = executeMultiStageSearch(testQuery);
  
  if (multiStageResult.success) {
    console.log(`Q&A取得数: ${multiStageResult.context.relatedQA?.length || 0}`);
    
    if (multiStageResult.context.relatedQA && multiStageResult.context.relatedQA.length > 0) {
      console.log("取得したQ&A:");
      multiStageResult.context.relatedQA.forEach((qa, i) => {
        console.log(`  ${i + 1}. ${qa.question} (スコア: ${qa.similarityScore || "N/A"})`);
      });
    }
    
    // 検索プロセスの詳細
    if (multiStageResult.searchLog && multiStageResult.searchLog.stages) {
      console.log("\n検索プロセス:");
      const stages = multiStageResult.searchLog.stages;
      
      if (stages.stage1?.result) {
        console.log("Stage 1 - 抽出された意図:", stages.stage1.result);
      }
      if (stages.stage2?.result) {
        console.log(`Stage 2 - 候補データ: ${stages.stage2.result.totalCount}件`);
      }
      if (stages.stage3?.result) {
        console.log(`Stage 3 - AIフィルター後: Q&A ${stages.stage3.result.filteredQA}件`);
      }
    }
  }
  
  console.log("\n=== 比較分析完了 ===");
}

/**
 * 統合実行
 */
function runFinalQATest() {
  console.clear();
  console.log("Q&A検索精度向上の最終検証を開始します...\n");
  
  // 1. 最終テスト実行
  finalQASearchTest();
  
  // 2. 検索方式の比較
  console.log("\n");
  compareSearchMethods();
}