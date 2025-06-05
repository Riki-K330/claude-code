# 更新手順 - 料金プラン検索の修正

## 修正したファイル

### 1. MultiStageSearchHelpers.gs
- 48-54行目: `needsPriceSearch` 関数にnullチェックを追加
- 124-153行目: `searchPricePlansWithKeywords` 関数を改善
  - アカルボースの特別処理を追加
  - 価格キーワードがある場合の処理を改善

### 2. MultiStageSearchSystem.gs  
- 350-353行目: `callClaudeAPILightweight` 関数に追加
  - アカルボース価格検索の意図を明示的に追加

### 3. TestPricePlanSearch.gs (新規作成)
- 料金プラン検索のテスト関数を追加

## GASでの更新手順

1. **MultiStageSearchHelpers.gs** を開く
   - 48行目付近の `needsPriceSearch` 関数を更新
   - 128行目付近のキーワードマッチング部分を更新

2. **MultiStageSearchSystem.gs** を開く
   - 350行目付近に「アカルボースの価格検索を明示的に追加」のコメント部分を追加

3. **TestPricePlanSearch.gs** を新規作成
   - GitHubから内容をコピー

4. すべてのファイルを保存（Ctrl+S）

5. テスト実行
   ```javascript
   // TestPricePlanSearch.gsで実行
   runPricePlanTest()
   ```

## 確認事項

1. 料金プランシートにアカルボースのデータが6件あることを確認
2. 多段階検索で料金プランが取得されることを確認
3. チャットで「アカルボースの価格を教えてください」と質問
4. 正しい価格（5,980円、14,940円、23,880円）が表示されることを確認

## もし動作しない場合

1. `runPricePlanTest()` の実行ログを確認
2. 料金プランが0件の場合は、シート名やデータを確認
3. エラーメッセージがあれば共有してください