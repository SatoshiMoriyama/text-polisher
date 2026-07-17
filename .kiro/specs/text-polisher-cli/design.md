# Text Polisher CLI - 設計

## 全体アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│  text-polisher CLI                               │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ CLI解析    │─▶│ プロンプト  │─▶│ エンジン   │  │
│  │ (Commander)│  │ 構築       │  │ 実行      │  │
│  └────────────┘  └────────────┘  └─────┬─────┘  │
│                                        │         │
│  ┌────────────┐                        │         │
│  │ フォーマット│─── prefix/suffix ──────┘         │
│  │ 解決       │                                  │
│  └────────────┘                                  │
└────────────────────────────────────────┬─────────┘
                                         │
                          サブプロセス実行 │
                                         ▼
                    ┌─────────────────────────────┐
                    │  Claude Code CLI             │
                    │  claude -p "プロンプト"       │
                    │  --output-format text        │
                    ├─────────────────────────────┤
                    │  Kiro CLI                    │
                    │  kiro-cli chat               │
                    │  --no-interactive "プロンプト" │
                    └─────────────────────────────┘
```

## ディレクトリ構成

```
text-polisher/
├── src/
│   ├── index.ts              # エントリーポイント（CLI定義）
│   ├── engine/
│   │   ├── index.ts          # エンジンインターフェース
│   │   ├── claude.ts         # Claude Code CLI 呼び出し
│   │   └── kiro.ts           # Kiro CLI 呼び出し
│   ├── prompt/
│   │   ├── index.ts          # プロンプト構築メイン
│   │   ├── levels.ts         # レベル別指示定義
│   │   └── formats.ts        # ビルトインフォーマット定義
│   ├── config/
│   │   ├── index.ts          # 設定読み込み
│   │   └── custom-formats.ts # カスタムフォーマット解決
│   └── types.ts              # 型定義
├── package.json
├── tsconfig.json
├── .text-polisher.example.yaml  # 設定ファイルのサンプル
└── README.md
```

## 詳細設計

### 型定義 (`src/types.ts`)

```typescript
export type Level = 'casual' | 'polite' | 'formal' | 'honorific';
export type BuiltinFormat = 'email' | 'slack' | 'document';
export type Engine = 'claude' | 'kiro';

export interface CustomFormat {
  prefix?: string;
  suffix?: string;
}

export interface PolishOptions {
  text: string;
  level: Level;
  format?: string;          // ビルトイン名 or カスタム名
  engine: Engine;
}

export interface ResolvedOptions {
  text: string;
  level: Level;
  builtinFormat?: BuiltinFormat;
  customFormat?: CustomFormat;
  engine: Engine;
}

export interface EngineResult {
  output: string;
  exitCode: number;
}
```

### エンジン層 (`src/engine/`)

#### インターフェース (`src/engine/index.ts`)

```typescript
export interface EngineAdapter {
  name: Engine;
  isAvailable(): Promise<boolean>;
  execute(prompt: string): Promise<EngineResult>;
}
```

#### Claude Code CLI (`src/engine/claude.ts`)

Claude Code のヘッドレスモード（`-p` フラグ）を使用。

```typescript
// 実行コマンド:
// claude -p "プロンプト" --output-format text
//
// オプション:
//   -p: ヘッドレスモード（プロンプトを渡して結果を返す）
//   --output-format text: プレーンテキスト出力
```

- `child_process.execFile` でサブプロセス実行
- stdout からテキスト結果を取得
- タイムアウト: 60秒

#### Kiro CLI (`src/engine/kiro.ts`)

Kiro CLI のヘッドレスモード（`--no-interactive` フラグ）を使用。

```typescript
// 実行コマンド:
// kiro-cli chat --no-interactive --trust-tools=none "プロンプト"
//
// オプション:
//   --no-interactive: ヘッドレスモード
//   --trust-tools=none: ツール不使用（テキスト変換のみなので）
//
// 認証:
//   KIRO_API_KEY 環境変数が設定済みであること前提
```

- `child_process.execFile` でサブプロセス実行
- stdout からテキスト結果を取得
- タイムアウト: 60秒

### プロンプト構築 (`src/prompt/`)

#### メインプロンプト構築 (`src/prompt/index.ts`)

```typescript
export function buildPrompt(options: ResolvedOptions): string {
  // システム指示 + レベル指示 + フォーマット指示 + カスタムフォーマット + 入力テキスト
  // を1つのプロンプト文字列に組み立てる
}
```

生成されるプロンプト例:

```
以下のルールに従って、入力テキストを変換してください。
変換後のテキストのみを出力してください。説明や注釈は一切不要です。

## 丁寧さレベル: formal
ビジネス敬語を使用してください。「いたします」「存じます」「ご〜」などの表現を用います。

## フォーマット: email
メール形式で出力してください。挨拶→本文→締めの構造にしてください。

## カスタム定型文
- 文頭に必ず以下を挿入: 「お疲れ様です。」
- 文末に必ず以下を挿入: 「以上です。よろしくお願いします。」

