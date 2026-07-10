/**
 * 基金数据 API 服务
 * 调用本地代理服务获取天天基金网真实数据
 */

import type { FundRankItem, FundRankData, FundDetail } from '../types/fund'

// API 配置
const API_BASE_URL = 'http://localhost:3001'

// 是否使用 Mock 数据（开发调试时可手动改为 true）
const USE_MOCK = false

// ========== Mock 数据生成（备用） ==========

// 基金公司名称库
const FUND_COMPANIES = [
  '华夏基金', '易方达基金', '嘉实基金', '南方基金', '广发基金',
  '汇添富基金', '博时基金', '富国基金', '招商基金', '景顺长城基金'
]

// 基金经理姓名库
const FUND_MANAGERS = [
  '张三', '李四', '王五', '赵六', '钱七',
  '孙八', '周九', '吴十', '郑明', '陈强'
]

// 基金类型
const FUND_TYPES = ['股票型', '混合型', '债券型', '指数型', 'QDII']

function generateFundCode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')
}

function randomReturn(): number {
  return (Math.random() * 100 - 40) / 100
}

function generateFundItem(code?: string): FundRankItem {
  const fundCode = code || generateFundCode()
  const typeIndex = Math.floor(Math.random() * FUND_TYPES.length)

  return {
    code: fundCode,
    name: `${FUND_COMPANIES[typeIndex % FUND_COMPANIES.length].replace('基金', '')}${['成长', '精选', '优选', '策略', '价值'][Math.floor(Math.random() * 5)]}${FUND_TYPES[typeIndex]}`,
    type: FUND_TYPES[typeIndex],
    monthReturn: randomReturn(),
    threeMonthReturn: randomReturn(),
    halfYearReturn: randomReturn(),
    yearReturn: randomReturn(),
    nav: Math.random() * 3 + 0.5,
    navDate: new Date().toISOString().split('T')[0],
    manager: FUND_MANAGERS[Math.floor(Math.random() * FUND_MANAGERS.length)],
    company: FUND_COMPANIES[Math.floor(Math.random() * FUND_COMPANIES.length)],
    scale: Math.random() * 50 + 1
  }
}

async function fetchMockFundRankData(): Promise<FundRankData> {
  await new Promise(resolve => setTimeout(resolve, 600))

  const funds: FundRankItem[] = []
  const usedCodes = new Set<string>()

  for (let i = 0; i < 30; i++) {
    let code = generateFundCode()
    while (usedCodes.has(code)) {
      code = generateFundCode()
    }
    usedCodes.add(code)
    funds.push(generateFundItem(code))
  }

  const monthTop5 = [...funds]
    .sort((a, b) => b.monthReturn - a.monthReturn)
    .slice(0, 10)

  const threeMonthTop5 = [...funds]
    .sort((a, b) => b.threeMonthReturn - a.threeMonthReturn)
    .slice(0, 10)

  const halfYearTop5 = [...funds]
    .sort((a, b) => b.halfYearReturn - a.halfYearReturn)
    .slice(0, 10)

  const yearTop5 = [...funds]
    .sort((a, b) => b.yearReturn - a.yearReturn)
    .slice(0, 10)

  const monthCodes = new Set(monthTop5.map(f => f.code))
  const threeMonthCodes = new Set(threeMonthTop5.map(f => f.code))
  const halfYearCodes = new Set(halfYearTop5.map(f => f.code))
  const yearCodes = new Set(yearTop5.map(f => f.code))

  // 计算至少三榜在前10的基金
  const intersectionCodes: string[] = []
  const allCodes = new Set([...monthCodes, ...threeMonthCodes, ...halfYearCodes, ...yearCodes])
  
  for (const code of allCodes) {
    let count = 0
    if (monthCodes.has(code)) count++
    if (threeMonthCodes.has(code)) count++
    if (halfYearCodes.has(code)) count++
    if (yearCodes.has(code)) count++
    
    // 至少三榜在前10
    if (count >= 3) {
      intersectionCodes.push(code)
    }
  }

  const allFundsMap = new Map<string, FundRankItem>()
  funds.forEach(f => allFundsMap.set(f.code, f))

  const intersection = intersectionCodes.map(code => allFundsMap.get(code)!)

  return {
    monthTop5,
    threeMonthTop5,
    halfYearTop5,
    yearTop5,
    intersection,
    updateTime: new Date().toISOString()
  }
}

