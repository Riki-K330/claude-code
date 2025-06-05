// DemoMultiStageSearch.gs - 多段階検索システムのデモンストレーション

/**
 * 多段階検索システムの動作確認とデモ
 */
function demoMultiStageSearch() {
  console.log("=== 多段階検索システム デモンストレーション ===");
  console.log("日時:", new Date().toLocaleString());
  
  // デモ用の質問例
  const demoQueries = [
    {
      title: "ケース1: マンジャロ用量相談",
      query: "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？",
      expectedContent: ["マンジャロの用量情報", "2.5mgと5mgの違い"]
    },
    {
      title: "ケース2: アカルボース価格",
      query: "アカルボースの価格を教えてください",
      expectedContent: ["アカルボース50mg価格", "アカルボース100mg価格"]
    },
    {
      title: "ケース3: 解約方法",
      query: "定期コースを解約したいのですが、どうすればいいですか",
      expectedContent: ["解約手続き", "次回お届け予定日の10日前"]
    }
  ];
  
  demoQueries.forEach((demo, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`デモ ${index + 1}: ${demo.title}`);
    console.log(`質問: "${demo.query}"`);
    console.log(`期待される内容: ${demo.expectedContent.join(", ")}`);
    console.log(`${'='.repeat(60)}`);
    
    // 多段階検索を実行
    const result = executeMultiStageSearch(demo.query);
    
    if (result.success) {
      console.log("\n✅ 検索成功");
      
      // 各段階の結果を表示
      if (result.searchLog && result.searchLog.stages) {
        console.log("\n【検索プロセス】");
        
        // Stage 1: 意図解析
        if (result.searchLog.stages.stage1) {
          console.log("\nStage 1 - 意図解析:");
          console.log("  抽出された意図:", result.searchLog.stages.stage1.result);
        }
        
        // Stage 2: データ収集
        if (result.searchLog.stages.stage2) {
          console.log("\nStage 2 - データ収集:");
          const stage2Result = result.searchLog.stages.stage2.result;
          console.log(`  薬剤情報: ${stage2Result.medicineCount}件`);
          console.log(`  料金プラン: ${stage2Result.priceCount}件`);
          console.log(`  Q&A: ${stage2Result.qaCount}件`);
          console.log(`  合計: ${stage2Result.totalCount}件`);
        }
        
        // Stage 3: AIフィルター
        if (result.searchLog.stages.stage3) {
          console.log("\nStage 3 - AIフィルター:");
          const stage3Result = result.searchLog.stages.stage3.result;
          console.log(`  絞り込み後Q&A: ${stage3Result.filteredQA}件`);
          console.log(`  絞り込み後プラン: ${stage3Result.filteredPlans}件`);
        }
      }
      
      // 最終結果の詳細
      console.log("\n【最終取得データ】");
      
      // Q&A結果
      if (result.context.relatedQA && result.context.relatedQA.length > 0) {
        console.log("\n📋 関連Q&A:");
        result.context.relatedQA.forEach((qa, i) => {
          console.log(`\n  ${i + 1}. [${qa.category}] ${qa.question}`);
          console.log(`     回答: ${qa.answer.substring(0, 150)}...`);
          if (qa.prohibitedKeywords) {
            console.log(`     禁止キーワード: ${qa.prohibitedKeywords}`);
          }
          if (qa.similarityScore) {
            console.log(`     類似度スコア: ${qa.similarityScore}`);
          }
        });
      }
      
      // 料金プラン結果
      if (result.context.pricePlans && result.context.pricePlans.length > 0) {
        console.log("\n💰 料金プラン:");
        result.context.pricePlans.forEach((plan, i) => {
          console.log(`  ${i + 1}. ${plan.medicine} ${plan.quantity} - ${plan.price}円 (${plan.period})`);
        });
      }
      
      // 薬剤情報結果
      if (result.context.relatedMedicines && result.context.relatedMedicines.length > 0) {
        console.log("\n💊 薬剤情報:");
        result.context.relatedMedicines.forEach((med, i) => {
          console.log(`  ${i + 1}. ${med.name}: ${med.description.substring(0, 100)}...`);
        });
      }
      
      // コスト情報
      if (result.searchLog) {
        console.log("\n💵 検索コスト:");
        console.log(`  使用トークン: ${result.searchLog.totalTokens}`);
        console.log(`  推定コスト: ¥${result.searchLog.totalCost}`);
      }
      
    } else {
      console.log("\n❌ 検索失敗");
      console.log("エラー:", result.error);
    }
  });
  
  console.log(`\n\n${'='.repeat(60)}`);
  console.log("デモンストレーション完了");
  console.log(`${'='.repeat(60)}`);
}

/**
 * 多段階検索の設定を確認・調整
 */
function checkSearchConfig() {
  console.log("=== 多段階検索設定確認 ===");
  console.log("\n現在の設定:");
  
  Object.entries(SEARCH_CONFIG).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log("\n推奨設定:");
  console.log("  qa_initial_count: 10 (初期Q&A取得数)");
  console.log("  qa_final_count: 3 (最終使用Q&A数)");
  console.log("  enable_ai_filter: true (AI絞り込み有効)");
  console.log("  enable_search_log: true (検索ログ有効)");
}

/**
 * Q&Aシートの状態を確認
 */
function checkQASheetStatus() {
  console.log("=== Q&Aシート状態確認 ===");
  
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) {
      console.error("Q&Aシートが見つかりません");
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    console.log("ヘッダー:", headers);
    console.log("データ行数:", data.length - 1);
    
    // 禁止キーワード列の確認
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    console.log("禁止キーワード列:", prohibitedIndex !== -1 ? `列${prohibitedIndex + 1}` : "なし");
    
    // 各カテゴリのQ&A数を集計
    const categoryCounts = {};
    for (let i = 1; i < data.length; i++) {
      const category = data[i][0];
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }
    
    console.log("\nカテゴリ別Q&A数:");
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}件`);
    });
    
    // 特定のキーワードを含むQ&Aを検索
    console.log("\n特定キーワードのQ&A:");
    const keywords = ["マンジャロ", "アカルボース", "解約", "価格"];
    
    keywords.forEach(keyword => {
      let count = 0;
      for (let i = 1; i < data.length; i++) {
        const question = data[i][1] || "";
        const answer = data[i][2] || "";
        if (question.includes(keyword) || answer.includes(keyword)) {
          count++;
        }
      }
      console.log(`  "${keyword}"を含むQ&A: ${count}件`);
    });
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

/**
 * 多段階検索システムの完全リセット
 */
function resetMultiStageSearch() {
  console.log("=== 多段階検索システムリセット ===");
  
  // 設定を初期値に戻す
  SEARCH_CONFIG.enable_ai_filter = true;
  SEARCH_CONFIG.enable_search_log = true;
  SEARCH_CONFIG.qa_initial_count = 10;
  SEARCH_CONFIG.qa_final_count = 3;
  
  console.log("設定を初期値にリセットしました");
  console.log("現在の設定:", SEARCH_CONFIG);
}

/**
 * 統合デモ実行
 */
function runFullDemo() {
  console.clear();
  console.log("多段階検索システム 統合デモを開始します...\n");
  
  // 1. 設定確認
  checkSearchConfig();
  
  // 2. Q&Aシート状態確認
  console.log("\n");
  checkQASheetStatus();
  
  // 3. デモ実行
  console.log("\n");
  demoMultiStageSearch();
}