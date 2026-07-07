# 资产管理系统设计文档

- **日期**: 2026-07-05
- **状态**: 已批准（待实施）
- **范围**: 在「轻记账」App 中新增家庭实物资产管理系统

---

## 一、背景与目标

### 1.1 用户需求
记录家庭重要物品的价格、折旧、归属等信息（如相机 ¥8000、汽车 ¥120000），便于掌握家庭实物资产状况。

### 1.2 市场参考
| 软件 | 借鉴点 |
|------|--------|
| 随手记 | 资产账户化管理、折旧概念、分类清晰 |
| 家财通（金蝶） | 物品位置/归属人/票据图片、家庭物品清单 |
| 支付宝-我的资产 | 卡片式资产列表、总值醒目展示、分类饼图 |
| Notion 家财模板 | 时间线视图、按房间/位置组织、可附图 |

### 1.3 设计原则
- 卡片化列表 + 顶部总值概览 + 分类筛选 + 详情时间线 + 图片附件
- 延续现有 Liquid Glass 视觉风格
- 数据本地存储，与现有记账数据共存
- 记账与资产联动，避免重复录入

---

## 二、入口与导航

### 2.1 入口位置
新增底部 Tab「资产」，与首页/统计/我的并列。

### 2.2 底部 Tab 布局（方案 B：+ 按钮居中）

重构 [BottomTabBar.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/components/BottomTabBar.vue)，由单胶囊改为「双胶囊 + 中间独立 + 按钮」结构：

```
┌─────────────┐       ┌─────────────┐
│ 首页 │ 统计 │  (＋)  │ 资产 │ 我的 │
└─────────────┘       └─────────────┘
   左胶囊           实色圆按钮        右胶囊
```

- 左胶囊（LiquidGlass）：首页、统计
- 右胶囊（LiquidGlass）：资产、我的
- 中间 + 按钮：实色圆形（accent 色），略大于现有 + 按钮，带光晕脉冲动画
- 三元素水平居中排列，固定底部 24px

### 2.3 视觉细节
- 左右胶囊宽度一致（对称美）
- 中间 + 按钮直径约 52px，比胶囊高度大 8px，视觉突出
- + 按钮带 `addPulse` 光晕动画（沿用现有 keyframes）
- 点击 + 按钮仍触发 `add-click` 事件，弹出现有记账 Modal

---

## 三、资产页结构

### 3.1 整体布局

```
┌─────────────────────────────────┐
│  资产总览卡 (Liquid Glass)        │
│  ┌───────────────────────────┐  │
│  │  家庭总资产                 │  │
│  │  ¥ 158,420                 │  │
│  │  ┌──────┬──────┐          │  │
│  │  │物品数 │折旧后 │          │  │
│  │  │  23  │¥132k│          │  │
│  │  └──────┴──────┘          │  │
│  │  [饼图: 各分类占比]         │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  筛选条: [全部] 数码 家电 交通…  │
│         排序: 价值↓ 日期↓ 位置  │
├─────────────────────────────────┤
│  资产列表 (卡片)                 │
│  ┌───────────────────────────┐  │
│  │ [📷] 相机 Sony A7M4        │  │
│  │      ¥8000 → ¥6400         │  │
│  │      数码 · 客厅 · 爸爸     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [🚗] 汽车 特斯拉 Model 3   │  │
│  │      ¥280000 → ¥210000     │  │
│  │      交通 · 车库 · 家庭共用 │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 3.2 资产总览卡 (AssetSummaryCard.vue)
- 顶部大字显示「家庭总资产 ¥xxx」
- 副信息：物品数、折旧后总值
- 底部迷你饼图：按分类显示价值占比
- 沿用 BalanceCard 的 Liquid Glass 容器风格

### 3.3 筛选与排序条
- 分类筛选：横向滚动 chip（全部/数码/家电/交通工具/家具/珠宝/收藏品/其他）
- 排序：下拉切换（价值降序/购入日期降序/位置分组）

### 3.4 资产卡片 (AssetCard.vue)
- 左侧大 emoji 图标
- 右侧上行：物品名 + 品牌型号
- 右侧中行：`¥8000 → ¥6400`（购入价 → 当前估价）
- 右侧下行：分类 · 位置 · 归属人
- 点击打开 AssetDetailModal

### 3.5 资产详情 (AssetDetailModal.vue)
- 顶部：物品大图 + 名称 + 品牌/型号
- 价值卡：购入价、当前估价、折旧金额、折旧率
- 信息组：分类、位置、归属人、购入日期、购入渠道、序列号
- 时间线：购入 → 折旧节点 → 备注
- 图片附件区：物品照片、发票/凭证
- 关联交易：若 `transactionId` 存在，显示「查看关联交易」按钮
- 操作栏：编辑、删除

### 3.6 新增/编辑资产 (AssetModal.vue)
- 资产页内点击 + 按钮（新增专用 + 按钮，区别于底部 + 按钮）
- 表单字段见数据模型
- 折旧字段：使用年限 + 残值率（默认 10%）+ 折旧方式（直线/手动）

---

## 四、数据模型

### 4.1 Asset 接口

新增到 [src/types.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/types.ts)：

```typescript
export interface Asset {
  id: number
  name: string                    // 物品名
  category: string                // 数码/家电/家具/交通工具/珠宝/收藏品/其他
  icon: string                    // emoji
  purchasePrice: number           // 购入价
  purchaseDate: string            // YYYY-MM-DD
  currentValue: number            // 当前估价（自动算 or 手动）

