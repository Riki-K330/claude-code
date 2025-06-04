# CTFオンラインクリニック AIチャットボット実装マニュアル

## 1. はじめに
このマニュアルでは、**CTFオンラインクリニック**の問い合わせ対応 AI チャットボットを  
**Google Apps Script (GAS)** と **Google スプレッドシート**、そして **Anthropic Claude API** を用いて  
非エンジニアの方でも簡単に構築・運用できるよう段階的に解説します。

> **注意**  
> プログラミングの知識がなくても実装できるよう、手順をかみ砕いて説明しています。

---

## 2. 準備するもの
- Google アカウント  
- Anthropic 社 **Claude API キー**  
- インターネット接続環境  
- **Google Chrome**（推奨ブラウザ）

---

## 3. 導入手順

### ステップ 1: 新しい Google スプレッドシートを作成
1. **Google ドライブ** <https://drive.google.com> を開く  
2. **[新規] → [Google スプレッドシート]** を選択  
3. スプレッドシート名を **CTFクリニックAIチャットボット** に変更  

### ステップ 2: Google Apps Script を開く
1. スプレッドシート上部メニュー **[拡張機能] → [Apps Script]** をクリック  
2. 新タブのエディタ左上でプロジェクト名を **CTFクリニックAIチャットボット** に変更  
3. 左サイドバーの **[ファイル]** アイコンでファイル管理画面を開く  

### ステップ 3: スクリプトファイルの作成
1. 既存の `コード.gs` を **Config.gs** にリネーム  
2. **[ファイル] → [新規] → [スクリプト]** で次のファイルを追加  
   - `Sheets.gs`  
   - `ClaudeAPI.gs`  
   - `PromptManager.gs`  
   - `Utils.gs`  
   - `UI.gs`  
   - `Testing.gs`  
   - `CostTracker.gs`  
   - `DataManager.gs`  
3. **[ファイル] → [新規] → [HTMLファイル]** で次を追加  
   - `Sidebar.html`  
   - `TemplateEditor.html`  
   - `CSVImport.html`  
   - `Settings.html`

### ステップ 4: コードの貼り付け
用意したコードを各ファイルに貼り付けます。推奨順序:

1. `Config.gs`  
2. `Sheets.gs`  
3. `ClaudeAPI.gs`  
4. `PromptManager.gs`  
5. `Utils.gs`  
6. `UI.gs`  
7. `Testing.gs`  
8. `CostTracker.gs`  
9. `DataManager.gs`  
10. `Sidebar.html`  
11. `TemplateEditor.html`  
12. `CSVImport.html`  
13. `Settings.html`

### ステップ 5: スクリプトの保存
- **[ファイル] → [保存]** もしくは **Ctrl + S / ⌘ + S**  

### ステップ 6: API キーの設定
1. **`Config.gs`** を開く  
2. 以下の行を探し、`your-api-key` を実際のキーに置換  

   ```javascript
   const DEFAULT_API_KEY = "your-api-key";
