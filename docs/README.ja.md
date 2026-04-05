<p align="center">
  <img src="../assets/combined.gif" alt="Before vs After — AIエージェントの7つの規律法則" width="700" />
</p>

<h1 align="center">AIエージェントの7つの規律法則</h1>

<p align="center">
  <b>AIエージェントがステップを飛ばし、推測し、検証せずに「完了」と宣言するのを防ぐ</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/continuous-improvement"><img src="https://img.shields.io/npm/v/continuous-improvement" alt="npm"></a>
  <a href="https://www.npmjs.com/package/continuous-improvement"><img src="https://img.shields.io/npm/dm/continuous-improvement" alt="downloads"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
  <a href="../test/"><img src="https://img.shields.io/badge/tests-104%20passing-brightgreen" alt="tests"></a>
</p>

<p align="center">
  <a href="https://docs.anthropic.com/en/docs/claude-code"><img src="https://img.shields.io/badge/Claude%20Code-skill-blueviolet" alt="Claude Code"></a>
  <a href="https://cursor.sh"><img src="https://img.shields.io/badge/Cursor-compatible-blue" alt="Cursor"></a>
  <a href="https://openai.com/codex"><img src="https://img.shields.io/badge/Codex-compatible-blue" alt="Codex"></a>
  <a href="https://ai.google.dev/gemini-api/docs/gemini-cli"><img src="https://img.shields.io/badge/Gemini%20CLI-compatible-blue" alt="Gemini CLI"></a>
</p>

---

[English](../README.md) | [简体中文](README.zh-CN.md) | **日本語**

---

## 問題

AIエージェントは個々のステップは得意です。しかし**規律**がありません。

リサーチを飛ばします。計画が曖昧です。検証せずに「完了」と宣言します。タスクの途中で機能を追加します。振り返りをしません。セッションごとに同じミスを繰り返します。

**7つの法則**がこれを解決します。さらに**学習システム**（Mulahazah）が時間とともにインスティンクト（直感）を構築します。設定不要、デーモン不要、手動セットアップ不要です。

### Before vs After

<details>
<summary><b>continuous-improvement なし</b> — エージェントがリサーチを飛ばし、検証せずに「完了」と宣言</summary>

```
あなた: /api/users エンドポイントにレート制限を追加して

エージェント: レート制限を追加します。
       *express-rate-limit ミドルウェアを作成*
       完了しました！/api/users エンドポイントにレート制限を追加しました。

あなた: 既にレート制限があるか確認した？
エージェント: 確認します... あ、middleware/rateLimit.ts に既にレートリミッターがありました。
       重複を作ってしまいました。修正します。

あなた: テストした？
エージェント: テストを実行します... 失敗しています。インポートパスが間違っています。
       *インポートを修正*
       動きました！

あなた: /api/auth エンドポイントも壊れているよ — 同じミドルウェアを共有していたのに。
エージェント: なるほど。それも修正します...
```

**結果:** 4回のやり取り。重複コード。壊れたエンドポイント。15分の無駄。
</details>

<details>
<summary><b>continuous-improvement あり</b> — エージェントが7つの法則に従う</summary>

```
あなた: /api/users エンドポイントにレート制限を追加して

エージェント: **[法則1: リサーチ]** 既存のレート制限を検索中...
       発見: middleware/rateLimit.ts — 既に /api/auth に適用中。
       発見: express-rate-limit は package.json に既にあり。

       **[法則2: 計画]**
       実行すること: 既存の rateLimit ミドルウェアを拡張して /api/users をカバー
       実行しないこと: 新しいミドルウェアの作成、既存の /api/auth の動作変更
       検証方法: テスト実行 + curl で /api/users に101回リクエストし 429 レスポンスを確認

       **[法則3: 一つずつ実行]** middleware/rateLimit.ts の
       ルートリストに /api/users を追加中...

       **[法則4: 検証]**
       ✓ npm test — 47/47 パス
       ✓ curl テスト — 100リクエスト後に 429
       ✓ /api/auth は正常 — 200 OK

       完了。既存のレートリミッターを拡張して /api/users をカバーしました。
       変更ファイル1つ: middleware/rateLimit.ts (+1行)。
```

**結果:** 初回で正解。重複コードなし。壊れたエンドポイントなし。2分。
</details>

---

## インストール

