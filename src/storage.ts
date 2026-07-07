import type { AppData, Transaction, Category, SubCategories, Budget, RecurringItem, ReminderSettings } from './types'

export const STORAGE_KEY = 'light-ledger-data-v1'

// ========== 默认数据 ==========

const defaultCategories: Category[] = [
  { name: '餐饮', icon: '🍜' },
  { name: '交通', icon: '🚗' },
  { name: '购物', icon: '🛍️' },
  { name: '娱乐', icon: '🎮' },
  { name: '居家', icon: '🏠' },
  { name: '医疗', icon: '💊' },
  { name: '教育', icon: '📚' },
  { name: '人情', icon: '🎁' },
  { name: '其他', icon: '📦' },
]

const defaultSubCategories: SubCategories = {
  '餐饮': ['早餐', '午餐', '晚餐', '零食', '饮品', '外卖'],
  '交通': ['地铁', '公交', '打车', '加油', '停车', '高铁'],
  '购物': ['服装', '日用品', '数码', '美妆', '家居', '其他'],
  '娱乐': ['电影', '游戏', '旅行', '运动', 'KTV', '其他'],
  '居家': ['房租', '水电', '物业', '维修', '日用品', '其他'],
  '医疗': ['门诊', '药品', '体检', '住院', '牙科', '其他'],
  '教育': ['学费', '书本', '培训', '考试', '文具', '其他'],
  '人情': ['红包', '礼物', '聚餐', '婚礼', '探病', '其他'],
  '其他': ['其他'],
}

const defaultAssetCategories: Category[] = [
  { name: '数码', icon: '📷' },
  { name: '家电', icon: '📺' },
  { name: '家具', icon: '🛋️' },
  { name: '交通工具', icon: '🚗' },
  { name: '珠宝', icon: '💎' },
  { name: '收藏品', icon: '🏺' },
  { name: '其他', icon: '📦' },
]

function getDefaultTransactions(): Transaction[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = (day: number) => `${y}-${m}-${String(day).padStart(2, '0')}`

  // 生成上个月日期用于同比环比
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? y - 1 : y
  const pm = String(prevMonth).padStart(2, '0')
  const pd = (day: number) => `${prevYear}-${pm}-${String(day).padStart(2, '0')}`

  return [
    { id: 1, name: '星巴克咖啡', category: '餐饮', subCategory: '饮品', date: d(22), amount: 38.00, type: 'expense', icon: '☕', tag: '饮品', merchant: '星巴克', location: '万达广场' },
    { id: 2, name: '地铁通勤', category: '交通', subCategory: '地铁', date: d(22), amount: 6.00, type: 'expense', icon: '🚇', tag: '地铁', merchant: '城市地铁', location: '1号线' },
    { id: 3, name: '工资入账', category: '其他', date: d(15), amount: 15000.00, type: 'income', icon: '💼', tag: '薪资', merchant: '公司', location: '' },
    { id: 4, name: '优衣库外套', category: '购物', subCategory: '服装', date: d(14), amount: 299.00, type: 'expense', icon: '👔', tag: '服装', merchant: '优衣库', location: '龙湖天街' },
    { id: 5, name: '电影院', category: '娱乐', subCategory: '电影', date: d(13), amount: 89.90, type: 'expense', icon: '🎬', tag: '电影', merchant: '万达影城', location: '万达广场' },
    { id: 6, name: 'Uber出行', category: '交通', subCategory: '打车', date: d(12), amount: 45.00, type: 'expense', icon: '🚕', tag: '打车', merchant: '滴滴出行', location: '公司' },
    { id: 7, name: '理财收益', category: '其他', date: d(10), amount: 3500.00, type: 'income', icon: '📈', tag: '投资', merchant: '余额宝', location: '' },
    { id: 8, name: '711便利店', category: '购物', subCategory: '日用品', date: d(9), amount: 52.60, type: 'expense', icon: '🏪', tag: '日用品', merchant: '711便利店', location: '楼下' },
    // 重复交易样本：让首页快捷记账的次数有梯度，便于对比不同展示风格
    { id: 14, name: '豆浆油条', category: '餐饮', subCategory: '早餐', date: d(6), amount: 12.00, type: 'expense', icon: '🥐', tag: '早餐', merchant: '早餐摊', location: '楼下' },
    { id: 15, name: '包子豆浆', category: '餐饮', subCategory: '早餐', date: d(8), amount: 10.00, type: 'expense', icon: '🥟', tag: '早餐', merchant: '早餐摊', location: '楼下' },
    { id: 16, name: '煎饼果子', category: '餐饮', subCategory: '早餐', date: d(11), amount: 15.00, type: 'expense', icon: '🌯', tag: '早餐', merchant: '街边摊', location: '公司楼下' },
    { id: 17, name: '兰州拉面', category: '餐饮', subCategory: '午餐', date: d(7), amount: 32.00, type: 'expense', icon: '🍜', tag: '午餐', merchant: '兰州拉面', location: '公司楼下' },
    { id: 18, name: '麻辣烫', category: '餐饮', subCategory: '午餐', date: d(18), amount: 38.00, type: 'expense', icon: '🥘', tag: '午餐', merchant: '杨国福', location: '万达广场' },
    { id: 19, name: '地铁通勤', category: '交通', subCategory: '地铁', date: d(17), amount: 6.00, type: 'expense', icon: '🚇', tag: '地铁', merchant: '城市地铁', location: '1号线' },
    // 上月数据（用于同比环比）
    { id: 9, name: '上月工资', category: '其他', date: pd(15), amount: 15000.00, type: 'income', icon: '💼', tag: '薪资', merchant: '公司', location: '' },
    { id: 10, name: '上月餐饮', category: '餐饮', subCategory: '午餐', date: pd(20), amount: 45.00, type: 'expense', icon: '🍜', tag: '午餐', merchant: '公司食堂', location: '公司' },
    { id: 11, name: '上月房租', category: '居家', subCategory: '房租', date: pd(1), amount: 3000.00, type: 'expense', icon: '🏠', tag: '房租', merchant: '房东', location: '小区' },
    { id: 12, name: '上月交通', category: '交通', subCategory: '地铁', date: pd(18), amount: 6.00, type: 'expense', icon: '🚇', tag: '地铁', merchant: '城市地铁', location: '2号线' },
    { id: 13, name: '上月购物', category: '购物', subCategory: '服装', date: pd(10), amount: 199.00, type: 'expense', icon: '👔', tag: '服装', merchant: 'ZARA', location: '商场' },
  ]
}