## 入力テキスト
明日休むわ
```

#### レベル定義 (`src/prompt/levels.ts`)

| レベル | プロンプト指示 |
|--------|--------------|
| casual | 「です・ます」調で柔らかく。親しみを残しつつ最低限の丁寧さ |
| polite | 標準的な丁寧語。「です・ます」「お願いします」を使用 |
| formal | ビジネス敬語。「いたします」「存じます」「ご〜」「〜いただく」 |
| honorific | 最上級敬語。「〜させていただきます」「〜賜りたく」「恐れ入りますが」 |

#### ビルトインフォーマット定義 (`src/prompt/formats.ts`)

| フォーマット | プロンプト指示 |
|-------------|--------------|
| email | メール形式。挨拶→本文→締めの3構造。件名は不要 |
| slack | Slack向け。簡潔に1〜3文。適度な絵文字可 |
| document | 文書形式。正式・構造的。必要に応じて箇条書き |

### 設定管理 (`src/config/`)

#### カスタムフォーマット (`src/config/custom-formats.ts`)

```typescript
// 読み込み優先順位（将来対応込み）:
// 1. ~/.text-polisher/formats.yaml（ユーザーローカル）← 今回実装
// 2. ./.text-polisher/formats.yaml（プロジェクト）← 将来
// 3. ビルトイン（email, slack, document）

export function resolveFormat(name: string): BuiltinFormat | CustomFormat | null
```

設定ファイル形式:

```yaml
# ~/.text-polisher/formats.yaml
formats:
  my-email:
    prefix: "お疲れ様です。"
    suffix: "以上です。よろしくお願いします。"
```

#### デフォルトエンジン設定

```yaml
# ~/.text-polisher/config.yaml（将来対応）
# 今回は環境変数 TEXT_POLISHER_ENGINE で対応
engine: claude
```

今回のスコープ:
- デフォルトエンジンは環境変数 `TEXT_POLISHER_ENGINE` で指定（未設定時: `claude`）
- `--engine` フラグで上書き可能

### CLI定義 (`src/index.ts`)

```typescript
// Commander.js でCLI定義
program
  .name('text-polisher')
  .description('適当な日本語を丁寧な文章に変換する')
  .argument('[text]', '変換するテキスト')
  .option('--level <level>', '丁寧さレベル', 'polite')
  .option('--format <format>', '出力フォーマット')
  .option('--engine <engine>', 'AIエンジン (claude|kiro)')
  .action(async (text, options) => { ... });
```

## データフロー

```
1. ユーザー入力
   text-polisher --level formal --format my-email "明日休むわ"

2. CLI解析 (Commander.js)
   → { text: "明日休むわ", level: "formal", format: "my-email", engine: "claude" }

3. フォーマット解決
   → "my-email" は ~/.text-polisher/formats.yaml にある
   → { prefix: "お疲れ様です。", suffix: "以上です。よろしくお願いします。" }

4. プロンプト構築
   → レベル指示 + カスタムフォーマット指示 + 入力テキスト を結合

5. エンジン実行
   → claude -p "構築されたプロンプト" --output-format text

6. 結果出力
   → stdout に変換後テキストのみ出力

   お疲れ様です。
   明日、お休みをいただきます。
   以上です。よろしくお願いします。
```

## エラーハンドリング

| エラー | 検出方法 | メッセージ |
|--------|---------|-----------|
| テキスト未入力 | 引数なし & stdin なし | `Error: テキストを入力してください` |
| 不正なlevel | Level型に含まれない | `Error: --level は casual, polite, formal, honorific のいずれかを指定してください` |
| 不正なformat | ビルトインにもカスタムにもない | `Error: フォーマット "xxx" が見つかりません。利用可能: email, slack, document, [カスタム一覧]` |
| エンジン未インストール | `which` で確認 | `Error: claude が見つかりません。インストール: https://docs.claude.com/...` |
| エンジン実行エラー | exit code ≠ 0 | `Error: エンジンの実行に失敗しました: [stderr内容]` |
| YAML解析エラー | パースエラーcatch | `Error: ~/.text-polisher/formats.yaml の解析に失敗しました: [詳細]` |
| タイムアウト | 60秒超過 | `Error: エンジンの応答がタイムアウトしました（60秒）` |

## 依存パッケージ

| パッケージ | 用途 |
|-----------|------|
| `commander` | CLI引数・オプション解析 |
| `yaml` | YAML設定ファイル読み込み |
| `typescript` | 開発時型チェック |
| `tsx` | TypeScript直接実行（開発時） |
| `@types/node` | Node.js型定義 |

## ビルド・実行

```bash
# 開発
pnpm dev -- "明日休むわ"            # tsx で直接実行

# ビルド
pnpm build                          # tsc でコンパイル

# ローカルインストール
pnpm link --global                  # text-polisher コマンドとして使える

# 実行
text-polisher "明日休むわ"
```

## セキュリティ考慮

- CLIはサブプロセスとして外部コマンドを実行するため、入力テキストのエスケープを適切に行う
- `child_process.execFile` を使用し、シェルインジェクションを防止
- プロンプトは引数ではなく stdin 経由で渡すことを検討（長文対応 + セキュリティ）
