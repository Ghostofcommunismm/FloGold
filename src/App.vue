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
            <CategoryIcon :name="cat.name" />
            <span class="cat-label">{{ cat.name }}</span>
          </div>
        </section>

        <!-- 快捷记账 -->
        <QuickLog
          :transactions="transactions"
          :categories="categories"
          :sub-categories="subCategories"
          :days="30"
          @pick="onQuickLogPick"
        />
      </div>

      <!-- transaction-drawer: 占满剩余空间，内部滚动 -->
      <div class="transaction-drawer">
        <div class="transaction-list-section">
          <!-- 抽屉拖拽指示器 -->
          <div class="drawer-handle">
            <div class="drawer-indicator">
              <span class="drawer-bar"></span>
            </div>
          </div>

          <!-- 交易列表头部 -->
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
          <span class="stats-period-badge">{{ statsPeriod === 'week' ? '本周' : statsPeriod === 'month' ? '本月' : '本年' }}</span>
        </div>
        <button class="report-btn neumorph-pill" @click="showReport = true">
          <IconDisplay icon="ClipboardList" :size="16" /> 报告
        </button>
      </header>

      <!-- 收支汇总卡片 -->
      <section v-reveal class="stats-summary">
        <div class="summary-card" @click="statsType = statsType === 'expense' ? 'income' : 'expense'">
          <span class="summary-label">{{ statsType === 'expense' ? '总支出' : '总收入' }}</span>
          <span class="summary-amount" :class="statsType">
            {{ statsType === 'expense' ? '-' : '+' }}¥{{ statsTotalDisp.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </span>
        </div>
        <div class="summary-mini-row">
          <div class="summary-mini"><span class="mini-label">笔数</span><span class="mini-value">{{ Math.round(statsCountDisp) }} 笔</span></div>
          <div class="summary-mini"><span class="mini-label">日均</span><span class="mini-value">¥{{ Math.round(statsAvgDisp) }}</span></div>
        </div>
      </section>

      <!-- 收支切换 tab -->
      <div class="stats-type-tabs">
        <button class="stat-tab-btn" :class="{ active: statsType === 'expense' }" @click="statsType = 'expense'">支出</button>
        <button class="stat-tab-btn" :class="{ active: statsType === 'income' }" @click="statsType = 'income'">收入</button>
      </div>

      <!-- 同比环比卡片 -->
      <section class="compare-card neumorph">
        <div class="compare-card-header">
          <span class="compare-card-title">同比环比</span>
          <span class="compare-card-period">{{ comparePeriodLabel }}</span>
        </div>
        <div class="compare-card-body">
          <div class="compare-block">
            <span class="compare-block-tag blue">环比</span>
            <div class="compare-block-data">
              <span class="compare-block-label">支出</span>
              <span class="compare-block-value" :class="momCompare.cls">{{ momCompare.text }}</span>
            </div>
          </div>
          <div class="compare-divider"></div>
          <div class="compare-block">
            <span class="compare-block-tag green">同比</span>
            <div class="compare-block-data">
              <span class="compare-block-label">支出</span>
              <span class="compare-block-value" :class="yoyCompare.cls">{{ yoyCompare.text }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 环形饼图 + 分类列表 -->
      <section v-reveal class="stats-chart-section">
        <div class="chart-area">
          <div v-if="categoryStatsList.length === 0" class="chart-empty">
            <span class="empty-icon"><IconDisplay icon="ChartBar" :size="44" :stroke-width="1.6" /></span>
            <span class="empty-text">暂无{{ statsType === 'expense' ? '支出' : '收入' }}数据</span>
          </div>
          <template v-else>
            <div class="donut-wrapper">
              <!-- SVG 指示线层 -->
              <svg v-if="categoryStatsList.length > 0" class="donut-lines-svg" viewBox="0 0 340 280" aria-hidden="true">
                <g v-for="(label, idx) in donutLabels" :key="'l-' + label.name">
                  <polyline
                    :points="`${label.x1},${label.y1} ${label.x2},${label.y2} ${label.x3},${label.y3}`"
                    fill="none"
                    :stroke="label.color"
                    stroke-width="2"
                    stroke-opacity="0.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle :cx="label.x1" :cy="label.y1" r="4" :fill="label.color" />
                  <circle :cx="label.x1" :cy="label.y1" r="2" fill="#fff" />
                </g>
              </svg>
              <!-- 饼图本体 —— SVG 弧段描边绘制 -->
              <svg class="donut-ring-svg" viewBox="0 0 170 170" aria-hidden="true">
                <circle class="donut-track" cx="85" cy="85" r="72" />
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
                  stroke-width="26"
                  stroke-linecap="butt"
                />
              </svg>
              <div class="donut-center">
                <span class="donut-center-amount">¥{{ Math.round(statsTotalDisp) }}</span>
                <span class="donut-center-label">{{ statsType === 'expense' ? '支出' : '收入' }}</span>
              </div>
              <!-- 标签文字层 -->
              <template v-if="categoryStatsList.length > 0">
                <div
                  v-for="(label, idx) in donutLabels"
                  :key="'t-' + label.name"
                  class="donut-label-tag"
                  :class="label.side"
                  :style="{
                    left: label.labelX + 'px',
                    top: label.labelY + 'px',
                    '--color': label.color,
                    animationDelay: idx * 0.08 + 's',
                  }"
                >
                  <span class="tag-dot" :style="{ background: label.color }"></span>
                  <IconDisplay :icon="getLucideIconName(label.icon)" :size="16" /> {{ label.name }}
                </div>
              </template>
            </div>
            <div class="cat-rank-list">
              <div
                v-for="(cat, idx) in categoryStatsList"
                :key="cat.name"
                class="rank-item"
                :class="{ expanded: expandedCategory === cat.name }"
                :style="{ animationDelay: idx * 0.06 + 's' }"
              >
                <div class="rank-header" @click="toggleCategory(cat.name)">
                  <div class="rank-color-dot" :style="{ background: cat.color }"></div>
                  <span class="rank-cat-icon"><IconDisplay :icon="getLucideIconName(cat.icon)" :size="18" /></span>
                  <span class="rank-cat-name">{{ cat.name }}</span>
                  <div class="rank-bar-track">
                    <div class="rank-bar-fill" :style="{ width: (cat.percent * 100).toFixed(1) + '%', background: cat.color }"></div>
                  </div>
                  <span class="rank-amount">¥{{ cat.amount.toFixed(2) }}</span>
                  <span class="rank-percent">{{ (cat.percent * 100).toFixed(1) }}%</span>
                  <svg class="rank-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div class="rank-expandable">
                  <div class="rank-expandable-inner">
                    <div
                      v-for="(sub, sIdx) in getSubcategoryStats(cat.name)"
                      :key="sub.name"
                      class="sub-item"
                      :style="{ transitionDelay: expandedCategory === cat.name ? (sIdx * 0.05) + 's' : '0s' }"
                    >
                      <span class="sub-dot" :style="{ background: cat.color }"></span>
                      <span class="sub-name">{{ sub.name }}</span>
                      <div class="sub-bar-track">
                        <div class="sub-bar-fill" :style="{ width: (sub.percent * 100).toFixed(1) + '%', background: cat.color }"></div>
                      </div>
                      <span class="sub-amount">¥{{ sub.amount.toFixed(2) }}</span>
                      <span class="sub-percent">{{ (sub.percent * 100).toFixed(1) }}%</span>
                      <span class="sub-count">{{ sub.count }}笔</span>
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
        <div class="section-header">
          <h3 class="section-title">趋势</h3>
          <div class="trend-header-right">
            <div class="trend-type-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                :class="{ active: statsType === 'expense' }"
                @click="statsType = 'expense'"
              >支出</button>
              <button
                type="button"
                role="tab"
                :class="{ active: statsType === 'income' }"
                @click="statsType = 'income'"
              >收入</button>
            </div>
            <span v-if="trendCategory" class="trend-filter-badge">
              {{ trendCategory }}{{ trendSubCategory ? ' · ' + trendSubCategory : '' }}
            </span>
          </div>
        </div>

        <!-- 分类筛选：单行横向滑动 -->
        <div class="trend-cat-filter">
          <div class="trend-cat-row">
            <button
              class="trend-cat-chip"
              :class="{ active: !trendCategory }"
              @click="setTrendCategory(null)"
            >全部</button>
            <button
              v-for="cat in categories.slice(1)"
              :key="cat.name"
              class="trend-cat-chip"
              :class="{ active: trendCategory === cat.name }"
              @click="setTrendCategory(cat.name)"
            >
              <span class="trend-cat-icon"><IconDisplay :icon="getLucideIconName(cat.icon)" :size="16" /></span>
              <span>{{ cat.name }}</span>
            </button>
          </div>
          <!-- 二级分类：选了一级才显示 -->
          <div v-if="trendCategory" class="trend-cat-row trend-cat-sub">
            <button
              class="trend-cat-chip"
              :class="{ active: !trendSubCategory }"
              @click="trendSubCategory = null"
            >全部</button>
            <button
              v-for="sub in (subCategories[trendCategory] || [])"
              :key="sub"
              class="trend-cat-chip"
              :class="{ active: trendSubCategory === sub }"
              @click="trendSubCategory = sub"
            >{{ sub }}</button>
          </div>
        </div>

        <div class="trend-chart trend-chart-line">
          <svg
            class="trend-svg"
            :viewBox="`0 0 ${TREND_W} ${TREND_H}`"
            preserveAspectRatio="none"
            @mousemove="onTrendHover"
            @mouseleave="onTrendLeave"
          >
            <defs>
              <linearGradient id="trend-grad-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8ba888" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#8ba888" stop-opacity="0.02" />
              </linearGradient>
              <linearGradient id="trend-grad-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#c97b7b" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#c97b7b" stop-opacity="0.02" />
              </linearGradient>
            </defs>

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

            <!-- 折线 + 区域 -->
            <path v-if="trendAreaPath" :d="trendAreaPath" :fill="`url(#trend-grad-${activeClass})`" />
            <path v-if="trendLinePath" :d="trendLinePath" :class="['trend-line', `trend-line-${activeClass}`]" />

            <!-- 数据点 -->
            <g v-for="p in trendPoints" :key="p.index">
              <circle
                v-if="activeValue(p) > 0"
                :cx="p.x" :cy="p.activeY"
                r="2.5"
                :class="['trend-dot', `trend-dot-${activeClass}`]"
              />
            </g>

            <!-- hover 高亮 -->
            <template v-if="hoverPoint">
              <line
                :x1="hoverPoint.x" :x2="hoverPoint.x"
                :y1="TREND_PAD_T" :y2="trendBaselineY"
                class="trend-hover-line"
              />
              <circle
                v-if="activeValue(hoverPoint) > 0"
                :cx="hoverPoint.x" :cy="hoverPoint.activeY"
                r="5"
                :class="['trend-hover-dot', `trend-hover-dot-${activeClass}`]"
              />
            </template>

            <!-- X 轴标签 -->
            <g v-for="(t, i) in trendXLabels" :key="'x-' + i">
              <text :x="t.x" :y="TREND_H - 10" text-anchor="middle" class="trend-x-text">{{ t.label }}</text>
            </g>
          </svg>
          <div class="trend-legend">
            <span class="legend-item"><i class="legend-dot legend-income"></i>收入</span>
            <span class="legend-item"><i class="legend-dot legend-expense"></i>支出</span>
          </div>
          <!-- hover tooltip -->
          <div
            v-if="hoverPoint && activeValue(hoverPoint) > 0"
            class="trend-tooltip"
            :style="{ left: (hoverPoint.x / TREND_W * 100) + '%' }"
          >
            <div class="tt-date">{{ hoverPoint.day }} 日</div>
            <div :class="['tt-row', `tt-${activeClass}`]">
              <span class="tt-dot"></span>
              {{ activeClass === 'income' ? '收入' : '支出' }} ¥{{ activeValue(hoverPoint).toFixed(0) }}
            </div>
          </div>
        </div>
      </section>

      <!-- 记账热力图 (方案C: 液态金额条) -->
      <section v-reveal class="heatmap-section">
        <div class="section-header">
          <h3 class="section-title">收支热力图</h3>
          <span class="heatmap-subtitle">{{ heatmapTitle }}</span>
          <span class="heatmap-legend-inline">
            <span class="legend-item income"><i class="legend-dot"></i>收入</span>
            <span class="legend-item expense"><i class="legend-dot"></i>支出</span>
          </span>
        </div>
        <div class="heatmap-wrapper liquid">
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
                    <span class="metric-label">收</span>
                    <span class="metric-val">{{ heatmapShortMoney(cell.income) }}</span>
                  </span>
                  <span class="metric-bar expense" :style="{ '--bar-w': heatmapBarWidth(cell.expense, heatmapMaxExpense) }">
                    <span class="metric-label">支</span>
                    <span class="metric-val">{{ heatmapShortMoney(cell.expense) }}</span>
                  </span>
                </div>
              </template>
            </div>
          </div>
          <div class="heatmap-tip">条形越长越深，金额越高</div>
        </div>
      </section>
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

    <!-- 完整记账弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
          <div class="modal-card">
            <!-- 顶部操作栏 -->
            <div class="modal-top-row">
              <button class="modal-cancel" @click="closeAddModal">取消</button>
              <h3 class="modal-title">记一笔</h3>
              <button class="modal-save" :disabled="!canSave" @click="saveTransaction">完成</button>
            </div>

            <!-- 收支切换 -->
            <div class="modal-tabs">
              <button
                class="modal-tab"
                :class="{ active: form.type === 'expense' }"
                @click="form.type = 'expense'"
              >支出</button>
              <button
                class="modal-tab"
                :class="{ active: form.type === 'income' }"
                @click="form.type = 'income'"
              >收入</button>
            </div>

            <!-- 金额展示区 -->
            <div class="modal-body">
              <div class="modal-amount-display" :class="form.type">
                <span class="modal-currency">¥</span>
                <span class="modal-number" :class="{ placeholder: !form.amount }">
                  {{ form.amount || '0' }}
                </span>
              </div>

              <!-- 分类选择 -->
              <div class="modal-categories">
                <button
                  v-for="cat in categories.slice(1)"
                  :key="cat.name"
                  type="button"
                  class="modal-cat-chip"
                  :class="{ active: form.category === cat.name }"
                  @click="selectCategory(cat.name)"
                >
                  <CategoryIcon :name="cat.name" />
                  <span class="chip-name">{{ cat.name }}</span>
                </button>
              </div>

              <!-- 二级分类（仅支出） -->
              <div v-if="form.type === 'expense'" class="modal-subcategories">
                <button
                  v-for="sub in (subCategories[form.category] || [])"
                  :key="sub"
                  type="button"
                  class="modal-sub-chip"
                  :class="{ active: form.subCategory === sub }"
                  @click="selectSubCategory(sub)"
                >
                  {{ sub }}
                </button>
              </div>

              <!-- 商户/地点输入 -->
              <div class="modal-merchant-row">
                <input
                  v-model="form.merchant"
                  type="text"
                  class="merchant-input"
                  placeholder="商户（选填）"
                  maxlength="20"
                />
                <input
                  v-model="form.location"
                  type="text"
                  class="merchant-input"
                  placeholder="地点（选填）"
                  maxlength="20"
                />
              </div>

              <!-- 备注输入 -->
              <div class="modal-remark">
                <input
                  v-model="form.note"
                  type="text"
                  class="remark-input"
                  placeholder="添加备注…"
                  maxlength="20"
                />
              </div>

              <!-- 记为资产开关（仅支出） -->
              <div v-if="form.type === 'expense'" class="asset-toggle-row">
                <label class="asset-toggle-label">记为资产</label>
                <button
                  type="button"
                  class="toggle-switch"
                  :class="{ on: form.asAsset }"
                  @click="form.asAsset = !form.asAsset"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>

              <!-- 资产字段（开关打开时展开） -->
              <div v-if="form.asAsset" class="asset-fields">
                <div class="asset-field-row">
                  <label class="asset-field-label">资产分类</label>
                  <input v-model="form.assetCategory" type="text" class="asset-field-input" placeholder="如：数码" maxlength="10" />
                </div>
                <div class="asset-field-row">
                  <label class="asset-field-label">存放位置</label>
                  <input v-model="form.assetLocation" type="text" class="asset-field-input" placeholder="如：客厅" maxlength="20" />
                </div>
                <div class="asset-field-row">
                  <label class="asset-field-label">归属人</label>
                  <input v-model="form.assetOwner" type="text" class="asset-field-input" placeholder="如：爸爸" maxlength="20" />
                </div>
                <div class="asset-field-row-pair">
                  <div class="asset-field-col">
                    <label class="asset-field-label">使用年限</label>
                    <input v-model.number="form.assetUsefulLife" type="number" class="asset-field-input" min="1" max="100" />
                  </div>
                  <div class="asset-field-col">
                    <label class="asset-field-label">残值率</label>
                    <input v-model.number="form.assetSalvageRate" type="number" class="asset-field-input" min="0" max="1" step="0.05" />
                  </div>
                </div>
              </div>

              <!-- 日期快捷选择 + 自定义日期 -->
              <div class="modal-date-row">
                <div class="date-quick-pick">
                  <button
                    v-for="opt in dateQuickOptions"
                    :key="opt.label"
                    type="button"
                    class="date-quick-chip"
                    :class="{ active: form.date === opt.date }"
                    @click="form.date = opt.date"
                  >{{ opt.label }}</button>
                </div>
                <button
                  type="button"
                  class="date-picker-btn"
                  :class="{ active: showDatePopover }"
                  @click="showDatePopover = !showDatePopover"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span class="date-picker-text">{{ formatDisplayDate(form.date) }}</span>
                </button>
              </div>

              <DateCalendarPopover
                :show="showDatePopover"
                v-model="form.date"
                :max="todayStr()"
                @close="showDatePopover = false"
              />
            </div>

            <!-- 数字键盘 -->
            <div class="num-keyboard">
              <button
                v-for="(key, index) in numKeys"
                :key="index"
                class="num-key"
                :class="{
                  'key-zero': key === '0',
                  'key-fn': key === '⌫' || key === '.',
                  'key-dot': key === '.',
                  'key-op': key === '+' || key === '×',
                  'key-submit': key === '✓',
                  'key-empty': !key,
                  [form.type]: key === '✓'
                }"
                :style="key === '0' ? { gridColumn: 'span 2' } : {}"
                @click="key === '✓' ? saveTransaction() : (key ? handleKeyPress(key) : null)"
              >
                <template v-if="key === '✓'">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                  </svg>
                </template>
                <template v-else>{{ key }}</template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
    <ReportModal
      :show="showReport"
      :transactions="transactions"
      @close="showReport = false"
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
import ReportModal from './components/ReportModal.vue'
import DatePickerModal from './components/DatePickerModal.vue'
import DateCalendarPopover from './components/DateCalendarPopover.vue'
import QuickLog from './components/QuickLog.vue'
import AssetTab from './components/AssetTab.vue'
import { buildAssetFromTransaction } from './asset-utils'
import type { Transaction, Category, SubCategories, Budget, RecurringItem, ReminderSettings, AppData, UISettings, Asset, AssetCardStyle } from './types'
import { loadData, saveData, todayStr, currentMonthKey, prevMonthKey, lastYearSameMonthKey, formatDisplayDate } from './storage'
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
const showReport = ref(false)
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
  { key: 'showReport', ref: () => showReport.value, close: () => { showReport.value = false } },
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
const statsPeriod = ref<'week' | 'month' | 'year'>('month')
const statsType = ref<'expense' | 'income'>('expense')

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

  if (statsPeriod.value === 'week') {
    // 最近7天
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
    return transactions.value.filter(t => t.type === statsType.value && t.date >= weekAgoStr && t.date <= todayDateStr)
  }
  if (statsPeriod.value === 'month') {
    const currentMonthStr = cmKey
    return transactions.value.filter(
      t => t.type === statsType.value && t.date.startsWith(currentMonthStr)
    )
  }
  // year
  const yearStr = String(now.getFullYear())
  return transactions.value.filter(t => t.type === statsType.value && t.date.startsWith(yearStr))
})