async function fetchMockFundDetail(code: string): Promise<FundDetail | null> {
  await new Promise(resolve => setTimeout(resolve, 400))

  const fund = generateFundItem(code)

  const navHistory = []
  let nav = fund.nav
  for (let i = 12; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    nav = nav * (1 + (Math.random() - 0.45) * 0.08)
    navHistory.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0.3, nav)
    })
  }

  const holdings = []
  for (let i = 0; i < 10; i++) {
    holdings.push({
      stockCode: String(600000 + Math.floor(Math.random() * 2000)),
      stockName: ['贵州茅台', '宁德时代', '比亚迪', '中国平安', '招商银行', '五粮液', '隆基绿能', '美的集团', '长江电力', '中国中免'][i],
      proportion: (Math.random() * 10 + 2) / 100
    })
  }

  return {
    ...fund,
    establishDate: '2020-01-15',
    benchmark: '沪深300指数收益率×70%+中证全债指数收益率×30%',
    purchaseFee: Math.random() * 0.02,
    managementFee: Math.random() * 0.02,
    custodianFee: Math.random() * 0.005,
    riskLevel: Math.floor(Math.random() * 5) + 1,
    holdings,
    navHistory
  }
}

// ========== 真实 API 调用 ==========

/**
 * 解析天天基金网返回的百分比字符串
 * 例如："4.92%" => 0.0492
 */
function parsePercent(str: string): number {
  if (!str || str === '--' || str === '') return 0
  const num = parseFloat(str.replace('%', ''))
  return num / 100
}

/**
 * 解析天天基金网返回的净值字符串
 * 例如："8.8070" => 8.8070
 */
function parseNumber(str: string): number {
  if (!str || str === '--' || str === '') return 0
  return parseFloat(str)
}

/**
 * 从基金名称推断基金类型
 */
function inferFundTypeFromName(name: string): string {
  if (name.includes('股票') || name.includes('指数') || name.includes('ETF')) {
    return '股票型'
  }
  if (name.includes('债券') || name.includes('债')) {
    return '债券型'
  }
  if (name.includes('混合')) {
    return '混合型'
  }
  if (name.includes('QDII') || name.includes('境外')) {
    return 'QDII'
  }
  return '混合型' // 默认
}

/**
 * 将天天基金网数据映射为 FundRankItem
 */
function mapApiResponseToFundItem(item: any): FundRankItem {
  return {
    code: item.code,
    name: item.name,
    type: inferFundTypeFromName(item.name),
    monthReturn: parsePercent(item.monthGrowth || '0'),
    threeMonthReturn: parsePercent(item.threeMonthGrowth || '0'),
    halfYearReturn: parsePercent(item.sixMonthGrowth || '0'),
    yearReturn: parsePercent(item.yearGrowth || '0'),
    nav: parseNumber(item.unitValue || '1'),
    navDate: item.date || new Date().toISOString().split('T')[0],
    manager: '未知', // 需要通过详情接口补充
    company: item.name.split('-')[0] || '未知基金公司',
    scale: 0 // 需要通过详情接口补充
  }
}

/**
 * 获取基金排行榜数据（真实 API）
 */
