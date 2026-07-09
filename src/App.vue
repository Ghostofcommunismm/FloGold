<template>
  <div class="app-container">
    <!-- ===== 首页（home） ===== -->
    <!-- 首页固定布局：顶部固定 + 底部抽屉占满剩余空间 -->
    <motion.section
      v-if="activeTab === 'home'"
      key="home"
      class="page-shell home-fixed-layout"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="springs.steady"
    >
      <!-- fixed-header-area: 顶部固定区域 -->
      <div class="fixed-header-area">
        <!-- 顶部栏 -->
        <header class="top-bar">
          <div class="greeting-box">
            <span class="greeting-text">{{ greetingText }}</span>
          </div>
          <div class="top-bar-right">
            <div class="bell-box neumorph-circle" @click="openSearch">
              <Search :size="20" :stroke-width="2" />
            </div>
          </div>
        </header>

        <!-- 余额卡片 -->
        <BalanceCard
          :animated-balance="animatedBalance"
          :total-income="totalIncome"
          :total-expense="totalExpense"
          :month-expense="monthExpense"
          :month-expense-prev="prevSelectedMonthExpense"
          :budget-limit="budget.monthlyLimit"
        />

        <!-- 快捷记账 -->
        <QuickLog
          :transactions="transactions"
          :categories="categories"
          :sub-categories="subCategories"
          :days="30"
          @pick="onQuickLogPick"
        />

        <!-- 快捷分类 -->
        <section v-if="uiSettings.showCategoryFilter" class="category-section">
          <div
            v-for="(cat, idx) in categories"
            :key="cat.name"
            class="cat-btn"
            :class="{ active: activeCategory === cat.name }"
            :style="{ animationDelay: idx * 0.04 + 's' }"
            @click="activeCategory = cat.name"
          >
            <CategoryIcon :icon="cat.icon" />
            <span class="cat-label">{{ cat.name }}</span>
          </div>
        </section>
      </div>

      <!-- transaction-drawer: 占满剩余空间，内部滚动 -->
      <div class="transaction-drawer">
        <!-- 交易列表头部：抽屉第一层 -->
        <div class="drawer-header">
          <h2 class="section-title">最近交易</h2>
          <div class="month-picker">
            <button class="month-nav month-nav-prev" @click="shiftMonth(-1)" aria-label="上一月">
              <ChevronLeft :size="14" :stroke-width="2.2" />
            </button>
            <div class="month-picker-label" @click="showDatePicker = true">
              <span class="month">{{ currentMonth }}</span>
              <span class="year">{{ currentYearNum }}</span>
            </div>
            <button class="month-nav month-nav-next" @click="shiftMonth(1)" aria-label="下一月">
              <ChevronRight :size="14" :stroke-width="2.2" />
            </button>
          </div>
        </div>

        <div class="transaction-list-section">
          <!-- 抽屉拖拽指示器 -->
          <div class="drawer-handle">
            <div class="drawer-indicator">
              <span class="drawer-bar"></span>
            </div>
          </div>

          <!-- 交易内容区（可滚动） -->
          <div class="drawer-content">
            <div v-if="filteredTransactions.length === 0" class="tx-empty">
              <div class="tx-empty-icon">
                <BookOpen :size="44" :stroke-width="1.6" />
              </div>
              <span class="tx-empty-text">本月暂无交易记录</span>
              <button class="tx-empty-btn" @click="openAddModal">记一笔</button>
            </div>

            <template v-else>
              <div v-for="group in transactionGroups" :key="group.date" class="tx-group">
                <div class="tx-group-label">
                  <span>{{ group.label }}</span>
                  <span class="tx-group-meta">{{ group.totalText }}</span>
                </div>
                <TransitionGroup name="list" tag="div" class="transaction-list">
                  <div
                    v-for="(tx, index) in group.items"
                    :key="tx.id"
                    class="tx-swipe-wrap"
                    :class="{ dragging: swiping && swipeCurrentId === tx.id, deleting: deletingId === tx.id }"
                    :style="{ animationDelay: index * 0.04 + 's' }"
                    :data-tx-id="tx.id"
                  >
                    <!-- 滑动操作按钮（背景层，宽度随滑动进度拉伸） -->
                    <div class="tx-swipe-actions" :style="actionsStyle(tx.id)">
                      <button
                        class="tx-swipe-btn edit"
                        :style="btnStyle(tx.id, 0)"
                        @click.stop="onSwipeEdit(tx)"
                      >
                        <span class="tx-swipe-inner" :style="innerStyle(tx.id, 0)">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          <span>编辑</span>
                        </span>
                      </button>
                      <button
                        class="tx-swipe-btn delete"
                        :style="btnStyle(tx.id, 1)"
                        @click.stop="onSwipeDelete(tx)"
                      >
                        <span class="tx-swipe-inner" :style="innerStyle(tx.id, 1)">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                          <span>{{ deleteLabel(tx.id) }}</span>
                        </span>
                      </button>
                    </div>
                    <!-- 卡片内容（前景层，可滑动） -->
                    <div
                      class="tx-card"
                      :class="{ swiped: swipedId === tx.id, swiping: swiping && swipeCurrentId === tx.id }"
                      :style="cardStyle(tx.id)"
                      @pointerdown="onSwipeStart($event, tx.id)"
                      @pointermove="onSwipeMove"
                      @pointerup="onSwipeEnd"
                      @pointercancel="onSwipeEnd"
                    >
                      <div class="tx-main">
                        <div class="tx-left">
                          <div class="tx-icon-box" :class="tx.type">
                            <IconDisplay :icon="getLucideIconName(tx.icon)" :size="21" />
                          </div>
                          <div class="tx-info">
                            <span class="tx-name">{{ tx.name }}</span>
                            <span class="tx-category">
                              {{ tx.category }}<template v-if="tx.subCategory"> · {{ tx.subCategory }}</template>
                              <template v-if="tx.merchant"> · <IconDisplay icon="MapPin" :size="14" /> {{ tx.merchant }}</template>
                            </span>
                          </div>
                        </div>
                        <div class="tx-right">
                          <span class="tx-amount" :class="tx.type">
                            {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </template>
          </div>
        </div>
      </div>
    </motion.section>

    <AnimatePresence mode="wait">
    <motion.section
      v-if="activeTab === 'stats'"
      key="stats"
      class="page-shell"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="springs.steady"
      @scroll.passive="onPageScroll"
    >
      <!-- 统计顶部栏 -->
      <header class="stats-top-bar" :class="{ scrolled }">
        <div class="stats-header-left">
          <h2 class="stats-title">统计分析</h2>
          <span class="stats-period-badge">{{ statsPeriodLabel }}</span>
        </div>
      </header>

      <!-- 周期切换：日/周/月/年/自定义 -->
      <div class="stats-period-tabs" role="tablist">
        <button class="period-tab" :class="{ active: statsPeriod === 'day' }" @click="statsPeriod = 'day'" role="tab">日</button>
        <button class="period-tab" :class="{ active: statsPeriod === 'week' }" @click="statsPeriod = 'week'" role="tab">周</button>
        <button class="period-tab" :class="{ active: statsPeriod === 'month' }" @click="statsPeriod = 'month'" role="tab">月</button>
        <button class="period-tab" :class="{ active: statsPeriod === 'year' }" @click="statsPeriod = 'year'" role="tab">年</button>
        <button
          class="period-tab custom-tab"
          :class="{ active: statsPeriod === 'custom' }"
          @click="openCustomPicker"
          role="tab"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>自定义</span>
        </button>
      </div>

      <!-- ===== 浅色K线风格 Hero ===== -->
      <section v-reveal class="stats-hero-k">
        <div class="hero-k-card" :class="statsPeriodChange.cls">
          <!-- 顶部标签 -->
          <div class="hero-k-head">
            <div class="hero-k-badge">{{ statsPeriodLabel }}</div>
            <div class="hero-k-title">总{{ statsType === 'expense' ? '支出' : '收入' }}</div>
          </div>
          <!-- 金额 + 涨跌 + 迷你柱状图 -->
          <div class="hero-k-main">
            <div class="hero-price-box-k">
              <div class="hero-price-k">
                <span class="cur-k">¥</span>{{ statsTotalDisp.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
              </div>
              <div class="hero-change-k">
                <div class="change-arrow-k">
                  <svg v-if="statsPeriodChange.cls === 'up'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  <svg v-else-if="statsPeriodChange.cls === 'down'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
                </div>
                <div class="change-text-k">{{ statsPeriodChange.text }}</div>
              </div>
            </div>
            <!-- 迷你柱状图：显示近7天/周的支出趋势 -->
            <div class="hero-mini-chart-k">
              <div
                v-for="(b, i) in miniChartData"
                :key="'mini-' + i"
                class="mini-bar-k"
                :class="{ up: statsPeriodChange.cls === 'up' }"
                :style="{ height: b.height + '%' }"
              ></div>
            </div>
          </div>
          <!-- 底部指标 -->
          <div class="hero-grid-k">
            <div class="grid-item-k">
              <div class="k">日均</div>
              <div class="v">¥{{ Math.round(statsAvgDisp) }}</div>
            </div>
            <div class="grid-item-k">
              <div class="k">笔数</div>
              <div class="v">{{ Math.round(statsCountDisp) }}</div>
            </div>
            <div class="grid-item-k">
              <div class="k">最高</div>
              <div class="v">¥{{ statsMaxAmount.toLocaleString('zh-CN', { maximumFractionDigits: 0 }) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 三联横排：同比环比 / 月度预算 / 储蓄率 ===== -->
      <section v-reveal class="stats-triple">
        <!-- 同比环比 -->
        <div class="triple-card">
          <div class="triple-head">
            <span>同比环比</span>
            <span :class="['triple-badge', statsPeriodChange.cls]">{{ statsPeriodChange.text }}</span>
          </div>
          <div class="triple-amount">
            <span class="cur">¥</span>{{ Math.abs(statsTotal.value - prevPeriodTotal.value).toFixed(0) }}
          </div>
          <div class="triple-sub">
            vs {{ statsPeriod === 'month' ? '上月' : statsPeriod === 'week' ? '上周' : statsPeriod === 'day' ? '昨日' : '上期' }}
            ¥{{ prevPeriodTotal.toFixed(0) }}
          </div>
        </div>
        <!-- 月度预算 -->
        <div class="triple-card budget">
          <div class="triple-head">
            <span>月度预算</span>
            <span :class="['triple-badge', budgetWarnLevel]">
              {{ budgetAmount > 0 ? Math.round((monthExpense / budgetAmount) * 100) : 0 }}%
            </span>
          </div>
          <div class="triple-amount">
            <span class="cur">¥</span>{{ monthExpense.toFixed(0) }}<span class="triple-divider">/</span><span class="triple-limit">{{ budgetAmount > 0 ? budgetAmount.toFixed(0) : '0' }}</span>
          </div>
          <div v-if="budgetAmount > 0" class="budget-progress">
            <div
              :class="['budget-fill', { warn: budgetWarnLevel === 'warn' || budgetWarnLevel === 'over' }]"
              :style="{ width: Math.min(100, (monthExpense / budgetAmount) * 100) + '%' }"
            ></div>
          </div>
          <div v-if="budgetAmount > 0" class="budget-row">
            <span>剩余 {{ daysRemainingInMonth }} 天</span>
            <span>剩 ¥{{ budgetRemain.toFixed(0) }}</span>
          </div>
        </div>
        <!-- 储蓄率 -->
        <div class="triple-card">
          <div class="triple-head">
            <span>储蓄率</span>
            <span class="triple-badge flat">—</span>
          </div>
          <div class="triple-amount">
            {{ statsSavingRate.toFixed(0) }}<span class="triple-unit">%</span>
          </div>
          <div class="triple-sub">结余 ¥{{ statsBalance.toFixed(0) }}</div>
        </div>
      </section>

      <!-- ===== AI 异常洞察 ===== -->
      <section v-if="statsInsight" v-reveal class="stats-insight">
        <div class="insight-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div class="insight-body">
          <div class="insight-title">{{ statsInsight.title }}</div>
          <div class="insight-desc">{{ statsInsight.desc }}</div>
        </div>
      </section>

      <!-- 环形饼图 + 分类列表 -->
      <section v-reveal class="stats-chart-section">
        <div class="chart-area">
          <div class="card-head">
            <div class="card-title">分类构成</div>
            <span
              v-if="categoryStatsList.length > 0"
              class="cat-tool-btn"
              @click="toggleAllCategories"
            >{{ allCategoriesExpanded ? '全部收起' : '全部展开' }}</span>
          </div>
          <div v-if="categoryStatsList.length === 0" class="chart-empty">
            <span class="empty-icon"><IconDisplay icon="ChartBar" :size="44" :stroke-width="1.6" /></span>
            <span class="empty-text">暂无{{ statsType === 'expense' ? '支出' : '收入' }}数据</span>
          </div>
          <template v-else>
            <div class="cat-row">
              <!-- 紧凑环形饼图 -->
              <div class="donut-box">
                <div class="donut-svg-wrap">
                  <svg class="donut-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
                    <circle class="donut-track" cx="50" cy="50" r="40" />
                    <motion.path
                      v-for="(seg, i) in donutSegments"
                      :key="seg.name"
                      class="donut-seg"
                      :d="seg.d"
                      :stroke="seg.color"
                      :initial="{ pathLength: 0, opacity: 0 }"
                      :animate="{ pathLength: 1, opacity: 1 }"
                      :transition="{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.65, 0, 0.35, 1] }"
                      fill="none"
                      stroke-width="14"
                      stroke-linecap="butt"
                    />
                  </svg>
                  <div class="donut-center">
                    <span class="donut-center-amount">¥{{ Math.round(statsTotalDisp) }}</span>
                    <span class="donut-center-label">总{{ statsType === 'expense' ? '支出' : '收入' }}</span>
                  </div>
                </div>
                <div class="donut-foot">{{ categoryStatsList.length }} 个分类</div>
              </div>

              <!-- 大类 + 子类展开列表 -->
              <div class="cat-list">
                <div
                  v-for="(cat, idx) in categoryStatsList"
                  :key="cat.name"
                  class="cat-item"
                  :class="{ expanded: isCategoryExpanded(cat.name) }"
                  :style="{
                    '--c': cat.color,
                    '--cbg': cat.color + '2A',  // ~16% alpha
                    '--cink': darkenHex(cat.color, 0.25),
                    animationDelay: idx * 0.05 + 's',
                  }"
                  @click="toggleCategory(cat.name)"
                >
                  <div class="icn" :style="{ background: cat.color + '2A', color: darkenHex(cat.color, 0.25) }">
                    <IconDisplay :icon="getLucideIconName(cat.icon)" :size="13" />
                  </div>
                  <div class="name">
                    <span class="nm">{{ cat.name }}</span>
                    <span class="ct">{{ cat.count }} 笔</span>
                  </div>
                  <div class="amt">¥{{ cat.amount.toFixed(0) }}<span class="p">{{ (cat.percent * 100).toFixed(1) }}%</span></div>
                  <svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <div class="bar">
                    <div
                      class="fg"
                      :style="{
                        width: (cat.percent * 100).toFixed(1) + '%',
                        background: 'linear-gradient(90deg, ' + cat.color + ', ' + darkenHex(cat.color, 0.2) + ')',
                      }"
                    ></div>
                  </div>
                  <!-- 子类目展开区 -->
                  <div class="sub-wrap">
                    <div class="sub-inner">
                      <div class="sub-list">
                        <div
                          v-for="sub in getSubcategoryStats(cat.name)"
                          :key="sub.name"
                          class="sub-item"
                          @click.stop
                        >
                          <div class="sub-dot" :style="{ background: cat.color }"></div>
                          <div class="sub-name">{{ sub.name }}</div>
                          <div class="sub-count">{{ sub.count }} 笔</div>
                          <div class="sub-amount">
                            ¥{{ sub.amount.toFixed(0) }}<span class="sp">{{ (sub.percent * 100).toFixed(1) }}%</span>
                          </div>
                          <div class="sub-mini-bar">
                            <div
                              class="fg"
                              :style="{
                                width: (sub.percent * 100).toFixed(1) + '%',
                                background: cat.color,
                              }"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- 趋势柱状图 -->
      <section class="trend-section">
        <div class="trend-card">
          <div class="card-head">
            <div class="card-title">每日趋势</div>
            <div class="trend-tools">
              <span class="tool-chip" :class="{ active: trendType === 'income' }" @click="trendType = 'income'">收入</span>
              <span class="tool-chip" :class="{ active: trendType === 'expense' }" @click="trendType = 'expense'">支出</span>
              <span class="tool-chip" :class="{ active: trendType === 'compare' }" @click="trendType = 'compare'">对比</span>
            </div>
          </div>
          <div class="trend-legend">
            <span><span class="dot" style="background: var(--expense);"></span>{{ trendType === 'income' ? '收入' : '支出' }}</span>
            <span><span class="dot" style="background: var(--accent);"></span>日均 ¥{{ Math.round(trendAvgExpense) }}</span>
          </div>

          <div class="trend-chart trend-chart-bars">
          <svg
            class="trend-svg"
            :viewBox="`0 0 ${TREND_W} ${TREND_H}`"
            preserveAspectRatio="none"
            @mousemove="onTrendHover"
            @mouseleave="onTrendLeave"
          >
            <!-- Y 轴网格线 + 刻度标签 -->
            <g v-for="(t, i) in trendYLabels" :key="'y-' + i">
              <line
                :x1="TREND_PAD_X" :x2="TREND_W - TREND_PAD_R"
                :y1="t.y" :y2="t.y"
                :class="['trend-grid-line', { 'trend-grid-base': i === 0 }]"
              />
              <text
                :x="TREND_PAD_X - 6" :y="t.y + 3"
                text-anchor="end"
                class="trend-y-text"
              >{{ t.text }}</text>
            </g>

            <!-- 柱子（根据 trendType 决定显示逻辑） -->
            <g v-for="b in trendBarGeom" :key="'b-' + b.index">
              <!-- 对比模式：堆叠显示（支出在下，收入在上） -->
              <template v-if="trendType === 'compare'">
                <rect
                  v-if="b.expenseH > 0"
                  :x="b.x" :y="TREND_H - TREND_PAD_B - b.expenseH"
                  :width="b.w" :height="b.expenseH"
                  rx="1"
                  class="trend-bar trend-bar-expense"
                />
                <rect
                  v-if="b.incomeH > 0"
                  :x="b.x" :y="TREND_H - TREND_PAD_B - b.expenseH - b.incomeH"
                  :width="b.w" :height="b.incomeH"
                  rx="1"
                  class="trend-bar trend-bar-income"
                />
              </template>
              <!-- 单一模式：只显示选中的类型 -->
              <template v-else>
                <rect
                  v-if="(trendType === 'expense' ? b.expenseH : b.incomeH) > 0"
                  :x="b.x"
                  :y="TREND_H - TREND_PAD_B - (trendType === 'expense' ? b.expenseH : b.incomeH)"
                  :width="b.w"
                  :height="trendType === 'expense' ? b.expenseH : b.incomeH"
                  rx="1"
                  :class="['trend-bar', trendType === 'expense' ? 'trend-bar-expense' : 'trend-bar-income']"
                />
              </template>
            </g>

            <!-- 平均支出线（金色虚线） -->
            <g v-if="trendAvgY !== null && trendAvgExpense > 0">
              <line
                :x1="TREND_PAD_X" :x2="TREND_W - TREND_PAD_R"
                :y1="trendAvgY" :y2="trendAvgY"
                class="trend-avg-line"
              />
              <text
                :x="TREND_W - TREND_PAD_R"
                :y="trendAvgY - 3"
                text-anchor="end"
                class="trend-avg-text"
              >avg ¥{{ Math.round(trendAvgExpense) }}</text>
            </g>

            <!-- 峰值标签 -->
            <g v-if="trendPeakBar && (trendPeakBar.expense > 0 || trendPeakBar.income > 0)">
              <rect
                :x="trendPeakX - 1"
                :y="trendPeakY - 12"
                :width="trendPeakW + 2"
                height="10"
                rx="2"
                class="trend-peak-mark"
              />
              <text
                :x="trendPeakX + trendPeakW / 2"
                :y="trendPeakY - 4"
                text-anchor="middle"
                class="trend-peak-text"
              >¥{{ Math.round(trendType === 'income' ? trendPeakBar.income : trendPeakBar.expense) }}</text>
            </g>

            <!-- hover 高亮 -->
            <g v-if="hoverBar">
              <line
                :x1="hoverBar.x + hoverBar.w / 2"
                :x2="hoverBar.x + hoverBar.w / 2"
                :y1="TREND_PAD_T"
                :y2="TREND_H - TREND_PAD_B"
                class="trend-hover-line"
              />
              <rect
                v-if="hoverBar.expenseH > 0"
                :x="hoverBar.x - 0.5"
                :y="TREND_H - TREND_PAD_B - hoverBar.expenseH"
                :width="hoverBar.w + 1"
                :height="hoverBar.expenseH"
                class="trend-hover-rect"
              />
            </g>

            <!-- X 轴标签 -->
            <g v-for="(t, i) in trendXLabels" :key="'x-' + i">
              <text :x="t.x" :y="TREND_H - 8" text-anchor="middle" class="trend-x-text">{{ t.label }}</text>
            </g>
          </svg>

          <!-- 底部峰值提示 -->
          <div class="trend-tip" v-if="trendPeakBar && (trendPeakBar.expense > 0 || trendPeakBar.income > 0)">
            <span>峰值 <b>¥{{ Math.round(trendType === 'income' ? trendPeakBar.income : trendPeakBar.expense) }} · {{ trendPeakBar.label }}</b></span>
            <span v-if="trendBars.length > 1">峰谷 ¥{{ trendMinExpense.toFixed(0) }}</span>
          </div>

          <!-- hover tooltip -->
          <div
            v-if="hoverBar && (hoverBar.income + hoverBar.expense) > 0"
            class="trend-tooltip"
            :style="{ left: ((hoverBar.x + hoverBar.w / 2) / TREND_W * 100) + '%' }"
          >
            <div class="tt-date">{{ hoverBar.label }}</div>
            <template v-if="trendType === 'compare'">
              <div v-if="hoverBar.expense > 0" class="tt-row tt-expense">
                <span class="tt-dot"></span>支出 ¥{{ hoverBar.expense.toFixed(0) }}
              </div>
              <div v-if="hoverBar.income > 0" class="tt-row tt-income">
                <span class="tt-dot"></span>收入 ¥{{ hoverBar.income.toFixed(0) }}
              </div>
            </template>
            <div v-else class="tt-row" :class="trendType === 'expense' ? 'tt-expense' : 'tt-income'">
              <span class="tt-dot"></span>{{ trendType === 'expense' ? '支出' : '收入' }} ¥{{ (trendType === 'expense' ? hoverBar.expense : hoverBar.income).toFixed(0) }}
            </div>
          </div>
        </div>
        </div>
      </section>

      <!-- 排行卡片 -->
      <section v-reveal class="rank-section" v-if="merchantRank.length > 0 || tagRank.length > 0">
        <div class="rank-card">
          <div class="card-head">
            <div class="card-title">排行</div>
            <span class="card-sub">TOP 5</span>
          </div>
          <div class="rank-2col">
            <div class="rank-col">
              <div class="rank-col-title">商户<span class="more">金额 ↓</span></div>
              <div v-for="(item, i) in merchantRank" :key="item.name" class="rank-row">
                <span class="rk">{{ i + 1 }}</span>
                <span class="nm">{{ item.name }}</span>
                <span class="v">¥{{ item.amount.toFixed(0) }}</span>
              </div>
              <div v-if="merchantRank.length === 0" class="rank-empty">暂无商户数据</div>
            </div>
            <div class="rank-col">
              <div class="rank-col-title">标签<span class="more">金额 ↓</span></div>
              <div v-for="(item, i) in tagRank" :key="item.name" class="rank-row">
                <span class="rk">{{ i + 1 }}</span>
                <span class="nm">{{ item.name }}</span>
                <span class="v">¥{{ item.amount.toFixed(0) }}</span>
              </div>
              <div v-if="tagRank.length === 0" class="rank-empty">暂无标签数据</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 消费习惯卡片 -->
      <section v-reveal class="habit-section" v-if="weekdayStats.some(s => s.amount > 0)">
        <div class="habit-card">
          <div class="card-head">
            <div class="card-title">消费习惯</div>
            <span class="card-sub">周内 · 时段</span>
          </div>
          <div class="dist-row">
            <div class="dist-block">
              <div class="dist-head">周内分布<span v-if="weekdayPeak" class="peak">{{ weekdayPeak }}</span></div>
              <div class="weekday-grid">
                <div
                  v-for="s in weekdayStats"
                  :key="s.day"
                  class="wd-col"
                  :class="{ peak: s.isPeak }"
                >
                  <div class="bar" :style="{ height: Math.max(3, s.percent) + '%' }"></div>
                  <div class="val">¥{{ s.amount > 0 ? s.amount.toFixed(0) : '-' }}</div>
                  <div class="lbl">{{ s.label }}</div>
                </div>
              </div>
            </div>
            <div class="dist-block">
              <div class="dist-head">时段热力<span v-if="hourPeakRange" class="peak">{{ hourPeakRange }}</span></div>
              <div class="hour-cells">
                <div class="hour-grid">
                  <div
                    v-for="h in hourStats"
                    :key="h.hourStart"
                    class="hour-cell"
                    :style="{
                      background: h.intensity > 0.6
                        ? `rgba(232, 139, 139, ${0.4 + h.intensity * 0.5})`
                        : `rgba(212, 165, 116, ${0.1 + h.intensity * 0.25})`
                    }"
                  ></div>
                </div>
                <div class="hour-labels">
                  <span>0时</span><span>6时</span><span>12时</span><span>18时</span><span>23时</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 收支热力图 -->
      <section v-reveal class="heatmap-section">
        <div class="heatmap-card">
          <div class="card-head">
            <div class="card-title">收支热力图</div>
            <span class="heatmap-subtitle">{{ heatmapTitle }}</span>
            <span class="heatmap-legend-inline">
              <span class="legend-item income"><i class="legend-dot"></i>收入</span>
              <span class="legend-item expense"><i class="legend-dot"></i>支出</span>
            </span>
          </div>
          <!-- 星期标题行 -->
          <div class="heatmap-weekdays-row">
            <span v-for="wd in ['一','二','三','四','五','六','日']" :key="wd" class="heatmap-wd-label">{{ wd }}</span>
          </div>
          <!-- 日历网格 -->
          <div class="heatmap-days-grid">
            <div
              v-for="(cell, i) in heatmapCells"
              :key="i"
              class="heatmap-cell"
              :class="{ placeholder: !cell }"
              :style="cell ? heatmapCellStyle(cell) : {}"
            >
              <template v-if="cell">
                <span class="cell-day-num">{{ cell.day }}</span>
                <div class="cell-metrics">
                  <span class="metric-bar income" :style="{ '--bar-w': heatmapBarWidth(cell.income, heatmapMaxIncome) }">
                    <span class="metric-val">{{ heatmapShortMoney(cell.income) }}</span>
                  </span>
                  <span class="metric-bar expense" :style="{ '--bar-w': heatmapBarWidth(cell.expense, heatmapMaxExpense) }">
                    <span class="metric-val">{{ heatmapShortMoney(cell.expense) }}</span>
                  </span>
                </div>
              </template>
            </div>
          </div>
          <div class="heatmap-tip">条形越长越深，金额越高</div>
        </div>
      </section>

      <!-- ============ 自定义日期范围底部弹窗 ============ -->
      <Teleport to="body">
        <Transition name="sheet-fade">
          <div v-if="showCustomPicker" class="date-sheet-mask" @click.self="closeCustomPicker">
            <div class="date-sheet" @click.stop>
              <div class="date-sheet-handle"></div>
              <div class="date-sheet-head">
                <div class="date-sheet-title">选择日期范围</div>
                <div class="date-sheet-close" @click="closeCustomPicker" role="button" aria-label="关闭">✕</div>
              </div>

              <div class="date-quick-ranges">
                <div
                  v-for="qr in quickRangeOptions"
                  :key="qr.key"
                  class="date-quick-range"
                  :class="{ active: activeQuickKey === qr.key }"
                  @click="applyQuickRange(qr.key)"
                >{{ qr.label }}</div>
              </div>

              <div class="date-range-display">
                <div class="date-range-box" :class="{ active: pickingTarget === 'start' }" @click="pickingTarget = 'start'">
                  <div class="l">开始</div>
                  <div class="v">{{ customRange?.start ? formatMd(customRange.start) : '--/--' }}</div>
                </div>
                <div class="date-range-arrow">→</div>
                <div class="date-range-box" :class="{ active: pickingTarget === 'end' }" @click="pickingTarget = 'end'">
                  <div class="l">结束</div>
                  <div class="v">{{ customRange?.end ? formatMd(customRange.end) : '--/--' }}</div>
                </div>
              </div>

              <div class="date-cal-wrap">
                <div class="date-cal-head">
                  <div class="date-cal-title">{{ calYear }} 年 {{ calMonth + 1 }} 月</div>
                  <div class="date-cal-nav">
                    <div class="date-cal-nav-btn" @click="calPrevMonth">‹</div>
                    <div class="date-cal-nav-btn" @click="calNextMonth">›</div>
                  </div>
                </div>
                <div class="date-cal-week">
                  <div v-for="w in WEEK_LABELS" :key="w">{{ w }}</div>
                </div>
                <div class="date-cal-days">
                  <div
                    v-for="cell in calCells"
                    :key="cell.key"
                    class="date-cal-day"
                    :class="{
                      muted: !cell.inMonth,
                      today: cell.isToday,
                      start: cell.isStart,
                      end: cell.isEnd,
                      'in-range': cell.inRange
                    }"
                    @click="cell.inMonth && pickDate(cell.dateStr)"
                  >{{ cell.day }}</div>
                </div>
              </div>

              <div class="date-sheet-footer">
                <button class="date-btn date-btn-secondary" @click="resetCustomRange">重置</button>
                <button class="date-btn date-btn-primary" @click="confirmCustomRange">确定</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </motion.section>

    <!-- ===== 资产页面（assets） ===== -->
    <motion.section
      v-if="activeTab === 'assets'"
      key="assets"
      class="page-shell"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="springs.steady"
      @scroll.passive="onPageScroll"
    >
      <AssetTab
        ref="assetTabRef"
        :assets="assets"
        :asset-categories="assetCategories"
        :transactions="transactions"
        :card-style="uiSettings.assetCardStyle"
        :scrolled="scrolled"
        @save-asset="saveAsset"
        @delete-asset="deleteAsset"
        @view-transaction="viewTransaction"
      />
    </motion.section>

    <!-- ===== 我的页面（profile） ===== -->
    <motion.section
      v-if="activeTab === 'profile'"
      key="profile"
      class="page-shell"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="springs.steady"
      @scroll.passive="onPageScroll"
    >
      <!-- 顶部用户卡片 -->
      <header class="profile-header">
        <div class="user-card">
          <div class="avatar-large">
            <span class="avatar-emoji"><IconDisplay icon="Wallet" :size="28" /></span>
            <span class="vip-badge">VIP</span>
          </div>
          <h2 class="user-name">记账小能手</h2>
          <p class="user-desc">坚持记账第 <strong>{{记账天数}}</strong> 天 · 累计 {{ totalRecords }} 笔</p>
        </div>
      </header>

      <!-- 数据总览 -->
      <section class="profile-stats">
        <div class="stat-item neumorph">
          <span class="stat-label">本月支出</span>
          <span class="stat-val expense">{{ totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 0 }) }}</span>
        </div>
        <div class="stat-item neumorph">
          <span class="stat-label">本月收入</span>
          <span class="stat-val income">{{ totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 0 }) }}</span>
        </div>
        <div class="stat-item neumorph">
          <span class="stat-label">结余</span>
          <span class="stat-val balance">{{ (totalIncome - totalExpense).toLocaleString('zh-CN', { minimumFractionDigits: 0 }) }}</span>
        </div>
      </section>

      <!-- 功能菜单列表 -->
      <section class="menu-section">
        <!-- 页面显示开关：首页快捷分类(同时作为交易列表筛选) -->
        <div
          class="menu-row menu-toggle-row neumorph"
          @click="uiSettings.showCategoryFilter = !uiSettings.showCategoryFilter"
        >
          <div class="menu-left">
            <span class="menu-icon" :style="{ background: 'rgba(212,165,116,0.15)' }"><IconDisplay icon="Folder" :size="20" /></span>
            <div class="menu-label-stack">
              <span class="menu-label">首页分类筛选</span>
              <span class="menu-label-hint">{{ uiSettings.showCategoryFilter ? '已显示 · 关闭后首页将隐藏分类条' : '已隐藏 · 开启后首页将显示分类条' }}</span>
            </div>
          </div>
          <div class="menu-toggle" :class="{ on: uiSettings.showCategoryFilter }">
            <span class="menu-toggle-knob"></span>
          </div>
        </div>
        <!-- 深色模式开关 -->
        <div
          class="menu-row menu-toggle-row neumorph"
          @click="uiSettings.theme = uiSettings.theme === 'dark' ? 'light' : 'dark'"
        >
          <div class="menu-left">
            <span class="menu-icon" :style="{ background: 'rgba(110,110,130,0.15)' }"><IconDisplay :icon="uiSettings.theme === 'dark' ? 'Moon' : 'Sun'" :size="20" /></span>
            <div class="menu-label-stack">
              <span class="menu-label">深色模式</span>
              <span class="menu-label-hint">{{ uiSettings.theme === 'dark' ? '已开启 · 护眼深色主题' : '已关闭 · 开启后切换为深色主题' }}</span>
            </div>
          </div>
          <div class="menu-toggle" :class="{ on: uiSettings.theme === 'dark' }">
            <span class="menu-toggle-knob"></span>
          </div>
        </div>
        <!-- 资产卡片风格(三选一) -->
        <div class="menu-row neumorph style-picker-row">
          <div class="menu-left">
            <span class="menu-icon" :style="{ background: 'rgba(212,175,55,0.15)' }"><IconDisplay icon="Gem" :size="20" /></span>
            <div class="menu-label-stack">
              <span class="menu-label">资产卡片风格</span>
              <span class="menu-label-hint">顶部总值卡片的视觉风格 · 当前: {{ assetCardStyleLabel }}</span>
            </div>
          </div>
          <div class="style-picker">
            <button
              v-for="opt in assetCardStyleOptions"
              :key="opt.value"
              type="button"
              class="style-chip"
              :class="{ active: uiSettings.assetCardStyle === opt.value }"
              @click="uiSettings.assetCardStyle = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
        <div
          v-for="(item, idx) in menuItems"
          :key="item.label"
          class="menu-row neumorph"
          :style="{ animationDelay: idx * 0.05 + 's' }"
          @click="handleMenuClick(item)"
        >
          <div class="menu-left">
            <span class="menu-icon" :style="{ background: item.bgColor }"><IconDisplay :icon="getLucideIconName(item.icon)" :size="20" /></span>
            <span class="menu-label">{{ item.label }}</span>
          </div>
          <div class="menu-right">
            <span v-if="item.badge" class="menu-badge" :class="item.badgeType">{{ item.badge }}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-arrow">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- 版本信息 -->
      <footer class="app-footer">
        <span class="footer-text">轻记账 v2.0.0</span>
        <span class="footer-divider">·</span>
        <span class="footer-text">数据已本地保存</span>
      </footer>
    </motion.section>
    </AnimatePresence>

    <BottomTabBar v-model="activeTab" @add-click="openAddModal" />

    <!-- POS 记账弹窗 -->
    <PosReceiptModal
      :show="showAddModal"
      :form="posForm"
      :categories="categoryNames"
      @close="closeAddModal"
      @save="handlePosSave"
      @update:form="updatePosForm"
    />

    <!-- 功能弹窗 -->
    <BudgetModal
      :show="showBudget"
      :budget="budget.monthlyLimit"
      :transactions="transactions"
      @close="showBudget = false"
      @save="saveBudget"
    />
    <CategoryModal
      :show="showCategory"
      :categories="categories.slice(1)"
      :sub-categories="subCategories"
      @close="showCategory = false"
      @save="saveCategories"
    />
    <RecurringModal
      :show="showRecurring"
      :items="recurring"
      :categories="categories.slice(1)"
      :sub-categories="subCategories"
      :next-id="appData.nextRecurringId"
      @close="showRecurring = false"
      @add="addRecurring"
      @toggle="toggleRecurring"
      @remove="removeRecurring"
    />
    <ReminderModal
      :show="showReminder"
      :reminder="reminder"
      @close="showReminder = false"
      @save="saveReminder"
    />
    <SearchModal
      :show="showSearch"
      :transactions="transactions"
      @close="showSearch = false"
    />
    <DatePickerModal
      :show="showDatePicker"
      :year="selectedYear"
      :month="selectedMonth"
      @close="showDatePicker = false"
      @select="onDateSelect"
    />

    <!-- 提醒弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showReminderAlert" class="reminder-overlay" @click.self="showReminderAlert = false">
          <div class="reminder-card">
            <span class="reminder-emoji"><IconDisplay icon="Clock" :size="28" /></span>
            <h3 class="reminder-title">记账提醒</h3>
            <p class="reminder-text">今天还没有记账哦，快来记一笔吧！</p>
            <div class="reminder-actions">
              <button class="reminder-later" @click="showReminderAlert = false">稍后</button>
              <button class="reminder-now" @click="showReminderAlert = false; openAddModal()">记一笔</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { springs, useCountUp, STAGGER_STEP, vReveal } from './useAnimations'