### Beginner（デフォルト） — フックのみ、セットアップ不要

```bash
npx continuous-improvement install
```

これだけです。Claude Code の場合、以下がインストールされます:
- Observation フック（すべてのツール呼び出しをキャプチャ、50ms未満、jq はオプション）
- `/continuous-improvement` コマンド
- 自動レベリング・インスティンクトシステム

### Expert — フルパワー、MCP サーバー付き

```bash
npx continuous-improvement install --mode expert
```

Beginner のすべてに加えて:
- **MCP サーバー** — 8つのツール（インスティンクト管理、インポート/エクスポート、observation ビューア）
- **セッションフック**（セッション開始時にインスティンクトを自動ロード、終了時に振り返りをリマインド）
- Claude Code、Claude Desktop、その他の MCP クライアントで動作

### MCP のみ — Claude 以外のエディタ向け

```bash
npx continuous-improvement install --mode mcp
```

フックなしで MCP サーバーを登録します。Cursor、Zed、Windsurf、VS Code など MCP をサポートするエディタ向けです。

### 特定のターゲットにインストール

```bash
npx continuous-improvement install --target claude    # Claude Code + Mulahazah
npx continuous-improvement install --target openclaw  # OpenClaw（スキルのみ）
npx continuous-improvement install --target cursor    # Cursor（スキルのみ）
npx continuous-improvement install --target all       # すべてのターゲット
```

### 手動インストール

```bash
mkdir -p ~/.claude/skills/continuous-improvement && \
curl -fsSL -o ~/.claude/skills/continuous-improvement/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

### エージェントに直接指示する

```
Fetch and follow the skill at: https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

---

## AIエージェントの7つの規律法則

> エコシステム内のすべてのスキルは機能を追加します。これは唯一、*エージェントの思考方法*を修正するスキルです。

| # | 法則 | これがないと、エージェントは... |
|---|------|-------------------------------|
| 1 | **実行前にリサーチする** | 既に存在するものを再発明する |
| 2 | **計画は神聖である** | スコープクリープし過剰に作り込む |
| 3 | **一度に一つだけ** | テストされていない変更を積み重ねる |
| 4 | **報告前に検証する** | 「完了」と嘘をつく |
| 5 | **セッション後に振り返る** | 同じ失敗を繰り返す |
| 6 | **一つの変更をイテレーションする** | 5つの変更を同時にデバッグする |
| 7 | **すべてのセッションから学ぶ** | コンテキストウィンドウが終わると知識を失う |

### ループ

```
リサーチ → 計画 → 実行（一つずつ） → 検証 → 振り返り → 学習 → イテレーション
```

エージェントがステップを飛ばしているなら、それこそが最も必要なステップです。

---

## Mulahazah: 自動レベリング学習

Mulahazah（アラビア語: 観察を意味する「ملاحظة」）は、エージェントが時間とともに**インスティンクト（直感）**を構築する仕組みです。自動的にレベルアップします。設定は一切不要です。

```
インストール:     フックがサイレントにキャプチャを開始。何も気づきません。
~20セッション:   エージェントがパターンを分析し、最初のインスティンクトを作成（サイレント）
~50セッション:   インスティンクトが 0.5 を超える → エージェントが行動を提案し始める
~100セッション:  インスティンクトが 0.7 を超える → エージェントが学習した内容を自動適用
```

### 仕組み

1. **フックがすべてのツール呼び出しをキャプチャ** — PreToolUse/PostToolUse フックが JSONL の observation を書き込みます（50ms未満、セッションをブロックしない、jq 不要）
2. **分析はインラインで実行** — 20件以上の observation が蓄積されると、セッション開始時に Claude が分析します。バックグラウンドデーモンなし。
3. **インスティンクトは信頼度を持つ** — 0.3〜0.9 のスケールで段階的な動作:
   - **サイレント** (< 0.5) — 保存されるが表示されない
   - **提案** (0.5〜0.69) — 関連する場面でインラインで言及
   - **自動適用** (0.7+) — 自動的に適用
4. **自己修正** — ユーザーの修正で信頼度が 0.1 低下。使われないインスティンクトは減衰。間違った行動は自然に消えます。
5. **プロジェクトスコープ** — インスティンクトはデフォルトでプロジェクト単位。2つ以上のプロジェクトで確認されるとグローバルに昇格。

### エージェントが学んだことを確認する

