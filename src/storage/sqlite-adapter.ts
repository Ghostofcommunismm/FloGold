// ============================================================
// SQLite Adapter —— APK 生产环境用
//
// 底层使用 @capacitor-community/sqlite + Capacitor Preferences：
// - 大表（transactions / assets / recurring）走 SQLite，支持索引查询
// - 小配置（categories / subCategories / budget / reminder / uiSettings）
//   走 Capacitor Preferences（KV），避免一次性加载全部子分类
//
// 启动流程（init）：
//   1. 初始化 sqlite connection（如未存在）
//   2. CREATE TABLE IF NOT EXISTS 三张大表 + 索引
//   3. 检查 KV：若 uiSettings 为空，说明首次启动，灌入默认 snapshot
//
// 注意：
// - 本文件只通过 dynamic import 加载（见 storage/index.ts），
//   在 web 构建里完全不会进 bundle
// - 所有日期都按 ISO YYYY-MM-DD 存，字符串比较和字典序一致
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
import type {
  AppDataSnapshot,
  ListTxOpts,
  StorageAdapter,
  KVKey,
} from './types'
import { getDefaultSnapshot } from './defaults'

const DB_NAME = 'light_ledger'
const DB_VERSION = 1

// 动态导入 sqlite 包，避免 web 打包
async function loadSqlite() {
  const mod = await import('@capacitor-community/sqlite')
  const { Preferences } = await import('@capacitor/preferences')
  return { SQLiteConnection: mod.SQLiteConnection, CapacitorSQLite: mod.CapacitorSQLite, Preferences }
}

let _conn: any = null
let _Preferences: any = null

async function getConn() {
  if (_conn) return _conn
  const { SQLiteConnection, CapacitorSQLite, Preferences } = await loadSqlite()
  _Preferences = Preferences
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  // encrypted=false, mode=no-encryption, version, readonly=false
  _conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
  await _conn.open()
  await ensureSchema(_conn)
  return _conn
}

async function ensureSchema(db: any) {
  // 三张主表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      name TEXT NOT NULL,
      icon TEXT,
      tag TEXT,
      merchant TEXT,
      location TEXT,
      account_id INTEGER,
      asset_id INTEGER,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_date_type ON transactions(date, type);`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);`)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT,
      purchase_price REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      current_value REAL NOT NULL,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      location TEXT,
      owner TEXT,
      channel TEXT,
      useful_life INTEGER,
      salvage_rate REAL,
      depreciation_type TEXT,
      status TEXT,
      photo TEXT,
      receipt_photo TEXT,
      note TEXT,
      transaction_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);`)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      icon TEXT,
      frequency TEXT NOT NULL,
      day_of_week INTEGER,
      day_of_month INTEGER,
      last_triggered TEXT,
      enabled INTEGER NOT NULL DEFAULT 1
    );
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recurring_enabled ON recurring(enabled);`)
}

// ---------- 行 ↔ 对象映射 ----------

function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: row.date,
    category: row.category,
    subCategory: row.sub_category ?? undefined,
    name: row.name,
    icon: row.icon ?? '',
    tag: row.tag ?? '',
    merchant: row.merchant ?? undefined,
    location: row.location ?? undefined,
    accountId: row.account_id ?? undefined,
    assetId: row.asset_id ?? undefined,
    note: row.note ?? undefined,
  } as Transaction
}

function rowToAsset(row: any): Asset {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon ?? '',
    purchasePrice: row.purchase_price,
    purchaseDate: row.purchase_date,
    currentValue: row.current_value,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    serialNumber: row.serial_number ?? undefined,
    location: row.location ?? undefined,
    owner: row.owner ?? undefined,
    channel: row.channel ?? undefined,
    usefulLife: row.useful_life ?? undefined,
    salvageRate: row.salvage_rate ?? undefined,
    depreciationType: row.depreciation_type ?? undefined,
    status: row.status ?? undefined,
    photo: row.photo ?? undefined,
    receiptPhoto: row.receipt_photo ?? undefined,
    note: row.note ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Asset
}