const statsTotal = computed(() =>
  statsFilteredTxs.value.reduce((sum, t) => sum + t.amount, 0)
)
const statsCount = computed(() => statsFilteredTxs.value.length)

const statsAvgPerDay = computed(() => {
  const days = statsPeriod.value === 'week' ? 7 : statsPeriod.value === 'month' ? 30 : 365
  return days > 0 ? statsTotal.value / days : 0
})

// 统计页数字滚动 —— 切换类型/周期时平滑过渡
const { display: statsTotalDisp } = useCountUp(statsTotal, { duration: 700, decimals: 2 })
const { display: statsCountDisp } = useCountUp(statsCount, { duration: 500, decimals: 0 })
const { display: statsAvgDisp } = useCountUp(statsAvgPerDay, { duration: 700, decimals: 0 })

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
const expandedCategory = ref<string | null>(null)

function toggleCategory(name: string) {
  expandedCategory.value = expandedCategory.value === name ? null : name
}

// 切换统计维度时收起展开项
watch([statsType, statsPeriod], () => {
  expandedCategory.value = null
})

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
  const cx = 85, cy = 85, r = 72
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

const trendData = computed<TrendData[]>(() => {
  // 趋势图始终按日统计当月（1-31 号），与 statsPeriod 解耦
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`
  const catFilter = trendCategory.value
  const subFilter = trendSubCategory.value

  const days: TrendData[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${monthKey}-${String(d).padStart(2, '0')}`
    let income = 0
    let expense = 0
    for (const tx of transactions.value) {
      if (tx.date !== dateKey) continue
      if (catFilter && tx.category !== catFilter) continue
      if (subFilter && tx.subCategory !== subFilter) continue
      if (tx.type === 'income') income += tx.amount
      else expense += tx.amount
    }
    days.push({ label: String(d), income, expense })
  }
  return days
})

