/**
 * 基金相关类型定义
 */

// 基金排行项
export interface FundRankItem {
  code: string              // 基金代码 "000001"
  name: string              // 基金名称 "华夏成长混合"
  type: string              // 基金类型 "混合型" | "股票型" | "债券型" | "指数型" | "QDII"
  monthReturn: number       // 近1月收益率 -0.0221 表示 -2.21%
  threeMonthReturn: number  // 近3月收益率 0.0532 表示 5.32%
  halfYearReturn: number    // 近半年收益率 0.1331 表示 13.31%
  yearReturn: number        // 近1年收益率 -0.3620 表示 -36.20%
  nav: number               // 当前净值 1.234
  navDate: string           // 净值日期 "2026-07-09"
  manager: string           // 基金经理 "张三"
  company: string           // 基金公司 "华夏基金"
  scale: number             // 基金规模（亿元） 15.6
}

// 基金详情（扩展信息）
export interface FundDetail extends FundRankItem {
  establishDate: string     // 成立日期 "2020-01-15"
  benchmark: string         // 业绩比较基准 "沪深300指数收益率×70%+中证全债指数收益率×30%"
  purchaseFee: number       // 申购费率 0.015 表示 1.5%
  managementFee: number     // 管理费率 0.01 表示 1.0%
  custodianFee: number      // 托管费率 0.002 表示 0.2%
  riskLevel: number         // 风险等级 1-5
  holdings: FundHolding[]   // 前十大持仓股票
  navHistory: NavPoint[]    // 近1年净值走势
}

// 持仓股票
export interface FundHolding {
  stockCode: string         // 股票代码 "600519"
  stockName: string         // 股票名称 "贵州茅台"
  proportion: number        // 持仓比例 0.095 表示 9.5%
}

// 净值历史数据点
export interface NavPoint {
  date: string              // 日期 "2026-06-01"
  value: number             // 净值 1.234
}

// 排行榜数据结构
export interface FundRankData {
  monthTop5: FundRankItem[]     // 月收益率 Top 5
  threeMonthTop5: FundRankItem[] // 近3月收益率 Top 5
  halfYearTop5: FundRankItem[]  // 半年收益率 Top 5
  yearTop5: FundRankItem[]      // 年收益率 Top 5
  intersection: FundRankItem[]  // 四榜都在前5的基金（交集）
  updateTime: string            // 数据更新时间
}

// 排行榜类型
export type RankType = 'month' | 'threeMonth' | 'halfYear' | 'year'