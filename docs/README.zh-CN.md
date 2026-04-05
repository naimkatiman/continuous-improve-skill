[English](../README.md) | **简体中文** | [日本語](README.ja.md)

---

<p align="center">
  <img src="../assets/combined.gif" alt="使用前 vs 使用后 — AI 代理的七条纪律法则" width="700" />
</p>

<h1 align="center">AI 代理的七条纪律法则</h1>

<p align="center">
  <b>阻止你的 AI 代理跳过步骤、猜测结果和未经验证就宣布"完成"。</b>
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

## 问题所在

AI 代理擅长执行单个步骤，但在**纪律性**方面表现很差。

它们跳过调研，随意规划，还没验证就宣布"完成"，执行中途还会擅自添加功能，从不反思。每次会话都在重复同样的错误。

**七条法则**解决了这些问题 — 再加上一个**学习系统**（Mulahazah），让代理随时间积累本能直觉。无需配置，无需守护进程，无需手动设置。

### 使用前 vs 使用后

<details>
<summary><b>没有 continuous-improvement</b> — 代理跳过调研，未经验证就宣布"完成"</summary>

```
你: 给 /api/users 端点添加限流功能

代理: 我现在就添加限流。
       *编写 express-rate-limit 中间件*
       完成！我已经给 /api/users 端点添加了限流。

你: 你检查过我们是否已经有限流了吗？
代理: 让我查一下...哦，middleware/rateLimit.ts 里已经有一个限流器了。
       我创建了重复代码。让我修复一下。

你: 你测试过了吗？
代理: 让我跑一下测试...测试失败了。导入路径不对。
       *修复导入*
       现在可以了！

你: 你还搞坏了 /api/auth 端点 — 它共享了那个中间件。
代理: 我看到了。让我也修复一下...
```

**结果：** 4 轮来回修正。重复代码。端点被搞坏。浪费了 15 分钟。
</details>

<details>
<summary><b>有 continuous-improvement</b> — 代理遵循七条法则</summary>

```
你: 给 /api/users 端点添加限流功能

代理: **[法则 1: 调研]** 搜索现有的限流实现...
       找到: middleware/rateLimit.ts — 已应用于 /api/auth。
       找到: express-rate-limit 已在 package.json 中。

       **[法则 2: 规划]**
       将要: 扩展现有的 rateLimit 中间件以覆盖 /api/users
       不会: 创建新中间件或改变现有的 /api/auth 行为
       验证: 运行测试 + curl /api/users 101 次确认 429 响应

       **[法则 3: 一次只做一件事]** 在 middleware/rateLimit.ts
       的路由列表中添加 /api/users...

       **[法则 4: 验证]**
       ✓ npm test — 47/47 通过
       ✓ curl 测试 — 100 次请求后返回 429
       ✓ /api/auth 仍然正常 — 200 OK

       完成。扩展了现有限流器以覆盖 /api/users。
       一个文件修改: middleware/rateLimit.ts (+1 行)。
```

**结果：** 首次尝试即正确。没有重复代码。没有端点被搞坏。2 分钟搞定。
</details>

---

## 安装

### 入门模式（默认）— 仅 hooks，无需额外设置

```bash
npx continuous-improvement install
```

就这么简单。对于 Claude Code，会安装：
- 观察 hooks（捕获每次工具调用，<50ms，jq 可选）
- `/continuous-improvement` 命令
- 自动升级的本能直觉系统

### 专家模式 — 完整功能，包含 MCP 服务器

```bash
npx continuous-improvement install --mode expert
```

包含入门模式的所有功能，额外增加：
- **MCP 服务器**，提供 8 个工具（本能管理、导入/导出、观察查看器）
- **会话 hooks**（启动时自动加载本能，结束时提醒反思）
- 兼容 Claude Code、Claude Desktop 及任何 MCP 客户端

### 仅 MCP — 适用于非 Claude 编辑器

```bash
npx continuous-improvement install --mode mcp
```

注册 MCP 服务器但不安装 hooks — 适用于 Cursor、Zed、Windsurf、VS Code 或任何支持 MCP 的编辑器。

### 安装到指定目标

```bash
npx continuous-improvement install --target claude    # Claude Code + Mulahazah
npx continuous-improvement install --target openclaw  # OpenClaw（仅 skill）
npx continuous-improvement install --target cursor    # Cursor（仅 skill）
npx continuous-improvement install --target all       # 所有目标
```

### 手动安装

```bash
mkdir -p ~/.claude/skills/continuous-improvement && \
curl -fsSL -o ~/.claude/skills/continuous-improvement/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

### 让你的代理知道

```
Fetch and follow the skill at: https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

---

## AI 代理的七条纪律法则

> 生态系统中的每个 skill 都在增加能力。而这是唯一一个修正*代理思维方式*的 skill。

