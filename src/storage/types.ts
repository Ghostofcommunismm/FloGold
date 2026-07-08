// ============================================================
// 存储层抽象接口
//
// 设计要点：
// 1. 全异步（即便 localStorage 是同步）—— 统一对外契约，
//    让上层不需要区分 web / native。
// 2. "数据"和"配置"分两层：
//    - 数据层（transactions / assets / recurring / categories）：
//      SQLite（native）或 JSON in localStorage（web）
//    - 配置层（nextId / nextRecurringId / uiSettings 等小键值）：
//      Capacitor Preferences（native）或 localStorage（web）
//    配置层不强求走 SQL，单 key 读写走 KV 更省事。
// 3. exportAll / importAll 提供"整块读写"能力，
//    用于：首次启动灌默认数据、备份/恢复、跨设备迁移。
// 4. Adapter 实现必须保证 init() 幂等，可重复调用。
// ============================================================

import type {
  Transaction,
  Asset,
  Category,
  SubCategories,
  Budget,
  RecurringItem,
  ReminderSettings,
  UISettings,
} from '../types'

/** 整块应用数据的快照（用于备份/恢复/默认数据） */
export interface AppDataSnapshot {
  transactions: Transaction[]
  categories: Category[]
  subCategories: SubCategories
  budget: Budget
  recurring: RecurringItem[]
  reminder: ReminderSettings
  uiSettings: UISettings
  assets: Asset[]
  assetCategories: Category[]
  /** 自增主键游标（事务/资产/周期记账各自的 next id） */
  nextId: number
  nextRecurringId: number
  nextAssetId: number
}

/** 事务查询参数 */
export interface ListTxOpts {
  /** 按日期范围 [start, end]，闭区间，YYYY-MM-DD */
  startDate?: string
  endDate?: string
  /** 按分类精确匹配 */
  category?: string
  /** 按类型过滤 */
  type?: 'income' | 'expense'
  /** 限制返回条数（按 id 倒序） */
  limit?: number
}

/** Adapter 抽象接口 */
export interface StorageAdapter {
  /** 初始化（建表/打开连接）。幂等。 */
  init(): Promise<void>

  /** 读出整块应用数据（用于启动时加载 / 备份） */
  exportAll(): Promise<AppDataSnapshot>

  /** 灌入整块应用数据（用于首次启动 / 恢复备份）。会覆盖现有。 */
  importAll(snapshot: AppDataSnapshot): Promise<void>

  // ---------- 事务 ----------
  listTransactions(opts?: ListTxOpts): Promise<Transaction[]>
  insertTransaction(tx: Transaction): Promise<void>
  updateTransaction(tx: Transaction): Promise<void>
  deleteTransaction(id: number): Promise<void>

  // ---------- 资产 ----------
  listAssets(): Promise<Asset[]>
  insertAsset(asset: Asset): Promise<void>
  updateAsset(asset: Asset): Promise<void>
  deleteAsset(id: number): Promise<void>

  // ---------- 周期记账 ----------
  listRecurring(): Promise<RecurringItem[]>
  upsertRecurring(item: RecurringItem): Promise<void>
  deleteRecurring(id: number): Promise<void>

  // ---------- 通用 KV（预算/提醒/分类/主题等小配置） ----------
  /** 读取指定 key 的 JSON 值；不存在时返回 null */
  getKV<T>(key: KVKey): Promise<T | null>
  /** 写入指定 key 的 JSON 值 */
  setKV<T>(key: KVKey, value: T): Promise<void>
}

/** KV 命名空间 key —— 加前缀避免和 SQLite 表名撞 */
export type KVKey =
  | 'categories'
  | 'subCategories'
  | 'budget'
  | 'reminder'
  | 'uiSettings'
  | 'nextId'
  | 'nextRecurringId'
  | 'nextAssetId'
  | 'meta.lastExportAt'