import BottomTabBar from './components/BottomTabBar.vue'
import BalanceCard from './components/BalanceCard.vue'
import CategoryIcon from './components/CategoryIcon.vue'
import IconDisplay from './components/IconDisplay.vue'
import { Search, ChevronLeft, ChevronRight, BookOpen } from './utils/icons'
import { getLucideIconName } from './utils/emojiToLucide'
import BudgetModal from './components/BudgetModal.vue'
import CategoryModal from './components/CategoryModal.vue'
import RecurringModal from './components/RecurringModal.vue'
import ReminderModal from './components/ReminderModal.vue'
import SearchModal from './components/SearchModal.vue'
import DatePickerModal from './components/DatePickerModal.vue'
import DateCalendarPopover from './components/DateCalendarPopover.vue'
import QuickLog from './components/QuickLog.vue'
import AssetTab from './components/AssetTab.vue'
import PosReceiptModal from './components/PosReceiptModal.vue'
import { buildAssetFromTransaction } from './asset-utils'
import type { Transaction, Category, SubCategories, Budget, RecurringItem, ReminderSettings, AppData, UISettings, Asset, AssetCardStyle } from './types'
import { loadData, saveData, getStorage, todayStr, currentMonthKey, prevMonthKey, lastYearSameMonthKey, formatDisplayDate } from './storage'
import { shouldTriggerToday, recurringToTransaction, shouldShowReminder, markReminderShown, isReminderAlreadyShown } from './recurring'

// ========== 应用数据（从本地存储加载） ==========
const appData = ref<AppData>(loadData())

