// TestChatbotResponse.gs - チャットボット回答生成のテスト

/**
 * チャットボットの実際の回答を確認
 */
function testChatbotResponse() {
  console.log("=== チャットボット回答テスト ===");
  
  const testQuery = "アカルボースの価格を教えてください";
  
  console.log("質問:", testQuery);
  
  // 実際のprocessUserMessage関数を呼び出し
  try {
    const result = processUserMessage("test-user", testQuery);
    
    console.log("\n生成された回答:");
    console.log("=".repeat(50));
    
    // レスポンスがオブジェクトの場合とテキストの場合の両方に対応
    const responseText = typeof result === 'string' ? result : result.response;
    console.log(responseText);
    console.log("=".repeat(50));
    
    // 価格が含まれているかチェック
    const correctPrices = ["5,980円", "14,940円", "23,880円"];
    let foundPrices = [];
    
    correctPrices.forEach(price => {
      if (responseText && responseText.includes(price)) {
        foundPrices.push(price);
      }
    });
    
    if (foundPrices.length > 0) {
      console.log("\n✅ 正しい価格が含まれています:", foundPrices.join(", "));
    } else {
      console.log("\n❌ 正しい価格が含まれていません");
      console.log("期待される価格: 5,980円、14,940円、23,880円");
    }
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

/**
 * コンテキスト構築の確認
 */
function testContextBuilding() {
  console.log("=== コンテキスト構築テスト ===");
  
  const query = "アカルボースの価格を教えてください";
  
  // 意図分類
  const intent = categorizeIntent(query);
  console.log("意図分類:", intent);
  
  // コンテキスト取得
  const context = getContextByIntent(intent, query);
  
  console.log("\n取得されたコンテキスト:");
  console.log("薬剤情報:", context.relatedMedicines?.length || 0, "件");
  console.log("料金プラン:", context.pricePlans?.length || 0, "件");
  console.log("Q&A:", context.relatedQA?.length || 0, "件");
  
  // 料金プランの詳細
  if (context.pricePlans && context.pricePlans.length > 0) {
    console.log("\n料金プランの詳細:");
    context.pricePlans.forEach((plan, i) => {
      console.log(`${i+1}. ${plan.medicine} ${plan.quantity} = ${plan.price}円`);
    });
  }
  
  // プロンプトの構築
  const prompt = buildContextualPrompt(query, context);
  console.log("\n構築されたプロンプト（一部）:");
  console.log("=".repeat(50));
  
  // 料金プラン部分だけ表示
  const priceSection = prompt.match(/【料金プラン情報】[\s\S]*?(?=【|$)/);
  if (priceSection) {
    console.log(priceSection[0]);
  } else {
    console.log("料金プラン情報が含まれていません");
  }
}