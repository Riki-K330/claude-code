// PromptManager.gs - プロンプト管理モジュール

/**
 * システムプロンプトを取得
 */
function getSystemPrompt() {
  return `あなたは「CTFオンラインクリニック事務局」の担当者として、オンラインでのダイエット薬やクリニックの利用に関するお問い合わせに対応するAIアシスタントです。
以下のルール・前提を踏まえ、利用者（ユーザー）からの質問・相談に対して一度のメッセージで完結する回答を行ってください。

## ルール・前提

### 役割・クリニック情報
- あなたの役割: CTFオンラインクリニック事務局の担当者
- 提供する主な情報:
  - ダイエット薬の案内（取り扱い種類・料金・購入・配送プロセス）
  - クリニック利用に関する手続き（お支払い方法・解約など）
- 名乗りフレーズ例:
  - 「CTFオンラインクリニック事務局です😊」
  - 「CTFオンラインクリニック事務局でございます。お問い合わせありがとうございます🙌」
- クリニックの基本情報:
  - 東京都中野区にある「中野トータルヘルスケアクリニック」が提携医療機関
- お問い合わせ窓口（LINE）:
  - 順次返信。18時以降・休業日のお問い合わせは翌診療日以降に対応

### 回答スタイルの基本
- LINE上でのやり取りを想定し、改行を多めに使用して読みやすくする
- 適度に絵文字を使用し、明るく親しみやすい印象を与える（😊✨🙌💊🚚💳）
- 共感の言葉は毎回同じにならないようにし、具体的に
- 効果・副作用の問い合わせには:
  「お薬の効果や副作用につきましては、患者様お一人おひとりの状態により異なりますので、医師から詳しくご説明させていただきますね😌」
- 体調不良時の案内:
  「もし体調にご不安な点がある場合は、無理なさらず、かかりつけ医や専門医にご相談くださいね🏥」

## お薬の取り扱い状況

【取扱いあり】
- アカルボース
- リベルサス
- マンジャロ
- 整腸剤（医療用ビオフェルミン錠剤＋ミヤBM配合錠）

【取扱いなし】
- フォシーガ
- 防風通聖散（漢方）
※お問い合わせがあれば「貴重なご意見ありがとうございます。今後の参考にさせていただきますね🙏」と回答

## 応答の基本構成
1. 冒頭あいさつ & 共感
2. 具体的な情報提供（薬の種類・料金・手続きなど）
3. 必要に応じて支払い・配送・解約などの案内
4. 安心感のある締め & 医師との連携案内

## 重要な注意事項
- 料金に関する質問の場合は、【料金プラン情報】に記載されている正確な価格・数量・期間を必ず使用してください
- アカルボースの価格を聞かれた場合は、50mgと100mgの両方のプランを全て案内してください
- 【料金プラン情報】にないデータは絶対に使用しないでください
- 価格を回答する際は、必ず【料金プラン情報】セクションに記載されている金額のみを使用し、推測や概算は一切行わないでください
- 【料金プラン情報】が提供されていない場合のみ、「詳しい料金につきましては、改めてご案内させていただきますね」と回答してください`;
}

/**
 * 質問の意図を分類
 */
function categorizeIntent(userMessage) {
  const intents = {
    medicine_info: {
      keywords: ["アカルボース", "リベルサス", "マンジャロ", "薬", "効果", "副作用", "飲み方", "服用"],
      priority: 1
    },
    pricing: {
      keywords: ["料金", "価格", "いくら", "値段", "費用", "支払", "クレジット"],
      priority: 2
    },
    procedure: {
      keywords: ["解約", "キャンセル", "変更", "休止", "再開", "手続き"],
      priority: 3
    },
    side_effects: {
      keywords: ["副作用", "体調", "不調", "心配", "大丈夫", "症状"],
      priority: 4
    },
    delivery: {
      keywords: ["配送", "発送", "届く", "到着", "送料"],
      priority: 5
    },
    general: {
      keywords: ["問い合わせ", "質問", "教えて", "知りたい"],
      priority: 10
    }
  };
  
  let detectedIntent = "general";
  let highestScore = 0;
  
  for (const [intent, config] of Object.entries(intents)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (userMessage.includes(keyword)) {
        score += (10 - config.priority);
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      detectedIntent = intent;
    }
  }
  
  return detectedIntent;
}

/**
 * 意図に応じたコンテキスト情報を取得
 */
