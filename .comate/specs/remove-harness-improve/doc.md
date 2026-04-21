# 移除 harness-improve，精简为两个 skill

## 背景

harness-pilot 插件目前有三个 skill：harness-analyze、harness-apply、harness-improve。harness-improve 存在以下问题：
1. 与 harness-analyze 大量重叠（Step 1 直接复用 harness-analyze 评分）
2. 失败模式分析依赖 `.harness/trace/failures/` 数据，但无自动写入机制
3. 能自动修复的问题太浅，不足以支撑"自我进化"的定位

决策：删除 harness-improve skill，将其中有价值的审计功能（文档过期检测、lint 覆盖率 gap 检测）合并到 harness-analyze 中。

## 变更范围

### 1. 删除 harness-improve skill 目录

- **操作**: 删除整个目录
- **路径**: `plugins/harness-pilot/skills/harness-improve/` (含 SKILL.md)

### 2. 增强 harness-analyze，合并有价值的审计功能

- **文件**: `plugins/harness-pilot/skills/harness-analyze/SKILL.md`
- **修改内容**:
  - description 中增加审计相关关键词（audit, health）
  - "When to Activate" 增加 harness-improve 原有的触发词：`improve`, `harness-improve`, `harness-health`, `harness-audit`
  - 在 Step 5（Generate Health Report）之后新增 Step 5.5: Audit Analysis（可选），包含：
    - 文档过期检测（对比文档和源码修改时间）
    - Lint 覆盖率 gap 检测（检查目录是否在 layer mapping 中）
  - 更新 "After Analysis" 部分，去掉对 harness-improve 的引用，改为 harness-analyze 自身的 `--audit` 深度分析提示

### 3. 更新 README.md

- **文件**: `README.md`
- **修改**:
  - 移除 harness-improve 的介绍行（第13行）
  - 移除 harness-improve 的 Quick Start 示例（第54行）
  - 更新 harness-analyze 描述，体现审计功能

### 4. 更新 docs/API.md

- **文件**: `docs/API.md`
- **修改**:
  - 删除 `### harness-improve` 整个段落（第65-81行）
  - 更新 harness-analyze 段落，增加审计触发词和审计功能说明

### 5. 更新 docs/CONTRIBUTING.md

- **文件**: `docs/CONTRIBUTING.md`
- **修改**:
  - 移除目录树中 `harness-improve/` 行（第40行）

### 6. 更新 docs/FAQ.md

- **文件**: `docs/FAQ.md`
- **修改**: 无直接引用 harness-improve，无需修改

### 7. 更新 harness-guardian agent

- **文件**: `plugins/harness-pilot/agents/harness-guardian.md`
- **修改**:
  - 第71行 "feed into harness-improve" 改为 "feed into harness-analyze"

### 8. 更新 harness-apply SKILL.md

- **文件**: `plugins/harness-pilot/skills/harness-apply/SKILL.md`
- **检查**: 无直接引用 harness-improve，无需修改

## 合并到 harness-analyze 的具体内容

从 harness-improve SKILL.md 中提取以下有价值的审计逻辑，作为 harness-analyze 的可选深度分析步骤：

### 文档过期检测（来自 harness-improve Step 4）

```bash
# 对比文档和源码的修改时间
ARCH_MTIME=$(stat -f %m docs/ARCHITECTURE.md 2>/dev/null || stat -c %Y docs/ARCHITECTURE.md 2>/dev/null)
LATEST_SRC=$(find . -name "*.ts" -o -name "*.py" -o -name "*.go" | \
  xargs stat -f %m 2>/dev/null | sort -rn | head -1)

if [ "$LATEST_SRC" -gt "$ARCH_MTIME" ]; then
  echo "STALE: docs/ARCHITECTURE.md is older than latest source changes"
fi
```

输出格式：
```
=== Documentation Freshness ===
  docs/ARCHITECTURE.md  — [Fresh/Stale]
  docs/DEVELOPMENT.md   — [Fresh/Stale]
  AGENTS.md             — [Fresh/Stale]
```

### Lint 覆盖率 gap 检测（来自 harness-improve Step 3）

```bash
SOURCE_DIRS=$(find . -maxdepth 2 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -name '.*' | sort)

for dir in $SOURCE_DIRS; do
  dir_name=$(basename "$dir")
  if ! grep -q "$dir_name" docs/ARCHITECTURE.md 2>/dev/null; then
    echo "UNCOVERED: $dir is not in layer mapping"
  fi
done
```

输出格式：
```
=== Lint Coverage Analysis ===
Covered directories: [count]/[total]
Uncovered directories:
  - [dir1] — Not in layer mapping
```

## 预期结果

- 插件从 3 个 skill 精简为 2 个：harness-analyze 和 harness-apply
- harness-analyze 承担原有分析 + 审计两个职责
- 所有文档中对 harness-improve 的引用被清除或更新
- 用户心智负担降低，工作流更清晰：analyze → apply
