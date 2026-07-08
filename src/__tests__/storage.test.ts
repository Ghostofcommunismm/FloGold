import { describe, it, expect, beforeEach } from 'vitest'
import { loadData, saveData, STORAGE_KEY, webAdapter } from '../storage'
import type { Transaction, RecurringItem } from '../types'

// ============================================================
// 同步兼容层测试（loadData / saveData / STORAGE_KEY）
// 与原测试保持兼容，证明 web 模式下数据迁移路径仍然正确
// ============================================================

describe('loadData migration (legacy AppData format)', () => {
  beforeEach(() => localStorage.clear())

  it('fills assets fields for old data without assets', () => {
    // 模拟老版本数据：无 assets/assetCategories/nextAssetId 字段
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nextId: 5, transactions: [] }))
    const data = loadData()
    expect(data.assets.length).toBeGreaterThan(0)
    expect(data.assetCategories.length).toBeGreaterThan(0)
    expect(data.nextAssetId).toBe(16)
  })

  it('preserves existing assets fields when present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nextId: 5,
      assets: [{ id: 1, name: 'test', category: '数码', icon: '📷', purchasePrice: 1000, purchaseDate: '2024-01-01', currentValue: 800, createdAt: '', updatedAt: '' }],
      assetCategories: [{ name: '自定义', icon: '🎯' }],
      nextAssetId: 2,
    }))
    const data = loadData()
    expect(data.assets.length).toBe(1)
    expect(data.assets[0].name).toBe('test')
    expect(data.assetCategories[0].name).toBe('自定义')
    expect(data.nextAssetId).toBe(2)
  })

  it('default asset categories include 数码 and 交通工具', () => {
    const data = loadData()
    const names = data.assetCategories.map(c => c.name)
    expect(names).toContain('数码')
    expect(names).toContain('交通工具')
  })

  it('saveData round-trips through loadData', () => {
    const data = loadData()
    data.transactions[0].note = '测试备注'
    saveData(data)
    const reloaded = loadData()
    expect(reloaded.transactions[0].note).toBe('测试备注')
  })
})

// ============================================================
// Web Adapter（async API）测试
// ============================================================

describe('webAdapter (async API)', () => {
  beforeEach(async () => {
    localStorage.clear()
    await webAdapter.init()
  })

  it('init seeds default data when storage is empty', async () => {
    const snap = await webAdapter.exportAll()
    expect(snap.transactions.length).toBeGreaterThan(0)
    expect(snap.assets.length).toBeGreaterThan(0)
    expect(snap.nextId).toBeGreaterThanOrEqual(100)
  })

  it('insertTransaction appends and bumps nextId', async () => {
    const tx: Transaction = {
      id: 9999, type: 'expense', amount: 12.5, date: '2026-01-01',
      category: '餐饮', name: 'test meal', icon: '🍜', tag: '测试',
    }
    await webAdapter.insertTransaction(tx)
    const snap = await webAdapter.exportAll()
    expect(snap.transactions.some(t => t.id === 9999)).toBe(true)
    expect(snap.nextId).toBeGreaterThanOrEqual(10000)
  })

  it('updateTransaction replaces by id', async () => {
    const tx: Transaction = {
      id: 5000, type: 'expense', amount: 12.5, date: '2026-01-01',
      category: '餐饮', name: 'before', icon: '🍜', tag: '测试',
    }
    await webAdapter.insertTransaction(tx)
    await webAdapter.updateTransaction({ ...tx, name: 'after', amount: 20 })
    const list = await webAdapter.listTransactions({ category: '餐饮' })
    const found = list.find(t => t.id === 5000)
    expect(found?.name).toBe('after')
    expect(found?.amount).toBe(20)
  })

  it('deleteTransaction removes by id', async () => {
    const tx: Transaction = {
      id: 5001, type: 'expense', amount: 12.5, date: '2026-01-01',
      category: '餐饮', name: 'to delete', icon: '🍜', tag: '测试',
    }
    await webAdapter.insertTransaction(tx)
    await webAdapter.deleteTransaction(5001)
    const list = await webAdapter.listTransactions()
    expect(list.some(t => t.id === 5001)).toBe(false)
  })

  it('listTransactions filters by date range and type', async () => {
    await webAdapter.importAll({
      transactions: [
        { id: 1, type: 'expense', amount: 10, date: '2026-01-15', category: '餐饮', name: 'a', icon: '', tag: '' },
        { id: 2, type: 'expense', amount: 20, date: '2026-02-15', category: '交通', name: 'b', icon: '', tag: '' },
        { id: 3, type: 'income',  amount: 30, date: '2026-02-20', category: '其他', name: 'c', icon: '', tag: '' },
      ],
      categories: [], subCategories: {}, budget: { monthlyLimit: 0 },
      recurring: [], reminder: { enabled: false, time: '20:00', days: [] },
      uiSettings: { showCategoryFilter: false, theme: 'light', assetCardStyle: 'flowingGold' },
      assets: [], assetCategories: [],
      nextId: 100, nextRecurringId: 1, nextAssetId: 1,
    })

    const janExpenses = await webAdapter.listTransactions({
      startDate: '2026-01-01', endDate: '2026-01-31', type: 'expense',
    })
    expect(janExpenses).toHaveLength(1)
    expect(janExpenses[0].id).toBe(1)

    const febAll = await webAdapter.listTransactions({
      startDate: '2026-02-01', endDate: '2026-02-28',
    })
    expect(febAll).toHaveLength(2)
  })

  it('upsertRecurring inserts then updates', async () => {
    const item: RecurringItem = {
      id: 1, name: '工资', amount: 10000, type: 'income',
      category: '其他', icon: '💼', frequency: 'monthly', dayOfMonth: 15, enabled: true,
    }
    await webAdapter.upsertRecurring(item)
    let list = await webAdapter.listRecurring()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('工资')

    await webAdapter.upsertRecurring({ ...item, amount: 12000 })
    list = await webAdapter.listRecurring()
    expect(list[0].amount).toBe(12000)

    await webAdapter.deleteRecurring(1)
    list = await webAdapter.listRecurring()
    expect(list).toHaveLength(0)
  })

  it('KV: getKV / setKV round-trip for budget and uiSettings', async () => {
    await webAdapter.setKV('budget', { monthlyLimit: 5000 })
    const b = await webAdapter.getKV<{ monthlyLimit: number }>('budget')
    expect(b?.monthlyLimit).toBe(5000)

    await webAdapter.setKV('uiSettings', { showCategoryFilter: true, theme: 'dark', assetCardStyle: 'brushedMetal' })
    const u = await webAdapter.getKV<{ theme: string }>('uiSettings')
    expect(u?.theme).toBe('dark')
  })
})

// ============================================================
// SQLite Adapter —— 仅在原生环境可跑，jsdom 下跳过
// ============================================================

describe.skip('sqliteAdapter', () => {
  // 真实运行需要在 Android APK / iOS App 里测。
  // vitest 在 jsdom 下 @capacitor-community/sqlite 会因为找不到原生桥而抛错，
  // 所以这里只放接口约定，避免 CI 误报红。
  it('exports the same shape as webAdapter (compile-time guarantee)', () => {
    // TypeScript 在编译期已保证两个 adapter 满足 StorageAdapter 接口，
    // 这里仅作为代码占位，说明 SQLite 测试的入口位置。
    expect(true).toBe(true)
  })
})