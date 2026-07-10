/**
 * 天天基金网 API 代理服务
 * 转发基金排行榜请求，解决 CORS 问题
 */

import express from 'express';
import cors from 'cors';
import nodeFetch from 'node-fetch';

const app = express();
const PORT = 3001;

// 启用 CORS
app.use(cors());
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 基金排行榜代理
 * 接口参数说明：
 * - ft: 基金类型 (all/gp/hh/zq/qs/qdii/lof/fof)
 * - sc: 排序字段 (rzdf=日增长率, 1yzf=近1月, 3yzf=近3月, 6yzf=近6月, 1nzf=近1年)
 * - st: 排序方式 (desc=降序, asc=升序)
 * - sd/ed: 时间范围
 * - pi/pn: 页码/每页数量
 */
app.get('/api/fund/rank', async (req, res) => {
  try {
    const { period = '1nzf', limit = 50, type = 'hh' } = req.query;

    // 构建天天基金网排行榜接口 URL
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const sd = formatDate(oneYearAgo);
    const ed = formatDate(today);

    // 根据 period 参数选择排序字段
    // sc 参数映射：1yzf(近1月), 3yzf(近3月), 6yzf(近6月), 1nzf(近1年)
    let sc = '1nzf'; // 默认近1年
    if (period === 'month') sc = '1yzf';
    else if (period === 'threemonth') sc = '3yzf';
    else if (period === 'halfyear') sc = '6yzf';
    else if (period === 'year') sc = '1nzf';

    // 根据 type 参数选择基金类型
    // ft 参数映射：gp=股票型, hh=混合型, zq=债券型, all=全部
    const ft = type || 'hh'; // 默认混合型

    const url = `http://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=${ft}&rs=&gs=0&sc=${sc}&st=desc&sd=${sd}&ed=${ed}&qdii=&tabSubtype=,&pi=1&pn=${limit}&dx=1`;

    console.log(`请求天天基金网: ${url}`);

    const response = await nodeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://fund.eastmoney.com/data/fundranking.html'
      }
    });

    const text = await response.text();

    // 解析返回数据 (格式: var rankData = {datas:["...","..."]})
    // 只匹配 datas 数组内容，不要匹配整个对象
    const match = text.match(/datas:\s*\[([\s\S]*?)\]/);
    if (!match) {
      return res.json({ success: false, error: '解析数据失败', raw: text.substring(0, 500) });
    }

    // 解析基金数据行
    // 格式: "025686,国泰半导体制造精选混合发起A,GTBDTZZJXHHFQA,2026-07-09,2.6656,2.6656,9.24,15.91,64.78,123.51,126.61,..."
    const dataStr = match[1];
    const rows = [];
    
    // 使用正则提取每一行（去掉双引号）
    const rowRegex = /"([^"]+)"/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(dataStr)) !== null) {
      const row = rowMatch[1].split(',');
      if (row.length >= 15) {
        rows.push({
          code: row[0],           // 基金代码
          name: row[1],           // 基金名称
          date: row[3],           // 日期
          unitValue: row[4],      // 单位净值
          accumValue: row[5],     // 累计净值
          dayGrowth: row[6],      // 日增长率
          weekGrowth: row[7],     // 近1周
          monthGrowth: row[8],    // 近1月
          threeMonthGrowth: row[9],  // 近3月
          sixMonthGrowth: row[10],   // 近6月
          yearGrowth: row[11],        // 近1年
          twoYearGrowth: row[12],     // 近2年
          threeYearGrowth: row[13],   // 近3年
          thisYearGrowth: row[14],    // 今年来
          sinceGrowth: row[15],       // 成立来
        });
      }
    }

    console.log(`成功获取 ${rows.length} 条基金数据`);

    res.json({
      success: true,
      period: period,
      sortField: sc,
      count: rows.length,
      data: rows.slice(0, limit) // 返回前 limit 条
    });

  } catch (error) {
    console.error('代理请求失败:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * 单只基金详情代理
 */
app.get('/api/fund/detail/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const url = `http://fundgz.1234567.com.cn/js/${code}.js`;

    console.log(`请求基金详情: ${url}`);

    const response = await nodeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://fund.eastmoney.com/'
      }
    });

    const text = await response.text();

    // 解析返回数据 (格式: jsonpgz({...});)
    const match = text.match(/jsonpgz\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    if (!match) {
      return res.json({ success: false, error: '解析详情失败', raw: text });
    }

    // 将 JSON 字符串转为对象
    const jsonStr = match[1].replace(/(\w+):/g, '"$1":');
    const data = JSON.parse(`{${jsonStr}}`);

    res.json({
      success: true,
      data: {
        code: data.fundcode,
        name: data.name,
        date: data.jzrq,
        unitValue: data.dwjz,
        accumValue: data.ljjz,
        dayGrowth: data.gszzl,
        estimatedValue: data.gszzl,
        estimatedTime: data.gztime
      }
    });

  } catch (error) {
    console.error('获取基金详情失败:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * 所有基金列表代理
 */
app.get('/api/fund/list', async (req, res) => {
  try {
    const url = 'http://fund.eastmoney.com/js/fundcode_search.js';

    console.log(`请求基金列表: ${url}`);

    const response = await nodeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const text = await response.text();

    // 解析返回数据 (格式: var r = [["000001","HXCZHH","华夏成长混合",...],...];)
    const match = text.match(/var\s+r\s*=\s*\[([\s\S]*?)\];/);
    if (!match) {
      return res.json({ success: false, error: '解析列表失败' });
    }

    // 提取基金数组
    const dataStr = match[1];
    const funds = [];
    const fundRegex = /\["([^"]+)"\]/g;
    let fundMatch;

    while ((fundMatch = fundRegex.exec(dataStr)) !== null) {
      const parts = fundMatch[1].split('","');
      if (parts.length >= 4) {
        funds.push({
          code: parts[0],
          shortName: parts[1],
          name: parts[2],
          type: parts[3]
        });
      }
    }

    res.json({
      success: true,
      count: funds.length,
      data: funds.slice(0, 100) // 返回前 100 条示例
    });

  } catch (error) {
    console.error('获取基金列表失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toLocaleString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`\n🚀 天天基金 API 代理服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log(`\n可用接口:`);
  console.log(`   GET /api/fund/rank?period=month|halfyear|year&limit=50`);
  console.log(`   GET /api/fund/detail/:code`);
  console.log(`   GET /api/fund/list\n`);
});