const trendMaxValue = computed(() => {
  return Math.max(
    ...trendData.value.map(d => Math.max(d.income, d.expense)),
    1,
  )
})

// ========== 折线图几何 ==========
const TREND_W = 360
const TREND_H = 200
const TREND_PAD_X = 28
const TREND_PAD_R = 12
const TREND_PAD_T = 14
const TREND_PAD_B = 26

interface TrendPoint {
  index: number
  day: number
  income: number
  expense: number
  x: number
  activeY: number  // 当前类型（income/expense）的 y 坐标，统一从基线向上
}

const trendBaselineY = computed(() => TREND_PAD_T + (TREND_H - TREND_PAD_T - TREND_PAD_B))

const activeClass = computed(() => statsType.value === 'income' ? 'income' : 'expense')

function activeValue(p: TrendPoint): number {
  return statsType.value === 'income' ? p.income : p.expense
}

const trendPoints = computed<TrendPoint[]>(() => {
  const data = trendData.value
  if (data.length === 0) return []
  const N = data.length
  const chartW = TREND_W - TREND_PAD_X - TREND_PAD_R
  const chartH = TREND_H - TREND_PAD_T - TREND_PAD_B
  const baselineY = TREND_PAD_T + chartH
  const isIncome = statsType.value === 'income'
  const maxV = Math.max(...data.map(d => isIncome ? d.income : d.expense), 1)

  return data.map((d, i) => {
    const day = parseInt(d.label) || (i + 1)
    const x = N === 1 ? TREND_PAD_X + chartW / 2 : TREND_PAD_X + (i / (N - 1)) * chartW
    const v = isIncome ? d.income : d.expense
    const activeY = v > 0 ? baselineY - (v / maxV) * (chartH - 8) : baselineY
    return { index: i, day, income: d.income, expense: d.expense, x, activeY }
  })
})