function getContextByIntent(intent, userMessage) {
  const context = {};
  
  console.log("意図分類結果:", intent);
  console.log("ユーザーメッセージ:", userMessage);
  
  switch (intent) {
    case "medicine_info":
      context.relatedMedicines = searchMedicineInfo(userMessage);
      context.relatedQA = searchRelatedQA("薬剤情報", userMessage);
      // 薬剤情報の場合は料金も含める
      context.pricePlans = getPricePlans(userMessage);
      break;
      
    case "pricing":
      context.pricePlans = getPricePlans(userMessage);
      context.relatedQA = searchRelatedQA("料金", userMessage);
      context.relatedMedicines = searchMedicineInfo(userMessage);
      break;
      
    case "procedure":
      context.procedureInfo = getProcedureInfo(userMessage);
      context.relatedQA = searchRelatedQA("手続き", userMessage);
      break;
      
    case "side_effects":
      context.sideEffectInfo = getSideEffectInfo(userMessage);
      context.medicalAdvice = true;
      break;
      
    case "delivery":
      context.deliveryInfo = getDeliveryInfo();
      context.relatedQA = searchRelatedQA("配送", userMessage);
      break;
      
    default:
      // デフォルトでも薬剤名が含まれていれば情報を取得
      if (userMessage.includes("アカルボース") || userMessage.includes("マンジャロ") || userMessage.includes("リベルサス")) {
        context.relatedMedicines = searchMedicineInfo(userMessage);
        context.pricePlans = getPricePlans(userMessage);
        context.relatedQA = searchRelatedQA("薬剤", userMessage);
      }
      break;
  }
  
  console.log("取得したコンテキスト:", context);
  
  return context;
}

/**
 * 薬剤情報を検索
 */
function searchMedicineInfo(query) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.MEDICINES);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const medicines = [];
    
    for (let i = 1; i < data.length; i++) {
      const medicine = {
        name: data[i][0],
        category: data[i][1],
        description: data[i][2],
        dosage: data[i][3],
        sideEffects: data[i][4],
        contraindications: data[i][5]
      };
      
      if (query.includes(medicine.name)) {
        medicines.push(medicine);
      }
    }
    
    return medicines;
  } catch (error) {
    console.error("薬剤情報検索エラー:", error);
    return [];
  }
}

/**
 * 関連Q&Aを検索
 */
function searchRelatedQA(category, query) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.QA);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const qaList = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === category || query.includes(data[i][1])) {
        qaList.push({
          category: data[i][0],
          question: data[i][1],
          answer: data[i][2],
          frequency: data[i][3]
        });
      }
    }
    
    // 使用頻度でソート
    qaList.sort((a, b) => {
      const freqOrder = { "高": 3, "中": 2, "低": 1 };
      return (freqOrder[b.frequency] || 0) - (freqOrder[a.frequency] || 0);
    });
    
    return qaList.slice(0, 3); // 上位3件を返す
  } catch (error) {
    console.error("Q&A検索エラー:", error);
    return [];
  }
}

/**
 * 料金プラン情報を取得（表示制限機能付き）
 */