function getDefaultAssets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = (day: number) => `${y}-${m}-${String(day).padStart(2, '0')}`

  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? y - 1 : y
  const pm = String(prevMonth).padStart(2, '0')
  const pd = (day: number) => `${prevYear}-${pm}-${String(day).padStart(2, '0')}`

  const twoMonthsAgo = now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1
  const twoMonthsAgoYear = now.getMonth() - 1 < 0 ? y - 1 : y
  const tm = String(twoMonthsAgo + 1).padStart(2, '0')
  const td = (day: number) => `${twoMonthsAgoYear}-${tm}-${String(day).padStart(2, '0')}`

  const lastYear = y - 1
  const ld = (month: number, day: number) => `${lastYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const twoYearsAgo = y - 2
  const twd = (month: number, day: number) => `${twoYearsAgo}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const threeYearsAgo = y - 3
  const thd = (month: number, day: number) => `${threeYearsAgo}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return [
    {
      id: 1,
      name: 'iPhone 15 Pro Max',
      category: '数码',
      icon: '📱',
      purchasePrice: 9999,
      purchaseDate: pd(10),
      currentValue: 9999,
      brand: 'Apple',
      model: 'A3108',
      location: '主卧',
      owner: '张三',
      channel: 'Apple Store',
      usefulLife: 3,
      salvageRate: 0.1,
      depreciationType: 'straight',
      status: '在用',
      note: '256GB 原色钛金属',
      createdAt: pd(10),
      updatedAt: pd(10),
    },
    {
      id: 2,
      name: 'MacBook Pro 14英寸',
      category: '数码',
      icon: '💻',
      purchasePrice: 16999,
      purchaseDate: ld(6, 15),
      currentValue: 16999,
      brand: 'Apple',
      model: 'M3 Pro',
      location: '书房',
      owner: '张三',
      channel: '京东',
      usefulLife: 4,
      salvageRate: 0.15,
      depreciationType: 'straight',
      status: '在用',
      note: '18GB 内存 512GB SSD',
      createdAt: ld(6, 15),
      updatedAt: ld(6, 15),
    },
    {
      id: 3,
      name: '索尼 A7M4 相机',
      category: '数码',
      icon: '📷',
      purchasePrice: 16999,
      purchaseDate: ld(11, 20),
      currentValue: 16999,
      brand: 'Sony',
      model: 'ILCE-7M4',
      location: '客厅',
      owner: '张三',
      channel: '天猫旗舰店',
      usefulLife: 5,
      salvageRate: 0.2,
      depreciationType: 'straight',
      status: '闲置',
      note: '全画幅微单，含 24-70mm 镜头',
      createdAt: ld(11, 20),
      updatedAt: ld(11, 20),
    },
    {
      id: 4,
      name: '小米电视 75英寸',
      category: '家电',
      icon: '📺',
      purchasePrice: 5999,
      purchaseDate: twd(5, 1),
      currentValue: 5999,
      brand: 'Xiaomi',
      model: 'L75M9-S',
      location: '客厅',
      owner: '张三',
      channel: '小米商城',
      usefulLife: 8,
      salvageRate: 0.1,
      depreciationType: 'straight',
      status: '在用',
      note: '4K 量子点 Mini LED',
      createdAt: twd(5, 1),
      updatedAt: twd(5, 1),
    },
    {
      id: 5,
      name: '海尔冰箱',
      category: '家电',
      icon: '❄️',
      purchasePrice: 4599,
      purchaseDate: twd(8, 10),
      currentValue: 4599,
      brand: 'Haier',
      model: 'BCD-500WDGLU1',
      location: '厨房',
      owner: '张三',
      channel: '苏宁易购',
      usefulLife: 10,
      salvageRate: 0.05,
      depreciationType: 'straight',
      status: '在用',
      note: '500L 十字对开门 风冷无霜',
      createdAt: twd(8, 10),
      updatedAt: twd(8, 10),
    },
    {
      id: 6,
      name: '戴森吸尘器',
      category: '家电',
      icon: '🧹',
      purchasePrice: 3990,
      purchaseDate: ld(3, 25),
      currentValue: 3990,
      brand: 'Dyson',
      model: 'V15 Detect',
      location: '储物间',
      owner: '李四',
      channel: '戴森官网',
      usefulLife: 5,
      salvageRate: 0.15,
      depreciationType: 'straight',
      status: '在用',
      note: '激光探测灰尘',
      createdAt: ld(3, 25),
      updatedAt: ld(3, 25),
    },
    {
      id: 7,
      name: '真皮沙发',
      category: '家具',
      icon: '🛋️',
      purchasePrice: 12800,
      purchaseDate: thd(12, 1),
      currentValue: 12800,
      brand: '顾家家居',
      model: 'DK.103',
      location: '客厅',
      owner: '张三',
      channel: '居然之家',
      usefulLife: 15,
      salvageRate: 0.2,
      depreciationType: 'straight',
      status: '在用',
      note: '三人位 深灰色',
      createdAt: thd(12, 1),
      updatedAt: thd(12, 1),
    },
    {
      id: 8,
      name: '实木餐桌',
      category: '家具',
      icon: '🪑',
      purchasePrice: 4500,
      purchaseDate: thd(10, 15),
      currentValue: 4500,
      brand: '源氏木语',
      model: 'Y801',
      location: '餐厅',
      owner: '张三',
      channel: '天猫',
      usefulLife: 20,
      salvageRate: 0.3,
      depreciationType: 'straight',
      status: '在用',
      note: '1.4米 白橡木',
      createdAt: thd(10, 15),
      updatedAt: thd(10, 15),
    },
    {
      id: 9,
      name: '大众朗逸',
      category: '交通工具',
      icon: '🚗',
      purchasePrice: 125800,
      purchaseDate: twd(1, 20),
      currentValue: 125800,
      brand: 'Volkswagen',
      model: '2023款 1.5L 自动舒适版',
      location: '地下车库',
      owner: '张三',
      channel: '4S店',
      usefulLife: 15,
      salvageRate: 0.1,
      depreciationType: 'straight',
      status: '在用',
      note: '车牌号：京A12345',
      createdAt: twd(1, 20),
      updatedAt: twd(1, 20),
    },
    {
      id: 10,
      name: '周大福钻戒',
      category: '珠宝',
      icon: '💍',
      purchasePrice: 28800,
      purchaseDate: ld(2, 14),
      currentValue: 28800,
      brand: '周大福',
      model: 'LOVE系列',
      location: '主卧',
      owner: '李四',
      channel: '周大福门店',
      usefulLife: 0,
      salvageRate: 0.5,
      depreciationType: 'manual',
      status: '在用',
      note: '1克拉 VVS 铂金镶嵌',
      createdAt: ld(2, 14),
      updatedAt: ld(2, 14),
    },
    {
      id: 11,
      name: '翡翠手镯',
      category: '珠宝',
      icon: '💎',
      purchasePrice: 15000,
      purchaseDate: td(8, 1),
      currentValue: 15000,
      brand: '七彩云南',
      location: '主卧',
      owner: '李四',
      channel: '七彩云南旗舰店',
      usefulLife: 0,
      salvageRate: 0.6,
      depreciationType: 'manual',
      status: '闲置',
      note: '糯种飘花',
      createdAt: td(8, 1),
      updatedAt: td(8, 1),
    },
    {
      id: 12,
      name: '明代青花瓷瓶',
      category: '收藏品',
      icon: '🏺',
      purchasePrice: 88000,
      purchaseDate: twd(9, 1),
      currentValue: 95000,
      location: '书房',
      owner: '张三',
      channel: '拍卖行',
      usefulLife: 0,
      salvageRate: 1,
      depreciationType: 'manual',
      status: '闲置',
      note: '万历年间，口径12cm，高35cm',
      createdAt: twd(9, 1),
      updatedAt: pd(5),
    },
    {
      id: 13,
      name: '茅台飞天',
      category: '收藏品',
      icon: '🍶',
      purchasePrice: 2800,
      purchaseDate: twd(11, 10),
      currentValue: 3200,
      brand: '茅台',
      model: '53度 500ml',
      location: '酒柜',
      owner: '张三',
      channel: '茅台专卖店',
      usefulLife: 0,
      salvageRate: 1,
      depreciationType: 'manual',
      status: '闲置',
      note: '2023年生产',
      createdAt: twd(11, 10),
      updatedAt: d(1),
    },
    {
      id: 14,
      name: 'iPad Air',
      category: '数码',
      icon: '📱',
      purchasePrice: 5999,
      purchaseDate: ld(9, 1),
      currentValue: 5999,
      brand: 'Apple',
      model: 'M2',
      location: '客厅',
      owner: '李四',
      channel: '京东',
      usefulLife: 4,
      salvageRate: 0.15,
      depreciationType: 'straight',
      status: '在用',
      note: '10.9英寸 256GB 深空灰色',
      createdAt: ld(9, 1),
      updatedAt: ld(9, 1),
    },
    {
      id: 15,
      name: '跑步机',
      category: '家电',
      icon: '🏃',
      purchasePrice: 3599,
      purchaseDate: ld(1, 15),
      currentValue: 3599,
      brand: '舒华',
      model: 'SH-T5100',
      location: '阳台',
      owner: '张三',
      channel: '天猫',
      usefulLife: 8,
      salvageRate: 0.1,
      depreciationType: 'straight',
      status: '闲置',
      note: '可折叠',
      createdAt: ld(1, 15),
      updatedAt: ld(1, 15),
    },
  ]
}

function getDefaultData(): AppData {
  return {
    transactions: getDefaultTransactions(),
    categories: [...defaultCategories],
    subCategories: { ...defaultSubCategories },
    budget: { monthlyLimit: 0 },
    recurring: [],
    reminder: { enabled: false, time: '20:00', days: [1, 2, 3, 4, 5] },
    uiSettings: { showCategoryFilter: true, theme: 'light', assetCardStyle: 'flowingGold' },
    nextId: 100,
    nextRecurringId: 1,
    assets: getDefaultAssets(),
    assetCategories: [...defaultAssetCategories],
    nextAssetId: 16,
  }
}

// ========== 存储操作 ==========

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const data = getDefaultData()
      saveData(data)
      return data
    }
    const parsed = JSON.parse(raw) as Partial<AppData>
    // 合并默认值确保字段完整
    const data: AppData = {
      transactions: parsed.transactions ?? getDefaultTransactions(),
      categories: parsed.categories ?? [...defaultCategories],
      subCategories: parsed.subCategories ?? { ...defaultSubCategories },
      budget: parsed.budget ?? { monthlyLimit: 0 },
      recurring: parsed.recurring ?? [],
      reminder: parsed.reminder ?? { enabled: false, time: '20:00', days: [1, 2, 3, 4, 5] },
      uiSettings: { showCategoryFilter: parsed.uiSettings?.showCategoryFilter ?? true, theme: parsed.uiSettings?.theme ?? 'light', assetCardStyle: parsed.uiSettings?.assetCardStyle ?? 'flowingGold' },
      nextId: parsed.nextId ?? 100,
      nextRecurringId: parsed.nextRecurringId ?? 1,
      assets: parsed.assets ?? getDefaultAssets(),
      assetCategories: parsed.assetCategories ?? [...defaultAssetCategories],
      nextAssetId: parsed.nextAssetId ?? 16,
    }
    return data
  } catch {
    return getDefaultData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data:', e)
  }
}

export function resetData(): AppData {
  const data = getDefaultData()
  saveData(data)
  return data
}

// ========== 日期工具函数 ==========

/** 获取今天的日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** 从 YYYY-MM-DD 提取月份 YYYY-MM */
export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7)
}

/** 获取当前月份 key */
export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 获取上个月 key */
export function prevMonthKey(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 获取去年同月 key */
export function lastYearSameMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 获取当前年份 */
export function currentYear(): number {
  return new Date().getFullYear()
}

/** 从日期字符串获取显示用的 MM/DD */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr
  return dateStr.substring(5).replace('-', '/')
}

/** 格式化日期为中文显示 MM月DD日 */
export function formatChineseDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}