| # | 法则 | 不遵循的话，代理会... |
|---|------|---------------------|
| 1 | **执行前先调研** | 重新发明已经存在的东西 |
| 2 | **计划神圣不可侵犯** | 范围蔓延，过度设计 |
| 3 | **一次只做一件事** | 堆叠未经测试的变更 |
| 4 | **汇报前先验证** | 谎称"已完成" |
| 5 | **会话后反思** | 重复同样的失败 |
| 6 | **每次只迭代一个变更** | 同时调试 5 个变更 |
| 7 | **从每次会话中学习** | 上下文窗口结束后知识就丢失了 |

### 循环

```
调研 → 规划 → 执行（一件事） → 验证 → 反思 → 学习 → 迭代
```

如果你的代理正在跳过某个步骤，那就是它最需要的步骤。

---

## Mulahazah：自动升级的学习系统

Mulahazah（阿拉伯语：观察 / ملاحظة）让你的代理随时间建立**本能直觉**。它会自动升级 — 你无需任何配置。

```
安装:          Hooks 开始静默捕获。你不会察觉任何变化。
约 20 次会话:   代理分析模式，创建第一批本能（静默）
约 50 次会话:   本能置信度超过 0.5 → 代理开始建议行为
约 100 次会话:  本能置信度超过 0.7 → 代理自动应用所学
```

### 工作原理

1. **Hooks 捕获每次工具调用** — PreToolUse/PostToolUse hooks 写入 JSONL 观察记录（<50ms，不会阻塞你的会话，不依赖 jq）
2. **分析在会话中内联执行** — 当积累 20+ 条观察记录后，Claude 会在会话开始时进行分析。没有后台守护进程。
3. **本能带有置信度** — 0.3-0.9 的分级行为：
   - **静默**（< 0.5）— 已存储，但不展示
   - **建议**（0.5-0.69）— 在相关时内联提及
   - **自动应用**（0.7+）— 自动应用
4. **自我修正** — 用户的修正会使置信度降低 0.1。未使用的本能会衰减。错误的行为会逐渐消失。
5. **项目范围** — 本能默认按项目隔离，当在 2+ 个项目中出现时会提升为全局本能

### 查看代理学到了什么

```
/continuous-improvement
```

---

## 插件架构

continuous-improvement 作为**插件**发布，包含三个层级。按需选用：

### 第一层：仅 Skill（任意 LLM）
将 SKILL.md 粘贴到你的 system prompt 中。代理即可遵循七条法则。无需工具、hooks 或服务器。

### 第二层：Hooks（Claude Code）
`npx continuous-improvement install` — 安装静默捕获每次工具调用的 hooks。本能系统自动成长。零配置。

### 第三层：MCP 服务器（任意 MCP 客户端）
`npx continuous-improvement install --mode expert` — 完整的 MCP 服务器，任何编辑器都可以连接。

### 入门模式 vs 专家模式

| 功能 | 入门模式（默认） | 专家模式 |
|------|-----------------|---------|
| 观察 hooks | 有 | 有 |
| `/continuous-improvement` 命令 | 有 | 有 |
| 自动升级本能 | 有 | 有 |
| `ci_status` 工具 | - | 有 |
| `ci_instincts` 工具 | - | 有 |
| `ci_reflect` 工具 | - | 有 |
| `ci_reinforce` 工具 | - | 有 |
| `ci_create_instinct` 工具 | - | 有 |
| `ci_observations` 工具 | - | 有 |
| `ci_export` / `ci_import` | - | 有 |
| 会话 hooks | - | 有 |
| MCP 服务器 | - | 有 |

**入门模式**适合 90% 的用户。安装即忘，开箱即用。系统会从你的会话中静默学习。

**专家模式**增加了 MCP 服务器，提供编程式访问、手动本能管理、团队间导入/导出共享，以及会话级 hooks。

### MCP 工具参考

| 工具 | 说明 |
|------|------|
| `ci_status` | 当前等级、本能数量、观察记录数量 |
| `ci_instincts` | 列出已学习的本能及其置信度 |
| `ci_reflect` | 生成结构化的会话反思 |
| `ci_reinforce` | 接受/拒绝本能建议（专家模式） |
| `ci_create_instinct` | 手动创建本能（专家模式） |
| `ci_observations` | 查看原始工具调用观察记录（专家模式） |
| `ci_export` | 导出本能为 JSON（专家模式） |
| `ci_import` | 从 JSON 导入本能（专家模式） |

---

## 实际案例

查看 [`examples/`](../examples/) 目录获取详细演示：

- [**Bug 修复**](../examples/01-bug-fix.md) — 双重提交 bug：没有框架需要 4 轮修复，有框架只需 1 轮
- [**功能开发**](../examples/02-feature-build.md) — 添加分页：没有框架需要重写 3 次，有框架首次尝试即正确
- [**重构**](../examples/03-refactor.md) — SDK 迁移：没有框架会级联失败，有框架零回归

每个案例都展示了有七条法则和没有七条法则时完成同一任务的对比，并指出是哪些法则起了关键作用。

---

## 文件结构