function rowToRecurring(row: any): RecurringItem {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    type: row.type,
    category: row.category,
    subCategory: row.sub_category ?? undefined,
    icon: row.icon ?? '',
    frequency: row.frequency,
    dayOfWeek: row.day_of_week ?? undefined,
    dayOfMonth: row.day_of_month ?? undefined,
    lastTriggered: row.last_triggered ?? undefined,
    enabled: row.enabled === 1,
  } as RecurringItem
}

// ---------- Preferences KV 助手 ----------

const KV_PREFIX = 'll:'

async function kvGet<T>(key: string): Promise<T | null> {
  const { value } = await _Preferences.get({ key: KV_PREFIX + key })
  if (value === null || value === undefined) return null
  try { return JSON.parse(value) as T } catch { return null }
}

async function kvSet<T>(key: string, value: T): Promise<void> {
  await _Preferences.set({ key: KV_PREFIX + key, value: JSON.stringify(value) })
}

// ---------- 默认 snapshot 灌入 ----------

async function seedIfEmpty(db: any): Promise<void> {
  const { values } = await db.query('SELECT COUNT(*) AS c FROM transactions')
  const count = values?.[0]?.c ?? 0
  if (count > 0) return
  const snap = getDefaultSnapshot()
  await importAllToDb(db, snap)
}

// ---------- 把 snapshot 灌到三张主表 + Preferences ----------

async function importAllToDb(db: any, snap: AppDataSnapshot): Promise<void> {
  // 清空三张主表
  await db.execute('DELETE FROM transactions')
  await db.execute('DELETE FROM assets')
  await db.execute('DELETE FROM recurring')

  // 事务批量插入
  for (const tx of snap.transactions) {
    await insertTxStmt(db, tx)
  }
  for (const a of snap.assets) {
    await insertAssetStmt(db, a)
  }
  for (const r of snap.recurring) {
    await insertRecurringStmt(db, r)
  }

  // 通用 KV
  await kvSet('categories', snap.categories)
  await kvSet('subCategories', snap.subCategories)
  await kvSet('budget', snap.budget)
  await kvSet('reminder', snap.reminder)
  await kvSet('uiSettings', snap.uiSettings)
  await kvSet('nextId', snap.nextId)
  await kvSet('nextRecurringId', snap.nextRecurringId)
  await kvSet('nextAssetId', snap.nextAssetId)
}

async function insertTxStmt(db: any, tx: Transaction): Promise<void> {
  await db.run(
    `INSERT INTO transactions
       (id, type, amount, date, category, sub_category, name, icon, tag, merchant, location, account_id, asset_id, note, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now','localtime'), datetime('now','localtime'))`,
    [
      tx.id, tx.type, tx.amount, tx.date, tx.category,
      tx.subCategory ?? null, tx.name, tx.icon ?? null, tx.tag ?? null,
      tx.merchant ?? null, tx.location ?? null,
      (tx as any).accountId ?? null, (tx as any).assetId ?? null,
      tx.note ?? null,
    ],
  )
}

async function insertAssetStmt(db: any, a: Asset): Promise<void> {
  await db.run(
    `INSERT INTO assets
       (id, name, category, icon, purchase_price, purchase_date, current_value,
        brand, model, serial_number, location, owner, channel,
        useful_life, salvage_rate, depreciation_type, status,
        photo, receipt_photo, note, transaction_id, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      a.id, a.name, a.category, a.icon ?? null,
      a.purchasePrice, a.purchaseDate, a.currentValue,
      a.brand ?? null, a.model ?? null, a.serialNumber ?? null,
      a.location ?? null, a.owner ?? null, a.channel ?? null,
      a.usefulLife ?? null, a.salvageRate ?? null,
      a.depreciationType ?? null, a.status ?? null,
      a.photo ?? null, a.receiptPhoto ?? null,
      a.note ?? null, a.transactionId ?? null,
      a.createdAt, a.updatedAt,
    ],
  )
}

async function insertRecurringStmt(db: any, r: RecurringItem): Promise<void> {
  await db.run(
    `INSERT INTO recurring
       (id, name, amount, type, category, sub_category, icon,
        frequency, day_of_week, day_of_month, last_triggered, enabled)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      r.id, r.name, r.amount, r.type, r.category,
      r.subCategory ?? null, r.icon ?? null,
      r.frequency, r.dayOfWeek ?? null, r.dayOfMonth ?? null,
      r.lastTriggered ?? null, r.enabled ? 1 : 0,
    ],
  )
}

