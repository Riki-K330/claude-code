// TestPricePlanSearch.gs - 料金プラン検索のテスト

/**
 * アカルボース価格検索の詳細テスト
 */
function testAcarbosePriceSearch() {
  console.log("=== アカルボース価格検索テスト ===");
  
  const query = "アカルボースの価格を教えてください";
  
  // Stage 1: 意図解析のテスト
  console.log("\n1. 意図解析テスト");
  const prompt = `質問から検索すべき項目を簡潔に抽出してください。
質問: "${query}"

形式（各行に1項目）:
項目1: 内容
項目2: 内容

例:
項目1: マンジャロ5mg価格
項目2: アカルボース解約`;
  
  const response = callClaudeAPILightweight(prompt);
  console.log("抽出された意図:", response.content);
  
  // Stage 2: キーワード抽出テスト
  console.log("\n2. キーワード抽出テスト");
  const intents = parseIntentResponse(response.content);
  intents.forEach(intent => {
    const keywords = extractKeywordsFromIntent(intent);
    console.log(`意図: ${intent}`);
    console.log(`キーワード: ${keywords.join(", ")}`);
  });
  
  // Stage 3: 料金プラン検索テスト
  console.log("\n3. 料金プラン検索テスト");
  const keywords = ["アカルボース", "価格", "料金"];
  const plans = searchPricePlansWithKeywords(keywords, 10);
  
  console.log(`取得した料金プラン: ${plans.length}件`);
  plans.forEach((plan, i) => {
    console.log(`\nプラン${i+1}:`);
    console.log(`  薬剤: ${plan.medicine}`);
    console.log(`  期間: ${plan.period}`);
    console.log(`  数量: ${plan.quantity}`);
    console.log(`  価格: ${plan.price}円`);
  });
  
  // Stage 4: 多段階検索の完全実行
  console.log("\n4. 多段階検索の完全実行");
  const searchResult = executeMultiStageSearch(query);
  
  if (searchResult.success) {
    console.log("\n✅ 検索成功");
    console.log(`料金プラン: ${searchResult.context.pricePlans.length}件`);
    console.log(`Q&A: ${searchResult.context.relatedQA.length}件`);
    
    if (searchResult.context.pricePlans.length > 0) {
      console.log("\n取得した料金プラン:");
      searchResult.context.pricePlans.forEach((plan, i) => {
        console.log(`${i+1}. ${plan.medicine} ${plan.quantity} - ${plan.price}円`);
      });
    } else {
      console.log("\n❌ 料金プランが取得されていません！");
    }
  }
}

/**
 * 料金プランシートの直接確認
 */
function verifyPricePlanSheet() {
  console.log("=== 料金プランシート直接確認 ===");
  
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  
  const data = sheet.getDataRange().getValues();
  
  console.log("アカルボースの料金プラン:");
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === "アカルボース") {
      count++;
      const plan = {
        planId: data[i][0],
        medicine: data[i][1],
        period: data[i][2],
        quantity: data[i][3],
        price: data[i][4],
        isActive: data[i][7]
      };
      
      console.log(`\n${count}. プランID: ${plan.planId}`);
      console.log(`   ${plan.quantity} (${plan.period}) = ${plan.price}円`);
      console.log(`   有効: ${plan.isActive}`);
    }
  }
  
  console.log(`\n合計: ${count}件のアカルボースプラン`);
}

/**
 * 完全な動作テスト
 */
function runPricePlanTest() {
  console.log("\n\n" + "=".repeat(60));
  console.log("料金プラン検索テスト開始");
  console.log("=".repeat(60) + "\n");
  
  // 1. 料金プランシートの確認
  verifyPricePlanSheet();
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // 2. 検索機能のテスト
  testAcarbosePriceSearch();
}