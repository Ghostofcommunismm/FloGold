// ========== 类型定义 ==========

export interface Transaction {
  id: number
  name: string
  category: string
  subCategory?: string
  date: string // YYYY-MM-DD
  amount: number
  type: 'income' | 'expense'
  icon: string
  tag: string
  merchant?: string
  location?: string
}

export interface Asset {
  id: number
  name: string
  category: string
  icon: string
  purchasePrice: number
  purchaseDate: string
  currentValue: number

  brand?: string
  model?: string
  serialNumber?: string
  location?: string
  owner?: string
  channel?: string

  usefulLife?: number
  salvageRate?: number
  depreciationType?: 'straight' | 'manual'
  status?: '在用' | '闲置' | '已出售'

  photo?: string
  receiptPhoto?: string
  note?: string

  transactionId?: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  name: string
  icon: string
}

export interface SubCategories {
  [key: string]: string[]
}

export interface Budget {
  monthlyLimit: number
}

export interface RecurringItem {
  id: number
  name: string
  amount: number
  type: 'income' | 'expense'
  category: string
  subCategory?: string
  icon: string
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number // 0=周日, 1-6=周一到周六
  dayOfMonth?: number // 1-31
  lastTriggered?: string // YYYY-MM-DD
  enabled: boolean
}

export interface ReminderSettings {
  enabled: boolean
  time: string // "HH:mm"
  days: number[] // 周几 [0,1,2,3,4,5,6] 0=周日
}

export type AssetCardStyle = 'flowingGold' | 'embossedGold' | 'brushedMetal'

export interface UISettings {
  showCategoryFilter: boolean // 首页快捷分类(同时用于交易列表筛选)是否显示
  theme: 'light' | 'dark' // 主题模式
  assetCardStyle: AssetCardStyle // 资产页头部总值卡片的视觉风格
}

export interface AppData {
  transactions: Transaction[]
  categories: Category[]
  subCategories: SubCategories
  budget: Budget
  recurring: RecurringItem[]
  reminder: ReminderSettings
  uiSettings: UISettings
  nextId: number
  nextRecurringId: number
  assets: Asset[]
  assetCategories: Category[]
  nextAssetId: number
}