```
continuous-improvement/
├── SKILL.md                           # 七条法则 + 本能行为定义
├── bin/
│   ├── install.mjs                    # CLI 安装器 (--mode beginner|expert|mcp)
│   └── mcp-server.mjs                # MCP 服务器（零依赖）
├── hooks/
│   ├── observe.sh                     # 观察 hook（纯 bash，<50ms）
│   └── session.sh                     # 会话 hook（专家模式）
├── plugins/
│   ├── beginner.json                  # 插件清单：3 个工具
│   └── expert.json                    # 插件清单：8 个工具
├── commands/continuous-improvement.md # /continuous-improvement 命令
├── test/                              # 34 个测试 (node --test)
├── examples/                          # 实际使用前后对比案例
├── QUICKSTART.md
├── CHANGELOG.md
└── package.json
```

### 安装位置

**入门模式**（默认）：
```
~/.claude/skills/continuous-improvement/SKILL.md     # Skill 文件
~/.claude/commands/continuous-improvement.md          # 命令文件
~/.claude/instincts/
├── observe.sh                                       # Hook 脚本
├── global/                                          # 全局本能 (*.yaml)
└── <project-hash>/
    ├── project.json                                 # 项目元数据
    ├── observations.jsonl                           # 工具调用观察记录
    └── *.yaml                                       # 项目本能
```

**专家模式**额外添加：
```
~/.claude/instincts/session.sh                       # 会话 hooks
~/.claude/settings.json                              # + MCP 服务器 + 会话 hooks
```

---

## 卸载

```bash
npx continuous-improvement install --uninstall
```

移除 skill、hooks 和命令。已学习的本能保留在 `~/.claude/instincts/` 中 — 如需彻底清除请手动删除该目录。

---

## 兼容性

| 工具 | 支持程度 |
|------|---------|
| **Claude Code** | 完整支持 — skill + hooks + MCP 服务器 + 自动升级本能 |
| **Claude Desktop** | MCP 服务器（expert/mcp 模式） |
| **Cursor** | MCP 服务器（mcp 模式）或仅 skill（将 SKILL.md 粘贴到 rules 中） |
| **Zed / Windsurf** | MCP 服务器（mcp 模式） |
| **VS Code** | MCP 服务器（mcp 模式），需 Copilot MCP 支持 |
| **Codex** | 仅 skill |
| **Gemini CLI** | 仅 skill |
| **OpenClaw** | 仅 skill |
| **任意 LLM** | 将 SKILL.md 粘贴到你的 system prompt 中 |

---

## 危险信号

如果你的代理说出以下任何一句话，说明它正在违反法则：

- "我快速弄一下..." → 违反法则 3
- "这应该没问题..." → 违反法则 4（要验证，不要假设）
- "我已经知道怎么做了..." → 违反法则 1（仍然需要调研）
- "我顺便再加个..." → 违反法则 6（先完成当前任务）
- "我会记住这个的..." → 违反法则 7（写下来，别靠记忆）

---

## 路线图

### 第一阶段：基础 -- 已完成

- [x] 发布到公共 npm（`npx continuous-improvement install` 可用）
- [x] 34 个测试（安装器、hook、MCP 服务器、插件配置、SKILL.md 验证）
- [x] README 和 `examples/` 目录中的使用前后对比
- [x] Gemini CLI 支持
- [x] 平台徽章和改进的 npm 元数据
- [ ] **提交到 [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)**（14K stars）

### 第二阶段：插件架构 -- 已完成

- [x] **MCP 服务器** — 8 个工具（入门：3 个，专家：额外 5 个），零依赖
- [x] **入门 / 专家模式分离** — 简单默认值，需要时释放全部功能
- [x] **插件清单** — `plugins/beginner.json` 和 `plugins/expert.json`
- [x] **会话 hooks** — 会话开始时自动加载本能，结束时提醒反思
- [x] **`--mode` 参数** — `beginner` | `expert` | `mcp` 安装模式
- [x] **导入/导出** — 团队成员间以 JSON 共享本能
- [x] **多编辑器 MCP 支持** — Claude Desktop、Cursor、Zed、Windsurf、VS Code

### 第三阶段：内容与证明

- [ ] **2 分钟演示视频** — 有纪律 vs 无纪律的代理对比。发布到 X 和 YouTube
- [ ] **"为什么你的 AI 代理总是谎称已完成"** — X 推文串 / 博客文章
- [ ] **"每周一条法则" X 系列** — 7 周内容，逐条解析每条法则

### 第四阶段：生态扩展

- [ ] **GitHub Action** — 审查代理对话记录的法则合规性
- [ ] **VS Code 扩展** — 侧边栏展示本能置信度
- [ ] **快速启动本能包** — 为 React、Python、Go 等预构建的本能

### 第五阶段：社区

- [ ] **本能市场** — 跨团队共享已学习的本能
- [ ] **Mulahazah 主题演讲** — 自动升级系统确实是一项创新
- [ ] **排行榜 / 徽章** — "100 次会话"成就系统

---

## 许可证

MIT