```
/continuous-improvement
```

---

## プラグインアーキテクチャ

continuous-improvement は3つのレイヤーを持つ**プラグイン**として提供されます。必要なものを選んでください:

### レイヤー1: スキルのみ（任意の LLM）
SKILL.md をシステムプロンプトに貼り付けるだけ。エージェントは7つの法則に従います。ツール、フック、サーバー不要。

### レイヤー2: フック（Claude Code）
`npx continuous-improvement install` — すべてのツール呼び出しをサイレントにキャプチャするフックをインストール。インスティンクトシステムが自動的に成長します。設定不要。

### レイヤー3: MCP サーバー（任意の MCP クライアント）
`npx continuous-improvement install --mode expert` — 任意のエディタが接続できるフル MCP サーバー。

### Beginner vs Expert

| 機能 | Beginner（デフォルト） | Expert |
|------|----------------------|--------|
| Observation フック | あり | あり |
| `/continuous-improvement` コマンド | あり | あり |
| 自動レベリング・インスティンクト | あり | あり |
| `ci_status` ツール | - | あり |
| `ci_instincts` ツール | - | あり |
| `ci_reflect` ツール | - | あり |
| `ci_reinforce` ツール | - | あり |
| `ci_create_instinct` ツール | - | あり |
| `ci_observations` ツール | - | あり |
| `ci_export` / `ci_import` | - | あり |
| セッション開始/終了フック | - | あり |
| MCP サーバー | - | あり |

**Beginner** は90%のユーザーに適しています。インストールして忘れるだけで動きます。システムはセッションからサイレントに学習します。

**Expert** は MCP サーバーによるプログラマティックアクセス、手動インスティンクト管理、チーム共有用のインポート/エクスポート、セッションレベルのフックを追加します。

### MCP ツールリファレンス

| ツール | 説明 |
|--------|------|
| `ci_status` | 現在のレベル、インスティンクト数、observation 数 |
| `ci_instincts` | 信頼度付きの学習済みインスティンクト一覧 |
| `ci_reflect` | 構造化されたセッション振り返りを生成 |
| `ci_reinforce` | インスティンクトの提案を承認/拒否（expert） |
| `ci_create_instinct` | インスティンクトを手動作成（expert） |
| `ci_observations` | 生のツール呼び出し observation を閲覧（expert） |
| `ci_export` | インスティンクトを JSON としてエクスポート（expert） |
| `ci_import` | JSON からインスティンクトをインポート（expert） |

---

## 実例

詳細なウォークスルーは [`examples/`](../examples/) ディレクトリを参照してください:

- [**バグ修正**](../examples/01-bug-fix.md) — ダブル送信バグ: フレームワークなしで4ラウンド → ありで1ラウンド
- [**機能追加**](../examples/02-feature-build.md) — ページネーション追加: なしで3回の書き直し → ありで初回から正解
- [**リファクタリング**](../examples/03-refactor.md) — SDK 移行: なしで連鎖的な障害 → ありでリグレッションゼロ

各例で、7つの法則の有無で同じタスクを実行し、どの法則が違いを生んだかを示しています。

---

## ファイル構成

```
continuous-improvement/
├── SKILL.md                           # 7つの法則 + インスティンクトの振る舞い
├── bin/
│   ├── install.mjs                    # CLI インストーラー (--mode beginner|expert|mcp)
│   └── mcp-server.mjs                # MCP サーバー（依存関係ゼロ）
├── hooks/
│   ├── observe.sh                     # Observation フック（純粋な bash、50ms未満）
│   └── session.sh                     # セッション開始/終了フック（expert モード）
├── plugins/
│   ├── beginner.json                  # プラグインマニフェスト: 3ツール
│   └── expert.json                    # プラグインマニフェスト: 8ツール
├── commands/continuous-improvement.md # /continuous-improvement コマンド
├── test/                              # 34テスト (node --test)
├── examples/                          # 実例 before/after シナリオ
├── QUICKSTART.md
├── CHANGELOG.md
└── package.json
```

### インストール先

**Beginner モード**（デフォルト）:
```
~/.claude/skills/continuous-improvement/SKILL.md     # スキル
~/.claude/commands/continuous-improvement.md          # コマンド
~/.claude/instincts/
├── observe.sh                                       # フックスクリプト
├── global/                                          # グローバルインスティンクト (*.yaml)
└── <project-hash>/
    ├── project.json                                 # プロジェクトメタデータ
    ├── observations.jsonl                           # ツール呼び出し observation
    └── *.yaml                                       # プロジェクトインスティンクト
```