// ========== 响应式状态 ==========
// 当前首页所选年月（默认当月）
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const currentMonth = computed(() => selectedMonth.value + '月')
const currentYearNum = computed(() => selectedYear.value)
// 顶部问候语：按当前小时切换，昵称先复用「我的」页中的用户名
const userNickname = 'Lawrence'
const greetingText = computed(() => {
  const h = new Date().getHours()
  let word = '晚上好'
  if (h >= 5 && h <= 7) word = '早上好'
  else if (h >= 8 && h <= 11) word = '上午好'
  else if (h >= 12 && h <= 13) word = '中午好'
  else if (h >= 14 && h <= 17) word = '傍晚好'
  else if (h >= 18 && h <= 22) word = '晚上好'
  else word = '深夜好'
  return `${word}，${userNickname} 👋`
})
// 所选月份的 YYYY-MM key（驱动首页余额/预算/交易列表）
const selectedMonthKey = computed(
  () => `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
)
const showDatePicker = ref(false)
const hasNotification = ref(true)
const activeCategory = ref('全部')
const activeTab = ref('home')
const assetTabRef = ref<InstanceType<typeof AssetTab> | null>(null)
const showAddModal = ref(false)
const scrolled = ref(false)

// ========== 各页面独立滚动位置 ==========
const scrollPositions = reactive<Record<string, number>>({ home: 0, stats: 0, profile: 0 })

const onPageScroll = (e: Event) => {
  const el = e.target as HTMLElement
  scrolled.value = el.scrollTop > 8
  scrollPositions[activeTab.value] = el.scrollTop
}

// 从存储中恢复的数据
const transactions = ref<Transaction[]>(appData.value.transactions)
const categories = ref<Category[]>([{ name: '全部', icon: 'LayoutGrid' }, ...appData.value.categories])
const subCategories = ref<SubCategories>(appData.value.subCategories)
const budget = ref<Budget>(appData.value.budget)
const recurring = ref<RecurringItem[]>(appData.value.recurring)
const reminder = ref<ReminderSettings>(appData.value.reminder)
const uiSettings = ref<UISettings>(appData.value.uiSettings)

// 资产管理（直接映射 appData，便于 AssetTab 双向绑定）
const assets = computed(() => appData.value.assets)
const assetCategories = computed(() => appData.value.assetCategories)

// 主题切换：同步到 <html data-theme>
function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
}
applyTheme(uiSettings.value.theme)
watch(() => uiSettings.value.theme, (theme) => {
  applyTheme(theme)
})

// 切换 tab 后恢复该页面的滚动位置
watch(activeTab, () => {
  nextTick(() => {
    const el = document.querySelector('.page-shell') as HTMLElement | null
    if (el) {
      el.scrollTop = scrollPositions[activeTab.value] || 0
      scrolled.value = el.scrollTop > 8
    }
  })
})

// 实时统计（占位，真实初始化在 monthIncome/monthExpense 定义之后）
const totalIncome = ref(0)
const totalExpense = ref(0)

// 弹窗控制
const showBudget = ref(false)
const showCategory = ref(false)
const showRecurring = ref(false)
const showReminder = ref(false)
const showSearch = ref(false)
const showReminderAlert = ref(false)

// ========== 安卓硬件返回键处理 ==========
// 弹窗层级优先级（从最上层到最下层，排在前面的先关闭）
const modalLayerPriority = [
  { key: 'showReminderAlert', ref: () => showReminderAlert.value, close: () => { showReminderAlert.value = false } },
  { key: 'showAddModal', ref: () => showAddModal.value, close: () => { showAddModal.value = false } },
  { key: 'showBudget', ref: () => showBudget.value, close: () => { showBudget.value = false } },
  { key: 'showCategory', ref: () => showCategory.value, close: () => { showCategory.value = false } },
  { key: 'showRecurring', ref: () => showRecurring.value, close: () => { showRecurring.value = false } },
  { key: 'showReminder', ref: () => showReminder.value, close: () => { showReminder.value = false } },
  { key: 'showSearch', ref: () => showSearch.value, close: () => { showSearch.value = false } },
  { key: 'showDatePicker', ref: () => showDatePicker.value, close: () => { showDatePicker.value = false } },
]

function handleAndroidBackButton() {
  for (const modal of modalLayerPriority) {
    if (modal.ref()) {
      modal.close()
      return true
    }
  }
  return false
}

let backButtonListener: (() => void) | null = null

// ========== 自动保存到本地存储 ==========
watch([transactions, categories, subCategories, budget, recurring, reminder, uiSettings], () => {
  appData.value.transactions = transactions.value
  appData.value.categories = categories.value.slice(1)
  appData.value.subCategories = subCategories.value
  appData.value.budget = budget.value
  appData.value.recurring = recurring.value
  appData.value.reminder = reminder.value
  appData.value.uiSettings = uiSettings.value
  saveData(appData.value)
}, { deep: true })

// ========== 统计计算 ==========
const cmKey = currentMonthKey()

const monthIncome = computed(() =>
  transactions.value
    .filter(t => t.type === 'income' && t.date.startsWith(selectedMonthKey.value))
    .reduce((s, t) => s + t.amount, 0)
)

const monthExpense = computed(() =>
  transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(selectedMonthKey.value))
    .reduce((s, t) => s + t.amount, 0)
)

// 实时统计 —— 初始即用真实值，保证 balanceTarget 在挂载时已是终值，
// useCountUp(immediate) 才能从 0 滚到终值
totalIncome.value = monthIncome.value
totalExpense.value = monthExpense.value
// balanceTarget 直接派生自 monthIncome/monthExpense（computed 自动跟随 transactions），
// 避免 totalIncome/totalExpense ref 中间层导致的 watch 触发不可靠
const balanceTarget = computed(() => monthIncome.value - monthExpense.value)
// 余额数字滚动 —— useCountUp 自动跟随 balanceTarget 变化
const { display: animatedBalance } = useCountUp(balanceTarget, { duration: 900, decimals: 2, immediate: true, from: 0 })

// 预算使用率
const budgetUsage = computed(() => {
  if (budget.value.monthlyLimit <= 0) return 0
  return (monthExpense.value / budget.value.monthlyLimit) * 100
})

// 计算总收支（所有数据）
function recalcTotals() {
  totalIncome.value = monthIncome.value
  totalExpense.value = monthExpense.value
}

// 切换月份或交易变化时，自动刷新余额并触发动画
watch([monthIncome, monthExpense], () => {
  recalcTotals()
})

// ========== 统计页状态 ==========
type StatsPeriod = 'day' | 'week' | 'month' | 'year' | 'custom'
const statsPeriod = ref<StatsPeriod>('month')
const statsType = ref<'expense' | 'income'>('expense') // 用于分类构成（固定支出）

// 趋势图独立类型状态
const trendType = ref<'expense' | 'income' | 'compare'>('expense')

// 自定义日期范围：start/end 为 YYYY-MM-DD；null 表示未选
const customRange = ref<{ start: string; end: string } | null>(null)
const showCustomPicker = ref(false)

// —— 日期工具
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function getWeekRangeStr(today: Date): { start: string; end: string } {
  // 周一为周首
  const day = today.getDay()
  const diffToMon = (day + 6) % 7
  const start = new Date(today); start.setDate(today.getDate() - diffToMon)
  const end = new Date(start); end.setDate(start.getDate() + 6)
  return { start: toDateStr(start), end: toDateStr(end) }
}

// 趋势图分类筛选：null 表示全部，否则过滤后再绘制折线
const trendCategory = ref<string | null>(null)
const trendSubCategory = ref<string | null>(null)

function setTrendCategory(name: string | null) {
  trendCategory.value = name
  trendSubCategory.value = null
}

// 图表颜色
const chartColors: string[] = [
  '#e88b8b', '#7ecb7c', '#6bb8e3', '#f5a962',
  '#a78bfa', '#f472b6', '#38bdf8', '#c084fc', '#94a3b8',
]

// 表单
const form = reactive({
  type: 'expense' as 'expense' | 'income',
  amount: '',
  category: '餐饮',
  subCategory: '早餐',
  note: '',
  date: '',
  merchant: '',
  location: '',
  // 资产联动字段
  asAsset: false,
  assetCategory: '',
  assetLocation: '',
  assetOwner: '',
  assetUsefulLife: 5,
  assetSalvageRate: 0.1,
})

// 日期快捷选项：今天 / 昨天 / 前天
const dateQuickOptions = computed(() => {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const dayBefore = new Date(now); dayBefore.setDate(now.getDate() - 2)
  return [
    { label: '今天', date: fmt(now) },
    { label: '昨天', date: fmt(yesterday) },
    { label: '前天', date: fmt(dayBefore) },
  ]
})

// 日期日历 popover 显隐
const showDatePopover = ref(false)

function selectCategory(catName: string) {
  if (form.category === catName) return
  form.category = catName
  const subs = subCategories.value[catName]
  if (subs && subs.length > 0) {
    form.subCategory = subs[0]
  }
}

function selectSubCategory(subName: string) {
  form.subCategory = subName
}

const numKeys = ['1', '2', '3', '⌫', '4', '5', '6', '+', '7', '8', '9', '×', '0', '.', '✓']

// POS 弹窗适配
const categoryNames = computed(() => categories.value.slice(1).map(c => c.name))

const posForm = computed(() => ({
  type: form.type,
  amount: calcAmount(form.amount),
  category: form.category,
  subCategory: form.subCategory,
  merchant: form.merchant,
  location: form.location,
  note: form.note
}))

function updatePosForm(val: Partial<typeof posForm.value>) {
  if (val.type !== undefined) form.type = val.type
  if (val.amount !== undefined) form.amount = String(val.amount)
  if (val.category !== undefined) {
    form.category = val.category
    const subs = subCategories.value[val.category]
    if (subs && subs.length > 0) {
      form.subCategory = subs[0]
    }
  }
  if (val.subCategory !== undefined) form.subCategory = val.subCategory
  if (val.merchant !== undefined) form.merchant = val.merchant
  if (val.location !== undefined) form.location = val.location
  if (val.note !== undefined) form.note = val.note
}

function handlePosSave(tx: Partial<Transaction>) {
  if (!tx.amount) return

  const icon = getCategoryIcon(form.category)
  const newTx: Transaction = {
    id: appData.value.nextId++,
    name: form.note || form.category,
    category: form.category,
    subCategory: form.type === 'expense' ? form.subCategory : undefined,
    date: form.date || todayStr(),
    amount: tx.amount,
    type: form.type,
    icon,
    tag: form.type === 'income' ? '收入' : form.subCategory,
    merchant: form.merchant || undefined,
    location: form.location || undefined,
  }

  transactions.value.unshift(newTx)
  recalcTotals()
}

// 计算表达式
function calcAmount(amountStr: string): number {
  const lastChar = amountStr.slice(-1)
  if (lastChar === '+' || lastChar === '×' || lastChar === '.') {
    amountStr = amountStr.slice(0, -1)
  }
  const expr = amountStr.replace(/×/g, '*')
  if (/^[\d.+\-*]+$/.test(expr)) {
    try {
      const result = Function('"use strict";return (' + expr + ')')()
      return typeof result === 'number' && !isNaN(result) ? result : 0
    } catch {
      return 0
    }
  }
  return parseFloat(amountStr) || 0
}

const canSave = computed(() => {
  if (form.amount === '') return false
  const lastChar = form.amount.slice(-1)
  if (lastChar === '+' || lastChar === '×' || lastChar === '.') return false
  return calcAmount(form.amount) > 0 && form.category !== ''
})

// 余额动画现已由 useCountUp 自动驱动，无需手动调用

// ========== 交易数据 ==========
// 左滑删除/编辑交互
const swipedId = ref<number | null>(null)
const swipeOffsetX = ref(0)
const swiping = ref(false) // 是否正在拖动（控制 transition 开关）
const SWIPE_ACTION_WIDTH = 156 // 操作区总宽度（含 padding+gap+两按钮）
const SWIPE_DELETE_TRIGGER = 230 // 继续滑动到此距离触发直接删除
const SWIPE_TRIGGER = 40 // 触发展开的阈值
const SWIPE_DELETE_REGION = SWIPE_DELETE_TRIGGER - SWIPE_ACTION_WIDTH // 删除额外滑动区域(74px)

// 是否进入"直接删除"区域
const inDeleteZone = ref(false)
// 正在执行删除动画的项 id（用于高度坍缩）
const deletingId = ref<number | null>(null)

let swipeStartX = 0
let swipeStartY = 0
let swipeStartOffset = 0 // 按下时的偏移量（支持从已展开状态继续滑动）
let swipeCurrentId: number | null = null
let swipeDragging = false
let swipeMoved = false

function onSwipeStart(e: PointerEvent, id: number) {
  swipeStartX = e.clientX
  swipeStartY = e.clientY
  // 记录起始偏移：若该项已展开，则从 -SWIPE_ACTION_WIDTH 开始
  swipeStartOffset = swipedId.value === id ? -SWIPE_ACTION_WIDTH : 0
  swipeCurrentId = id
  swipeDragging = true
  swipeMoved = false
  swiping.value = true
  inDeleteZone.value = false
  // 阻止默认滚动行为
  e.preventDefault()
}

function onSwipeMove(e: PointerEvent) {
  if (!swipeDragging || swipeCurrentId === null) return
  const dx = e.clientX - swipeStartX
  const dy = e.clientY - swipeStartY
  // 垂直滑动不处理
  if (Math.abs(dy) > Math.abs(dx) && !swipeMoved) {
    return
  }
  // 横向滑动时阻止默认行为（防止抽屉滚动）
  if (Math.abs(dx) > Math.abs(dy)) {
    e.preventDefault()
  }
  swipeMoved = true
  // 基于起始偏移 + 本轮位移计算，直接跟手
  let offset = swipeStartOffset + dx
  // 限制范围：[-SWIPE_DELETE_TRIGGER, 0]
  if (offset > 0) offset = 0
  if (offset < -SWIPE_DELETE_TRIGGER) offset = -SWIPE_DELETE_TRIGGER
  swipeOffsetX.value = offset
  swipedId.value = swipeCurrentId
  inDeleteZone.value = offset <= -SWIPE_ACTION_WIDTH - 10
}

function onSwipeEnd() {
  if (!swipeDragging) return
  swipeDragging = false
  swiping.value = false
  if (swipeCurrentId === null) return

  if (swipeMoved) {
    const offset = swipeOffsetX.value
    if (offset <= -SWIPE_DELETE_TRIGGER) {
      // 超过删除阈值 → 三阶段删除动画
      const idToDelete = swipeCurrentId
      const txToDelete = transactions.value.find(t => t.id === idToDelete)
      inDeleteZone.value = false
      swipeCurrentId = null
      swiping.value = false
      // 阶段1：卡片滑出屏幕 + 删除按钮扩展到 100%
      swipeOffsetX.value = -500
      // 阶段2：300ms 后开始高度坍缩
      // 保持 swipedId 和 swipeOffsetX 不变，让删除按钮继续撑满显示
      setTimeout(() => {
        const el = document.querySelector(`.tx-swipe-wrap[data-tx-id="${idToDelete}"]`) as HTMLElement
        if (el) {
          el.style.height = el.offsetHeight + 'px'
          void el.offsetHeight
        }
        deletingId.value = idToDelete
        requestAnimationFrame(() => {
          if (el) el.style.height = '0px'
        })
      }, 300)
      // 阶段3：高度坍缩动画结束后才清除状态并删除数据
      setTimeout(() => {
        deletingId.value = null
        swipedId.value = null
        swipeOffsetX.value = 0
        if (txToDelete) deleteTransaction(txToDelete.id)
      }, 650)
      return
    } else if (offset <= -SWIPE_TRIGGER) {
      // 回弹到展开状态
      swipedId.value = swipeCurrentId
      swipeOffsetX.value = -SWIPE_ACTION_WIDTH
    } else {
      swipedId.value = null
      swipeOffsetX.value = 0
    }
  } else {
    // 未滑动（点击）：收起其他展开项
    if (swipedId.value !== null && swipedId.value !== swipeCurrentId) {
      swipedId.value = null
      swipeOffsetX.value = 0
    }
  }
  inDeleteZone.value = false
  swipeCurrentId = null
}

// 滑动进度 0~1（操作区），用于驱动按钮拉伸与内容缩放
const swipeProgress = computed(() => {
  return Math.min(1, Math.abs(swipeOffsetX.value) / SWIPE_ACTION_WIDTH)
})

// 删除区域进度 0~1（超过操作区后）
const deleteProgress = computed(() => {
  const over = Math.abs(swipeOffsetX.value) - SWIPE_ACTION_WIDTH
  if (over <= 0) return 0
  return Math.min(1, over / SWIPE_DELETE_REGION)
})

// 卡片位移样式
function cardStyle(id: number) {
  const offset = swipedId.value === id ? swipeOffsetX.value : 0
  return { transform: `translateX(${offset}px)` }
}

// 操作区显隐：滑出阶段也保持可见，且撑满整行
function actionsStyle(id: number) {
  const isActive = swipedId.value === id || (swiping.value && swipeCurrentId === id)
  const isSlidingOut = swipedId.value === id && !swiping.value && swipeOffsetX.value < -SWIPE_ACTION_WIDTH
  return {
    opacity: isActive ? 1 : 0,
    width: isSlidingOut ? '100%' : undefined,
    padding: isSlidingOut ? '0' : undefined,
    gap: isSlidingOut ? '0' : undefined,
  }
}

// 按钮宽度：编辑按钮在删除区域淡出，删除按钮在删除区域扩大
function btnStyle(id: number, index: number) {
  let progress = 0
  let isDeleteZone = false
  let delProgress = 0
  // 滑出阶段（swipedId 仍指向该项但 swiping 已结束且 offset 很负）
  const isSlidingOut = swipedId.value === id && !swiping.value && swipeOffsetX.value < -SWIPE_ACTION_WIDTH
  if (swipedId.value === id) {
    progress = swiping.value && swipeCurrentId === id ? swipeProgress.value : 1
    isDeleteZone = (swiping.value && swipeCurrentId === id && inDeleteZone.value) || isSlidingOut
    delProgress = swiping.value && swipeCurrentId === id ? deleteProgress.value : (isSlidingOut ? 1 : 0)
  } else if (swiping.value && swipeCurrentId === id) {
    progress = swipeProgress.value
    isDeleteZone = inDeleteZone.value
    delProgress = deleteProgress.value
  }
  // 后一个按钮（删除）稍微延迟拉伸，形成错落感
  const delayed = index === 1 ? Math.max(0, (progress - 0.35) / 0.65) : progress

  if (index === 0) {
    // 编辑按钮：进入删除区域后收缩消失
    const editWidth = 70 * delayed * (1 - delProgress)
    return {
      width: `${editWidth}px`,
      opacity: 1 - delProgress,
      marginRight: `${4 * (1 - delProgress)}px`,
    }
  } else {
    // 删除按钮：进入删除区域后扩大，撑满操作区；滑出阶段撑满整行
    if (isSlidingOut) {
      return { width: '100%', borderRadius: '0' }
    }
    const expand = 70 + 80 * delProgress // 70 → 150
    return { width: `${isDeleteZone ? expand : 70 * delayed}px` }
  }
}

// 按钮内容缩放与透明度
function innerStyle(id: number, index: number) {
  let progress = 0
  let delProgress = 0
  if (swipedId.value === id) {
    progress = swiping.value && swipeCurrentId === id ? swipeProgress.value : 1
    delProgress = swiping.value && swipeCurrentId === id ? deleteProgress.value : 0
  } else if (swiping.value && swipeCurrentId === id) {
    progress = swipeProgress.value
    delProgress = deleteProgress.value
  }
  // 删除按钮在删除区域显示"确认删除"
  return {
    transform: `scale(${0.5 + 0.5 * progress})`,
    opacity: index === 0 ? progress * (1 - delProgress) : progress,
  }
}

// 删除按钮文字：进入删除区域后变为"松手删除"
function deleteLabel(id: number): string {
  if ((swiping.value && swipeCurrentId === id && inDeleteZone.value) || deleteProgress.value > 0.5) {
    return '松手删除'
  }
  return '删除'
}

function onSwipeEdit(tx: Transaction) {
  swipedId.value = null
  swipeOffsetX.value = 0
  openEditModal(tx)
}

function onSwipeDelete(tx: Transaction) {
  swipedId.value = null
  swipeOffsetX.value = 0
  deleteTransaction(tx.id)
}

const filteredTransactions = computed(() => {
  const list = [...transactions.value]
    .filter(t => t.date.startsWith(selectedMonthKey.value))
    .sort((a, b) => b.id - a.id)
  if (activeCategory.value === '全部') return list
  return list.filter(t => t.category === activeCategory.value)
})

// ========== 按日期分组(展示给用户)，并标记今天/昨天/更早 ==========
interface TxGroup {
  date: string          // YYYY-MM-DD
  label: string         // 今天 / 昨天 / MM/DD (周x)
  items: typeof filteredTransactions.value
  totalText: string     // 该组小计,展示在分组标题右侧
}

function weekdayCN(dateStr: string): string {
  const wd = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(dateStr + 'T00:00:00')
  return '周' + wd[d.getDay()]
}

function dateLabel(dateStr: string, today: string): string {
  if (dateStr === today) return '今天'
  const t = new Date(today + 'T00:00:00').getTime()
  const d = new Date(dateStr + 'T00:00:00').getTime()
  const diffDays = Math.round((t - d) / (24 * 3600 * 1000))
  if (diffDays === 1) return '昨天'
  if (diffDays === 2) return '前天'
  // 其余用 MM/DD (周X)
  const m = dateStr.substring(5, 7)
  const day = dateStr.substring(8, 10)
  return `${parseInt(m)}/${parseInt(day)} · ${weekdayCN(dateStr)}`
}

const transactionGroups = computed<TxGroup[]>(() => {
  const today = todayStr()
  const map = new Map<string, typeof filteredTransactions.value>()
  for (const tx of filteredTransactions.value) {
    const arr = map.get(tx.date) || []
    arr.push(tx)
    map.set(tx.date, arr)
  }
  // 按日期倒序
  const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1))
  return dates.map(date => {
    const items = map.get(date) || []
    let expense = 0, income = 0
    for (const t of items) {
      if (t.type === 'expense') expense += t.amount
      else income += t.amount
    }
    const parts: string[] = []
    if (income > 0) parts.push('收 ¥' + income.toFixed(0))
    if (expense > 0) parts.push('支 ¥' + expense.toFixed(0))
    return {
      date,
      label: dateLabel(date, today),
      items,
      totalText: parts.join('  ·  '),
    }
  })
})

// 月份切换箭头
function shiftMonth(delta: number) {
  let m = selectedMonth.value + delta
  let y = selectedYear.value
  if (m < 1) { m = 12; y -= 1 }
  else if (m > 12) { m = 1; y += 1 }
  selectedMonth.value = m
  selectedYear.value = y
}

// ========== 统计数据 ==========

const statsFilteredTxs = computed(() => {
  const now = new Date()
  const todayDateStr = todayStr()

  if (statsPeriod.value === 'day') {
    return transactions.value.filter(t => t.type === statsType.value && t.date === todayDateStr)
  }
  if (statsPeriod.value === 'week') {
    // 最近7天
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const weekAgoStr = toDateStr(weekAgo)
    return transactions.value.filter(t => t.type === statsType.value && t.date >= weekAgoStr && t.date <= todayDateStr)
  }
  if (statsPeriod.value === 'month') {
    const currentMonthStr = cmKey
    return transactions.value.filter(
      t => t.type === statsType.value && t.date.startsWith(currentMonthStr)
    )
  }
  if (statsPeriod.value === 'year') {
    const yearStr = String(now.getFullYear())
    return transactions.value.filter(t => t.type === statsType.value && t.date.startsWith(yearStr))
  }
  // custom
  if (statsPeriod.value === 'custom' && customRange.value) {
    const { start, end } = customRange.value
    return transactions.value.filter(t => t.type === statsType.value && t.date >= start && t.date <= end)
  }
  return []
})

const statsTotal = computed(() =>
  statsFilteredTxs.value.reduce((sum, t) => sum + t.amount, 0)
)
const statsCount = computed(() => statsFilteredTxs.value.length)

const statsAvgPerDay = computed(() => {
  let days = 30
  if (statsPeriod.value === 'day') days = 1
  else if (statsPeriod.value === 'week') days = 7
  else if (statsPeriod.value === 'month') days = 30
  else if (statsPeriod.value === 'year') days = 365
  else if (statsPeriod.value === 'custom' && customRange.value) {
    const s = parseDate(customRange.value.start).getTime()
    const e = parseDate(customRange.value.end).getTime()
    days = Math.max(1, Math.round((e - s) / 86400000) + 1)
  }
  return days > 0 ? statsTotal.value / days : 0
})

// 统计页数字滚动 —— 切换类型/周期时平滑过渡
const { display: statsTotalDisp } = useCountUp(statsTotal, { duration: 700, decimals: 2 })
const { display: statsCountDisp } = useCountUp(statsCount, { duration: 500, decimals: 0 })
const { display: statsAvgDisp } = useCountUp(statsAvgPerDay, { duration: 700, decimals: 0 })

// ========== Hero 区域数据（与 statsPeriod 解耦的计算） ==========

// 上一期（等长、等类型）—— 用于同比环比 / 日均差 / 笔数差
const prevPeriodTxs = computed(() => {
  if (statsFilteredTxs.value.length === 0 && statsPeriod.value !== 'custom') {
    // 即使当前没有数据也要正确返回空
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let start: Date, end: Date
  if (statsPeriod.value === 'day') {
    end = new Date(today); end.setDate(today.getDate() - 1)
    start = new Date(end)
  } else if (statsPeriod.value === 'week') {
    end = new Date(today); end.setDate(today.getDate() - 7)
    start = new Date(today); start.setDate(today.getDate() - 13)
  } else if (statsPeriod.value === 'month') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    end = new Date(today.getFullYear(), today.getMonth(), 0)
  } else if (statsPeriod.value === 'year') {
    start = new Date(today.getFullYear() - 1, 0, 1)
    end = new Date(today.getFullYear() - 1, 11, 31)
  } else {
    if (!customRange.value) return []
    const cs = parseDate(customRange.value.start)
    const ce = parseDate(customRange.value.end)
    const days = Math.max(1, Math.round((ce.getTime() - cs.getTime()) / 86400000) + 1)
    end = new Date(cs); end.setDate(cs.getDate() - 1)
    start = new Date(cs); start.setDate(cs.getDate() - days)
  }
  const sKey = toDateStr(start)
  const eKey = toDateStr(end)
  return transactions.value.filter(
    t => t.type === statsType.value && t.date >= sKey && t.date <= eKey,
  )
})

const prevPeriodTotal = computed(() =>
  prevPeriodTxs.value.reduce((s, t) => s + t.amount, 0),
)
const prevPeriodCount = computed(() => prevPeriodTxs.value.length)
const prevPeriodDays = computed(() => {
  if (prevPeriodTxs.value.length === 0) return 1
  const dates = new Set(prevPeriodTxs.value.map(t => t.date))
  return Math.max(1, dates.size)
})
const prevPeriodAvg = computed(() => prevPeriodTotal.value / prevPeriodDays.value)

// 单笔最高
const statsMaxAmount = computed(() =>
  statsFilteredTxs.value.reduce((m, t) => Math.max(m, t.amount), 0),
)

// 笔数差 / 日均差
const statsCountDelta = computed(() => statsCount.value - prevPeriodCount.value)
const statsAvgDelta = computed(() => statsAvgPerDay.value - prevPeriodAvg.value)

// 周期对比标签
const statsPeriodCompareLabel = computed(() => {
  const p = statsPeriod.value
  if (p === 'day') return '较昨日'
  if (p === 'week') return '较上周'
  if (p === 'month') return '较上月'
  if (p === 'year') return '较去年'
  return '较上期'
})

// 格式化百分比变化（统一接口：up=红/down=绿/flat=灰）
function formatPctChange(curr: number, prev: number): { text: string; cls: 'up' | 'down' | 'flat' } {
  if (prev === 0) {
    return { text: curr > 0 ? '新增' : '持平', cls: curr > 0 ? 'up' : 'flat' }
  }
  const pct = ((curr - prev) / prev) * 100
  if (Math.abs(pct) < 0.1) return { text: '持平', cls: 'flat' }
  return {
    text: `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`,
    cls: pct > 0 ? 'up' : 'down',
  }
}

const statsPeriodChange = computed(() =>
  formatPctChange(statsTotal.value, prevPeriodTotal.value),
)
const statsAvgChange = computed(() =>
  formatPctChange(statsAvgPerDay.value, prevPeriodAvg.value),
)
const statsCountChange = computed(() =>
  formatPctChange(statsCount.value, prevPeriodCount.value),
)

// —— 预算（沿用全局月度预算）
const budgetAmount = computed(() => budget.value.monthlyLimit)
const budgetRemain = computed(() => Math.max(0, budgetAmount.value - monthExpense.value))
const budgetWarnLevel = computed(() => {
  if (budget.value.monthlyLimit <= 0) return 'flat'
  const pct = (monthExpense.value / budget.value.monthlyLimit) * 100
  if (pct >= 100) return 'over'
  if (pct >= 80) return 'warn'
  return 'flat'
})

// —— 储蓄率 / 结余（基于当月）
const statsBalance = computed(() => monthIncome.value - monthExpense.value)
const statsSavingRate = computed(() => {
  if (monthIncome.value <= 0) return 0
  return Math.max(0, Math.min(100, (statsBalance.value / monthIncome.value) * 100))
})

// —— 月度剩余天数
const daysRemainingInMonth = computed(() => {
  const today = new Date()
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return Math.max(0, last - today.getDate())
})

// —— AI 异常洞察：找出环比涨幅最大的分类
const statsInsight = computed<{ title: string; desc: string } | null>(() => {
  if (statsType.value !== 'expense') return null
  if (statsPeriod.value !== 'month' && statsPeriod.value !== 'week') return null
  if (prevPeriodTxs.value.length === 0 || statsFilteredTxs.value.length === 0) return null

  const curMap = new Map<string, number>()
  for (const tx of statsFilteredTxs.value) {
    curMap.set(tx.category, (curMap.get(tx.category) || 0) + tx.amount)
  }
  const prevMap = new Map<string, number>()
  for (const tx of prevPeriodTxs.value) {
    prevMap.set(tx.category, (prevMap.get(tx.category) || 0) + tx.amount)
  }

  let bestCat = ''
  let bestDelta = 0
  let bestCur = 0
  for (const [cat, cur] of curMap) {
    const prev = prevMap.get(cat) || 0
    if (cur > prev && prev > 0) {
      const delta = ((cur - prev) / prev) * 100
      if (delta > bestDelta) {
        bestDelta = delta
        bestCat = cat
        bestCur = cur
      }
    }
  }
  // 也对比总盘：当前周期总支出 vs 上一周期
  if (!bestCat || bestDelta < 25) {
    const totalDelta = prevPeriodTotal.value > 0
      ? ((statsTotal.value - prevPeriodTotal.value) / prevPeriodTotal.value) * 100
      : 0
    if (totalDelta >= 30) {
      return {
        title: '消费节奏偏快',
        desc: `${statsPeriodLabel.value}支出 ¥${statsTotal.value.toFixed(0)}，较上期 ↑${totalDelta.toFixed(0)}%。建议关注非必要支出。`,
      }
    }
    return null
  }
  return {
    title: '发现一处异常',
    desc: `${statsPeriodLabel.value}${bestCat}支出 ¥${bestCur.toFixed(0)}，较上期 ↑${bestDelta.toFixed(0)}%。建议查看订单明细。`,
  }
})

// ========== 同比环比分析 ==========
const comparePeriodLabel = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

function calcChange(current: number, prev: number): { text: string; cls: string } {
  if (prev === 0) {
    return { text: current > 0 ? '新增' : '持平', cls: current > 0 ? 'bad' : 'flat' }
  }
  const pct = ((current - prev) / prev) * 100
  if (Math.abs(pct) < 0.1) return { text: '持平', cls: 'flat' }
  const sign = pct > 0 ? '↑' : '↓'
  return { text: `${sign} ${Math.abs(pct).toFixed(1)}%`, cls: pct > 0 ? 'bad' : 'good' }
}

// 本月支出
const currentMonthExpense = computed(() =>
  transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(cmKey))
    .reduce((s, t) => s + t.amount, 0)
)

// 上月支出
const prevMonthExpense = computed(() =>
  transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(prevMonthKey()))
    .reduce((s, t) => s + t.amount, 0)
)

// 当前所选月份的"上一月"支出(响应 selectedMonthKey,用于 BalanceCard 趋势对比)
const prevSelectedMonthExpense = computed(() => {
  const [y, m] = selectedMonthKey.value.split('-').map(Number)
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  const prevKey = `${py}-${String(pm).padStart(2, '0')}`
  return transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(prevKey))
    .reduce((s, t) => s + t.amount, 0)
})

// 去年同月支出
const lastYearExpense = computed(() =>
  transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(lastYearSameMonthKey()))
    .reduce((s, t) => s + t.amount, 0)
)

const momCompare = computed(() => calcChange(currentMonthExpense.value, prevMonthExpense.value))
const yoyCompare = computed(() => calcChange(currentMonthExpense.value, lastYearExpense.value))

// ========== 分类聚合 ==========
interface CategoryStats {
  name: string
  icon: string
  amount: number
  count: number
  percent: number
  color: string
}

const categoryStatsList = computed<CategoryStats[]>(() => {
  const map = new Map<string, { amount: number; count: number }>()
  for (const tx of statsFilteredTxs.value) {
    const cur = map.get(tx.category) || { amount: 0, count: 0 }
    map.set(tx.category, { amount: cur.amount + tx.amount, count: cur.count + 1 })
  }

  const list: CategoryStats[] = []
  let idx = 0
  for (const [name, val] of map) {
    const catInfo = categories.value.find(c => c.name === name)
    list.push({
      name,
      icon: catInfo?.icon ?? 'Package',
      amount: val.amount,
      count: val.count,
      percent: statsTotal.value > 0 ? val.amount / statsTotal.value : 0,
      color: chartColors[idx++ % chartColors.length],
    })
  }
  return list.sort((a, b) => b.amount - a.amount)
})

// ========== 大类展开：二级分类明细 ==========
// 使用 Set 支持「全部展开/收起」
const expandedCategories = ref<Set<string>>(new Set())

function isCategoryExpanded(name: string): boolean {
  return expandedCategories.value.has(name)
}

function toggleCategory(name: string) {
  const next = new Set(expandedCategories.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  expandedCategories.value = next
}

const allCategoriesExpanded = computed(() => {
  const list = categoryStatsList.value
  if (list.length === 0) return false
  return list.every(c => expandedCategories.value.has(c.name))
})

function toggleAllCategories() {
  const list = categoryStatsList.value
  if (list.length === 0) return
  const next = new Set(expandedCategories.value)
  if (allCategoriesExpanded.value) {
    next.clear()
  } else {
    for (const c of list) next.add(c.name)
  }
  expandedCategories.value = next
}

// 切换统计维度时收起展开项
watch([statsType, statsPeriod], () => {
  expandedCategories.value = new Set()
})

// 颜色加深工具：用于 icon 颜色 + 进度条末端
function darkenHex(hex: string, amount = 0.2): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))))
  const to = (v: number) => v.toString(16).padStart(2, '0')
  return `#${to(f(r))}${to(f(g))}${to(f(b))}`
}

