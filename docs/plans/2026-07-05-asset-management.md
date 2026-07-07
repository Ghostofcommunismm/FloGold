# 资产管理系统实现计划

- **日期**: 2026-07-05
- **关联设计**: [2026-07-05-asset-management-design.md](./2026-07-05-asset-management-design.md)
- **执行方式**: 待用户选择（subagent-driven / manual）
- **测试框架**: Vitest（项目当前无测试框架，Task 1 搭建）

---

## 任务总览

| # | 任务 | 类型 | 预估 |
|---|------|------|------|
| 1 | 搭建 Vitest 测试环境 | 基础设施 | 3 min |
| 2 | 扩展 types.ts：Asset 接口 + AppData 字段 | 类型 | 2 min |
| 3 | 扩展 storage.ts：默认数据 + 迁移兼容 | 数据层 | 4 min |
| 4 | 折旧计算工具函数 + 测试 | TDD | 5 min |
| 5 | 资产分类映射工具 + 测试 | TDD | 3 min |
| 6 | 重构 BottomTabBar.vue 为双胶囊布局 | UI | 5 min |
| 7 | 新建 AssetSummaryCard.vue 总览卡 | UI | 5 min |
| 8 | 新建 AssetCard.vue 列表卡片 | UI | 4 min |
| 9 | 新建 AssetModal.vue 新增/编辑表单 | UI | 5 min |
| 10 | 新建 AssetDetailModal.vue 资产详情 | UI | 5 min |
| 11 | 新建 AssetTab.vue 资产主页 | UI 集成 | 5 min |
| 12 | App.vue 集成资产 Tab | 集成 | 3 min |
| 13 | 记账 Modal 加「记为资产」开关 + 字段 | UI | 5 min |
| 14 | saveTransaction 加资产联动保存逻辑 | TDD | 4 min |
| 15 | 端到端验证 + 打包 APK | 验收 | 5 min |

---

## Task 1: 搭建 Vitest 测试环境

**Goal**: 安装 vitest，配置 npm test 脚本，运行空测试通过

**Files**:
- `package.json`（修改 scripts，添加 devDependencies）
- `vitest.config.ts`（新建）

**Steps**:
1. 写测试 `src/__tests__/smoke.test.ts`：
   ```typescript
   import { describe, it, expect } from 'vitest'
   describe('smoke', () => {
     it('runs', () => { expect(1 + 1).toBe(2) })
   })
   ```
2. 运行 `npx vitest run` → 失败（无 vitest）
3. `npm install -D vitest @vue/test-utils jsdom`
4. 创建 `vitest.config.ts`：
   ```typescript
   import { defineConfig } from 'vitest/config'
   export default defineConfig({
     test: { environment: 'jsdom', globals: true }
   })
   ```
5. `package.json` scripts 加 `"test": "vitest run"`、`"test:watch": "vitest"`
6. 运行 `npm test` → 通过
7. commit

**Verify**: `npm test` 输出 1 passed

---

## Task 2: 扩展 types.ts

**Goal**: 新增 Asset 接口，扩展 AppData

**Files**: [src/types.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/types.ts)

**Steps**:
1. 在 Transaction 接口后新增 `Asset` 接口（字段见设计文档 §4.1）
2. 在 `AppData` 末尾新增 `assets: Asset[]`、`assetCategories: Category[]`、`nextAssetId: number`
3. `npx tsc --noEmit` 通过
4. commit

**Verify**: `npx tsc --noEmit` 无错误

**Note**: 类型定义无需单测，但需确保 storage.ts 后续合并默认值正确

---

## Task 3: 扩展 storage.ts

**Goal**: 默认数据加 assets 字段，loadData 迁移兼容

**Files**: [src/storage.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/storage.ts)

**Steps**:
1. 写测试 `src/__tests__/storage.test.ts`：
   ```typescript
   describe('loadData migration', () => {
     it('fills assets fields for old data without assets', () => {
       localStorage.setItem('light-ledger-data-v1', JSON.stringify({ nextId: 5 }))
       const data = loadData()
       expect(data.assets).toEqual([])
       expect(data.assetCategories.length).toBeGreaterThan(0)
       expect(data.nextAssetId).toBe(1)
     })
   })
   ```
2. `npm test` → 失败
3. 实现：
   - 新增 `defaultAssetCategories`（见设计文档 §4.3）
   - `getDefaultData()` 加 `assets: []`、`assetCategories: [...defaultAssetCategories]`、`nextAssetId: 1`
   - `loadData()` 合并逻辑加 `assets: parsed.assets ?? []`、`assetCategories: parsed.assetCategories ?? [...defaultAssetCategories]`、`nextAssetId: parsed.nextAssetId ?? 1`
4. `npm test` → 通过
5. commit

**Verify**: `npm test` storage 测试通过

