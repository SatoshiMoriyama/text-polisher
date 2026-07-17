# Text Polisher CLI - 実装タスク

## Task 1: プロジェクト初期化

### 内容
- pnpm でプロジェクトを初期化
- TypeScript 設定
- package.json に `bin` フィールド設定（`text-polisher` コマンド）
- 依存パッケージインストール（commander, yaml, tsx, typescript, @types/node）
- ディレクトリ構成作成

### 成果物
- `package.json`
- `tsconfig.json`
- `src/` ディレクトリ構成

### 完了条件
- [ ] `pnpm build` が通る
- [ ] `pnpm dev` で TypeScript を直接実行できる

---

## Task 2: 型定義

### 内容
- `src/types.ts` に全型定義を実装

### 成果物
- `src/types.ts`

### 完了条件
- [ ] `Level`, `BuiltinFormat`, `Engine` 型が定義されている
- [ ] `CustomFormat`, `PolishOptions`, `ResolvedOptions`, `EngineResult` インターフェースが定義されている
- [ ] コンパイルエラーなし

---

## Task 3: プロンプト構築 - レベル定義

### 内容
- `src/prompt/levels.ts` に丁寧さレベル別のプロンプト指示を定義
- 4レベル（casual, polite, formal, honorific）の日本語指示文を作成

### 成果物
- `src/prompt/levels.ts`

### 完了条件
- [ ] 4レベルそれぞれのプロンプト指示テキストが定義されている
- [ ] レベル名から指示テキストを取得する関数がエクスポートされている

---

## Task 4: プロンプト構築 - ビルトインフォーマット定義

### 内容
- `src/prompt/formats.ts` にビルトインフォーマット（email, slack, document）のプロンプト指示を定義

### 成果物
- `src/prompt/formats.ts`

### 完了条件
- [ ] 3フォーマットそれぞれのプロンプト指示テキストが定義されている
- [ ] フォーマット名から指示テキストを取得する関数がエクスポートされている
- [ ] フォーマット名がビルトインかどうか判定する関数がエクスポートされている

---

## Task 5: プロンプト構築 - メイン

### 内容
- `src/prompt/index.ts` に `buildPrompt()` 関数を実装
- レベル指示 + フォーマット指示 + カスタム定型文 + 入力テキスト を結合して1つのプロンプトにする

### 成果物
- `src/prompt/index.ts`

### 完了条件
- [ ] `buildPrompt(ResolvedOptions)` が完全なプロンプト文字列を返す
- [ ] レベルのみ指定時、フォーマットのみ指定時、両方指定時、カスタムフォーマット指定時 すべてで正しいプロンプトが生成される
- [ ] 「変換後テキストのみ出力」の指示が含まれている

---

## Task 6: カスタムフォーマット読み込み

### 内容
- `src/config/custom-formats.ts` に `~/.text-polisher/formats.yaml` の読み込みロジックを実装
- `src/config/index.ts` にフォーマット解決ロジック（カスタム優先 → ビルトイン）を実装

### 成果物
- `src/config/custom-formats.ts`
- `src/config/index.ts`

### 完了条件
- [ ] `~/.text-polisher/formats.yaml` が存在する場合、カスタムフォーマットを読み込める
- [ ] ファイルが存在しない場合、エラーにならずビルトインのみで動作する
- [ ] カスタム名がビルトイン名と衝突した場合、カスタムが優先される
- [ ] YAML解析エラー時に分かりやすいエラーメッセージを出す
- [ ] `resolveFormat(name)` でビルトイン/カスタムを統一的に解決できる

---

## Task 7: エンジン - インターフェースと Claude Code アダプター

### 内容
- `src/engine/index.ts` に `EngineAdapter` インターフェースとファクトリ関数を実装
- `src/engine/claude.ts` に Claude Code CLI (`claude -p`) の呼び出しロジックを実装

### 成果物
- `src/engine/index.ts`
- `src/engine/claude.ts`