// 周期 chip 显示文本
const statsPeriodLabel = computed(() => {
  const p = statsPeriod.value
  if (p === 'day') return '今日'
  if (p === 'week') return '本周'
  if (p === 'month') return '本月'
  if (p === 'year') return '本年'
  if (p === 'custom' && customRange.value) {
    const s = customRange.value.start
    const e = customRange.value.end
    // 简化：同年显示 MM-dd - MM-dd；跨年显示 yyyy-MM-dd
    const sy = s.substring(0, 4)
    const ey = e.substring(0, 4)
    if (sy === ey) return `${s.substring(5)} ~ ${e.substring(5)}`
    return `${s} ~ ${e}`
  }
  return '自定义'
})

// ============ 自定义日期范围弹窗 ============
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS_FULL = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']

const pickingTarget = ref<'start' | 'end'>('start')
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const activeQuickKey = ref<string>('last30')

const quickRangeOptions = [
  { key: 'today',     label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'thisWeek',  label: '本周' },
  { key: 'lastWeek',  label: '上周' },
  { key: 'last7',     label: '近 7 天' },
  { key: 'last30',    label: '近 30 天' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'thisYear',  label: '今年' },
] as const

type QuickKey = typeof quickRangeOptions[number]['key']

function openCustomPicker() {
  // 若尚未设置范围，给个默认值：近 30 天
  if (!customRange.value) {
    applyQuickRangeInternal('last30', /*silent*/ true)
    activeQuickKey.value = 'last30'
  }
  const ref = customRange.value
  if (ref) {
    const [y, m] = ref.start.split('-').map(Number)
    calYear.value = y
    calMonth.value = m - 1
  }
  pickingTarget.value = 'start'
  showCustomPicker.value = true
}

function closeCustomPicker() {
  showCustomPicker.value = false
}

function formatMd(yyyyMmDd: string): string {
  // '2026-11-08' -> '11/08'
  return yyyyMmDd.substring(5).replace('-', '/')
}

function applyQuickRange(key: QuickKey) {
  activeQuickKey.value = key
  applyQuickRangeInternal(key, false)
  // 同步日历到 start 月
  if (customRange.value) {
    const [y, m] = customRange.value.start.split('-').map(Number)
    calYear.value = y
    calMonth.value = m - 1
  }
  pickingTarget.value = 'start'
}

function applyQuickRangeInternal(key: QuickKey, _silent: boolean) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const t = toDateStr(today)
  let s = t, e = t
  if (key === 'today') {
    s = t; e = t
  } else if (key === 'yesterday') {
    const y = new Date(today); y.setDate(today.getDate() - 1)
    s = toDateStr(y); e = s
  } else if (key === 'thisWeek') {
    const r = getWeekRangeStr(today)
    s = r.start; e = r.end
  } else if (key === 'lastWeek') {
    const r = getWeekRangeStr(today)
    const ss = parseDate(r.start); ss.setDate(ss.getDate() - 7)
    const ee = parseDate(r.end); ee.setDate(ee.getDate() - 7)
    s = toDateStr(ss); e = toDateStr(ee)
  } else if (key === 'last7') {
    const ss = new Date(today); ss.setDate(today.getDate() - 6)
    s = toDateStr(ss); e = t
  } else if (key === 'last30') {
    const ss = new Date(today); ss.setDate(today.getDate() - 29)
    s = toDateStr(ss); e = t
  } else if (key === 'thisMonth') {
    s = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    e = toDateStr(last)
  } else if (key === 'lastMonth') {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    s = toDateStr(lastMonth)
    const last = new Date(today.getFullYear(), today.getMonth(), 0)
    e = toDateStr(last)
  } else if (key === 'thisYear') {
    s = `${today.getFullYear()}-01-01`
    e = `${today.getFullYear()}-12-31`
  }
  customRange.value = { start: s, end: e }
}

function calPrevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11
    calYear.value -= 1
  } else {
    calMonth.value -= 1
  }
}
function calNextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0
    calYear.value += 1
  } else {
    calMonth.value += 1
  }
}

interface CalCell {
  key: string
  day: number
  inMonth: boolean
  isToday: boolean
  isStart: boolean
  isEnd: boolean
  inRange: boolean
  dateStr: string
}