// ---------- Adapter 实现 ----------

export const sqliteAdapter: StorageAdapter = {
  async init() {
    const db = await getConn()
    await seedIfEmpty(db)
  },

  async exportAll(): Promise<AppDataSnapshot> {
    const db = await getConn()

    const txRes = await db.query('SELECT * FROM transactions ORDER BY id DESC')
    const assetRes = await db.query('SELECT * FROM assets ORDER BY id DESC')
    const recRes = await db.query('SELECT * FROM recurring ORDER BY id DESC')

    const transactions: Transaction[] = (txRes.values ?? []).map(rowToTransaction)
    const assets: Asset[] = (assetRes.values ?? []).map(rowToAsset)
    const recurring: RecurringItem[] = (recRes.values ?? []).map(rowToRecurring)

    const categories = await kvGet<Category[]>('categories') ?? []
    const subCategories = await kvGet<SubCategories>('subCategories') ?? {}
    const budget = await kvGet<Budget>('budget') ?? { monthlyLimit: 0 }
    const reminder = await kvGet<ReminderSettings>('reminder') ?? {
      enabled: false, time: '20:00', days: [1, 2, 3, 4, 5],
    }
    const uiSettings = await kvGet<UISettings>('uiSettings') ?? {
      showCategoryFilter: false, theme: 'light', assetCardStyle: 'flowingGold',
    }
    const assetCategories: Category[] = await kvGet<Category[]>('assetCategories') ?? []
    const nextId = (await kvGet<number>('nextId')) ?? 1
    const nextRecurringId = (await kvGet<number>('nextRecurringId')) ?? 1
    const nextAssetId = (await kvGet<number>('nextAssetId')) ?? 1

    return {
      transactions, categories, subCategories, budget, recurring,
      reminder, uiSettings, assets, assetCategories,
      nextId, nextRecurringId, nextAssetId,
    }
  },

  async importAll(snapshot: AppDataSnapshot): Promise<void> {
    const db = await getConn()
    await importAllToDb(db, snapshot)
  },

  // ----- 事务 -----

  async listTransactions(opts: ListTxOpts = {}): Promise<Transaction[]> {
    const db = await getConn()
    const where: string[] = []
    const params: any[] = []
    if (opts.startDate) { where.push('date >= ?'); params.push(opts.startDate) }
    if (opts.endDate)   { where.push('date <= ?'); params.push(opts.endDate) }
    if (opts.category)  { where.push('category = ?'); params.push(opts.category) }
    if (opts.type)      { where.push('type = ?'); params.push(opts.type) }

    let sql = 'SELECT * FROM transactions'
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY id DESC'
    if (opts.limit && opts.limit > 0) {
      sql += ' LIMIT ?'
      params.push(opts.limit)
    }

    const res = await db.query(sql, params)
    return (res.values ?? []).map(rowToTransaction)
  },

  async insertTransaction(tx: Transaction): Promise<void> {
    const db = await getConn()
    await insertTxStmt(db, tx)
    if (tx.id >= (await kvGet<number>('nextId') ?? 0)) {
      await kvSet('nextId', tx.id + 1)
    }
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const db = await getConn()
    await db.run(
      `UPDATE transactions SET
         type=?, amount=?, date=?, category=?, sub_category=?,
         name=?, icon=?, tag=?, merchant=?, location=?,
         account_id=?, asset_id=?, note=?, updated_at=datetime('now','localtime')
       WHERE id=?`,
      [
        tx.type, tx.amount, tx.date, tx.category,
        tx.subCategory ?? null, tx.name, tx.icon ?? null, tx.tag ?? null,
        tx.merchant ?? null, tx.location ?? null,
        (tx as any).accountId ?? null, (tx as any).assetId ?? null,
        tx.note ?? null, tx.id,
      ],
    )
  },

  async deleteTransaction(id: number): Promise<void> {
    const db = await getConn()
    await db.run('DELETE FROM transactions WHERE id = ?', [id])
  },

  // ----- 资产 -----

  async listAssets(): Promise<Asset[]> {
    const db = await getConn()
    const res = await db.query('SELECT * FROM assets ORDER BY id DESC')
    return (res.values ?? []).map(rowToAsset)
  },

  async insertAsset(asset: Asset): Promise<void> {
    const db = await getConn()
    await insertAssetStmt(db, asset)
    if (asset.id >= (await kvGet<number>('nextAssetId') ?? 0)) {
      await kvSet('nextAssetId', asset.id + 1)
    }
  },

  async updateAsset(asset: Asset): Promise<void> {
    const db = await getConn()
    await db.run(
      `UPDATE assets SET
         name=?, category=?, icon=?, purchase_price=?, purchase_date=?,
         current_value=?, brand=?, model=?, serial_number=?, location=?,
         owner=?, channel=?, useful_life=?, salvage_rate=?, depreciation_type=?,
         status=?, photo=?, receipt_photo=?, note=?, transaction_id=?,
         updated_at=datetime('now','localtime')
       WHERE id=?`,
      [
        asset.name, asset.category, asset.icon ?? null,
        asset.purchasePrice, asset.purchaseDate, asset.currentValue,
        asset.brand ?? null, asset.model ?? null, asset.serialNumber ?? null,
        asset.location ?? null, asset.owner ?? null, asset.channel ?? null,
        asset.usefulLife ?? null, asset.salvageRate ?? null,
        asset.depreciationType ?? null, asset.status ?? null,
        asset.photo ?? null, asset.receiptPhoto ?? null,
        asset.note ?? null, asset.transactionId ?? null,
        asset.id,
      ],
    )
  },

  async deleteAsset(id: number): Promise<void> {
    const db = await getConn()
    await db.run('DELETE FROM assets WHERE id = ?', [id])
  },

  // ----- 周期记账 -----

  async listRecurring(): Promise<RecurringItem[]> {
    const db = await getConn()
    const res = await db.query('SELECT * FROM recurring ORDER BY id DESC')
    return (res.values ?? []).map(rowToRecurring)
  },

  async upsertRecurring(item: RecurringItem): Promise<void> {
    const db = await getConn()
    const res = await db.query('SELECT id FROM recurring WHERE id = ?', [item.id])
    if (res.values && res.values.length > 0) {
      await db.run(
        `UPDATE recurring SET
           name=?, amount=?, type=?, category=?, sub_category=?, icon=?,
           frequency=?, day_of_week=?, day_of_month=?, last_triggered=?, enabled=?
         WHERE id=?`,
        [
          item.name, item.amount, item.type, item.category,
          item.subCategory ?? null, item.icon ?? null,
          item.frequency, item.dayOfWeek ?? null, item.dayOfMonth ?? null,
          item.lastTriggered ?? null, item.enabled ? 1 : 0,
          item.id,
        ],
      )
    } else {
      await insertRecurringStmt(db, item)
      if (item.id >= (await kvGet<number>('nextRecurringId') ?? 0)) {
        await kvSet('nextRecurringId', item.id + 1)
      }
    }
  },

  async deleteRecurring(id: number): Promise<void> {
    const db = await getConn()
    await db.run('DELETE FROM recurring WHERE id = ?', [id])
  },

  // ----- 通用 KV -----

  async getKV<T>(key: KVKey): Promise<T | null> {
    if (key === 'meta.lastExportAt') {
      return (await kvGet<T>('meta.lastExportAt'))
    }
    if (key === 'nextAssetId') return (await kvGet<number>('nextAssetId')) as unknown as T
    if (key === 'nextRecurringId') return (await kvGet<number>('nextRecurringId')) as unknown as T
    if (key === 'nextId') return (await kvGet<number>('nextId')) as unknown as T
    return await kvGet<T>(key)
  },

  async setKV<T>(key: KVKey, value: T): Promise<void> {
    if (key === 'nextId' || key === 'nextRecurringId' || key === 'nextAssetId' || key === 'meta.lastExportAt') {
      await kvSet(key, value)
      return
    }
    await kvSet(key, value)
  },
}