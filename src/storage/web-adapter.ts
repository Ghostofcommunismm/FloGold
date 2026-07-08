// ============================================================
// Web Adapter —— 用 localStorage 做持久化
//
// 用途：浏览器开发模式（npm run dev / vite preview）
// - 用一个总 key（STORAGE_KEY）存整份 snapshot
// - 简单粗暴，零依赖
// - 仅供开发/调试用；APK 上会切到 SQLite Adapter
//
// 注意：
// - 这里是同步实现但暴露 async API，便于上层统一用 await
// - 与 SQLite adapter 对外契约完全一致
// ============================================================

import type {
  Transaction,
  Asset,
  RecurringItem,
} from '../types'
import type {
  AppDataSnapshot,
  ListTxOpts,
  StorageAdapter,
  KVKey,
} from './types'
import { getDefaultSnapshot } from './defaults'

/** 老的 JSON 大 key，兼容历史数据 */
export const STORAGE_KEY = 'light-ledger-data-v1'

/** 读取 localStorage 的 JSON 值；解析失败返回 null */
function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('[storage/web] write failed', key, e)
  }
}

/**
 * 把旧的"全量 JSON"格式（AppData 顶层 nextId 等字段直接挂在根上）
 * 转成新的 AppDataSnapshot 格式。用于兼容 v1 数据。
 */
function legacyToSnapshot(raw: Record<string, unknown>): AppDataSnapshot {
  const defaults = getDefaultSnapshot()
  return {
    transactions: (raw.transactions as Transaction[]) ?? defaults.transactions,
    categories: (raw.categories as any) ?? defaults.categories,
    subCategories: (raw.subCategories as any) ?? defaults.subCategories,
    budget: (raw.budget as any) ?? defaults.budget,
    recurring: (raw.recurring as RecurringItem[]) ?? defaults.recurring,
    reminder: (raw.reminder as any) ?? defaults.reminder,
    uiSettings: (raw.uiSettings as any) ?? defaults.uiSettings,
    assets: (raw.assets as Asset[]) ?? defaults.assets,
    assetCategories: (raw.assetCategories as any) ?? defaults.assetCategories,
    nextId: (raw.nextId as number) ?? defaults.nextId,
    nextRecurringId: (raw.nextRecurringId as number) ?? defaults.nextRecurringId,
    nextAssetId: (raw.nextAssetId as number) ?? defaults.nextAssetId,
  }
}

/**
 * 把当前 snapshot 写回老的"全量 JSON"格式，
 * 让那些还在用 STORAGE_KEY 直接读写的旧代码（如果有）能继续工作。
 */
function snapshotToLegacy(snap: AppDataSnapshot): Record<string, unknown> {
  return { ...snap }
}