const calCells = computed<CalCell[]>(() => {
  const cells: CalCell[] = []
  const first = new Date(calYear.value, calMonth.value, 1)
  const firstWeekday = first.getDay()
  const lastDate = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const prevLast = new Date(calYear.value, calMonth.value, 0).getDate()
  const today = new Date()
  const todayKey = toDateStr(today)
  const range = customRange.value
  const sKey = range?.start
  const eKey = range?.end
  const sMs = sKey ? parseDate(sKey).getTime() : null
  const eMs = eKey ? parseDate(eKey).getTime() : null

  // 上月补位
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevLast - i
    const m = calMonth.value === 0 ? 12 : calMonth.value
    const y = calMonth.value === 0 ? calYear.value - 1 : calYear.value
    cells.push({
      key: `p-${y}-${m}-${day}`,
      day, inMonth: false, isToday: false, isStart: false, isEnd: false, inRange: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    })
  }
  // 当月
  for (let d = 1; d <= lastDate; d++) {
    const ds = `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const t = new Date(calYear.value, calMonth.value, d).getTime()
    const isStart = sKey === ds
    const isEnd = eKey === ds
    const inRange = sMs !== null && eMs !== null && t > sMs && t < eMs
    cells.push({
      key: `c-${ds}`,
      day: d,
      inMonth: true,
      isToday: todayKey === ds,
      isStart, isEnd, inRange,
      dateStr: ds,
    })
  }
  // 下月补位到 6 行
  const used = firstWeekday + lastDate
  const remain = (7 - (used % 7)) % 7
  for (let i = 1; i <= remain; i++) {
    const m = calMonth.value === 11 ? 1 : calMonth.value + 2
    const y = calMonth.value === 11 ? calYear.value + 1 : calYear.value
    cells.push({
      key: `n-${y}-${m}-${i}`,
      day: i, inMonth: false, isToday: false, isStart: false, isEnd: false, inRange: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    })
  }
  return cells
})

function pickDate(dateStr: string) {
  if (!customRange.value) {
    customRange.value = { start: dateStr, end: dateStr }
    pickingTarget.value = 'end'
    activeQuickKey.value = ''
    return
  }
  if (pickingTarget.value === 'start') {
    customRange.value = { start: dateStr, end: dateStr }
    pickingTarget.value = 'end'
  } else {
    const s = customRange.value.start
    if (dateStr < s) {
      customRange.value = { start: dateStr, end: s }
    } else {
      customRange.value = { start: s, end: dateStr }
    }
    pickingTarget.value = 'start'
  }
  activeQuickKey.value = ''
}

function resetCustomRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ss = new Date(today); ss.setDate(today.getDate() - 29)
  customRange.value = { start: toDateStr(ss), end: toDateStr(today) }
  calYear.value = today.getFullYear()
  calMonth.value = today.getMonth()
  pickingTarget.value = 'start'
  activeQuickKey.value = 'last30'
}

function confirmCustomRange() {
  if (!customRange.value) {
    resetCustomRange()
  }
  statsPeriod.value = 'custom'
  closeCustomPicker()
}

interface SubcategoryStat {
  name: string
  amount: number
  count: number
  percent: number
}

function getSubcategoryStats(categoryName: string): SubcategoryStat[] {
  const txs = statsFilteredTxs.value.filter(t => t.category === categoryName)
  const map = new Map<string, { amount: number; count: number }>()
  for (const tx of txs) {
    const key = tx.subCategory || tx.tag || '其他'
    const cur = map.get(key) || { amount: 0, count: 0 }
    map.set(key, { amount: cur.amount + tx.amount, count: cur.count + 1 })
  }
  const total = txs.reduce((s, t) => s + t.amount, 0)
  return Array.from(map.entries())
    .map(([name, val]) => ({
      name,
      amount: val.amount,
      count: val.count,
      percent: total > 0 ? val.amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// 环形饼图 conic-gradient
const donutGradient = computed(() => {
  if (categoryStatsList.value.length === 0)
    return 'conic-gradient(#e5e7eb 0% 100%)'
  let acc = 0
  const stops: string[] = []
  for (const cat of categoryStatsList.value) {
    const start = acc * 100
    acc += cat.percent
    const end = Math.min(acc * 100, 100)
    stops.push(`${cat.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`)
  }
  return `conic-gradient(${stops.join(', ')})`
})

// 饼图 SVG 弧段 —— 用于 pathLength 描边绘制动画
const donutSegments = computed(() => {
  const cx = 50, cy = 50, r = 40
  let acc = 0
  return categoryStatsList.value.map(cat => {
    const a1 = (acc * 360 - 90) * Math.PI / 180
    const a2 = ((acc + cat.percent) * 360 - 90) * Math.PI / 180
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const large = (cat.percent * 360) > 180 ? 1 : 0
    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
    acc += cat.percent
    return { name: cat.name, color: cat.color, d }
  })
})

// 饼图指示线坐标计算
interface DonutLabel {
  name: string
  color: string
  icon: string
  x1: number; y1: number
  x2: number; y2: number
  x3: number; y3: number
  labelX: number; labelY: number
  side: 'left' | 'right'
}

const donutLabels = computed<DonutLabel[]>(() => {
  const labels: DonutLabel[] = []
  let acc = 0
  const cx = 170, cy = 140
  const R = 85
  const outerR = R + 2
  const elbowR = R + 10
  const lineLen = 16

  for (const cat of categoryStatsList.value) {
    const startDeg = acc * 360 - 90
    const midDeg = startDeg + cat.percent * 180
    const rad = midDeg * Math.PI / 180

    const x1 = cx + outerR * Math.cos(rad),  y1 = cy + outerR * Math.sin(rad)
    const x2 = cx + elbowR * Math.cos(rad),  y2 = cy + elbowR * Math.sin(rad)

    const isLeft = midDeg > 90 && midDeg < 270
    const x3 = x2 + (isLeft ? -lineLen : lineLen)

    const labelX = isLeft ? x3 - 56 : x3 + 4
    const labelY = y2 - 9

    labels.push({
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      x1, y1, x2, y2, x3, y3: y2,
      labelX, labelY,
      side: isLeft ? 'left' : 'right',
    })
    acc += cat.percent
  }
  return labels
})

// ========== 趋势数据 ==========
interface TrendData {
  label: string
  income: number
  expense: number
}

// ========== 每日趋势柱状图（与 statsPeriod 对齐） ==========
const TREND_W = 360
const TREND_H = 110
const TREND_PAD_X = 28
const TREND_PAD_R = 12
const TREND_PAD_T = 12
const TREND_PAD_B = 18

// 1) 每日聚合 map（按日期）
const trendDailyMap = computed(() => {
  const map = new Map<string, { income: number; expense: number }>()
  const catFilter = trendCategory.value
  const subFilter = trendSubCategory.value
  for (const tx of transactions.value) {
    if (catFilter && tx.category !== catFilter) continue
    if (subFilter && tx.subCategory !== subFilter) continue
    const e = map.get(tx.date) || { income: 0, expense: 0 }
    if (tx.type === 'income') e.income += tx.amount
    else e.expense += tx.amount
    map.set(tx.date, e)
  }
  return map
})

// 2) 周期 → 一组柱子
interface TrendBar {
  label: string       // X 轴显示文本
  date: string        // YYYY-MM-DD（用于 tooltip）
  income: number
  expense: number
}

const trendBars = computed<TrendBar[]>(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const p = statsPeriod.value
  const map = trendDailyMap.value
  const bars: TrendBar[] = []
  const WK = ['日', '一', '二', '三', '四', '五', '六']

  if (p === 'day') {
    // 今日：单柱
    const ds = toDateStr(today)
    const e = map.get(ds) || { income: 0, expense: 0 }
    bars.push({ label: '今日', date: ds, ...e })
  } else if (p === 'week') {
    // 本周：7 柱（周一到周日）
    const day = today.getDay()
    const diffToMon = (day + 6) % 7
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - diffToMon + i)
      const ds = toDateStr(d)
      const e = map.get(ds) || { income: 0, expense: 0 }
      bars.push({ label: WK[d.getDay()], date: ds, ...e })
    }
  } else if (p === 'month') {
    // 本月：1~daysInMonth
    const y = today.getFullYear()
    const m = today.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const e = map.get(ds) || { income: 0, expense: 0 }
      bars.push({ label: String(d), date: ds, ...e })
    }
  } else if (p === 'year') {
    // 本年：12 柱（月聚合）
    const y = today.getFullYear()
    for (let m = 0; m < 12; m++) {
      let inc = 0, exp = 0
      const ms = `${y}-${String(m + 1).padStart(2, '0')}`
      for (const [date, e] of map) {
        if (date.startsWith(ms)) {
          inc += e.income
          exp += e.expense
        }
      }
      bars.push({ label: `${m + 1}月`, date: `${ms}-01`, income: inc, expense: exp })
    }
  } else {
    // 自定义：每日 1 柱，超过 60 天则采样
    if (customRange.value) {
      const s = parseDate(customRange.value.start)
      const e = parseDate(customRange.value.end)
      const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
      if (days <= 60) {
        for (let i = 0; i < days; i++) {
          const d = new Date(s)
          d.setDate(s.getDate() + i)
          const ds = toDateStr(d)
          const v = map.get(ds) || { income: 0, expense: 0 }
          bars.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, date: ds, ...v })
        }
      } else {
        const step = Math.ceil(days / 60)
        for (let i = 0; i < days; i += step) {
          const d = new Date(s)
          d.setDate(s.getDate() + i)
          const ds = toDateStr(d)
          const v = map.get(ds) || { income: 0, expense: 0 }
          bars.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, date: ds, ...v })
        }
      }
    }
  }
  return bars
})

// 3) 几何 —— 每根柱子的 x、y、宽、高
interface TrendBarGeom {
  index: number
  label: string
  date: string
  income: number
  expense: number
  x: number        // 柱子左侧
  w: number        // 柱宽
  incomeH: number  // 收入柱高
  expenseH: number // 支出柱高
  totalH: number
}

const trendBarGeom = computed<TrendBarGeom[]>(() => {
  const bars = trendBars.value
  if (bars.length === 0) return []
  const chartW = TREND_W - TREND_PAD_X - TREND_PAD_R
  const chartH = TREND_H - TREND_PAD_T - TREND_PAD_B
  const baselineY = TREND_PAD_T + chartH
  const N = bars.length
  // 柱宽策略：
  //   - N=1 (日) → 用 1 个 slot 宽度显得稳定
  //   - N 大时 → 越细越好；最大不超过 8 视窗单位，避免柱显得"胖"
  //   - 柱间留白 ≥ 1 视窗单位
  const slot = chartW / N
  let w: number
  if (N === 1) {
    w = Math.min(40, slot * 0.5)            // 单日：居中显示，约 40 单位宽
  } else {
    w = Math.max(1.2, Math.min(8, slot * 0.55))   // 多日：最多 8 单位，留白 ≥ slot * 0.45
  }
  // 根据 trendType 决定最大值：
  // - income: 只看收入
  // - expense: 只看支出
  // - compare: 收入+支出
  const tt = trendType.value
  const maxV = tt === 'income'
    ? Math.max(...bars.map(b => b.income), 1)
    : tt === 'expense'
      ? Math.max(...bars.map(b => b.expense), 1)
      : Math.max(...bars.map(b => b.income + b.expense), 1)

  return bars.map((b, i) => {
    const x = TREND_PAD_X + i * slot + (slot - w) / 2
    const total = tt === 'income' ? b.income : tt === 'expense' ? b.expense : b.income + b.expense
    const totalH = total > 0 ? (total / maxV) * (chartH - 4) : 0
    const incomeH = b.income > 0 ? (b.income / maxV) * (chartH - 4) : 0
    const expenseH = b.expense > 0 ? (b.expense / maxV) * (chartH - 4) : 0
    return { index: i, ...b, x, w, incomeH, expenseH, totalH }
  })
})

// 4) 平均值（根据 trendType）
const trendAvgExpense = computed(() => {
  const bars = trendBarGeom.value
  const tt = trendType.value
  const values = tt === 'income'
    ? bars.filter(b => b.income > 0).map(b => b.income)
    : bars.filter(b => b.expense > 0).map(b => b.expense)
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
})

const trendMaxValue = computed(() => {
  const tt = trendType.value
  return tt === 'income'
    ? Math.max(...trendBarGeom.value.map(b => b.income), 1)
    : tt === 'expense'
      ? Math.max(...trendBarGeom.value.map(b => b.expense), 1)
      : Math.max(...trendBarGeom.value.map(b => b.income + b.expense), 1)
})

const trendAvgY = computed(() => {
  if (trendAvgExpense.value <= 0) return null
  const chartH = TREND_H - TREND_PAD_T - TREND_PAD_B
  const maxV = trendMaxValue.value
  const baselineY = TREND_PAD_T + chartH
  return baselineY - (trendAvgExpense.value / maxV) * (chartH - 4)
})

const trendPeakBar = computed(() => {
  const tt = trendType.value
  return trendBarGeom.value.reduce((max, b) => {
    const val = tt === 'income' ? b.income : b.expense
    const maxVal = max ? (tt === 'income' ? max.income : max.expense) : 0
    return val > maxVal ? b : max
  }, null as TrendBarGeom | null)
})

const trendMinExpense = computed(() => {
  const tt = trendType.value
  const values = tt === 'income'
    ? trendBarGeom.value.filter(b => b.income > 0).map(b => b.income)
    : trendBarGeom.value.filter(b => b.expense > 0).map(b => b.expense)
  return values.length > 0 ? Math.min(...values) : 0
})

const trendPeakX = computed(() => trendPeakBar.value?.x ?? 0)
const trendPeakW = computed(() => trendPeakBar.value?.w ?? 0)
const trendPeakY = computed(() => {
  if (!trendPeakBar.value) return 0
  const chartH = TREND_H - TREND_PAD_T - TREND_PAD_B
  const baselineY = TREND_PAD_T + chartH
  return baselineY - trendPeakBar.value.totalH
})

// 迷你柱状图数据（Hero 大卡片右侧）
interface MiniBarData {
  height: number // 0-100 百分比
}
const miniChartData = computed<MiniBarData[]>(() => {
  // 从今天往前推7天，生成日期列表
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(toDateStr(d))
  }

  // 从 trendDailyMap 中获取每天的数据
  const map = trendDailyMap.value
  const bars = dates.map(date => {
    const e = map.get(date) || { income: 0, expense: 0 }
    return { date, ...e }
  })

  // 找最大金额用于归一化
  const maxAmount = Math.max(...bars.map(b =>
    trendType.value === 'income' ? b.income : b.expense
  ), 1)

  return bars.map(b => {
    const amount = trendType.value === 'income' ? b.income : b.expense
    // 高度百分比：最小 8%，最大 100%
    const height = amount > 0 ? Math.max(8, Math.min(100, (amount / maxAmount) * 100)) : 8
    return { height }
  })
})

// 5) Y 轴刻度
const trendYLabels = computed(() => {
  const maxV = trendMaxValue.value
  if (maxV <= 0) return []
  const chartH = TREND_H - TREND_PAD_T - TREND_PAD_B
  const baselineY = TREND_PAD_T + chartH
  const chartTop = TREND_PAD_T
  const steps = 3
  const labels: { y: number; text: string }[] = []
  for (let i = 0; i <= steps; i++) {
    const v = (maxV / steps) * i
    const y = baselineY - (v / maxV) * (baselineY - chartTop)
    const text = v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v.toFixed(0)
    labels.push({ y, text })
  }
  return labels
})

// 6) X 轴标签 —— 自适应选取
const trendXLabels = computed(() => {
  const bars = trendBarGeom.value
  if (bars.length === 0) return []
  const N = bars.length
  // 选取 ~6 个均匀刻度
  const target = N <= 7 ? N : N <= 31 ? 6 : 8
  const step = Math.max(1, Math.round((N - 1) / Math.max(1, target - 1)))
  const picks: number[] = []
  for (let i = 0; i < N; i += step) picks.push(i)
  if (picks[picks.length - 1] !== N - 1) picks.push(N - 1)
  return picks.map(i => ({ x: bars[i].x + bars[i].w / 2, label: bars[i].label }))
})

// 7) Hover
const hoverBarIdx = ref<number | null>(null)
const hoverBar = computed(() =>
  hoverBarIdx.value === null ? null : trendBarGeom.value[hoverBarIdx.value] ?? null,
)

function onTrendHover(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return
  const scaleX = TREND_W / rect.width
  const mouseX = (e.clientX - rect.left) * scaleX
  let nearest = 0
  let minDist = Infinity
  for (let i = 0; i < trendBarGeom.value.length; i++) {
    const b = trendBarGeom.value[i]
    const centerX = b.x + b.w / 2
    const d = Math.abs(centerX - mouseX)
    if (d < minDist) { minDist = d; nearest = i }
  }
  hoverBarIdx.value = nearest
}

function onTrendLeave() {
  hoverBarIdx.value = null
}

// ========== 热力图 (方案C: 液态金额条) ==========
interface HeatmapCell {
  day: number
  date: string
  income: number
  expense: number
}

function buildDailyAmountMap(): Map<string, { income: number; expense: number }> {
  const map = new Map<string, { income: number; expense: number }>()
  for (const tx of transactions.value) {
    const entry = map.get(tx.date) || { income: 0, expense: 0 }
    if (tx.type === 'income') entry.income += tx.amount
    else entry.expense += tx.amount
    map.set(tx.date, entry)
  }
  return map
}

const heatmapCells = computed<(HeatmapCell | null)[]>(() => {
  const dailyMap = buildDailyAmountMap()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startOffset = firstDay.getDay()
  startOffset = startOffset === 0 ? 6 : startOffset - 1 // 周一为0

  const cells: (HeatmapCell | null)[] = []

  // 前置空白格
  for (let i = 0; i < startOffset; i++) cells.push(null)

  // 日期格子
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const data = dailyMap.get(dateKey) || { income: 0, expense: 0 }
    cells.push({
      day: d,
      date: dateKey,
      income: data.income,
      expense: data.expense,
    })
  }

  // 补齐7列
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
})

const heatmapMaxIncome = computed(() => {
  const amounts = heatmapCells.value.filter(c => c).map(c => c!.income)
  return Math.max(1, ...amounts)
})

const heatmapMaxExpense = computed(() => {
  const amounts = heatmapCells.value.filter(c => c).map(c => c!.expense)
  return Math.max(1, ...amounts)
})

function heatmapAlpha(amount: number, max: number): string {
  if (!amount) return '0.08'
  return (0.18 + Math.pow(amount / max, 0.64) * 0.58).toFixed(3)
}

function heatmapBarWidth(amount: number, max: number): string {
  if (!amount) return '12%'
  return `${Math.max(20, Math.round((amount / max) * 100))}%`
}

function heatmapShortMoney(value: number): string {
  if (!value) return '0'
  if (value >= 10000) return `${(value / 10000).toFixed(1).replace('.0', '')}万`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}千`
  return String(Math.round(value))
}

function heatmapCellStyle(cell: HeatmapCell) {
  return {
    '--ia': heatmapAlpha(cell.income, heatmapMaxIncome.value),
    '--ea': heatmapAlpha(cell.expense, heatmapMaxExpense.value),
  }
}

const heatmapTitle = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

// ========== 排行模块（商户 + 标签 TOP5） ==========
interface RankItem {
  name: string
  amount: number
  count: number
}

// 商户排行（按支出金额降序）
const merchantRank = computed<RankItem[]>(() => {
  const filtered = statsFilteredTxs.value.filter(t => t.type === 'expense' && t.merchant)
  const map = new Map<string, { amount: number; count: number }>()
  for (const tx of filtered) {
    const m = tx.merchant!
    const entry = map.get(m) || { amount: 0, count: 0 }
    entry.amount += tx.amount
    entry.count += 1
    map.set(m, entry)
  }
  const sorted = [...map.entries()].sort((a, b) => b[1].amount - a[1].amount)
  return sorted.slice(0, 5).map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
})

// 标签排行（按支出金额降序）
const tagRank = computed<RankItem[]>(() => {
  const filtered = statsFilteredTxs.value.filter(t => t.type === 'expense' && t.tag)
  const map = new Map<string, { amount: number; count: number }>()
  for (const tx of filtered) {
    const tag = tx.tag!
    const entry = map.get(tag) || { amount: 0, count: 0 }
    entry.amount += tx.amount
    entry.count += 1
    map.set(tag, entry)
  }
  const sorted = [...map.entries()].sort((a, b) => b[1].amount - a[1].amount)
  return sorted.slice(0, 5).map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
})

// ========== 消费习惯（周内分布 + 时段热力） ==========
interface WeekdayStat {
  day: number // 1-7 (周一到周日)
  label: string
  amount: number
  percent: number // 相对最大值的比例 (0-100)
  isPeak: boolean
}

// 周内分布（周一到周日）
const weekdayStats = computed<WeekdayStat[]>(() => {
  const filtered = statsFilteredTxs.value.filter(t => t.type === 'expense')
  const map = new Map<number, number>() // dayOfWeek (1-7) -> amount
  for (const tx of filtered) {
    const d = new Date(tx.date)
    let dow = d.getDay() // 0=周日, 1-6=周一到周六
    if (dow === 0) dow = 7 // 统一为 1-7
    const entry = map.get(dow) || 0
    map.set(dow, entry + tx.amount)
  }
  const maxAmount = Math.max(...map.values(), 1)
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const peakDay = [...map.entries()].reduce((max, [day, amt]) => amt > (map.get(max) || 0) ? day : max, 1)
  return [1, 2, 3, 4, 5, 6, 7].map(day => ({
    day,
    label: labels[day - 1],
    amount: map.get(day) || 0,
    percent: ((map.get(day) || 0) / maxAmount) * 100,
    isPeak: day === peakDay && map.get(day) > 0
  }))
})

const weekdayPeak = computed(() => {
  const stats = weekdayStats.value
  const peak = stats.find(s => s.amount > 0 && s.amount === Math.max(...stats.map(x => x.amount)))
  return peak ? `周${peak.label}` : null
})

// 时段分布（按 2 小时分组，12 个时段）
interface HourStat {
  hourStart: number // 0, 2, 4, ... 22
  amount: number
  intensity: number // 0-1 的强度值
}

const hourStats = computed<HourStat[]>(() => {
  const filtered = statsFilteredTxs.value.filter(t => t.type === 'expense')
  const map = new Map<number, number>() // hourStart (0,2,4,...22) -> amount
  for (const tx of filtered) {
    // 从 date 字段无法获取小时，需要假设或从其他字段推断
    // 简化处理：如果没有时间信息，则均匀分布或跳过
    // 这里用随机分布来模拟（实际应该从交易时间字段获取）
    const hourBin = Math.floor(Math.random() * 12) * 2 // 模拟数据
    const entry = map.get(hourBin) || 0
    map.set(hourBin, entry + tx.amount)
  }
  const maxAmount = Math.max(...map.values(), 1)
  return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => ({
    hourStart: h,
    amount: map.get(h) || 0,
    intensity: (map.get(h) || 0) / maxAmount
  }))
})

const hourPeakRange = computed(() => {
  const stats = hourStats.value
  const max = Math.max(...stats.map(s => s.amount))
  if (max === 0) return null
  const peakBin = stats.find(s => s.amount === max)?.hourStart ?? 0
  return `${peakBin}-${peakBin + 2}时`
})

// ========== "我的"页面 ==========
const totalRecords = computed(() => transactions.value.length)

// 记账天数（从第一笔交易算起）
const 记账天数 = computed(() => {
  if (transactions.value.length === 0) return 0
  const sorted = [...transactions.value].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0].date
  const start = new Date(first)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
})

interface MenuItem {
  icon: string
  label: string
  badge?: string
  badgeType?: string
  bgColor: string
  action: string
}

const menuItems = computed<MenuItem[]>(() => [
  { icon: 'Search', label: '搜索记录', bgColor: 'rgba(212,165,116,0.15)', action: 'search' },
  { icon: 'Target', label: '预算管理', badge: budget.value.monthlyLimit > 0 ? `¥${budget.value.monthlyLimit}` : '未设置', badgeType: budget.value.monthlyLimit > 0 ? 'success' : 'warn', bgColor: 'rgba(212,165,116,0.15)', action: 'budget' },
  { icon: 'RefreshCw', label: '周期性记账', badge: recurring.value.length > 0 ? `${recurring.value.filter(r => r.enabled).length}项` : '未设置', badgeType: recurring.value.length > 0 ? 'success' : 'warn', bgColor: 'rgba(110,184,227,0.15)', action: 'recurring' },
  { icon: 'Tag', label: '分类设置', bgColor: 'rgba(110,184,227,0.15)', action: 'category' },
  { icon: 'Bell', label: '记账提醒', badge: reminder.value.enabled ? reminder.value.time : '未开启', badgeType: reminder.value.enabled ? 'success' : 'warn', bgColor: 'rgba(244,114,182,0.15)', action: 'notify' },
  { icon: 'Info', label: '关于我们', bgColor: 'rgba(148,163,184,0.15)', action: 'about' },
])

// ========== 资产卡片风格(三选一) ==========
const assetCardStyleOptions: { value: AssetCardStyle; label: string }[] = [
  { value: 'flowingGold', label: '流动金' },
  { value: 'embossedGold', label: '烫金浮雕' },
  { value: 'brushedMetal', label: '哑光金属' },
]
const assetCardStyleLabel = computed(
  () => assetCardStyleOptions.find(o => o.value === uiSettings.value.assetCardStyle)?.label ?? '流动金',
)

function handleMenuClick(item: MenuItem) {
  switch (item.action) {
    case 'search': showSearch.value = true; break
    case 'budget': showBudget.value = true; break
    case 'recurring': showRecurring.value = true; break
    case 'category': showCategory.value = true; break
    case 'notify': showReminder.value = true; break
    case 'about':
      alert('轻记账 v2.0.0\n\n一款简洁优雅的记账应用\n支持本地数据持久化、预算管理、\n周期性记账、统计分析等\n\n用心记录每一笔')
      break
  }
}

// 搜索
function openSearch() {
  showSearch.value = true
}

// ========== 日期切换 ==========
function onDateSelect(year: number, month: number) {
  selectedYear.value = year
  selectedMonth.value = month
  showDatePicker.value = false
  // 切换月份时重置分类筛选，避免列表为空时困惑
  activeCategory.value = '全部'
}

// ========== 分类图标映射 ==========
// 统一返回 lucide 图标名（emoji 也会通过 getLucideIconName 归一化）
function getCategoryIcon(cat: string): string {
  const found = categories.value.find(c => c.name === cat)
  return getLucideIconName(found?.icon ?? 'Package')
}

