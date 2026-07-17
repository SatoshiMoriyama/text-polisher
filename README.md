# text-polisher

適当な日本語を丁寧な文章に変換するCLIツール。

裏側のAIエンジンとして **Claude Code CLI** または **Kiro CLI** をサブプロセスとして呼び出し、プロンプトの複雑さをユーザーから隠蔽します。

## 前提条件

以下のいずれかがインストール済みであること：

- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) (`claude` コマンド)
- [Kiro CLI](https://kiro.dev/cli/) (`kiro-cli` コマンド + `KIRO_API_KEY` 設定済み)

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/SatoshiMoriyama/text-polisher.git
cd text-polisher

# 依存パッケージのインストール
pnpm install

# ビルド
pnpm build

# グローバルにリンク（text-polisher コマンドとして使えるようになる）
pnpm link --global
```

## 使い方

### 基本

```bash
text-polisher "明日休むわ"
# → 明日、お休みをいただきます。
```

### パイプ入力

```bash
echo "あの件よろしく" | text-polisher
# → あの件、よろしくお願いいたします。
```

### 丁寧さレベル指定（`--level`）

| レベル | 説明 |
|--------|------|
| `casual` | カジュアル丁寧（です・ます調、親しみあり） |
| `polite` | 標準丁寧語（デフォルト） |
| `formal` | ビジネス敬語 |
| `honorific` | 最上級敬語 |

```bash
text-polisher --level casual "明日休むわ"
# → 明日はお休みしますね。

text-polisher --level formal "明日休むわ"
# → 明日、休暇を取得させていただきます。

text-polisher --level honorific "明日休むわ"
# → 誠に恐れ入りますが、明日は休暇を頂戴したく存じます。
```

### フォーマット指定（`--format`）

| フォーマット | 説明 |
|-------------|------|
| `email` | メール形式（挨拶・本文・締め） |
| `slack` | Slack向け（簡潔・絵文字適度） |
| `document` | 文書形式（正式・構造的） |

```bash
text-polisher --format email "明日の会議、資料送って"
# → お疲れ様です。
#   明日の会議の資料をお送りいただけますでしょうか。
#   よろしくお願いいたします。

text-polisher --format slack "確認しといて"
# → ご確認お願いします!
```

### オプション組み合わせ

```bash
text-polisher --level formal --format email "明日休むわ"
```

### AIエンジン指定（`--engine`）

```bash
# Claude Code を使用（デフォルト）
text-polisher --engine claude "明日休むわ"

# Kiro CLI を使用
text-polisher --engine kiro "明日休むわ"
```

環境変数でデフォルトエンジンを変更可能：

```bash
export TEXT_POLISHER_ENGINE=kiro
text-polisher "明日休むわ"  # kiro が使われる
```

## カスタムフォーマット

`~/.text-polisher/formats.yaml` にカスタムフォーマットを定義できます。

### セットアップ

```bash
mkdir -p ~/.text-polisher
cp .text-polisher.example.yaml ~/.text-polisher/formats.yaml
# お好みで編集
```

### 設定ファイルの書き方

```yaml
# ~/.text-polisher/formats.yaml
formats:
  my-email:
    prefix: "お疲れ様です。"
    suffix: "以上です。よろしくお願いします。"

  weekly-report:
    prefix: "今週の報告です。"
    suffix: "以上、ご確認よろしくお願いいたします。"

  client-email:
    prefix: "いつもお世話になっております。"
    suffix: "何卒よろしくお願い申し上げます。"
```

### 使用例

```bash
text-polisher --format my-email "明日休むわ"
# → お疲れ様です。
#   明日、お休みをいただきます。
#   以上です。よろしくお願いします。

text-polisher --level formal --format client-email "来週打ち合わせしたい"
# → いつもお世話になっております。
#   来週、お打ち合わせのお時間を頂戴できますでしょうか。
#   何卒よろしくお願い申し上げます。
```

### 優先順位

カスタムフォーマット名がビルトイン（email, slack, document）と同じ場合、カスタムが優先されます。

## 開発

```bash
# 開発時実行（tsx で直接実行）
pnpm dev -- "明日休むわ"
pnpm dev -- --level formal --format email "明日休むわ"

# ビルド
pnpm build

# クリーン
pnpm clean
```

## プロジェクト構成

```
text-polisher/
├── src/
│   ├── index.ts              # CLIエントリーポイント
│   ├── types.ts              # 型定義
│   ├── engine/
│   │   ├── index.ts          # エンジンインターフェース
│   │   ├── claude.ts         # Claude Code CLI アダプター
│   │   └── kiro.ts           # Kiro CLI アダプター
│   ├── prompt/
│   │   ├── index.ts          # プロンプト構築
│   │   ├── levels.ts         # レベル別指示
│   │   └── formats.ts        # ビルトインフォーマット指示
│   └── config/
│       ├── index.ts          # 設定・オプション解決
│       └── custom-formats.ts # カスタムフォーマット読み込み
├── package.json
├── tsconfig.json
└── .text-polisher.example.yaml
```

## 将来の拡張予定

- プロジェクト単位のフォーマット共有（`./.text-polisher/formats.yaml`）
- カスタムフォーマットのnpmプラグイン配布
- WEBアプリ版