export const webAdapter: StorageAdapter = {
  async init() {
    // 首次启动灌默认数据
    const existing = readJSON<Record<string, unknown>>(STORAGE_KEY)
    if (!existing) {
      writeJSON(STORAGE_KEY, snapshotToLegacy(getDefaultSnapshot()))
    }
  },

  async exportAll(): Promise<AppDataSnapshot> {
    const raw = readJSON<Record<string, unknown>>(STORAGE_KEY)
    if (!raw) {
      const defaults = getDefaultSnapshot()
      writeJSON(STORAGE_KEY, snapshotToLegacy(defaults))
      return defaults
    }
    return legacyToSnapshot(raw)
  },

  async importAll(snapshot: AppDataSnapshot): Promise<void> {
    writeJSON(STORAGE_KEY, snapshotToLegacy(snapshot))
  },

  // ----- 事务 -----

  async listTransactions(opts: ListTxOpts = {}): Promise<Transaction[]> {
    const snap = await this.exportAll()
    let list = [...snap.transactions]
    if (opts.startDate) list = list.filter(t => t.date >= opts.startDate!)
    if (opts.endDate) list = list.filter(t => t.date <= opts.endDate!)
    if (opts.category) list = list.filter(t => t.category === opts.category)
    if (opts.type) list = list.filter(t => t.type === opts.type)
    list.sort((a, b) => b.id - a.id)
    if (opts.limit && opts.limit > 0) list = list.slice(0, opts.limit)
    return list
  },

  async insertTransaction(tx: Transaction): Promise<void> {
    const snap = await this.exportAll()
    snap.transactions.push(tx)
    if (tx.id >= snap.nextId) snap.nextId = tx.id + 1
    await this.importAll(snap)
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const snap = await this.exportAll()
    const i = snap.transactions.findIndex(t => t.id === tx.id)
    if (i >= 0) snap.transactions[i] = tx
    await this.importAll(snap)
  },

  async deleteTransaction(id: number): Promise<void> {
    const snap = await this.exportAll()
    snap.transactions = snap.transactions.filter(t => t.id !== id)
    await this.importAll(snap)
  },

  // ----- 资产 -----

  async listAssets(): Promise<Asset[]> {
    const snap = await this.exportAll()
    return [...snap.assets]
  },

  async insertAsset(asset: Asset): Promise<void> {
    const snap = await this.exportAll()
    snap.assets.push(asset)
    if (asset.id >= snap.nextAssetId) snap.nextAssetId = asset.id + 1
    await this.importAll(snap)
  },

  async updateAsset(asset: Asset): Promise<void> {
    const snap = await this.exportAll()
    const i = snap.assets.findIndex(a => a.id === asset.id)
    if (i >= 0) snap.assets[i] = asset
    await this.importAll(snap)
  },

  async deleteAsset(id: number): Promise<void> {
    const snap = await this.exportAll()
    snap.assets = snap.assets.filter(a => a.id !== id)
    await this.importAll(snap)
  },

  // ----- 周期记账 -----

  async listRecurring(): Promise<RecurringItem[]> {
    const snap = await this.exportAll()
    return [...snap.recurring]
  },

  async upsertRecurring(item: RecurringItem): Promise<void> {
    const snap = await this.exportAll()
    const i = snap.recurring.findIndex(r => r.id === item.id)
    if (i >= 0) snap.recurring[i] = item
    else {
      snap.recurring.push(item)
      if (item.id >= snap.nextRecurringId) snap.nextRecurringId = item.id + 1
    }
    await this.importAll(snap)
  },

  async deleteRecurring(id: number): Promise<void> {
    const snap = await this.exportAll()
    snap.recurring = snap.recurring.filter(r => r.id !== id)
    await this.importAll(snap)
  },

  // ----- 通用 KV -----

  async getKV<T>(key: KVKey): Promise<T | null> {
    const snap = await this.exportAll()
    switch (key) {
      case 'categories': return snap.categories as unknown as T
      case 'subCategories': return snap.subCategories as unknown as T
      case 'budget': return snap.budget as unknown as T
      case 'reminder': return snap.reminder as unknown as T
      case 'uiSettings': return snap.uiSettings as unknown as T
      case 'nextId': return snap.nextId as unknown as T
      case 'nextRecurringId': return snap.nextRecurringId as unknown as T
      case 'nextAssetId': return snap.nextAssetId as unknown as T
      case 'meta.lastExportAt': return null
    }
  },

  async setKV<T>(key: KVKey, value: T): Promise<void> {
    const snap = await this.exportAll()
    switch (key) {
      case 'categories': snap.categories = value as any; break
      case 'subCategories': snap.subCategories = value as any; break
      case 'budget': snap.budget = value as any; break
      case 'reminder': snap.reminder = value as any; break
      case 'uiSettings': snap.uiSettings = value as any; break
      case 'nextId': snap.nextId = value as number; break
      case 'nextRecurringId': snap.nextRecurringId = value as number; break
      case 'nextAssetId': snap.nextAssetId = value as number; break
      case 'meta.lastExportAt':
        // 仅元信息，无需持久化到 snapshot
        return
    }
    await this.importAll(snap)
  },
}