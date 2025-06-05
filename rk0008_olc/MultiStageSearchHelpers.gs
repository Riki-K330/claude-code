// MultiStageSearchHelpers.gs - 多段階検索のヘルパー関数

/**
 * 意図からキーワードを抽出
 */
function extractKeywordsFromIntent(intent) {
  const keywords = [];
  
  // 薬剤名の抽出
  const medicines = ["アカルボース", "マンジャロ", "リベルサス"];
  medicines.forEach(med => {
    if (intent.includes(med)) {
      keywords.push(med);
    }
  });
  
  // 用量の抽出（数値+mg/ミリ）
  const doseMatch = intent.match(/(\d+(?:\.\d+)?)\s*(?:mg|ミリ|ミリグラム)/i);
  if (doseMatch) {
    keywords.push(doseMatch[1] + "mg");
  }
  
  // アクションキーワード
  const actions = ["解約", "変更", "価格", "値段", "料金", "効果", "副作用"];
  actions.forEach(action => {
    if (intent.includes(action)) {
      keywords.push(action);
    }
  });
  
  return keywords;
}

/**
 * 薬剤情報検索が必要かどうか
 */
function needsMedicineSearch(intent) {
  const medicineKeywords = ["効果", "副作用", "飲み方", "服用", "保管"];
  const medicines = ["アカルボース", "マンジャロ", "リベルサス"];
  
  return medicines.some(med => intent.includes(med)) || 
         medicineKeywords.some(keyword => intent.includes(keyword));
}

/**
 * 価格検索が必要かどうか
 */
function needsPriceSearch(intent) {
  const priceKeywords = ["価格", "値段", "料金", "いくら", "費用"];
  return priceKeywords.some(keyword => intent.includes(keyword));
}

/**
 * キーワードで薬剤情報を検索
 */
function searchMedicinesWithKeywords(keywords, limit) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.MEDICINES);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const medicines = [];
    
    for (let i = 1; i < data.length && medicines.length < limit; i++) {
      const medicine = {
        name: data[i][0],
        category: data[i][1],
        description: data[i][2],
        dosage: data[i][3],
        sideEffects: data[i][4],
        contraindications: data[i][5]
      };
      
      // キーワードマッチング
      const rowText = Object.values(medicine).join(" ").toLowerCase();
      const matches = keywords.some(keyword => 
        rowText.includes(keyword.toLowerCase())
      );
      
      if (matches) {
        medicines.push(medicine);
      }
    }
    
    return medicines;
  } catch (error) {
    console.error("薬剤検索エラー:", error);
    return [];
  }
}

/**
 * キーワードで料金プランを検索
 */
function searchPricePlansWithKeywords(keywords, limit) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const plans = [];
    
    for (let i = 1; i < data.length && plans.length < limit; i++) {
      const plan = {
        planId: data[i][0],
        medicine: data[i][1],
        period: data[i][2],
        quantity: data[i][3],
        price: data[i][4],
        notes: data[i][5],
        isActive: data[i][7] === "TRUE" || data[i][7] === true
      };
      
      // アクティブでないプランはスキップ
      if (!plan.isActive) continue;
      
      // キーワードマッチング（薬剤名と用量を重視）
      let matches = false;
      
      // 薬剤名チェック
      keywords.forEach(keyword => {
        if (plan.medicine.includes(keyword)) {
          matches = true;
        }
        // 用量チェック（例: "5mg" が quantity に含まれるか）
        if (keyword.includes("mg") && plan.quantity.includes(keyword)) {
          matches = true;
        }
      });
      
      if (matches) {
        plans.push(plan);
      }
    }
    
    return plans;
  } catch (error) {
    console.error("料金プラン検索エラー:", error);
    return [];
  }
}

/**
 * Q&Aを類似度で検索
 */
