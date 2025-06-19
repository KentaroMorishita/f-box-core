# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 開発コマンド

- `npm run build` - 配布用ライブラリのビルド（TypeScript コンパイル + Vite バンドル）
- `npm run lint` - ファイル出力なしの型チェック（`tsc --noEmit`）
- `npm test` - Vitest によるすべてのテスト実行
- `npm run coverage` - テストカバレッジレポート生成
- `npm run dev` - Vite 開発サーバー起動

## npm配布コマンド

### 配布手順
1. `npm test run` - 全テスト実行
2. `npm run lint` - 型チェック
3. `npm run build` - ビルド
4. `git add .` - 変更をステージング
5. `git commit -m "修正内容の説明"` - コミット
6. バージョン更新:
   - `npm run version:patch` - パッチ版更新（バグフィックス: 0.2.8 → 0.2.9）
   - `npm run version:minor` - マイナー版更新（新機能: 0.2.8 → 0.3.0）
   - `npm run version:major` - メジャー版更新（破壊的変更: 0.2.8 → 1.0.0）
7. `git push origin main --tags` - 変更とタグをプッシュ
8. `npm run publish:public` - npm公開

### 配布設定
- `files` フィールドで `dist/` のみを配布対象に設定
- `prepare` スクリプトで install 時に自動ビルド
- 複数フォーマット対応（ESM、CommonJS、UMD）

## アーキテクチャ概要

F-Box は TypeScript 向けの関数型プログラミングライブラリで、5つのコアなモナド抽象化を提供します：

- **Box**: 関数型変換を持つシンプルな値コンテナ
- **RBox**: サブスクリプションベースの状態管理を持つ Box のリアクティブ版
- **Maybe**: null/undefined エラーを防ぐオプショナル値（`Just` | `Nothing`）
- **Either**: 失敗する可能性のある計算のエラーハンドリング（`Left` | `Right`）
- **Task**: 関数型合成を持つ非同期計算

### 主要な関数型プログラミングパターン

各抽象化は標準的な FP 演算子を実装します：
- `<$>` (map): コンテキストを保持しながら値を変換
- `<*>` (apply): ラップされた関数をラップされた値に適用
- `>>=` (flatMap/bind): 依存する計算をチェーン

### Do 記法サポート

すべての型は `Box.do()`、`Maybe.do()` などを通じて「do 記法」をサポートし、命令型スタイルの逐次合成を可能にします：

```typescript
const result = Box.do(function*() {
  const x = yield Box.pack(10);
  const y = yield Box.pack(20);
  return x + y;
});
```

## テスト戦略

テストは関数型プログラミングの数学的法則に従います：
- **ファンクター則**: `map`/`<$>` の恒等性と合成性
- **アプリカティブ則**: `apply`/`<*>` の恒等性、合成性、交換性、準同型性
- **モナド則**: `flatMap`/`>>=` の左恒等性、右恒等性、結合性

テストファイルは `tests/` にあり、`src/` の構造をミラーしています。Vitest のグローバル（`describe`、`test`、`expect`）をインポートなしで使用します。

## コード規約

- すべての型に型ガード（`isBox`、`isLeft` など）を含む
- JSDoc コメントでの二か国語文書化（英語/日本語）
- 全体を通じてイミュータブルな readonly インターフェース
- Either と Task での一貫したエラーハンドリングパターン
- `src/main.ts` からすべての型とユーティリティをエクスポート

## ビルドシステム

複数の出力フォーマットで Vite を使用：
- ESM: `dist/index.mjs`
- CommonJS: `dist/index.cjs`
- UMD: `dist/index.js`
- TypeScript 宣言: `dist/types/`

エントリーポイントは `src/main.ts` で、すべてのモジュールを再エクスポートします。