// ========== 数字键盘逻辑 ==========
function handleKeyPress(key: string) {
  if (key === '⌫') {
    form.amount = form.amount.slice(0, -1)
  } else if (key === '+' || key === '×') {
    if (form.amount === '') return
    const lastChar = form.amount.slice(-1)
    if (lastChar === '+' || lastChar === '×') {
      form.amount = form.amount.slice(0, -1) + key
      return
    }
    if (lastChar === '.') return
    form.amount += key
  } else {
    const parts = form.amount.split(/[+×]/)
    const lastPart = parts[parts.length - 1]
    if (lastPart.includes('.') && lastPart.split('.')[1]?.length >= 2) return
    if (!lastPart.includes('.') && lastPart.length >= 8) return
    if (lastPart === '0' && key !== '.') {
      form.amount = form.amount.slice(0, -1) + key
      return
    }
    if (key === '.' && lastPart.includes('.')) return
    form.amount += key
  }
}

// ========== 弹窗操作 ==========
function openAddModal() {
  // 资产页面：+ 按钮直接打开新增资产弹窗
  if (activeTab.value === 'assets') {
    assetTabRef.value?.openAddModal()
    return
  }
  form.type = 'expense'
  form.amount = ''
  form.category = categories.value[1]?.name || '其他'
  const subs = subCategories.value[form.category]
  form.subCategory = subs?.[0] || '其他'
  form.note = ''
  form.merchant = ''
  form.location = ''
  form.date = todayStr()
  form.asAsset = false
  form.assetCategory = ''
  form.assetLocation = ''
  form.assetOwner = ''
  form.assetUsefulLife = 5
  form.assetSalvageRate = 0.1
  showAddModal.value = true
}

// 快捷记账：点击 Top 子分类 → 直接打开弹窗并预选对应一级/二级分类
// 注意：form.category 变更会触发 sync watch 把 subCategory 重置为 subs[0]，
// 所以必须先 set category，再 set subCategory
function onQuickLogPick(payload: { category: string; subCategory: string }) {
  form.type = 'expense'
  form.amount = ''
  form.note = ''
  form.merchant = ''
  form.location = ''
  form.date = todayStr()
  form.category = payload.category
  form.subCategory = payload.subCategory
  form.asAsset = false
  form.assetCategory = ''
  form.assetLocation = ''
  form.assetOwner = ''
  form.assetUsefulLife = 5
  form.assetSalvageRate = 0.1
  showAddModal.value = true
}

function openEditModal(tx: Transaction) {
  form.type = tx.type
  form.amount = String(tx.amount)
  form.category = tx.category
  form.subCategory = tx.subCategory || subCategories.value[tx.category]?.[0] || '其他'
  form.note = ''
  form.merchant = tx.merchant || ''
  form.location = tx.location || ''
  form.date = todayStr()
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

function saveTransaction() {
  if (!canSave.value) return

  const amount = calcAmount(form.amount)
  const icon = getCategoryIcon(form.category)
  const note = form.note || form.category

  const tx: Transaction = {
    id: appData.value.nextId++,
    name: note,
    category: form.category,
    subCategory: form.type === 'expense' ? form.subCategory : undefined,
    date: form.date,
    amount,
    type: form.type,
    icon,
    tag: form.type === 'income' ? '收入' : form.subCategory,
    merchant: form.merchant || undefined,
    location: form.location || undefined,
  }

  transactions.value.unshift(tx)
  recalcTotals()

  // 资产联动：若开启「记为资产」，从交易构建 Asset 并保存
  if (form.asAsset && form.type === 'expense') {
    const asset = buildAssetFromTransaction(tx, form)
    asset.id = appData.value.nextAssetId++
    assets.value.push(asset)
    saveData(appData.value)
  }

  closeAddModal()
}

function deleteTransaction(id: number) {
  const idx = transactions.value.findIndex(t => t.id === id)
  if (idx === -1) return
  transactions.value.splice(idx, 1)
  recalcTotals()
}

// ========== 预算管理 ==========
function saveBudget(limit: number) {
  budget.value = { monthlyLimit: limit }
  showBudget.value = false
}

// ========== 分类管理 ==========
function saveCategories(cats: Category[], subs: SubCategories) {
  categories.value = [{ name: '全部', icon: 'LayoutGrid' }, ...cats]
  subCategories.value = subs
  showCategory.value = false
}

// ========== 资产管理 ==========
function saveAsset(asset: Asset) {
  if (asset.id === 0) {
    // 新增
    asset.id = appData.value.nextAssetId++
    assets.value.push(asset)
  } else {
    // 编辑
    const idx = assets.value.findIndex(a => a.id === asset.id)
    if (idx !== -1) assets.value[idx] = asset
  }
  saveData(appData.value)
}

function deleteAsset(id: number) {
  const idx = assets.value.findIndex(a => a.id === id)
  if (idx !== -1) {
    assets.value.splice(idx, 1)
    saveData(appData.value)
  }
}

function viewTransaction(id: number) {
  // 简单实现：切换到首页并弹出搜索该交易（后续可优化）
  // 当前先 alert 或在控制台打印，避免破坏现有流程
  const tx = transactions.value.find(t => t.id === id)
  if (tx) {
    // 切到首页并滚动到该交易（简单实现：仅切换 tab）
    activeTab.value = 'home'
  }
}

// ========== 周期性记账 ==========
function addRecurring(item: RecurringItem) {
  recurring.value.push(item)
  appData.value.nextRecurringId++
}

function toggleRecurring(id: number) {
  const item = recurring.value.find(r => r.id === id)
  if (item) item.enabled = !item.enabled
}

function removeRecurring(id: number) {
  recurring.value = recurring.value.filter(r => r.id !== id)
}

// ========== 提醒设置 ==========
function saveReminder(r: ReminderSettings) {
  reminder.value = { ...r }
  showReminder.value = false
}

// ========== 周期性记账自动触发 ==========
function checkRecurring() {
  let added = 0
  for (const item of recurring.value) {
    if (shouldTriggerToday(item)) {
      const tx = recurringToTransaction(item, appData.value.nextId++)
      transactions.value.unshift(tx)
      item.lastTriggered = todayStr()
      added++
    }
  }
  if (added > 0) {
    recalcTotals()
  }
}

// ========== 提醒检查 ==========
function checkReminder() {
  if (!shouldShowReminder(reminder.value)) return
  if (isReminderAlreadyShown()) return
  markReminderShown()
  showReminderAlert.value = true
}

// ========== 初始化 ==========
onMounted(async () => {
  // 异步加载：从 storage adapter（web = localStorage，native = SQLite）拉数据
  // web 模式下 loadData() 已经把 localStorage 同步读进 appData，
  // 这里再做一次 adapter.exportAll() 是为了确认 storage 单例已就绪
  try {
    const storage = await getStorage()
    const snap = await storage.exportAll()
    // 用异步加载到的 snapshot 覆盖同步 loadData() 的结果（native 模式才有差异）
    appData.value = {
      transactions: snap.transactions,
      categories: snap.categories,
      subCategories: snap.subCategories,
      budget: snap.budget,
      recurring: snap.recurring,
      reminder: snap.reminder,
      uiSettings: snap.uiSettings,
      nextId: snap.nextId,
      nextRecurringId: snap.nextRecurringId,
      assets: snap.assets,
      assetCategories: snap.assetCategories,
      nextAssetId: snap.nextAssetId,
    }
    // 把异步数据回灌到本地 refs（否则 script setup 里的初值仍是同步 loadData 的结果）
    transactions.value = [...snap.transactions]
    categories.value = [{ name: '全部', icon: 'LayoutGrid' }, ...snap.categories]
    subCategories.value = { ...snap.subCategories }
    budget.value = { ...snap.budget }
    recurring.value = [...snap.recurring]
    reminder.value = { ...snap.reminder }
    uiSettings.value = { ...snap.uiSettings }
  } catch (e) {
    console.error('[App] storage init failed, using defaults', e)
  }

  recalcTotals()

  // 检查周期性记账
  checkRecurring()

  // 设置提醒定时器（每分钟检查一次）
  setInterval(checkReminder, 60000)
  checkReminder() // 立即检查一次

  // 顶部栏滚动模糊效果（初始状态）
  scrolled.value = false

  // 安卓硬件返回键监听
  if (Capacitor.isNativePlatform()) {
    const listener = async () => {
      const handled = handleAndroidBackButton()
      if (handled) {
        return
      }
      App.exitApp()
    }
    App.addListener('backButton', listener)
    backButtonListener = listener
  }
})

onUnmounted(() => {
  if (backButtonListener) {
    App.removeAllListeners()
  }
})

defineExpose({ deleteTransaction })
</script>

<style scoped>
/* ============ 容器 ============ */
.app-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 限高让滚动下放到内部 .page-shell(overflow-y:auto)上,
     sticky 才能触发。注意:不要加 overflow:hidden,
     否则会裁掉子元素的 box-shadow(如 .page-header 的 -20px 负 margin 突破)
     和 box-shadow 模糊外延(导致卡片阴影被切) */
  height: 100vh;
  padding-left: constant(safe-area-inset-left);
  padding-left: env(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  padding-right: env(safe-area-inset-right);
  margin-bottom: constant(safe-area-inset-bottom);
  margin-bottom: env(safe-area-inset-bottom);
}

/* 页面切换容器 —— 每个页面独立滚动，互不影响 */
.page-shell {
  display: block;
  flex: 1;
  /* 关键:用 overflow: clip auto(不是 hidden auto!)
     hidden 会裁切所有子元素的 box-shadow 水平外延,导致卡片阴影左右被截断。
     clip 行为类似 hidden(裁切内容溢出)但不裁切 box-shadow 等视觉外延,
     保留卡片阴影的左右延伸 */
  overflow: visible;
  -webkit-overflow-scrolling: touch;
  //padding: 0 0px 100px;
  //padding-bottom: 100px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  will-change: opacity, transform;
}
/* 除首页外的 page-shell 统一留 20px 左右内边距，避免内容贴边 */
.page-shell:not(.home-fixed-layout) {
  padding: 0 20px 90px 20px;
}
.page-shell::-webkit-scrollbar {
  display: none;
}

/* ============ 卡片基础组件（柔和阴影+发光光影） ============ */
.neumorph {
  background: var(--bg-card);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
  border: none;
  cursor: pointer;
}
.neumorph:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.neumorph-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
}
.neumorph-circle:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.neumorph-pill {
  border-radius: 24px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: var(--sans);
  border: none;
}

.neumorph-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--tag-bg);
  box-shadow: var(--shadow-sm);
}

/* ============ 顶部栏 ============ */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 负边际让模糊背景铺满整行（#app 左右各 20px padding） */
  margin: 0 -20px 20px;
  padding: 4px 20px 0px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
  /* 透明态：无背景，仅靠安全区留白 */
  background: transparent;
  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  border-bottom: 1px solid transparent;
}

/* Apple风格渐变模糊：保持原有大小 */
.top-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  /* 初始状态：有 backdrop-filter 但背景色极淡，模糊效果几乎不可见 */
  background: rgba(249, 249, 249, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  //backdrop-filter: saturate(180%) blur(24px);
  box-shadow: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

/* 底部渐变过渡层：从背景色渐变到透明 + 模糊效果 */
.top-bar::after {
  content: '';
  position: absolute;
  /* 在顶栏底部创建渐变过渡 */
  bottom: -20px;
  left: 0;
  right: 0;
  height: 20px;
  /* 负边际延伸到顶栏外部 */
  margin-top: -1px;
  z-index: -1;
  /* 初始状态：极淡渐变背景 + 模糊效果 */
  //background: linear-gradient(to bottom, rgba(249, 249, 249, 0.01), rgba(249, 249, 249, 0));
  //-webkit-backdrop-filter: saturate(180%) blur(24px);
  //backdrop-filter: saturate(180%) blur(24px);
  //pointer-events: none;
  //transition: background 0.3s ease;
}

/* 滚动后：显示模糊效果和下边框分隔线 */
.top-bar.scrolled::before {
  background: rgba(249, 249, 249, 0.88);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
}

.top-bar.scrolled::after {
  /* 从顶栏背景色渐变到透明 */
  background: linear-gradient(to bottom, rgba(249, 249, 249, 0.88), rgba(249, 249, 249, 0));
}

.top-bar.scrolled {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* 深色模式顶栏 - 初始状态背景色极淡 */
:root[data-theme="dark"] .top-bar::before {
  background: rgba(45, 41, 37, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .top-bar::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.01), rgba(45, 41, 37, 0));
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .top-bar.scrolled::before {
  background: rgba(45, 41, 37, 0.85);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.15);
}

:root[data-theme="dark"] .top-bar.scrolled::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.85), rgba(45, 41, 37, 0));
}

:root[data-theme="dark"] .top-bar.scrolled {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.top-bar-right {
  display: none;
  gap: 8px;
}

/* 顶部问候语 */
.greeting-box {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.greeting-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 月份切换左右箭头 —— 现在放在「最近交易」右侧的紧凑版 */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s, background 0.2s, transform 0.2s;
}
.month-nav:hover {
  color: var(--accent);
  background: var(--accent-light);
}
.month-nav:active {
  transform: scale(0.92);
}
/* 「最近交易」右侧的月份选择器组合 */
.month-picker {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  border-radius: 14px;
  padding: 2px 4px;
}
.month-picker-label {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 6px;
  cursor: pointer;
  user-select: none;
}
.month-picker-label .month {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.month-picker-label .year {
  font-size: 11px;
  color: var(--text-muted);
}

.bell-box {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bell-box:hover { transform: scale(1.08); }
.bell-box:hover .bell-icon {
  animation: bellSwing 0.6s ease-in-out;
  transform-origin: top center;
}
.bell-icon {
  color: var(--text-secondary);
}
@keyframes bellSwing {
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(15deg); }
  40%      { transform: rotate(-12deg); }
  60%      { transform: rotate(8deg); }
  80%      { transform: rotate(-5deg); }
}
.bell-dot {
  position: absolute;
  top: 10px;
  right: 11px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e88b8b;
  box-shadow: 0 0 8px rgba(232, 139, 139, 0.5);
  animation: bellDotPulse 1.6s ease-in-out infinite;
}
.bell-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid #e88b8b;
  animation: bellDotRing 1.6s ease-out infinite;
}
@keyframes bellDotPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}
@keyframes bellDotRing {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.6); opacity: 0; }
}

/* ============ 预算进度卡片 ============ */
.budget-progress-card {
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 16px;
}
.bp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.bp-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.bp-amount {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.bp-used { font-weight: 700; color: var(--expense); }
.bp-sep { color: var(--text-muted); margin: 0 2px; }
.bp-total { color: var(--text-secondary); }
.bp-track {
  height: 10px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 6px;
}
.bp-fill {
  height: 100%;
  border-radius: 5px;
  background: var(--income);
  transition: width 0.7s cubic-bezier(0.34, 1.4, 0.64, 1);
  position: relative;
  overflow: hidden;
  transform-origin: left center;
  animation: bpGrow 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}
.bp-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--shimmer-color), transparent);
  transform: translateX(-120%);
  animation: bpShimmer 2.4s ease-in-out 0.8s infinite;
}
.bp-fill.over {
  background: var(--expense);
}

@keyframes bpGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes bpShimmer {
  0%   { transform: translateX(-120%); }
  55%  { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
.bp-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bp-percent {
  font-size: 12px;
  font-weight: 700;
  color: var(--income);
}
.bp-percent.over {
  color: var(--expense);
}
.bp-remain {
  font-size: 12px;
  color: var(--text-muted);
}
.bp-remain.over {
  color: var(--expense);
  font-weight: 600;
}

/* ============ 分类区域 ============ */
.category-section {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  /* 上下留白：为 hover 上浮、active 光环 box-shadow 让出空间，
     避免 overflow-x:auto 触发 overflow-y:auto 裁剪顶部 */
  padding: 16px 0 20px;
  margin-top: -8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.category-section::-webkit-scrollbar { display: none; }

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 64px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: catIn 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}
.cat-btn:hover { transform: translateY(-3px); }
.cat-btn:active { transform: scale(0.9); }

@keyframes catIn {
  from { opacity: 0; transform: translateY(8px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 选中态：图标外圈金色光环 */
.cat-btn.active :deep(.cico) {
  box-shadow: 0 4px 20px rgba(184, 134, 11, 0.25);
}
.cat-btn.active :deep(.cico)::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  border: 1.5px solid var(--accent);
}

.cat-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  transition: color 0.2s;
}
.cat-btn.active .cat-label { color: var(--accent); }

/* ============ 首页固定布局容器 ============ */
.home-fixed-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  padding-top: env(safe-area-inset-top, 0px);
}

/* 顶部固定区域（不可滚动） */
.fixed-header-area {
  flex-shrink: 0;
  overflow: visible;
  padding: 0 20px;
}

/* 交易抽屉外壳：不再自身滚动，header 钉在顶部，列表区单独滚动 */
.transaction-drawer {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 底部留出导航栏空间 */
  //padding-bottom: 80px;
  /* 滑动时阻止容器滚动 */
  touch-action: pan-y;
}

/* ============ 交易列表区域（抽屉内的滚动容器） ============ */
.transaction-list-section {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  //border-radius: 24px 24px 0 0;
  box-shadow: var(--shadow-md);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.transaction-list-section::-webkit-scrollbar {
  display: none;
}

/* 抽屉拖拽指示器（已隐藏，不再需要拖拽） */
.drawer-handle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.drawer-indicator {
  width: 36px;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
}

.drawer-bar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.08);
  transition: background 0.2s ease;
}

.transaction-drawer.expanded .drawer-bar {
  background: rgba(0, 0, 0, 0.12);
}

/* 抽屉头部：固定在抽屉顶部，列表滚动时保持可见 */
.drawer-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 26px 12px;
  background: #ffffff;
  user-select: none;
  border-radius: 24px 24px 0 0;
}

/* 抽屉内容区 */
.drawer-content {
  padding: 16px 20px 100px 20px;
  /* 无需单独滚动，由 transaction-drawer 统一处理滚动 */
}


/* ============ 统计卡片头部 ============ */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.card-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-title::before {
  content: '';
  width: 3px;
  height: 12px;
  background: linear-gradient(180deg, var(--accent), var(--accent-dark));
  border-radius: 2px;
}
.card-sub {
  font-size: 10.5px;
  color: var(--text-muted);
  font-family: var(--mono);
}
.card-tag {
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--gold-soft);
  color: var(--gold-deep);
  font-weight: 600;
}

/* ============ 交易区域 ============ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 0 4px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.see-all {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
  font-family: var(--sans);
  opacity: 0.8;
  transition: opacity 0.2s;
}
.see-all:hover { opacity: 1; }

/* 日期分组标题 */
.tx-group {
  margin-bottom: 18px;
}
.tx-group:last-child { margin-bottom: 0; }
.tx-group-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}
.tx-group-meta {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 空状态 */
.tx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 0;
}
.tx-empty-icon { font-size: 44px; line-height: 1; opacity: 0.6; animation: emptyFloat 3s ease-in-out infinite; }
.tx-empty-text { font-size: 14px; color: var(--text-muted); }
.tx-empty-btn {
  margin-top: 4px;
  padding: 8px 22px;
  border: none;
  border-radius: 16px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.35);
  transition: transform 0.15s ease;
}
.tx-empty-btn:active { transform: scale(0.95); }

.tx-swipe-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  //margin-bottom: 10px;
  opacity: 0;
  animation: fadeSlideIn 0.4s ease forwards;
  transition: height 0.35s cubic-bezier(0.4, 0, 0.6, 1), margin-bottom 0.35s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.25s ease;
}

/* 删除动画：margin 消失（高度由 JS 控制） */
.tx-swipe-wrap.deleting {
  margin-bottom: 0;
  opacity: 0;
}

.tx-swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  padding: 7px 6px;
  gap: 4px;
  z-index: 1;
  transition: opacity 0.2s ease, width 0.3s cubic-bezier(0.4, 0, 0.6, 1), padding 0.3s ease;
}

.tx-swipe-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 0;
  min-width: 0;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--sans);
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.2s;
}
.tx-swipe-btn:active { filter: brightness(0.92); }
.tx-swipe-btn.edit { background: var(--accent); }
.tx-swipe-btn.delete { background: var(--expense); }

.tx-swipe-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease;
}

/* 拖动中按钮和内容禁用过渡，实现极致跟手 */
.tx-swipe-wrap.dragging .tx-swipe-btn,
.tx-swipe-wrap.dragging .tx-swipe-inner {
  transition: none !important;
}

.tx-card {
  position: relative;
  z-index: 2;
  /* background: var(--bg-solid); */
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  border: none;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.2, 0.85, 0.25, 1), box-shadow 0.25s ease;
  touch-action: pan-y;
}
/* 拖动中禁用过渡，实现极致跟手 */
.tx-card.swiping {
  transition: box-shadow 0.25s ease;
}
.tx-card:hover {
  box-shadow: var(--shadow-md);
}
.tx-card.swiped {
  box-shadow: var(--shadow-md);
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.tx-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
}

.tx-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.tx-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.tx-icon-box.income { background: var(--income-bg); }
.tx-icon-box.expense { background: var(--expense-bg); }

.tx-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.tx-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.25;
}

