# API タイムアウト問題 トラブルシューティングガイド

## 🎯 問題の概要
`runTestChat()`関数が無限にハングし、47秒後にキャンセルされる問題が発生しています。

## 🔍 診断手順

### ステップ1: クイック診断の実行
Google Apps Scriptエディタで以下の関数を実行してください：

```javascript
quickDiagnoseHangingIssue()
```

または、スプレッドシートのメニューから：
`🤖 CTFチャットボット` → `🧪 テスト` → `🔍 クイック診断`

### ステップ2: ネットワーク接続の確認
```javascript
diagnoseAPIConnection()
```

または、メニューから：
`🤖 CTFチャットボット` → `🧪 テスト` → `🌐 ネットワーク診断`

### ステップ3: 段階的API テスト
```javascript
runComprehensiveAPITest()
```

または、メニューから：
`🤖 CTFチャットボット` → `🧪 テスト` → `🔧 包括的API診断`

## 🛠 考えられる原因と対処法

### 1. APIキーの問題
**症状**: 認証エラー（401）またはAPIキー形式エラー
**確認方法**:
- Config.gsファイルでAPI_KEYが正しく設定されているか
- APIキーの形式が正しいか（sk-ant-api03-で始まる）

**対処法**:
```javascript
// Config.gsファイルで確認
console.log("APIキー:", CONFIG.API_KEY.substring(0, 10) + "...");
```

### 2. ネットワーク・プロキシの問題
**症状**: 接続タイムアウト、無限ハング
**確認方法**:
- 基本的なインターネット接続
- 会社のファイアウォールやプロキシ設定

**対処法**:
- 別のネットワーク環境で試す
- プロキシ設定の確認

### 3. ペイロードサイズの問題
**症状**: リクエストが大きすぎて処理できない
**確認方法**:
```javascript
diagnoseAPIPayload()
```

**対処法**:
- コンテキストデータの削減
- プロンプト長の短縮

### 4. Google Apps Scriptの制限
**症状**: 30秒でタイムアウト
**確認方法**:
- 実行時間の測定
- Google Apps Scriptの制限（6分制限、30秒API制限）

**対処法**:
```javascript
// より短いテストの実行
testAPIWithTimeout("こんにちは", {}, 5000)
```

### 5. Anthropic APIサーバーの問題
**症状**: API側の一時的な問題
**確認方法**:
- Anthropicのステータスページ確認
- 他のAPIエンドポイントとの比較

## 🚀 推奨される診断フロー

### フェーズ1: 基本確認
1. `quickDiagnoseHangingIssue()` を実行
2. すべてのチェックが✅の場合 → フェーズ2へ
3. ❌があれば、該当する問題を修正

### フェーズ2: 段階的テスト
1. `testAPIAuthentication()` で認証確認
2. `testAPIWithTimeout("hello", {}, 5000)` で最小テスト
3. `testAPIWithTimeout("アカルボース", {}, 15000)` で実際のテスト

### フェーズ3: 詳細診断
1. `runComprehensiveAPITest()` で包括的テスト
2. `diagnoseAPIPayload()` でペイロードサイズ確認

## 🔧 具体的な修正手順

### 問題1: APIキー未設定
```javascript
// Config.gsファイルで修正
const CONFIG = {
  API_KEY: "sk-ant-api03-your-actual-api-key-here", // 実際のAPIキーに置き換え
  // ...
};
```

### 問題2: ペイロードが大きすぎる
```javascript
// PromptManager.gsで制限を追加
function getPricePlans(query) {
  // ...
  const limitedPlans = plans.slice(0, 3); // 表示数を制限
  return limitedPlans;
}
```

### 問題3: タイムアウト対策
```javascript
// ClaudeAPI.gsでタイムアウト設定
const options = {
  method: "post",
  headers: { /* ... */ },
  payload: JSON.stringify(payload),
  muteHttpExceptions: true,
  timeoutMs: 15000 // 15秒タイムアウト
};
```

## 📊 ログ確認のポイント

実行時のコンソールログで以下を確認：

1. **設定確認**: APIキーとスプレッドシートIDの設定状況
2. **接続テスト**: ネットワーク接続とAPIエンドポイントへのアクセス
3. **認証テスト**: APIキーの有効性
4. **ペイロードサイズ**: リクエストのサイズ
5. **実行時間**: 各ステップの所要時間

## 🎯 次のステップ

1. **まず**: `quickDiagnoseHangingIssue()` を実行
2. **問題が見つからない場合**: `runComprehensiveAPITest()` で詳細診断
3. **それでも解決しない場合**: Google Apps Scriptのログを確認し、具体的なエラーメッセージを特定

## 💡 予防策

- 定期的な設定確認
- ペイロードサイズの監視
- 段階的なテストの実行
- ログの定期確認

この手順に従って診断を行い、問題の特定と解決を進めてください。