function getPricePlans(query) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    
    if (!sheet) {
      console.log("料金プランシートが見つかりません");
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const plans = [];
    
    console.log("料金プランシートのデータ行数:", data.length);
    console.log("ヘッダー:", data[0]);
    
    // 表示制限設定を取得（文字列比較を改善）
    const priorityOnlyValue = DynamicConfig ? DynamicConfig.get("plan_show_priority_only", "TRUE") : "TRUE";
    const acarboseValue = DynamicConfig ? DynamicConfig.get("plan_show_all_for_acarbose", "TRUE") : "TRUE";
    const rybelsusValue = DynamicConfig ? DynamicConfig.get("plan_show_all_for_rybelsus", "TRUE") : "TRUE";
    
    const showPriorityOnly = String(priorityOnlyValue).toLowerCase() === "true";
    const showAllForAcarbose = String(acarboseValue).toLowerCase() === "true";
    const showAllForRybelsus = String(rybelsusValue).toLowerCase() === "true";
    const displayLimit = DynamicConfig ? parseInt(DynamicConfig.get("plan_display_limit", "10")) : 10;
    
    console.log("表示制限設定:", {showPriorityOnly, showAllForAcarbose, showAllForRybelsus, displayLimit});
    
    for (let i = 1; i < data.length; i++) {
      const plan = {
        planId: data[i][0],
        medicine: data[i][1],
        period: data[i][2],
        quantity: data[i][3],
        price: data[i][4],
        notes: data[i][5],
        sortOrder: data[i][6] || 999,
        isActive: data[i][7] === "TRUE" || data[i][7] === true,
        priority: parseInt(data[i][8]) || 2,
        showFlag: data[i][9] === "TRUE" || data[i][9] === true
      };
      
      // 薬剤名が一致する場合のみ処理
      if (!query.includes(plan.medicine)) {
        continue;
      }
      
      console.log(`処理中のプラン: ${plan.planId} - ${plan.medicine} - アクティブ: ${plan.isActive}`);
      
      // アクティブでないプランはスキップ
      if (!plan.isActive) {
        console.log(`プラン ${plan.planId} はアクティブでないためスキップ`);
        continue;
      }
      
      // 薬剤別の表示ルール適用
      let shouldShow = false;
      
      if (plan.medicine === "アカルボース") {
        // アカルボースは設定に応じて全表示または制限
        shouldShow = showAllForAcarbose || (showPriorityOnly && plan.priority === 1) || plan.showFlag;
        console.log(`アカルボース判定: showAllForAcarbose=${showAllForAcarbose}, priority=${plan.priority}, showFlag=${plan.showFlag}, shouldShow=${shouldShow}`);
      } else if (plan.medicine === "リベルサス") {
        // リベルサスは設定に応じて全表示または制限
        shouldShow = showAllForRybelsus || (showPriorityOnly && plan.priority === 1) || plan.showFlag;
      } else if (plan.medicine === "マンジャロ") {
        // マンジャロは優先度とフラグで制限
        shouldShow = (showPriorityOnly && plan.priority === 1) || plan.showFlag;
      } else {
        // その他の薬剤は優先度とフラグで制限
        shouldShow = (showPriorityOnly && plan.priority === 1) || plan.showFlag;
      }
      
      if (shouldShow) {
        plans.push(plan);
        console.log(`${plan.medicine}プラン追加:`, plan.planId, plan.quantity, plan.price);
      }
    }
    
    // 表示順でソート
    plans.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // 表示上限を適用
    const limitedPlans = plans.slice(0, displayLimit);
    
    console.log("取得した料金プラン数:", limitedPlans.length);
    console.log("取得したプラン:", limitedPlans.map(p => `${p.planId}: ${p.quantity} ${p.price}円`));
    
    return limitedPlans;
  } catch (error) {
    console.error("料金プラン取得エラー:", error);
    return [];
  }
}

/**
 * データ取得と処理フローの完全テスト用関数
 */
function testCompleteDataFlow() {
  console.log("=== 完全データフローテスト開始 ===");
  
  const testQuery = "アカルボースの価格を教えて";
  
  // 1. 意図分類テスト
  const intent = categorizeIntent(testQuery);
  console.log("1. 意図分類結果:", intent);
  
  // 2. コンテキスト取得テスト
  const context = getContextByIntent(intent, testQuery);
  console.log("2. 取得されたコンテキスト:", JSON.stringify(context, null, 2));
  
  // 3. 料金プラン取得テスト
  const pricePlans = getPricePlans(testQuery);
  console.log("3. 直接取得した料金プラン:", JSON.stringify(pricePlans, null, 2));
  
  // 4. プロンプト構築テスト
  const prompt = buildContextualPrompt(testQuery, context);
  console.log("4. 構築されたプロンプト:");
  console.log(prompt);
  
  console.log("=== テスト完了 ===");
}

/**
 * スプレッドシート接続テスト用関数
 */
function testSpreadsheetConnection() {
  console.log("=== スプレッドシート接続テスト開始 ===");
  
  try {
    console.log("CONFIG.SHEET_ID:", CONFIG.SHEET_ID);
    console.log("CONFIG.SHEET_NAMES:", CONFIG.SHEET_NAMES);
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    console.log("スプレッドシート名:", spreadsheet.getName());
    
    // 各シートの存在確認
    const sheets = spreadsheet.getSheets();
    console.log("存在するシート数:", sheets.length);
    sheets.forEach(sheet => {
      console.log("- シート名:", sheet.getName(), "行数:", sheet.getLastRow());
    });
    
    // 料金プランシートの詳細確認
    const planSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.PLANS);
    if (planSheet) {
      console.log("料金プランシート:", planSheet.getName());
      console.log("データ行数:", planSheet.getLastRow());
      
      if (planSheet.getLastRow() > 1) {
        const data = planSheet.getDataRange().getValues();
        console.log("ヘッダー:", data[0]);
        console.log("最初のデータ行:", data[1]);
        console.log("アカルボース関連行数:", data.filter(row => row[1] === "アカルボース").length);
      }
    } else {
      console.log("料金プランシートが見つかりません！");
    }
    
    console.log("=== テスト完了 ===");
    
  } catch (error) {
    console.error("スプレッドシート接続エラー:", error);
  }
}