async function fetchRealFundRankData(fundType: 'gp' | 'hh' | 'zq' = 'hh'): Promise<FundRankData> {
  try {
    // 并行请求四个排行榜
    const [monthResp, threeMonthResp, halfYearResp, yearResp] = await Promise.all([
      fetch(`${API_BASE_URL}/api/fund/rank?period=month&limit=20&type=${fundType}`),
      fetch(`${API_BASE_URL}/api/fund/rank?period=threemonth&limit=20&type=${fundType}`),
      fetch(`${API_BASE_URL}/api/fund/rank?period=halfyear&limit=20&type=${fundType}`),
      fetch(`${API_BASE_URL}/api/fund/rank?period=year&limit=20&type=${fundType}`)
    ])

    const monthData = await monthResp.json()
    const threeMonthData = await threeMonthResp.json()
    const halfYearData = await halfYearResp.json()
    const yearData = await yearResp.json()

    if (!monthData.success || !threeMonthData.success || !halfYearData.success || !yearData.success) {
      console.error('API 返回失败:', monthData.error || threeMonthData.error || halfYearData.error || yearData.error)
      // 回退到 Mock 数据
      return fetchMockFundRankData()
    }

    // 映射为 FundRankItem（取前10名）
    const monthTop5 = monthData.data.slice(0, 10).map(mapApiResponseToFundItem)
    const threeMonthTop5 = threeMonthData.data.slice(0, 10).map(mapApiResponseToFundItem)
    const halfYearTop5 = halfYearData.data.slice(0, 10).map(mapApiResponseToFundItem)
    const yearTop5 = yearData.data.slice(0, 10).map(mapApiResponseToFundItem)

    // 计算至少三榜在前10的基金
    const monthCodes = new Set(monthTop5.map(f => f.code))
    const threeMonthCodes = new Set(threeMonthTop5.map(f => f.code))
    const halfYearCodes = new Set(halfYearTop5.map(f => f.code))
    const yearCodes = new Set(yearTop5.map(f => f.code))

    const intersectionCodes: string[] = []
    const allCodes = new Set([...monthCodes, ...threeMonthCodes, ...halfYearCodes, ...yearCodes])
    
    for (const code of allCodes) {
      let count = 0
      if (monthCodes.has(code)) count++
      if (threeMonthCodes.has(code)) count++
      if (halfYearCodes.has(code)) count++
      if (yearCodes.has(code)) count++
      
      // 至少三榜在前10
      if (count >= 3) {
        intersectionCodes.push(code)
      }
    }

    // 合并所有榜单中的基金，用于查找交集详情
    const allFundsMap = new Map<string, FundRankItem>();
    [...monthTop5, ...threeMonthTop5, ...halfYearTop5, ...yearTop5].forEach(f => allFundsMap.set(f.code, f))

    const intersection = intersectionCodes.map(code => allFundsMap.get(code)!)

    return {
      monthTop5,
      threeMonthTop5,
      halfYearTop5,
      yearTop5,
      intersection,
      updateTime: new Date().toISOString()
    }
  } catch (error) {
    console.error('获取真实基金数据失败，回退到 Mock:', error)
    return fetchMockFundRankData()
  }
}

/**
 * 获取基金详情（真实 API）
 */
async function fetchRealFundDetail(code: string): Promise<FundDetail | null> {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/fund/detail/${code}`)
    const data = await resp.json()

    if (!data.success) {
      console.error('获取基金详情失败:', data.error)
      return fetchMockFundDetail(code)
    }

    // 映射为 FundDetail
    return {
      code: data.data.code,
      name: data.data.name,
      type: '混合型', // 默认类型
      monthReturn: parsePercent(data.data.dayGrowth || '0'), // 使用日增长率代替月收益率（详情接口可能不含月收益率）
      halfYearReturn: 0, // 需要通过其他接口补充
      yearReturn: 0,
      nav: parseNumber(data.data.unitValue || '1'),
      navDate: data.data.date || new Date().toISOString().split('T')[0],
      manager: '未知',
      company: data.data.name.split('-')[0] || '未知基金公司',
      scale: 0,
      establishDate: '未知',
      benchmark: '未知',
      purchaseFee: 0,
      managementFee: 0,
      custodianFee: 0,
      riskLevel: 3,
      holdings: [],
      navHistory: []
    }
  } catch (error) {
    console.error('获取基金详情失败，回退到 Mock:', error)
    return fetchMockFundDetail(code)
  }
}

// ========== 公开接口 ==========

/**
 * 获取基金排行榜数据
 * 根据配置选择真实 API 或 Mock 数据
 */
export async function fetchFundRankData(fundType: 'gp' | 'hh' | 'zq' = 'hh'): Promise<FundRankData> {
  if (USE_MOCK) {
    return fetchMockFundRankData()
  }
  return fetchRealFundRankData(fundType)
}

/**
 * 获取基金详情
 */
export async function fetchFundDetail(code: string): Promise<FundDetail | null> {
  if (USE_MOCK) {
    return fetchMockFundDetail(code)
  }
  return fetchRealFundDetail(code)
}