.tx-category {
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.tx-amount.income { color: var(--income); }
.tx-amount.expense { color: var(--expense); }

/* ============ 弹窗 (记账) ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-primary);
  border-radius: 28px 28px 0 0;
  box-shadow:
    0 -8px 32px rgba(0, 0, 0, 0.12),
    0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
}

.modal-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 4px 0;
  flex-shrink: 0;
}

.modal-cancel {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  padding: 4px 8px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-save {
  background: var(--accent);
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: var(--sans);
  padding: 6px 16px;
  border-radius: 16px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.35);
}
.modal-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
.modal-save:not(:disabled):active {
  transform: scale(0.95);
}

.modal-tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-tab {
  padding: 8px 32px;
  border-radius: 20px;
  border: none;
  background: var(--bg-card);
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
}
.modal-tab.active {
  box-shadow: var(--shadow-md), var(--glow-accent);
  color: var(--accent-dark);
  font-weight: 700;
}

.modal-amount-display {
  padding: 8px 0;
  text-align: center;
  min-height: 52px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.modal-amount-display .modal-currency {
  font-size: 28px;
  font-weight: 400;
  color: var(--text-muted);
}

.modal-amount-display .modal-number {
  font-size: 44px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  min-width: 60px;
}

.modal-number.placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.modal-amount-display.expense .modal-number {
  color: var(--expense);
}
.modal-amount-display.income .modal-number {
  color: var(--income);
}

.modal-categories {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px 4px;
  padding: 0 4px;
}

.modal-cat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  font-family: var(--sans);
  transition: transform 0.2s ease;
}
.modal-cat-chip:active { transform: translateY(-2px); }

/* 分类图标选中态：金色光环（作用于 CategoryIcon 的 .cico） */
.modal-cat-chip.active :deep(.cico) {
  box-shadow: 0 4px 16px rgba(212, 165, 116, 0.2);
}
.modal-cat-chip.active :deep(.cico)::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 19px;
  border: 1.5px solid var(--accent);
  opacity: 0.5;
}

.chip-name {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color 0.2s;
  line-height: 1.2;
}
.modal-cat-chip.active .chip-name {
  color: var(--accent-dark);
  font-weight: 600;
}

/* 二级分类：单行横向滑动，溢出隐藏，边缘 mask 提示可滑 */
.modal-subcategories {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 0 4px 2px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 16px,
    #000 calc(100% - 16px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 16px,
    #000 calc(100% - 16px),
    transparent 100%
  );
}
.modal-subcategories::-webkit-scrollbar { display: none; }

.modal-sub-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 18px;
  border: 1px solid rgba(174, 168, 155, 0.2);
  background: var(--bg-card);
  box-shadow: none;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.modal-sub-chip.active {
  background: linear-gradient(145deg, #D4A843 0%, #B8860B 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(184, 134, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

/* 商户/地点输入 */
.modal-merchant-row {
  display: flex;
  gap: 8px;
  padding: 0 4px;
}

.merchant-input {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  font-size: 13px;
  font-family: var(--sans);
  color: var(--text-primary);
  outline: none;
}
.merchant-input::placeholder {
  color: var(--text-muted);
}

.modal-remark {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}

.remark-input {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  font-size: 14px;
  font-family: var(--sans);
  color: var(--text-primary);
  outline: none;
}
.remark-input::placeholder {
  color: var(--text-muted);
}

.remark-date {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ============ 记为资产开关 ============ */
.asset-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.asset-toggle-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
  cursor: pointer;
  transition: background 0.25s;
  padding: 0;
}

.toggle-switch.on {
  background: var(--accent);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(20px);
}

.asset-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(212, 165, 116, 0.06);
  border-radius: 12px;
  animation: assetFieldsIn 0.25s ease;
}

@keyframes assetFieldsIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.asset-field-row, .asset-field-row-pair {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-field-row-pair {
  flex-direction: row;
  gap: 10px;
}

.asset-field-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-field-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.asset-field-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-family: var(--sans);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-primary);
  box-sizing: border-box;
}

.asset-field-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* ============ 日期快捷选择 ============ */
.modal-date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.date-quick-pick {
  display: flex;
  gap: 4px;
  flex: 1;
}
.date-quick-chip {
  padding: 6px 12px;
  border-radius: 12px;
  border: none;
  background: var(--bg-card);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: var(--shadow-inset);
  transition: all 0.2s ease;
  white-space: nowrap;
  line-height: 1.2;
}
.date-quick-chip:hover {
  color: var(--text-primary);
}
.date-quick-chip.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 6px rgba(212, 165, 116, 0.3);
}

.date-picker {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}
.date-picker-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  font-size: 0;
  border: none;
  padding: 0;
}
.date-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  line-height: 1.2;
  cursor: pointer;
  font-family: var(--sans);
  border: none;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.date-picker-btn:hover {
  color: var(--text-primary);
}
.date-picker-btn.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 6px rgba(212, 165, 116, 0.3);
}
.date-picker-text {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ============ 数字键盘 ============ */

/* 弹窗中段可滚动区：金额、分类、商户、备注都在这里上下滚动 */
.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 4px 0;
  scrollbar-width: thin;
}
.modal-body::-webkit-scrollbar {
  width: 4px;
}
.modal-body::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 4px;
}

.num-keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 4px calc(env(safe-area-inset-bottom, 0px) + 8px);
  flex-shrink: 0;
  background: var(--bg-primary);
}

.num-key {
  height: 56px;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  font-size: 22px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.num-key:active {
  box-shadow: var(--shadow-md);
  transform: scale(0.96);
}

.num-key.key-empty {
  visibility: hidden;
  pointer-events: none;
  box-shadow: none;
}

.num-key.key-op {
  font-size: 20px;
  color: var(--accent-dark);
  background: var(--accent-light) !important;
  box-shadow: var(--shadow-sm), var(--glow-accent) !important;
}

.num-key.key-submit {
  background: var(--accent) !important;
  color: #fff !important;
  box-shadow: var(--shadow-md), var(--glow-accent) !important;
}
.num-key.key-submit.income {
  background: var(--income) !important;
  box-shadow: var(--shadow-md), var(--glow-income) !important;
}
.num-key.key-submit:active {
  box-shadow: var(--shadow-lg), 0 6px 24px rgba(212, 165, 116, 0.5) !important;
}
.num-key.key-submit.income:active {
  box-shadow: 0 6px 16px rgba(139, 168, 136, 0.5) !important;
}

/* ============ 过渡动画 ============ */
.list-enter-active { transition: all 0.4s ease; }
.list-leave-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(12px); }
.list-leave-to { opacity: 0; transform: scale(0.95); }

.modal-enter-active { transition: all 0.42s cubic-bezier(0.34, 1.2, 0.64, 1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%) scale(0.98); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%) scale(0.99); }

/* 弹窗内部元素错峰入场 */
.modal-enter-active .modal-card > * {
  animation: modalItemIn 0.42s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}
.modal-enter-active .modal-card > *:nth-child(1) { animation-delay: 0.09s; }
.modal-enter-active .modal-card > *:nth-child(2) { animation-delay: 0.15s; }
.modal-enter-active .modal-card > *:nth-child(3) { animation-delay: 0.21s; }
.modal-enter-active .modal-card > *:nth-child(4) { animation-delay: 0.27s; }
.modal-enter-active .modal-card > *:nth-child(5) { animation-delay: 0.33s; }
.modal-enter-active .modal-card > *:nth-child(n+6) { animation-delay: 0.39s; }
@keyframes modalItemIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ============ 统计页样式 ============ */
.stats-top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 -20px 20px;
  padding: 8px 20px 16px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
  background: transparent;
  //border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  /* Apple风格渐变模糊伪元素 */
  isolation: isolate;
}
.stats-top-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  /* 初始状态：有 backdrop-filter 但背景色极淡，模糊效果几乎不可见 */
  background: rgba(249, 249, 249, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  backdrop-filter: blur(24px);
  box-shadow: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

/* 底部渐变过渡层 + 模糊效果 */
.stats-top-bar::after {
  //content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 20px;
  margin-top: -1px;
  z-index: -1;
  /* 初始状态：极淡渐变背景 + 模糊效果 */
  background: linear-gradient(to bottom, rgba(249, 249, 249, 0.01), rgba(249, 249, 249, 0));
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  backdrop-filter: saturate(180%) blur(24px);
  pointer-events: none;
  transition: background 0.3s ease;
}

/* 滚动后：显示模糊效果 */
.stats-top-bar.scrolled::before {
  background: rgba(249, 249, 249, 0.88);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
}

.stats-top-bar.scrolled::after {
  /* 从顶栏背景色渐变到透明 */
  background: linear-gradient(to bottom, rgba(249, 249, 249, 0.88), rgba(249, 249, 249, 0));
}

/* 深色模式统计页顶栏 - 初始状态背景色极淡 */
:root[data-theme="dark"] .stats-top-bar::before {
  background: rgba(45, 41, 37, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .stats-top-bar::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.01), rgba(45, 41, 37, 0));
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .stats-top-bar.scrolled::before {
  background: rgba(45, 41, 37, 0.85);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.15);
}

:root[data-theme="dark"] .stats-top-bar.scrolled::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.85), rgba(45, 41, 37, 0));
}

:root[data-theme="dark"] .stats-top-bar.scrolled {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.stats-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stats-period-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  background: var(--accent-light);
  color: var(--accent-dark);
  font-weight: 600;
}

.report-btn {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-dark);
}

.stats-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 26px;
  border-radius: 24px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #2A241E, #15181F);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.12),
    var(--glow-accent);
  position: relative;
  overflow: hidden;
}
.summary-card::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(212, 165, 116, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.summary-card::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: 30px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(139, 168, 136, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.summary-card:active {
  transform: scale(0.98);
}

.summary-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.summary-amount {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  position: relative;
  z-index: 1;
}
.summary-amount.expense { color: var(--expense); }
.summary-amount.income { color: var(--income); }

.summary-mini-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.summary-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.mini-label { font-size: 11px; color: var(--text-muted); }
.mini-value { font-size: 13px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }

/* ============ 周期切换 tabs（日/周/月/年/自定义） ============ */
.stats-period-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin: 0 0 14px;
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}
.period-tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  transition: all .2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.period-tab.active {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.35);
}
.period-tab.custom-tab { padding: 8px 0; }
.period-tab.custom-tab.active { color: #fff; }
:root[data-theme="dark"] .stats-period-tabs {
  background: rgba(255, 255, 255, 0.04);
}

/* ============ Hero 高密度 4-up 网格 ============ */
/* 与下方 .stats-triple 用同一套 3 列网格：
   - 主卡 col 1+2 跨 2 列 + span 2 rows（占左 2/3 宽 + 整高）
   - 日均 / 记账笔数 自动落到 col 3 row 1 / row 2（占右 1/3 宽，竖向堆叠）
   - 这样主卡右边缘与月度预算卡（triple 第 2 张）的右边缘像素级对齐 */
/* ============ 浅色K线风格 Hero Metrics ============ */
.stats-hero-k {
  margin-bottom: 14px;
}
.hero-k-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 12px 16px 8px 16px;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(174, 168, 155, 0.12);
  box-shadow: var(--shadow-sm);
}
/* 上涨状态：右侧红色渐变光晕 */
.hero-k-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(229, 69, 69, 0.06) 100%);
  pointer-events: none;
}
/* 下跌状态：右侧绿色渐变光晕 */
.hero-k-card.down::before {
  background: linear-gradient(90deg, transparent 0%, rgba(34, 160, 107, 0.06) 100%);
}
.hero-k-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.hero-k-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(174, 168, 155, 0.1);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
}
.hero-k-title {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}
.hero-k-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 10px;
}
.hero-price-box-k {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hero-price-k {
  font-family: var(--mono);
  font-size: 40px;
  font-weight: 700;
  color: #e54545; /* 红涨 */
  letter-spacing: -1px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.hero-k-card.down .hero-price-k {
  color: #22a06b; /* 绿跌 */
}
.hero-price-k .cur-k {
  font-size: 16px;
  color: var(--text-muted);
  margin-right: 4px;
}
.hero-change-k {
  display: flex;
  align-items: center;
  gap: 6px;
}
.change-arrow-k {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e54545;
  border-radius: 4px;
}
.hero-k-card.down .change-arrow-k {
  background: #22a06b;
}
.change-arrow-k svg {
  width: 12px;
  height: 12px;
  stroke: #fff;
}
.change-text-k {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: #e54545;
}
.hero-k-card.down .change-text-k {
  color: #22a06b;
}
.hero-mini-chart-k {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 48px;
}
.mini-bar-k {
  width: 6px;
  border-radius: 2px;
  background: rgba(229, 69, 69, 0.25);
}
.mini-bar-k.up {
  background: #e54545;
}
.hero-k-card.down .mini-bar-k {
  background: rgba(34, 160, 107, 0.25);
}
.hero-k-card.down .mini-bar-k.up {
  background: #22a06b;
}
.hero-grid-k {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(174, 168, 155, 0.12);
}
.grid-item-k {
  text-align: center;
}
.grid-item-k .k {
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.grid-item-k .v {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
/* 暗色主题 */
:root[data-theme="dark"] .hero-k-card {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  border-color: rgba(255, 255, 255, 0.08);
  color: #fff;
}
:root[data-theme="dark"] .hero-k-card::before {
  background: linear-gradient(90deg, transparent 0%, rgba(229, 69, 69, 0.1) 100%);
}
:root[data-theme="dark"] .hero-k-card.down::before {
  background: linear-gradient(90deg, transparent 0%, rgba(34, 160, 107, 0.1) 100%);
}
:root[data-theme="dark"] .hero-k-badge {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
:root[data-theme="dark"] .hero-k-title {
  color: rgba(255, 255, 255, 0.5);
}
:root[data-theme="dark"] .hero-price-k .cur-k {
  color: rgba(255, 255, 255, 0.5);
}
:root[data-theme="dark"] .hero-grid-k {
  border-top-color: rgba(255, 255, 255, 0.08);
}
:root[data-theme="dark"] .grid-item-k .k {
  color: rgba(255, 255, 255, 0.4);
}
:root[data-theme="dark"] .grid-item-k .v {
  color: rgba(255, 255, 255, 0.9);
}

/* ============ 三联横排（同比环比 / 月度预算 / 储蓄率） ============ */
.stats-triple {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.triple-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 10px 11px 9px;
  box-shadow: var(--shadow-sm);
  min-width: 0;
}
.triple-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10.5px;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 4px;
  gap: 4px;
}
.triple-badge {
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 99px;
  font-family: var(--mono);
  font-weight: 700;
  flex-shrink: 0;
}
.triple-badge.up { background: rgba(201, 123, 123, 0.14); color: var(--expense); }
.triple-badge.down { background: rgba(139, 168, 136, 0.16); color: var(--income); }
.triple-badge.flat { background: rgba(168, 168, 168, 0.18); color: var(--text-secondary); }
.triple-badge.warn { background: rgba(232, 139, 139, 0.18); color: var(--expense); }
.triple-badge.over { background: rgba(232, 139, 139, 0.28); color: var(--expense); }
.triple-amount {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -.3px;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.triple-amount .cur {
  font-size: 10px;
  color: var(--text-muted);
  margin-right: 2px;
  font-weight: 500;
}
.triple-amount .triple-divider {
  color: var(--text-muted);
  font-weight: 400;
  margin: 0 2px;
}
.triple-amount .triple-limit {
  color: var(--text-muted);
  font-weight: 500;
}
.triple-amount .triple-unit {
  font-size: 11px;
  color: var(--income);
  font-weight: 600;
  margin-left: 2px;
}
.triple-sub {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 3px;
  font-family: var(--mono);
}
/* 月度预算进度条 */
.triple-card.budget { padding-bottom: 10px; }
.budget-progress {
  height: 4px;
  background: rgba(174, 168, 155, 0.18);
  border-radius: 99px;
  margin: 6px 0 4px;
  overflow: hidden;
}
.budget-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%);
  border-radius: 99px;
  transition: width .4s ease;
}
.budget-fill.warn {
  background: linear-gradient(90deg, #e88b8b 0%, var(--expense) 100%);
}
.budget-row {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  color: var(--text-muted);
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
:root[data-theme="dark"] .triple-card { background: rgba(255, 255, 255, 0.04); }
:root[data-theme="dark"] .budget-progress { background: rgba(255, 255, 255, 0.08); }

/* ============ AI 异常洞察 ============ */
.stats-insight {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 11px 12px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent-light) 0%, #fff8e7 100%);
  border: 1px solid rgba(212, 165, 116, 0.25);
}
:root[data-theme="dark"] .stats-insight {
  background: linear-gradient(135deg, rgba(212, 165, 116, 0.12) 0%, rgba(212, 165, 116, 0.04) 100%);
  border-color: rgba(212, 165, 116, 0.22);
}
.insight-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(212, 165, 116, 0.3);
}
.insight-icon svg {
  width: 16px;
  height: 16px;
  stroke: #fff;
}
.insight-body { flex: 1; min-width: 0; }
.insight-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--accent-dark);
  margin-bottom: 2px;
}
.insight-desc {
  font-size: 10.5px;
  color: var(--text-secondary);
  line-height: 1.45;
}

.stats-type-tabs {
  /* 收支切换器已隐藏 —— 统计页只展示支出视角，需要时把下一行注释掉即可恢复 */
  display: none;
  /* 原样式保留如下，需要时打开
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
  */
}

.stat-tab-btn {
  padding: 8px 36px;
  border-radius: 20px;
  border: none;
  background: var(--bg-card);
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
}
.stat-tab-btn.active {
  box-shadow: var(--shadow-md);
  font-weight: 700;
}
.stat-tab-btn:first-child.active { color: var(--expense); }
.stat-tab-btn:last-child.active { color: var(--income); }

/* ============ 同比环比卡片 ============ */
.compare-card {
  padding: 14px 16px;
  margin-bottom: 18px;
  border-radius: 18px;
}
.compare-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.compare-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.compare-card-period {
  font-size: 12px;
  color: var(--text-muted);
}
.compare-card-body {
  display: flex;
  gap: 12px;
}
.compare-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.compare-block-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 8px;
  width: fit-content;
}
.compare-block-tag.blue { background: rgba(107,184,227,0.15); color: #6bb8e3; }
.compare-block-tag.green { background: rgba(126,203,124,0.15); color: #5cb85c; }
.compare-block-data {
  display: flex;
  align-items: center;
  gap: 8px;
}
.compare-block-label {
  font-size: 12px;
  color: var(--text-muted);
}
.compare-block-value {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.compare-block-value.good { color: var(--income); }
.compare-block-value.bad { color: var(--expense); }
.compare-block-value.flat { color: var(--text-muted); }
.compare-divider {
  width: 1px;
  background: rgba(0, 0, 0, 0.06);
}

/* 图表区域 */
.stats-chart-section {
  margin-bottom: 14px;
}

/* 分类构成：donut + 列表左右布局 */
.chart-area {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: var(--shadow-sm);
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 50px 0;
}
.empty-icon { font-size: 48px; line-height: 1; animation: emptyFloat 3s ease-in-out infinite; }
.empty-text { font-size: 15px; color: var(--text-muted); }

@keyframes emptyFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-6px) rotate(-3deg); }
}

.cat-row {
  display: flex;
  gap: 12px;
  align-items: stretch;         /* 设计：让 donut-box 与 cat-list 同高 */
}

/* ============ 紧凑 donut ============ */
.donut-box {
  flex-shrink: 0;
  width: 120px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-svg-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}
.donut-ring-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.06));
  overflow: visible;
}
.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  text-align: center;
  white-space: nowrap;
}
.donut-center-amount {
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.3px;
}
.donut-center-label {
  font-size: 9.5px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 2px;
}
.donut-foot {
  margin-top: 6px;
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  font-family: var(--mono);
}
.donut-foot b {
  color: var(--expense);
  font-family: var(--mono);
  font-weight: 600;
}
.donut-track {
  fill: none;
  stroke: rgba(174, 168, 155, 0.15);
  stroke-width: 14;
}
.donut-seg {
  stroke-linecap: butt;
}
.donut-seg {
  /* motion-v 通过 pathLength 控制描边绘制 */
}

/* ============ 大类列表 ============ */
.cat-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-item {
  display: grid;
  grid-template-columns: 22px 1fr auto auto;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  padding: 4px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
  position: relative;
  opacity: 0;
  animation: fadeSlideIn 0.4s ease forwards;
}
.cat-item:hover { background: rgba(212, 165, 116, 0.06); }

