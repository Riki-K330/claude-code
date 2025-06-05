// FixPricePlanData.gs - 料金プランデータの修正

/**
 * アカルボース100mgの価格を修正
 */
function fixAcarbose100mgPrices() {
  console.log("=== アカルボース100mg価格修正 ===");
  
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  
  if (!sheet) {
    console.error("料金プランシートが見つかりません");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  let updatedCount = 0;
  
  // 正しい価格マッピング
  const correctPrices = {
    "100mg×30錠": 5980,   // 1ヶ月分
    "100mg×90錠": 14940,  // 3ヶ月分
    "100mg×180錠": 23880  // 6ヶ月分
  };
  
  for (let i = 1; i < data.length; i++) {
    const medicine = data[i][1];
    const quantity = data[i][3];
    const currentPrice = data[i][4];
    
    if (medicine === "アカルボース" && quantity in correctPrices) {
      const correctPrice = correctPrices[quantity];
      
      if (currentPrice != correctPrice) {
        console.log(`行${i+1}: ${quantity} の価格を ${currentPrice}円 → ${correctPrice}円 に修正`);
        sheet.getRange(i + 1, 5).setValue(correctPrice);
        updatedCount++;
      }
    }
  }
  
  if (updatedCount > 0) {
    console.log(`✅ ${updatedCount}件の価格を修正しました`);
  } else {
    console.log("修正の必要はありませんでした");
  }
  
  // 修正後の確認
  console.log("\n修正後の価格確認:");
  verifyAcarbosePrices();
}

/**
 * アカルボースの価格を確認
 */
function verifyAcarbosePrices() {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAMES.PLANS);
  
  const data = sheet.getDataRange().getValues();
  
  console.log("現在のアカルボース価格:");
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === "アカルボース") {
      console.log(`${data[i][3]}: ${data[i][4]}円`);
    }
  }
}

/**
 * チャットボットの回答を再テスト
 */
function retestChatbotWithCorrectPrices() {
  // 1. 価格を修正
  fixAcarbose100mgPrices();
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // 2. 数秒待機（スプレッドシートの更新を確実にするため）
  Utilities.sleep(2000);
  
  // 3. チャットボットの回答をテスト
  console.log("=== チャットボット回答再テスト ===");
  const query = "アカルボースの価格を教えてください";
  
  // コンテキストを再取得
  const intent = categorizeIntent(query);
  const context = getContextByIntent(intent, query);
  
  console.log("\n料金プラン情報:");
  if (context.pricePlans) {
    context.pricePlans.forEach(plan => {
      console.log(`${plan.medicine} ${plan.quantity}: ${plan.price}円`);
    });
  }
  
  // 実際のチャット回答
  if (typeof processUserMessage === 'function') {
    const result = processUserMessage("test-user", query);
    const responseText = typeof result === 'string' ? result : result.response;
    
    console.log("\n生成された回答（価格部分のみ）:");
    const priceLines = responseText.split('\n').filter(line => 
      line.includes('円') || line.includes('mg') || line.includes('錠')
    );
    priceLines.forEach(line => console.log(line));
  }
}