  // 物品详情
  brand?: string                  // 品牌
  model?: string                  // 型号
  serialNumber?: string           // 序列号
  location?: string               // 存放位置
  owner?: string                  // 归属人
  channel?: string                // 购买渠道

  // 折旧与估价
  usefulLife?: number             // 使用年限（年）
  salvageRate?: number            // 残值率（默认 0.1）
  depreciationType?: 'straight' | 'manual'

  // 图片与备注
  photo?: string                  // 物品照片 base64
  receiptPhoto?: string           // 发票照片 base64
  note?: string                   // 备注

  // 联动
  transactionId?: number          // 关联交易 ID
  createdAt: string
  updatedAt: string
}
```

### 4.2 AppData 扩展

```typescript
export interface AppData {
  // 现有字段...
  transactions: Transaction[]
  categories: Category[]
  subCategories: SubCategories
  budget: Budget
  recurring: RecurringItem[]
  reminder: ReminderSettings
  uiSettings: UISettings
  nextId: number
  nextRecurringId: number

  // 新增
  assets: Asset[]
  assetCategories: Category[]     // 资产分类（独立于支出分类）
  nextAssetId: number
}
```

### 4.3 默认资产分类

```typescript
const defaultAssetCategories: Category[] = [
  { name: '数码', icon: '📷' },
  { name: '家电', icon: '📺' },
  { name: '家具', icon: '🛋️' },
  { name: '交通工具', icon: '🚗' },
  { name: '珠宝', icon: '💎' },
  { name: '收藏品', icon: '🏺' },
  { name: '其他', icon: '📦' },
]
```

### 4.4 折旧计算（直线法）

```
年折旧 = 购入价 × (1 - 残值率) / 使用年限
已用年数 = (今天 - 购入日) / 365
当前估价 = max(购入价 - 年折旧 × 已用年数, 购入价 × 残值率)
```

- `depreciationType = 'straight'`：自动计算 currentValue
- `depreciationType = 'manual'`：直接使用用户输入的 currentValue

---

## 五、记账联动

### 5.1 入口
在新增记账 Modal（非 QuickLog）中，金额输入下方新增「记为资产」开关。

### 5.2 UI 设计

```
┌─────────────────────────────┐
│  金额: [        8000      ] │
│  分类: 数码 > 相机           │
│  ─────────────────────────  │
│  记为资产  ( ●━━ )          │  ← 开关打开
│  ┌─ 资产字段（展开） ─────┐ │
│  │ 资产分类: [数码]       │ │
│  │ 存放位置: [客厅]       │ │
│  │ 归属人:   [爸爸 ▼]     │ │
│  │ 使用年限: [5] 年       │ │
│  │ 残值率:   [10] %       │ │
│  │ 拍照:     [📷 添加]    │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

### 5.3 保存逻辑
1. 先保存 Transaction（沿用现有逻辑，获得交易 ID）
2. 若开关开启，构造 Asset 对象：
   - `name` = 交易名称
   - `purchasePrice` = 交易金额
   - `purchaseDate` = 交易日期
   - `category` = 资产分类（默认从交易 category 映射，用户可改）
   - `icon` = 交易 icon
   - `transactionId` = 刚保存的交易 ID
   - 其他字段从展开区域读取
3. push 到 `assets[]`，`nextAssetId++`
4. 一次性 `saveData()`

### 5.4 反向查看
资产详情页若 `transactionId` 存在，显示「查看关联交易」按钮，点击跳转或弹窗显示原交易。

---

## 六、文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| [src/types.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/types.ts) | 修改 | 新增 `Asset` 接口，扩展 `AppData` |
| [src/storage.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/storage.ts) | 修改 | 默认数据新增 `assets`/`assetCategories`/`nextAssetId`，迁移兼容 |
| [src/components/BottomTabBar.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/components/BottomTabBar.vue) | 重构 | 单胶囊 → 双胶囊 + 中间 + 按钮 |
| src/components/AssetTab.vue | 新建 | 资产主页（总览卡 + 筛选 + 列表） |
| src/components/AssetSummaryCard.vue | 新建 | 顶部总览卡 + 饼图 |
| src/components/AssetCard.vue | 新建 | 资产列表卡片 |
| src/components/AssetModal.vue | 新建 | 新增/编辑资产 |
| src/components/AssetDetailModal.vue | 新建 | 资产详情 |
| [src/App.vue](file:///c:/Users/30635/CodeBuddy/20260622143258/src/App.vue) | 修改 | 新增 `activeTab='assets'` 分支，集成资产管理 |
| 记账 Modal（待确认文件名） | 修改 | 新增「记为资产」开关与字段 |

---

## 七、约束与原则

- **本地存储**：所有数据存于 localStorage，不联网
- **Android 返回键**：先关闭打开的 Modal，再退出 App（沿用现有逻辑）
- **自定义 Modal**：使用 Vue 自定义 Modal，不用原生 Android Dialog
- **YAGNI**：本期不实现金融资产、负债、多用户同步、云端备份
- **DRY**：折旧计算、日期工具复用 [src/storage.ts](file:///c:/Users/30635/CodeBuddy/20260622143258/src/storage.ts) 中已有函数
- **TDD**：每个任务先写测试再实现

---

## 八、待确认事项

1. 记账 Modal 的具体文件名（QuickLog.vue 还是其他？需在 Plan 阶段确认）
2. 饼图实现方式（SVG 自绘 vs 引入库，倾向 SVG 自绘保持轻量）
3. 图片存储：base64 直接存 localStorage（简单但可能撑爆存储，需限制单图 < 200KB）

---

## 九、下一步

进入 Phase 2: Writing Plans，生成任务级实现计划 `docs/plans/2026-07-05-asset-management.md`。