---

## Task 4: 折旧计算工具 + 测试

**Goal**: 实现 `calculateCurrentValue(asset)` 直线折旧

**Files**:
- `src/asset-utils.ts`（新建）
- `src/__tests__/asset-utils.test.ts`（新建）

**Steps**:
1. 写测试（先 fail）：
   ```typescript
   describe('calculateCurrentValue', () => {
     it('manual type returns currentValue as-is', () => {
       const asset = { purchasePrice: 10000, currentValue: 8000, depreciationType: 'manual', purchaseDate: '2024-01-01' } as Asset
       expect(calculateCurrentValue(asset)).toBe(8000)
     })
     it('straight depreciation over 1 year', () => {
       // 购入 10000，残值 10%，年限 5 年，已用 1 年
       // 年折旧 = 10000 * 0.9 / 5 = 1800
       // 当前 = 10000 - 1800*1 = 8200
       const asset = { purchasePrice: 10000, currentValue: 10000, salvageRate: 0.1, usefulLife: 5, depreciationType: 'straight', purchaseDate: oneYearAgo } as Asset
       expect(calculateCurrentValue(asset)).toBeCloseTo(8200, -1)
     })
     it('straight never below salvage value', () => {
       // 已用 100 年，应等于残值 1000
       const asset = { purchasePrice: 10000, currentValue: 10000, salvageRate: 0.1, usefulLife: 5, depreciationType: 'straight', purchaseDate: '2000-01-01' } as Asset
       expect(calculateCurrentValue(asset)).toBe(1000)
     })
   })
   ```
2. `npm test` → 失败
3. 实现 `src/asset-utils.ts`：
   ```typescript
   export function calculateCurrentValue(asset: Asset): number {
     if (asset.depreciationType === 'manual') return asset.currentValue
     if (!asset.usefulLife || asset.usefulLife <= 0) return asset.currentValue
     const rate = asset.salvageRate ?? 0.1
     const yearsElapsed = (Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
     const annualDep = asset.purchasePrice * (1 - rate) / asset.usefulLife
     const depreciated = asset.purchasePrice - annualDep * yearsElapsed
     const salvage = asset.purchasePrice * rate
     return Math.max(depreciated, salvage)
   }
   ```
4. `npm test` → 通过
5. commit

**Verify**: 3 个折旧测试全过

---

## Task 5: 资产分类映射工具 + 测试

**Goal**: 实现 `mapTxCategoryToAssetCategory(txCategory: string): string`

**Files**:
- `src/asset-utils.ts`（追加）
- `src/__tests__/asset-utils.test.ts`（追加）

**Steps**:
1. 写测试：
   ```typescript
   describe('mapTxCategoryToAssetCategory', () => {
     it('maps 购物/数码 → 数码', () => {
       expect(mapTxCategoryToAssetCategory('购物', '数码')).toBe('数码')
     })
     it('maps 交通 → 交通工具', () => {
       expect(mapTxCategoryToAssetCategory('交通')).toBe('交通工具')
     })
     it('falls back to 其他', () => {
       expect(mapTxCategoryToAssetCategory('餐饮')).toBe('其他')
     })
   })
   ```
2. `npm test` → 失败
3. 实现映射表：
   ```typescript
   const TX_TO_ASSET_MAP: Record<string, string> = {
     '交通': '交通工具',
     '居家': '家具',
   }
   export function mapTxCategoryToAssetCategory(txCategory: string, subCategory?: string): string {
     if (subCategory === '数码') return '数码'
     return TX_TO_ASSET_MAP[txCategory] ?? '其他'
   }
   ```
4. `npm test` → 通过
5. commit

**Verify**: 映射测试通过

---

## Task 6: 重构 BottomTabBar.vue

**Goal**: 单胶囊 → 双胶囊 + 中间 + 按钮

**Files**: [src/components/BottomTabBar.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/components/BottomTabBar.vue)

**Steps**:
1. 模板重构：
   ```html
   <div class="bottom-bar">
     <LiquidGlass class="capsule left-capsule" ...>
       <div class="capsule-inner">
         <button class="tab-item" :class="{ active: modelValue === 'home' }" @click="$emit('update:modelValue', 'home')">首页</button>
         <button class="tab-item" :class="{ active: modelValue === 'stats' }" @click="$emit('update:modelValue', 'stats')">统计</button>
       </div>
     </LiquidGlass>
     <button class="add-btn" @click="ripple($event); $emit('add-click')">+</button>
     <LiquidGlass class="capsule right-capsule" ...>
       <div class="capsule-inner">
         <button class="tab-item" :class="{ active: modelValue === 'assets' }" @click="$emit('update:modelValue', 'assets')">资产</button>
         <button class="tab-item" :class="{ active: modelValue === 'profile' }" @click="$emit('update:modelValue', 'profile')">我的</button>
       </div>
     </LiquidGlass>
   </div>
   ```