function searchQAWithSimilarity(intent, originalQuery, limit) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const prohibitedIndex = headers.indexOf("禁止キーワード");
    
    const qaItems = [];
    
    for (let i = 1; i < data.length; i++) {
      const qa = {
        category: data[i][0],
        question: data[i][1],
        answer: data[i][2],
        frequency: data[i][3],
        prohibitedKeywords: prohibitedIndex !== -1 ? data[i][prohibitedIndex] : "",
        similarityScore: 0
      };
      
      if (!qa.question || !qa.answer) continue;
      
      // 類似度スコアの計算
      qa.similarityScore = calculateSimilarity(
        intent + " " + originalQuery,
        qa.question + " " + qa.category
      );
      
      qaItems.push(qa);
    }
    
    // スコアでソートして上位を返す
    qaItems.sort((a, b) => b.similarityScore - a.similarityScore);
    
    return qaItems.slice(0, limit);
    
  } catch (error) {
    console.error("Q&A検索エラー:", error);
    return [];
  }
}

/**
 * 簡易的な類似度計算
 */
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  words1.forEach(word => {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matchCount++;
    }
  });
  
  // 重要キーワードにボーナス
  const importantKeywords = ["マンジャロ", "アカルボース", "リベルサス", "解約", "価格", "5mg", "2.5mg"];
  importantKeywords.forEach(keyword => {
    if (text1.includes(keyword) && text2.includes(keyword)) {
      matchCount += 2;
    }
  });
  
  return matchCount;
}

/**
 * 重複除去
 */
function removeDuplicates(items, keyField) {
  const seen = new Set();
  return items.filter(item => {
    const key = item[keyField];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Q&Aフィルター用プロンプト作成
 */
function buildQAFilterPrompt(intents, qaItems, targetCount) {
  let prompt = `以下のQ&Aから、質問「${intents.join("、")}」に最も関連する${targetCount}つを選んでください。

Q&A一覧:\n`;

  qaItems.forEach((qa, index) => {
    prompt += `${index}: ${qa.question}\n`;
  });

  prompt += `\n番号のみをカンマ区切りで回答してください。
例: 0,3,5`;

  return prompt;
}

/**
 * 料金プランフィルター用プロンプト作成
 */
function buildPlanFilterPrompt(intents, plans, targetCount) {
  let prompt = `以下の料金プランから、「${intents.join("、")}」に最も関連する${targetCount}つを選んでください。

料金プラン一覧:\n`;

  plans.forEach((plan, index) => {
    prompt += `${index}: ${plan.medicine} ${plan.quantity} ${plan.price}円\n`;
  });

  prompt += `\n番号のみをカンマ区切りで回答してください。
例: 1,4`;

  return prompt;
}

/**
 * フィルターレスポンスの解析
 */
function parseFilterResponse(responseText) {
  const numbers = responseText.match(/\d+/g);
  return numbers ? numbers.map(n => parseInt(n)) : [];
}

/**
 * 多段階検索のテスト関数
 */
function testMultiStageSearch() {
  console.log("=== 多段階検索テスト ===");
  
  const testQueries = [
    "マンジャロ5.0ミリもあるようですが、2.5ミリでも大丈夫でしょうか？",
    "アカルボースの価格と解約方法を教えて",
    "リベルサスの副作用が心配です"
  ];
  
  testQueries.forEach((query, index) => {
    console.log(`\nテスト${index + 1}: ${query}`);
    
    const result = executeMultiStageSearch(query);
    
    if (result.success) {
      console.log("検索成功");
      console.log("取得データ:");
      console.log(`  薬剤: ${result.context.relatedMedicines.length}件`);
      console.log(`  料金: ${result.context.pricePlans.length}件`);
      console.log(`  Q&A: ${result.context.relatedQA.length}件`);
      
      if (result.context.relatedQA.length > 0) {
        console.log("\n関連Q&A:");
        result.context.relatedQA.forEach((qa, i) => {
          console.log(`  ${i+1}. ${qa.question} (スコア: ${qa.similarityScore})`);
        });
      }
    } else {
      console.log("検索失敗:", result.error);
    }
  });
  
  console.log("\n=== テスト完了 ===");
}