### 完了条件
- [ ] `EngineAdapter` インターフェースが定義されている
- [ ] `isAvailable()` で `claude` コマンドの存在確認ができる
- [ ] `execute(prompt)` で `claude -p "prompt" --output-format text` をサブプロセス実行できる
- [ ] `child_process.execFile` を使用している（シェルインジェクション防止）
- [ ] 60秒タイムアウトが設定されている
- [ ] stdout からテキスト結果を取得できる

---

## Task 8: エンジン - Kiro CLI アダプター

### 内容
- `src/engine/kiro.ts` に Kiro CLI (`kiro-cli chat --no-interactive`) の呼び出しロジックを実装

### 成果物
- `src/engine/kiro.ts`

### 完了条件
- [ ] `isAvailable()` で `kiro-cli` コマンドの存在確認ができる
- [ ] `execute(prompt)` で `kiro-cli chat --no-interactive --trust-tools=none "prompt"` をサブプロセス実行できる
- [ ] `child_process.execFile` を使用している（シェルインジェクション防止）
- [ ] 60秒タイムアウトが設定されている
- [ ] stdout からテキスト結果を取得できる

---

## Task 9: CLIエントリーポイント

### 内容
- `src/index.ts` に Commander.js でCLIを定義
- 引数解析、パイプ入力対応、バリデーション、メインフロー実装

### 成果物
- `src/index.ts`

### 完了条件
- [ ] `text-polisher "テキスト"` で引数からテキストを取得できる
- [ ] `echo "テキスト" | text-polisher` でパイプからテキストを取得できる
- [ ] `--level` オプションが機能する（デフォルト: polite）
- [ ] `--format` オプションが機能する
- [ ] `--engine` オプションが機能する（デフォルト: 環境変数 or claude）
- [ ] `--help` でヘルプが表示される
- [ ] 不正なオプション時にエラーメッセージが表示される
- [ ] テキスト未入力時にエラーメッセージが表示される
- [ ] エンジン未インストール時にエラーメッセージ+インストール手順が表示される
- [ ] 変換結果のみが stdout に出力される

---

## Task 10: ビルドとローカルインストール設定

### 内容
- `package.json` の `bin` フィールド設定
- ビルドスクリプト（`pnpm build`）設定
- shebang行（`#!/usr/bin/env node`）付与
- `pnpm link --global` でローカルインストール確認

### 成果物
- `package.json` 更新
- ビルド出力（`dist/`）

### 完了条件
- [ ] `pnpm build` で `dist/index.js` が生成される
- [ ] `dist/index.js` の先頭に shebang 行がある
- [ ] `pnpm link --global` 後に `text-polisher --help` が動作する

---

## Task 11: README とサンプル設定ファイル

### 内容
- `README.md` にインストール手順、使い方、設定方法を記載
- `.text-polisher.example.yaml` にカスタムフォーマットのサンプルを作成

### 成果物
- `README.md`
- `.text-polisher.example.yaml`

### 完了条件
- [ ] インストール手順（前提条件含む）が記載されている
- [ ] 使用例（全オプション）が記載されている
- [ ] カスタムフォーマットの設定方法が記載されている
- [ ] サンプル設定ファイルがコピペで使える

---

## 実装順序

```
Task 1 (プロジェクト初期化)
  │
  ▼
Task 2 (型定義)
  │
  ├──▶ Task 3 (レベル定義)
  │         │
  ├──▶ Task 4 (フォーマット定義)
  │         │
  │         ▼
  │    Task 5 (プロンプト構築メイン)
  │
  ├──▶ Task 6 (カスタムフォーマット)
  │
  ├──▶ Task 7 (Claude エンジン)
  │
  └──▶ Task 8 (Kiro エンジン)
            │
            ▼
       Task 9 (CLIエントリーポイント) ← 全部を統合
            │
            ▼
       Task 10 (ビルド・インストール)
            │
            ▼
       Task 11 (README・サンプル)
```