2. 样式：
   - `.bottom-bar`：`display:flex; align-items:center; justify-content:center; gap: 12px; position:fixed; bottom:24px; left:0; right:0; z-index:100;`
   - `.add-btn`：直径 52px，沿用现有 accent 色 + pulse 动画
   - 左右胶囊宽度视觉对称
3. `npm run dev` → 浏览器查看布局
4. commit

**Verify**: 浏览器显示双胶囊对称布局，点击各 Tab 切换正常

---

## Task 7: AssetSummaryCard.vue

**Goal**: 顶部总览卡（总值 + 物品数 + 折旧后 + 迷你饼图）

**Files**: `src/components/AssetSummaryCard.vue`（新建）

**Props**: `assets: Asset[]`

**Steps**:
1. 模板：LiquidGlass 容器 + 标题「家庭总资产」+ 大字总值 + 副信息（物品数 / 折旧后值）+ SVG 饼图
2. 计算属性：
   - `totalPurchase` = sum(purchasePrice)
   - `totalCurrent` = sum(calculateCurrentValue(asset))
   - `byCategory` = Map<category, sum>
3. SVG 饼图：用 `<path>` 绘制各分类扇形，半径 60px
4. 样式沿用 BalanceCard.vue 的 Liquid Glass 风格
5. `npm run dev` 在 App.vue 临时挂载测试
6. commit

**Verify**: 总值数字正确，饼图渲染正常

---

## Task 8: AssetCard.vue

**Goal**: 单个资产卡片

**Files**: `src/components/AssetCard.vue`（新建）

**Props**: `asset: Asset`

**Emits**: `click`

**Steps**:
1. 模板：左侧 emoji + 右侧三行（名称型号 / 价格变化 / 分类位置归属）
2. 计算属性 `currentValue` = `calculateCurrentValue(asset)`
3. 价格显示：`¥{{purchasePrice}} → ¥{{currentValue}}`
4. 样式：圆角卡片，hover 微动
5. commit

**Verify**: 单卡片渲染正确

---

## Task 9: AssetModal.vue

**Goal**: 新增/编辑资产表单

**Files**: `src/components/AssetModal.vue`（新建）

**Props**: `show: boolean`, `asset?: Asset`（编辑时传入）, `assetCategories: Category[]`

**Emits**: `close`, `save(asset: Asset)`

**Steps**:
1. 模板：modal-overlay + modal-card
2. 字段：name, category（chip 选择）, purchasePrice, purchaseDate, brand, model, location, owner, channel, serialNumber, usefulLife, salvageRate, depreciationType, note
3. 折旧方式 toggle：straight → 显示 usefulLife + salvageRate；manual → 显示 currentValue 输入
4. 校验：name + purchasePrice 必填
5. 保存：构造 Asset 对象 emit save
6. commit

**Verify**: 表单可填写并提交

---

## Task 10: AssetDetailModal.vue

**Goal**: 资产详情查看

**Files**: `src/components/AssetDetailModal.vue`（新建）

**Props**: `show: boolean`, `asset: Asset | null`

**Emits**: `close`, `edit`, `delete`, `view-transaction(id: number)`

**Steps**:
1. 模板：顶部图标+名称+品牌型号 / 价值卡 / 信息组 / 时间线 / 关联交易按钮（v-if transactionId）/ 操作栏
2. 价值卡显示：购入价、当前估价、折旧金额、折旧率
3. 时间线：购入日 → 今天（已用 X 年）→ 备注
4. 关联交易按钮：emit `view-transaction`
5. commit

**Verify**: 详情显示完整

---

## Task 11: AssetTab.vue

**Goal**: 资产主页（总览卡 + 筛选 + 列表 + 弹窗集成）

**Files**: `src/components/AssetTab.vue`（新建）

**Props**: `assets: Asset[]`, `assetCategories: Category[]`, `transactions: Transaction[]`

**Emits**: `save-asset`, `delete-asset`, `view-transaction`

**Steps**:
1. 模板：滚动容器 → AssetSummaryCard → 筛选条（横向 chip + 排序下拉）→ AssetCard 列表 → 空状态
2. 状态：`filterCategory`（默认'全部'）、`sortBy`（'value' | 'date' | 'location'）
3. 计算属性 `filteredAssets`：按 filterCategory 过滤 + sortBy 排序
4. 右下角浮动 + 按钮 → 打开 AssetModal（新增）
5. 点击卡片 → 打开 AssetDetailModal
6. 详情→编辑 → 打开 AssetModal（编辑）
7. commit

**Verify**: 筛选/排序/增删改流程跑通

---

## Task 12: App.vue 集成资产 Tab

**Goal**: 在 App.vue 渲染 AssetTab