/**
 * Catmull-Rom 转 Cubic Bezier：让折线带自然弧度。
 * 张力 0.2 —— 越小越贴近直线，越大越"软"。
 */
function smoothPath(points: TrendPoint[], tension = 0.2): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].activeY}`

  let d = `M ${points[0].x} ${points[0].activeY}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const y0 = p0.activeY, y1 = p1.activeY, y2 = p2.activeY, y3 = p3.activeY

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = y1 + (y2 - y0) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = y2 - (y3 - y1) * tension

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${y2.toFixed(1)}`
  }
  return d
}

function smoothAreaPath(points: TrendPoint[]): string {
  if (points.length < 2) return ''
  const lineD = smoothPath(points)
  const baseline = trendBaselineY.value
  const first = points[0]
  const last = points[points.length - 1]
  return `${lineD} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

const trendLinePath = computed(() => smoothPath(trendPoints.value))
const trendAreaPath = computed(() => smoothAreaPath(trendPoints.value))

// Y 轴刻度标签（0 / max/3 / 2max/3 / max）
const trendYLabels = computed(() => {
  const pts = trendPoints.value
  if (pts.length === 0) return []
  const maxV = Math.max(...pts.map(p => activeValue(p)), 1)
  const baselineY = trendBaselineY.value
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

// X 轴标签：每隔 5 天 + 首尾
const trendXLabels = computed(() => {
  const pts = trendPoints.value
  if (pts.length === 0) return []
  const targets = new Set<number>([1, 5, 10, 15, 20, 25, 30])
  targets.add(pts.length) // 最后一天
  return pts
    .filter(p => targets.has(p.day))
    .map(p => ({ x: p.x, label: String(p.day) }))
})

const hoverIdx = ref<number | null>(null)
const hoverPoint = computed(() => (hoverIdx.value === null ? null : trendPoints.value[hoverIdx.value]))

function onTrendHover(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return
  const scaleX = TREND_W / rect.width
  const mouseX = (e.clientX - rect.left) * scaleX
  let nearest = 0
  let minDist = Infinity
  for (let i = 0; i < trendPoints.value.length; i++) {
    const d = Math.abs(trendPoints.value[i].x - mouseX)
    if (d < minDist) { minDist = d; nearest = i }
  }
  hoverIdx.value = nearest
}

function onTrendLeave() {
  hoverIdx.value = null
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
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`
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
  { icon: 'ClipboardList', label: '收支报告', badge: '月/年', badgeType: 'success', bgColor: 'rgba(126,203,124,0.15)', action: 'report' },
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
    case 'report': showReport.value = true; break
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
function getCategoryIcon(cat: string): string {
  const found = categories.value.find(c => c.name === cat)
  return found?.icon ?? 'Package'
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
onMounted(() => {
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
  padding: 0 20px 100px;
  //padding-bottom: 100px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  will-change: opacity, transform;
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

/* 交易抽屉（占满剩余空间和全宽，内部滚动） */
.transaction-drawer {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* 底部留出导航栏空间 */
  padding-bottom: 80px;
  /* 滑动时阻止容器滚动 */
  touch-action: pan-y;
}
.transaction-drawer::-webkit-scrollbar {
  display: none;
}

/* ============ 交易列表区域（抽屉内部） ============ */
.transaction-list-section {
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  margin: 0 20px;
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

/* 抽屉头部 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 26px 12px;
  //border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
}

/* 抽屉内容区 */
.drawer-content {
  padding: 16px 20px 0;
  /* 无需单独滚动，由 transaction-drawer 统一处理滚动 */
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
  backdrop-filter: saturate(180%) blur(24px);
  box-shadow: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

/* 底部渐变过渡层 + 模糊效果 */
.stats-top-bar::after {
  content: '';
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

.stats-type-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
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
  margin-bottom: 24px;
}

.chart-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
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

/* 环形图 */
.donut-wrapper {
  position: relative;
  width: 340px;
  height: 280px;
  pointer-events: none;
}

.donut-ring-svg {
  width: 170px;
  height: 170px;
  position: absolute;
  top: 55px; left: 85px;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.06));
  overflow: visible;
}

.donut-track {
  fill: none;
  stroke: rgba(174, 168, 155, 0.14);
  stroke-width: 26;
}

.donut-seg {
  /* motion-v 通过 pathLength 控制描边绘制 */
}

.donut-center {
  position: absolute;
  top: 82px; left: 112px;
  width: 116px;
  height: 116px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-inset);
  pointer-events: none;
  z-index: 3;
}

.donut-center-amount {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.donut-center-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.donut-lines-svg {
  position: absolute;
  top: 0; left: 0;
  width: 340px;
  height: 280px;
  pointer-events: none;
  z-index: 5;
}

.donut-label-tag {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-card);
  padding: 3px 10px;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 分类排行列表 */
.cat-rank-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  animation: fadeSlideIn 0.4s ease forwards;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.rank-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.rank-item.expanded {
  box-shadow: var(--shadow-md);
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 展开区：grid 0fr→1fr 实现丝滑高度过渡 */
.rank-expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.rank-item.expanded .rank-expandable {
  grid-template-rows: 1fr;
}
.rank-expandable-inner {
  overflow: hidden;
  min-height: 0;
}

/* 展开时顶部细分割线 */
.rank-item.expanded .rank-expandable-inner {
  margin-top: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 二级分类条目 */
.sub-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0 7px 22px;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.rank-item.expanded .sub-item {
  opacity: 1;
  transform: translateX(0);
}

.sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.7;
}
.sub-name {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 42px;
  flex-shrink: 0;
  white-space: nowrap;
}
.sub-bar-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-width: 40px;
}
.sub-bar-fill {
  height: 100%;
  border-radius: 3px;
  opacity: 0.55;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sub-amount {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 62px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.sub-percent {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.sub-count {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
  opacity: 0.7;
}

/* 展开箭头 */
.rank-chevron {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.rank-item.expanded .rank-chevron {
  transform: rotate(180deg);
}

.rank-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rank-cat-icon {
  font-size: 17px;
  line-height: 1;
  flex-shrink: 0;
}

.rank-cat-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 36px;
  flex-shrink: 0;
}

.rank-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-width: 60px;
}

.rank-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rank-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 70px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.rank-percent {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 38px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* 趋势柱状图 */
.trend-section {
  margin-bottom: 24px;
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

/* ============ 折线图样式 ============ */
.trend-chart-line {
  position: relative;
  padding-top: 6px;
}
.trend-svg {
  display: block;
  width: 100%;
  height: 200px;
  cursor: crosshair;
  overflow: visible;
}

/* 标题区右侧容器：toggle + badge 并排 */
.trend-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 支出/收入 toggle */
.trend-type-toggle {
  display: inline-flex;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 2px;
  box-shadow: var(--shadow-inset);
  gap: 2px;
}
.trend-type-toggle button {
  padding: 4px 12px;
  border: none;
  border-radius: 11px;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.2s ease;
  line-height: 1.4;
}
.trend-type-toggle button.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 6px rgba(212, 165, 116, 0.3);
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

.trend-line {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-width 0.2s ease;
}
.trend-line-income {
  stroke: var(--income);
}
.trend-line-expense {
  stroke: var(--expense);
}
.trend-dot {
  stroke: var(--bg-card);
  stroke-width: 1.5;
  transition: r 0.15s ease;
}
.trend-dot-income { fill: var(--income); }
.trend-dot-expense { fill: var(--expense); }

.trend-hover-line {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  opacity: 0.6;
  pointer-events: none;
}
.trend-hover-dot {
  stroke: var(--bg-card);
  stroke-width: 2;
  pointer-events: none;
}
.trend-hover-dot-income { fill: var(--income); }
.trend-hover-dot-expense { fill: var(--expense); }

.trend-x-text {
  font-size: 10px;
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
  padding: 16px 4px;
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 160px;
  padding-bottom: 24px;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}

.trend-bar-group {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.trend-bar {
  width: 80%;
  max-width: 28px;
  border-radius: 4px 4px 2px 2px;
  min-height: 3px;
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  transform-origin: bottom center;
  animation: trendBarGrow 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}

@keyframes trendBarGrow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}

.trend-bar-income {
  background: linear-gradient(180deg, #7ecb7c, #a8d9a6);
}
.trend-bar-expense {
  background: linear-gradient(180deg, #e88b8b, #f0baba);
}

.trend-label {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  margin-top: 4px;
  font-weight: 500;
}

.trend-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.legend-income { background: #7ecb7c; }
.legend-expense { background: #e88b8b; }

/* ========== 热力图 (方案C: 液态金额条) ========== */
.heatmap-section {
  margin-bottom: 24px;
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

.metric-label { z-index: 1; opacity: 0.9; }
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
</style>