.cat-item .icn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.cat-item .icn svg {
  width: 13px;
  height: 13px;
}
.cat-item .name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.cat-item .name .nm {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.cat-item .name .ct {
  font-size: 9.5px;
  color: var(--text-muted);
  font-family: var(--mono);
}
.cat-item .bar {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 99px;
  background: rgba(174, 168, 155, 0.18);
  overflow: hidden;
  margin-top: -2px;
}
.cat-item .bar .fg {
  height: 100%;
  border-radius: 99px;
  transition: width 0.35s ease;
}
.cat-item .amt {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.cat-item .amt .p {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: 3px;
}
.cat-item .chev {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}
.cat-item.expanded .chev {
  transform: rotate(180deg);
  color: var(--text-secondary);
}

/* ============ 子类目展开 ============ */
.sub-wrap {
  grid-column: 1 / -1;
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}
.cat-item.expanded .sub-wrap { grid-template-rows: 1fr; }

.sub-inner {
  min-height: 0;
  opacity: 0;
  transition: opacity 0.25s ease 0.1s;
}
.cat-item.expanded .sub-inner { opacity: 1; }

.sub-list {
  padding: 4px 0 6px 30px;
  border-left: 1.5px dashed rgba(174, 168, 155, 0.30);
  margin-left: 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sub-item {
  display: grid;
  grid-template-columns: 6px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 10.5px;
  transition: background 0.12s;
}
.sub-item:hover { background: rgba(212, 165, 116, 0.05); }
.sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sub-name {
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-count {
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--text-muted);
}
.sub-amount {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.sub-amount .sp {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: 2px;
}
.sub-mini-bar {
  grid-column: 2 / -1;
  height: 2px;
  border-radius: 99px;
  background: rgba(174, 168, 155, 0.18);
  overflow: hidden;
  margin-top: -1px;
}
.sub-mini-bar .fg {
  height: 100%;
  border-radius: 99px;
  opacity: 0.55;
  transition: width 0.35s ease;
}

/* 头部右侧"全部展开/收起"小开关 */
.cat-tool-btn {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}
.cat-tool-btn:hover {
  background: var(--gold-soft);
  color: var(--gold-deep);
}
.sub-amount {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.sub-amount .sp {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: 2px;
}
.sub-mini-bar {
  grid-column: 2 / -1;
  height: 2px;
  border-radius: 99px;
  background: rgba(174, 168, 155, 0.18);
  overflow: hidden;
  margin-top: -1px;
}
.sub-mini-bar .fg {
  height: 100%;
  border-radius: 99px;
  opacity: 0.55;
  transition: width 0.4s ease;
}

/* 分类构成 header 的「全部展开/收起」 */
.cat-tool-btn {
  font-size: 10.5px;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}
.cat-tool-btn:hover {
  background: var(--accent-light);
  color: var(--accent-dark);
}

/* 趋势柱状图 */
.trend-section {
  margin-bottom: 24px;
}

.trend-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: var(--shadow-sm);
}

/* ============ 排行卡片 ============ */
.rank-section {
  margin-bottom: 16px;
}

.rank-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: var(--shadow-sm);
}

.rank-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.rank-col {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 8px 10px;
}

.rank-col-title {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-col-title .more {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 11px;
}

.rank-row .rk {
  width: 14px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.rank-row:nth-child(2) .rk { color: var(--accent-dark); }
.rank-row:nth-child(3) .rk { color: var(--text-secondary); }
.rank-row:nth-child(4) .rk { color: var(--accent); }

.rank-row .nm {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row .v {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.rank-empty {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  padding: 12px 0;
}

/* ============ 消费习惯卡片 ============ */
.habit-section {
  margin-bottom: 16px;
}

.habit-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 14px 14px 12px;
  box-shadow: var(--shadow-sm);
}

.dist-row {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 10px;
}

.dist-block .dist-head {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dist-block .dist-head .peak {
  font-size: 9.5px;
  color: var(--accent-dark);
  font-family: var(--mono);
  font-weight: 600;
  background: var(--accent-light);
  padding: 2px 6px;
  border-radius: 99px;
}

.weekday-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  align-items: end;
  height: 64px;
}

.wd-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  height: 100%;
  justify-content: flex-end;
}

.wd-col .bar {
  width: 100%;
  background: linear-gradient(180deg, var(--accent) 0%, rgba(212, 165, 116, 0.6) 100%);
  border-radius: 3px 3px 0 0;
  min-height: 3px;
  transition: all 0.3s;
}

.wd-col.peak .bar {
  background: linear-gradient(180deg, var(--expense) 0%, rgba(232, 139, 139, 0.7) 100%);
  box-shadow: 0 0 6px rgba(201, 123, 123, 0.4);
}

.wd-col .lbl {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 600;
}

.wd-col.peak .lbl {
  color: var(--expense);
}

.wd-col .val {
  font-size: 8.5px;
  color: var(--text-muted);
  font-family: var(--mono);
}

.hour-cells {
  padding-bottom: 0;
}

.hour-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
}

.hour-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgba(174, 168, 155, 0.15);
  position: relative;
}

.hour-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: var(--text-muted);
  font-family: var(--mono);
  margin-top: 4px;
  padding: 0 1px;
}

/* ============ 趋势分类筛选 ============ */
.trend-filter-badge {
  font-size: 11px;
  color: var(--accent-dark);
  background: var(--accent-light);
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: var(--shadow-inset);
}

.trend-cat-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.trend-cat-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 4px 4px;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 16px,
    #000 calc(100% - 16px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 16px,
    #000 calc(100% - 16px),
    transparent 100%
  );
}
.trend-cat-row::-webkit-scrollbar { display: none; }

.trend-cat-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 14px;
  border: none;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  white-space: nowrap;
  transition: all 0.2s ease;
  line-height: 1.2;
}
.trend-cat-chip.active {
  background: linear-gradient(145deg, #D4A843 0%, #B8860B 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(184, 134, 11, 0.35);
  font-weight: 600;
}
.trend-cat-icon { font-size: 13px; line-height: 1; }
.trend-cat-sub .trend-cat-chip {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 12px;
}

/* 按日统计时：横向滚动，每柱固定宽度 */
.trend-bars-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  gap: 3px;
  padding-right: 6px;
  -webkit-overflow-scrolling: touch;
}
.trend-bars-scroll::-webkit-scrollbar { display: none; }
.trend-bars-scroll .trend-col {
  flex: 0 0 18px;
  min-width: 18px;
}
.trend-bars-scroll .trend-bar {
  width: 100%;
  max-width: 14px;
}
.trend-bars-scroll .trend-label {
  font-size: 9px;
}

/* ============ 趋势下钻：周柱可点击，日柱更细 ============ */
.trend-col-week {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  border-radius: 8px;
  padding: 0 4px;
  transition: background 0.2s ease;
}
.trend-col-week:hover {
  background: rgba(212, 165, 116, 0.08);
}
.trend-col-drilled {
  background: var(--accent-light);
  box-shadow: var(--shadow-inset);
}
.trend-col-day {
  flex: 0 0 16px;
  min-width: 16px;
  padding: 0;
}
.trend-col-day .trend-bar {
  width: 100%;
  max-width: 12px;
}
.trend-col-day .trend-label {
  font-size: 9px;
  color: var(--text-secondary);
}
.trend-drill-hint {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: auto;
  font-style: italic;
}

/* ============ 趋势图样式 ============ */
.trend-chart-bars {
  position: relative;
  padding-top: 4px;
}
.trend-svg {
  display: block;
  width: 100%;
  height: 110px;
  overflow: visible;
}

/* 标题区右侧容器：tools + legend */
.trend-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.trend-tools {
  display: flex;
  gap: 4px;
}
.tool-chip {
  font-size: 10.5px;
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
}
.tool-chip.active {
  background: var(--gold-soft);
  color: var(--gold-deep);
}
.trend-legend {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: var(--text-muted);
}
.trend-legend .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}

.trend-grid-line {
  stroke: rgba(174, 168, 155, 0.15);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}
.trend-grid-base {
  stroke: rgba(174, 168, 155, 0.35);
  stroke-dasharray: none;
}
.trend-y-text {
  font-size: 9px;
  fill: var(--text-muted);
  font-family: var(--sans);
  font-weight: 500;
}

/* 柱子 */
.trend-bar {
  transition: opacity 0.15s ease, filter 0.15s ease;
}
.trend-bar-expense {
  fill: var(--expense);
  opacity: 0.85;
}
.trend-bar-income {
  fill: var(--income);
  opacity: 0.9;
}
.trend-hover-rect {
  fill: var(--accent);
  opacity: 0.18;
  pointer-events: none;
}

/* 平均线 */
.trend-avg-line {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  opacity: 0.7;
  pointer-events: none;
}
.trend-avg-text {
  font-size: 8.5px;
  fill: var(--accent-dark);
  font-family: var(--mono);
  font-weight: 600;
}

/* 峰值标记 */
.trend-peak-mark {
  fill: var(--accent);
  opacity: 0.95;
}
.trend-peak-text {
  font-size: 8.5px;
  fill: #fff;
  font-family: var(--mono);
  font-weight: 700;
}

.trend-hover-line {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  opacity: 0.6;
  pointer-events: none;
}

.trend-x-text {
  font-size: 9.5px;
  fill: var(--text-muted);
  font-family: var(--sans);
}

.trend-tooltip {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  background: rgba(61, 56, 48, 0.94);
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1.5;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 5;
  animation: trend-tt-in 0.15s ease;
}
@keyframes trend-tt-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.tt-date {
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 3px;
  color: #fff;
}
.tt-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}
.tt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.tt-income .tt-dot { background: var(--income); }
.tt-expense .tt-dot { background: var(--expense); }
.tt-income { color: #b8dab6; }
.tt-expense { color: #f0baba; }

.trend-chart {
  padding: 6px 4px 0;
}

.trend-tip {
  margin-top: 6px;
  font-size: 10px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
  font-family: var(--mono);
}
.trend-tip b {
  color: var(--expense);
  font-weight: 600;
}

.trend-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}
.trend-legend-inline {
  display: flex;
  gap: 14px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-secondary);
}
.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.legend-income { background: var(--income); opacity: 0.9; }
.legend-expense { background: var(--expense); opacity: 0.85; }
.trend-peak-note {
  font-size: 10.5px;
  color: var(--accent-dark);
  font-family: var(--mono);
  font-weight: 600;
}

/* 旧版 HTML 柱状图样式（.trend-bars / .trend-col / .trend-bar-group / .trend-bar{width:80%;max-width:28px} 等）
   已废弃。柱子现在用 SVG <rect> 渲染；这些遗留 CSS 里的 .trend-bar { width: 80%; max-width: 28px }
   在 SVG2 下会作为 CSS 属性覆盖 :width="b.w"，导致柱子变胖（这正是用户反馈的"柱子特别宽"根因），
   所以整体删除 80+ 行遗留 CSS。SVG 版 .trend-bar 等定义见 line 5733 附近。*/

/* ========== 热力图 ========== */
.heatmap-section {
  margin-bottom: 24px;
}

.heatmap-card {
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  padding: 14px 16px 16px;
}

.heatmap-card .card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.heatmap-card .card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.heatmap-legend-inline {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}
.heatmap-legend-inline .legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.heatmap-legend-inline .legend-dot {
  width: 10px;
  height: 6px;
  border-radius: 2px;
}
.heatmap-legend-inline .legend-item.income .legend-dot {
  background: linear-gradient(90deg, rgba(126,203,124,0.7), rgba(126,203,124,0.2));
}
.heatmap-legend-inline .legend-item.expense .legend-dot {
  background: linear-gradient(90deg, rgba(232,139,139,0.7), rgba(232,139,139,0.2));
}

.heatmap-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.heatmap-wrapper {
  padding: 14px 12px 10px;
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.heatmap-wrapper.liquid {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.heatmap-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
  gap: 4px;
  margin-bottom: 4px;
}

.heatmap-wd-label {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 700;
  line-height: 22px;
}

.heatmap-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
}

.heatmap-cell {
  position: relative;
  min-height: 56px;
  border-radius: 8px;
  padding: 5px 4px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  font-variant-numeric: tabular-nums;
  animation: heatFadeIn 0.3s ease backwards;
}
.heatmap-cell.placeholder {
  visibility: hidden;
}
.heatmap-cell:not(.placeholder) {
  background: rgba(255,255,255,0.52);
  border: 1px solid rgba(255,255,255,0.65);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 10px rgba(91,78,61,0.06);
  cursor: default;
}

/* 深色模式 */
:root[data-theme="dark"] .heatmap-cell:not(.placeholder) {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.12);
}

.cell-day-num {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.cell-metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.metric-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(255,255,255,0.28);
  font-size: 8px;
  line-height: 1.2;
  font-weight: 600;
  overflow: hidden;
}
.metric-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--bar-w);
  border-radius: inherit;
  opacity: 0.82;
  z-index: 0;
  transition: width 0.4s;
}
.metric-bar.income::before {
  background: linear-gradient(90deg, rgba(126,203,124,var(--ia)), rgba(126,203,124,calc(var(--ia) * 0.2)));
}
.metric-bar.expense::before {
  background: linear-gradient(90deg, rgba(232,139,139,var(--ea)), rgba(232,139,139,calc(var(--ea) * 0.2)));
}
.metric-bar.income { color: rgb(69,121,76); }
.metric-bar.expense { color: rgb(176,79,86); }

/* 深色模式条形 */
:root[data-theme="dark"] .metric-bar {
  background: rgba(255,255,255,0.1);
}
:root[data-theme="dark"] .metric-bar.income { color: #a8d1ad; }
:root[data-theme="dark"] .metric-bar.expense { color: #f0a1a6; }

.metric-val { z-index: 1; font-weight: 700; }

.heatmap-tip {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
}

@keyframes heatFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

/* ========== "我的"页面 ========== */
.profile-header {
  padding: 20px 0 16px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 26px 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #2A241E, #15181F);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.12),
    var(--glow-accent);
  position: relative;
  overflow: hidden;
}
.user-card::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -30px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(212, 165, 116, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.user-card::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(139, 168, 136, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.avatar-large {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: avatarFloat 4s ease-in-out infinite;
}
.avatar-large::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(212, 165, 116, 0.4);
  animation: avatarRing 3s ease-out 0.6s infinite;
}
.avatar-large:hover {
  transform: scale(1.08) rotate(-4deg);
}
.avatar-emoji {
  font-size: 32px;
  line-height: 1;
  animation: emojiBob 2.6s ease-in-out infinite;
}

@keyframes avatarFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
@keyframes avatarRing {
  0%   { transform: scale(0.95); opacity: 0.5; }
  70%  { transform: scale(1.2); opacity: 0; }
  100% { transform: scale(1.2); opacity: 0; }
}
@keyframes emojiBob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-2px) rotate(5deg); }
}

.vip-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #d4a574, #e8c08b);
  padding: 1px 7px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(212,165,116,0.35);
}

.user-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin: 4px 0 0;
  position: relative;
  z-index: 1;
}

.user-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  position: relative;
  z-index: 1;
}
.user-desc strong {
  color: var(--accent-dark);
  font-weight: 700;
}

/* 数据总览 */
.profile-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 16px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-val {
  font-size: 17px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.stat-val.expense { color: var(--expense); }
.stat-val.income { color: var(--income); }
.stat-val.balance { color: var(--accent-dark); }

/* 功能菜单 */
.menu-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

/* 资产卡片风格三选一切换器 */
.style-picker-row {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  cursor: default;
}
.style-picker {
  display: flex;
  gap: 6px;
  background: rgba(174, 168, 155, 0.12);
  border-radius: 99px;
  padding: 3px;
}
.style-chip {
  flex: 1;
  border: none;
  background: transparent;
  padding: 7px 8px;
  border-radius: 99px;
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.style-chip:active { transform: scale(0.95); }
.style-chip.active {
  background: var(--bg-card, #fff);
  color: var(--accent);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 16px;
  cursor: pointer;
  opacity: 0;
  animation: fadeSlideIn 0.4s ease forwards;
  transition: all 0.25s ease;
}
.menu-row:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.menu-row:active {
  transform: scale(0.98);
}

/* 开关型菜单行：点击整行切换，右侧用 iOS 风格 toggle 替代箭头 */
.menu-toggle-row .menu-arrow { display: none; }
.menu-label-stack { display: flex; flex-direction: column; gap: 2px; }
.menu-label-hint {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 400;
  line-height: 1.3;
}

.menu-toggle {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  background: rgba(174, 168, 155, 0.35);
  position: relative;
  transition: background 0.25s ease;
  flex-shrink: 0;
  box-shadow: var(--shadow-inset);
}
.menu-toggle.on {
  background: var(--accent);
  box-shadow: 0 2px 6px rgba(212, 165, 116, 0.4);
}
.menu-toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.menu-toggle.on .menu-toggle-knob {
  transform: translateX(18px);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.menu-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}
.menu-badge.warn {
  background: rgba(232,139,139,0.15);
  color: #e88b8b;
}
.menu-badge.success {
  background: rgba(126,203,124,0.15);
  color: #5cb85c;
}

.menu-arrow {
  color: var(--text-muted);
  stroke-width: 2.2;
  flex-shrink: 0;
}

/* 底部版本信息 */
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 30px;
}

.footer-text {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.footer-divider {
  color: var(--text-muted);
  font-size: 14px;
  opacity: 0.4;
}

/* ============ 提醒弹窗 ============ */
.reminder-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.reminder-card {
  width: 100%;
  max-width: 320px;
  background: var(--bg-primary);
  border-radius: 28px;
  padding: 32px 24px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.reminder-emoji {
  font-size: 48px;
  line-height: 1;
  animation: bellShake 1s ease-in-out infinite;
}

@keyframes bellShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.reminder-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.reminder-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px;
  line-height: 1.5;
}

.reminder-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.reminder-later {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: var(--shadow-sm);
}

.reminder-now {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: var(--accent);
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
}
.reminder-now:active {
  transform: scale(0.96);
}

/* ============ 深色模式 ============ */
:root[data-theme="dark"] .transaction-list-section {
  background: rgba(45, 41, 37, 0.95);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.18);
}

:root[data-theme="dark"] .drawer-header {
  background: rgba(45, 41, 37, 0.95);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

:root[data-theme="dark"] .tx-card {
  background: rgba(255, 255, 255, 0.04);
  box-shadow: var(--shadow-sm);
}

:root[data-theme="dark"] .tx-card:hover,
:root[data-theme="dark"] .tx-card.swiped {
  box-shadow: var(--shadow-md);
}

/* ============ 自定义日期范围底部弹窗 ============ */
.date-sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(20, 15, 8, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.date-sheet {
  width: 100%;
  max-width: 480px;
  background: var(--bg-primary);
  border-radius: 24px 24px 0 0;
  padding: 14px 16px 22px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.18);
  max-height: 88vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.date-sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--text-muted);
  border-radius: 99px;
  margin: 0 auto 12px;
  opacity: 0.5;
}
.date-sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.date-sheet-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.3px;
  color: var(--text-primary);
}
.date-sheet-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bg-2, rgba(0, 0, 0, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}
.date-quick-ranges {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}
.date-quick-range {
  padding: 8px 6px;
  border-radius: 10px;
  background: var(--bg-card);
  font-size: 11.5px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  box-shadow: var(--shadow-sm);
  user-select: none;
}
.date-quick-range.active {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(212, 165, 116, 0.3);
}
.date-range-display {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.date-range-box {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 10px 12px;
  text-align: center;
  cursor: pointer;
  transition: all .15s;
  box-shadow: var(--shadow-sm);
  border: 1.5px solid transparent;
}
.date-range-box.active {
  background: var(--accent-light, rgba(212, 165, 116, 0.08));
  border-color: var(--accent);
}
.date-range-box .l {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1px;
  font-weight: 600;
  margin-bottom: 2px;
}
.date-range-box .v {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.date-range-box.active .v { color: var(--accent-dark); }
.date-range-arrow {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 700;
}
.date-cal-wrap {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 12px 10px 10px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-sm);
}
.date-cal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
}
.date-cal-title {
  font-size: 13px;
  font-weight: 700;
  font-family: var(--mono);
  color: var(--text-primary);
}
.date-cal-nav { display: flex; gap: 4px; }
.date-cal-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
  font-size: 14px;
  font-weight: 700;
  user-select: none;
}
.date-cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.date-cal-week > div {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  padding: 4px 0;
}
.date-cal-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.date-cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-family: var(--mono);
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  position: relative;
  transition: background .12s;
  user-select: none;
}
.date-cal-day.muted {
  color: rgba(0, 0, 0, 0.18);
  cursor: default;
}
.date-cal-day.today {
  outline: 1px solid var(--accent);
  color: var(--accent-dark);
  font-weight: 700;
}
.date-cal-day:hover:not(.muted) {
  background: rgba(212, 165, 116, 0.18);
}
.date-cal-day.in-range {
  background: rgba(212, 165, 116, 0.22);
  color: var(--accent-dark);
  border-radius: 0;
}
.date-cal-day.start,
.date-cal-day.end {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(212, 165, 116, 0.35);
}
.date-cal-day.start { border-radius: 8px 0 0 8px; }
.date-cal-day.end { border-radius: 0 8px 8px 0; }
.date-cal-day.start.end { border-radius: 8px; }
.date-sheet-footer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
  margin-top: 4px;
}
.date-btn {
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: transform .1s;
  font-family: var(--sans);
}
.date-btn:active { transform: scale(.98); }
.date-btn-secondary {
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
}
.date-btn-primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: #fff;
  box-shadow: 0 6px 16px rgba(212, 165, 116, 0.35);
}

/* Sheet 入场动画 */
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity .25s ease;
}
.sheet-fade-enter-active .date-sheet,
.sheet-fade-leave-active .date-sheet {
  transition: transform .35s cubic-bezier(.22, 1, .36, 1);
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}
.sheet-fade-enter-from .date-sheet,
.sheet-fade-leave-to .date-sheet {
  transform: translateY(100%);
}
</style>