**Files**: [src/App.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/App.vue)

**Steps**:
1. import AssetTab
2. 在统计页和我的页之间插入：
   ```html
   <AssetTab
     v-if="activeTab === 'assets'"
     :assets="assets"
     :assetCategories="assetCategories"
     :transactions="transactions"
     @save-asset="saveAsset"
     @delete-asset="deleteAsset"
     @view-transaction="viewTransaction"
   />
   ```
3. 新增响应式 `const assets = computed(() => appData.value.assets)`
4. 新增 `saveAsset` / `deleteAsset` / `viewTransaction` 函数
5. `npm run dev` 切换到资产 Tab 验证
6. commit

**Verify**: 资产 Tab 可切换、数据可见

---

## Task 13: 记账 Modal 加「记为资产」开关

**Goal**: App.vue 内联 modal 加开关 + 展开字段

**Files**: [src/App.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/App.vue)

**Steps**:
1. `form` 加字段：`asAsset: boolean`, `assetCategory: string`, `assetLocation: string`, `assetOwner: string`, `assetUsefulLife: number`, `assetSalvageRate: number`
2. 在备注输入下方加开关 UI（仅 `form.type === 'expense'` 时显示）：
   ```html
   <div v-if="form.type === 'expense'" class="asset-toggle-row">
     <label>记为资产</label>
     <button class="toggle" :class="{ on: form.asAsset }" @click="form.asAsset = !form.asAsset" type="button">
       <span class="toggle-knob"></span>
     </button>
   </div>
   <div v-if="form.asAsset" class="asset-fields">
     <!-- 资产分类 chip / 位置 / 归属人 / 使用年限 / 残值率 -->
   </div>
   ```
3. `openAddModal` / `onQuickLogPick` 中重置 `form.asAsset = false`
4. 样式：toggle 开关 + 折叠展开动画
5. commit

**Verify**: 开关切换正常，字段展开收起

---

## Task 14: saveTransaction 联动保存逻辑

**Goal**: 开启「记为资产」时同时保存 Asset

**Files**:
- [src/App.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/App.vue)
- `src/__tests__/asset-link.test.ts`（新建，测纯函数）

**Steps**:
1. 抽出纯函数 `buildAssetFromTransaction(tx, form)` 到 `src/asset-utils.ts`
2. 写测试：
   ```typescript
   describe('buildAssetFromTransaction', () => {
     it('builds asset with transactionId', () => {
       const tx = { id: 42, name: '相机', amount: 8000, date: '2026-07-05', category: '购物', icon: '📷' } as Transaction
       const form = { asAsset: true, assetCategory: '数码', assetLocation: '客厅', assetOwner: '爸爸', assetUsefulLife: 5, assetSalvageRate: 0.1 } as any
       const asset = buildAssetFromTransaction(tx, form)
       expect(asset.transactionId).toBe(42)
       expect(asset.purchasePrice).toBe(8000)
       expect(asset.category).toBe('数码')
       expect(asset.depreciationType).toBe('straight')
     })
   })
   ```
3. `npm test` → 失败
4. 实现 `buildAssetFromTransaction`
5. `saveTransaction` 末尾加：
   ```typescript
   if (form.asAsset && form.type === 'expense') {
     const asset = buildAssetFromTransaction(tx, form)
     asset.id = appData.value.nextAssetId++
     assets.value.push(asset)
   }
   ```
6. `npm test` → 通过
7. commit

**Verify**: 测试通过 + 手动验证联动

---

## Task 15: 端到端验证 + 打包 APK

**Goal**: 全流程跑通 + 生成可安装 APK

**Steps**:
1. `npm test` 全部通过
2. `npm run build` 无错误
3. `npx cap sync android`
4. Android Studio Build → Build APK
5. 手动测试：
   - 切换到资产 Tab 看到空状态/默认数据
   - 资产页 + 按钮新增资产
   - 记账时勾选「记为资产」→ 验证资产列表新增
   - 资产详情查看关联交易
   - 折旧计算正确（购入 1 年的相机 8000/5年/10%残值 → 6560）
6. APK 复制到 `轻记账-debug.apk`
7. commit + tag `v1.1.0-assets`

**Verify**: APK 在模拟器或真机运行，资产管理功能完整可用

---

## 执行模式选择

完成 Plan 后，请选择执行方式：

**A. Subagent-Driven（推荐）**
- 当前会话中由我调度 sessions_spawn 子代理
- 每个任务：implementer 子代理实现 → spec-reviewer 子代理对规格 → code-quality reviewer 子代理审质量 → 修复 → 下一任务
- 全部完成后总 review → 进入 Phase 5 Finishing

**B. Manual**
- 你自己按计划执行
- 我提供每个任务的详细 prompt 模板供你复制
- 完成后可召唤我 review