**Expert モード** で追加されるもの:
```
~/.claude/instincts/session.sh                       # セッションフック
~/.claude/settings.json                              # + MCP サーバー + セッションフック
```

---

## アンインストール

```bash
npx continuous-improvement install --uninstall
```

スキル、フック、コマンドを削除します。`~/.claude/instincts/` に保存された学習済みインスティンクトは保持されます。完全にクリーンな状態にしたい場合は、そのディレクトリを手動で削除してください。

---

## 対応ツール

| ツール | サポート |
|--------|---------|
| **Claude Code** | フルサポート — スキル + フック + MCP サーバー + 自動レベリング・インスティンクト |
| **Claude Desktop** | MCP サーバー (expert/mcp モード) |
| **Cursor** | MCP サーバー (mcp モード) またはスキルのみ (SKILL.md を rules に貼り付け) |
| **Zed / Windsurf** | MCP サーバー (mcp モード) |
| **VS Code** | MCP サーバー (mcp モード)、Copilot MCP サポートあり |
| **Codex** | スキルのみ |
| **Gemini CLI** | スキルのみ |
| **OpenClaw** | スキルのみ |
| **任意の LLM** | SKILL.md をシステムプロンプトに貼り付け |

---

## レッドフラグ

エージェントが以下のような発言をしたら、法則を飛ばしています:

- 「ちょっとだけ...」 → 法則3違反
- 「これで動くはず...」 → 法則4違反（検証せよ、推測するな）
- 「もう知っているから...」 → 法則1違反（それでもリサーチせよ）
- 「ついでに追加して...」 → 法則6違反（まず今のタスクを完了せよ）
- 「覚えておきます...」 → 法則7違反（書き留めよ）

---

## ロードマップ

### フェーズ1: 基盤 -- 完了

- [x] 公開 npm に公開済み（`npx continuous-improvement install` が動作）
- [x] 34テストのテストスイート（インストーラー、フック、MCP サーバー、プラグイン設定、SKILL.md 検証）
- [x] README + `examples/` ディレクトリに before/after の実例
- [x] Gemini CLI サポート
- [x] プラットフォームバッジと改善された npm メタデータ
- [ ] **[awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)** への投稿（14K スター）

### フェーズ2: プラグインアーキテクチャ -- 完了

- [x] **MCP サーバー** — 8ツール（beginner: 3、expert: さらに5）、依存関係ゼロ
- [x] **Beginner / Expert の分離** — シンプルなデフォルト、必要な時にパワーを
- [x] **プラグインマニフェスト** — `plugins/beginner.json` と `plugins/expert.json`
- [x] **セッションフック** — セッション開始時にインスティンクトを自動ロード、終了時に振り返りをリマインド
- [x] **`--mode` フラグ** — `beginner` | `expert` | `mcp` のインストールモード
- [x] **インポート/エクスポート** — チームメンバー間でインスティンクトを JSON として共有
- [x] **マルチエディタ MCP サポート** — Claude Desktop、Cursor、Zed、Windsurf、VS Code

### フェーズ3: コンテンツと実証

- [ ] **2分デモ動画** — 規律あり/なしのエージェントを並べて比較。X + YouTube に投稿。
- [ ] **「AIエージェントが完了と嘘をつき続ける理由」** — X スレッド / ブログ記事
- [ ] **「今週の法則」X シリーズ** — 各法則を7週間かけて解説

### フェーズ4: エコシステムの成長

- [ ] **GitHub Action** — エージェントのトランスクリプトを法則準拠でリント
- [ ] **VS Code 拡張機能** — インスティンクトの信頼度を表示するサイドバー
- [ ] **クイックスタート・インスティンクトパック** — React、Python、Go 等の事前構築済みインスティンクト

### フェーズ5: コミュニティ

- [ ] **インスティンクト・マーケットプレイス** — チーム間で学習済みインスティンクトを共有
- [ ] **Mulahazah のカンファレンストーク** — 自動レベリングシステムは真に新しいコンセプト
- [ ] **リーダーボード / バッジ** — 「100セッション」の実績システム

---

## ライセンス

MIT
