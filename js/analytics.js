/**
 * ============================================================================
 * BroBudget - Analytics, Savings Goals & Monthly Reports Module
 * Developer 3 (Analytics, Charts, Insights, Savings Goals, Reports)
 *
 * FIXED VERSION
 *
 * Main data flow:
 * transactions.js
 *      ↓
 * brobudget_transactions_v1
 *      ↓
 * analytics.js
 *
 * Analytics no longer adds transaction totals on top of dashboard totals.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Configuration
  // --------------------------------------------------------------------------

  const BB_TRANSACTIONS_KEY = 'brobudget_transactions_v1';
  const BB_SAVINGS_GOALS_KEY = 'savingsGoals';
  const BB_DASHBOARD_KEY = 'brobudget_financial_data_v1';

  const bbMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const bbCategoryColors = {
    food: '#f43f5e',
    rent: '#06b6d4',
    transport: '#8b5cf6',
    shopping: '#ec4899',
    education: '#10b981',
    entertainment: '#f59e0b',
    health: '#3b82f6',
    bills: '#6366f1',
    other: '#94a3b8'
  };

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------

  let bbAnalyticsState = {
    transactions: [],
    monthlySummary: {},
    savingsGoals: [],
    activeReportMonthKey: '2026-9',
    historySortColumn: 'month',
    historySortAsc: false,

    chartInstances: {
      categoryDoughnut: null,
      incomeExpenseBar: null,
      savingsLine: null
    },

    initialized: false,
    eventsBound: false,
    resizeBound: false
  };

  let bbActiveDepositGoalId = null;

  // --------------------------------------------------------------------------
  // 3. Utility Helpers
  // --------------------------------------------------------------------------

  function bbAnalyticsEscapeHtml(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Converts all transaction/dashboard category naming variants
   * into the analytics category model.
   *
   * Dashboard:
   *   housing
   *   utilities
   *
   * Transactions:
   *   Rent
   *   Bills
   *
   * Analytics:
   *   rent
   *   bills
   */
  function bbAnalyticsNormalizeCategory(category) {
    const value = String(category || 'other')
      .trim()
      .toLowerCase();

    const categoryMap = {
      food: 'food',

      rent: 'rent',
      housing: 'rent',

      transport: 'transport',
      transportation: 'transport',

      shopping: 'shopping',

      education: 'education',

      entertainment: 'entertainment',

      health: 'health',
      medical: 'health',

      bills: 'bills',
      bill: 'bills',
      utilities: 'bills',
      utility: 'bills',

      other: 'other'
    };

    return categoryMap[value] || 'other';
  }

  /**
   * Safely parses YYYY-MM-DD without timezone conversion.
   *
   * new Date('2026-10-01') can behave differently depending on timezone.
   * String parsing avoids that problem.
   */
  function bbAnalyticsParseDate(dateValue) {
    const dateText = String(dateValue || '').trim();

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    return {
      year,
      monthIndex: month - 1,
      day
    };
  }

  function bbAnalyticsGetMonthKey(dateValue) {
    const parsed = bbAnalyticsParseDate(dateValue);

    if (!parsed) {
      return null;
    }

    return `${parsed.year}-${parsed.monthIndex}`;
  }

  function bbAnalyticsCreateEmptyMonth() {
    return {
      income: 0,
      expenses: 0,
      savings: 0,
      savingsPercentage: 0,
      categories: {},
      transactionsCount: 0
    };
  }

  function bbAnalyticsRecalculateMonth(record) {
    record.income = Number.isFinite(Number(record.income))
      ? Number(record.income)
      : 0;

    record.expenses = Number.isFinite(Number(record.expenses))
      ? Number(record.expenses)
      : 0;

    record.savings = record.income - record.expenses;

    record.savingsPercentage =
      record.income > 0
        ? Number(((record.savings / record.income) * 100).toFixed(1))
        : 0;

    if (!Number.isFinite(record.savingsPercentage)) {
      record.savingsPercentage = 0;
    }

    record.transactionsCount =
      Number.isFinite(Number(record.transactionsCount))
        ? Number(record.transactionsCount)
        : 0;

    return record;
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage - Transactions
  // --------------------------------------------------------------------------

  /**
   * Reads the shared transaction store.
   *
   * IMPORTANT:
   * An empty [] is a valid stored state.
   * We do NOT replace it with demo transactions.
   */
  function bbAnalyticsGetTransactions() {
    try {
      const stored = localStorage.getItem(BB_TRANSACTIONS_KEY);

      if (stored === null) {
        return [];
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      return [];
    } catch (error) {
      console.warn(
        'BroBudget Analytics: Unable to read transactions from LocalStorage.',
        error
      );

      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 5. LocalStorage - Savings Goals
  // --------------------------------------------------------------------------

  function bbSavingsGetGoals() {
    try {
      const stored = localStorage.getItem(BB_SAVINGS_GOALS_KEY);

      if (stored !== null) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(
        'BroBudget Analytics: Unable to read savings goals.',
        error
      );
    }

    const seedGoals = [
      {
        id: 1,
        name: '🎓 New Laptop',
        targetAmount: 80000,
        currentSaved: 35000,
        targetDate: '2026-12-31'
      },
      {
        id: 2,
        name: '🚗 Car Downpayment',
        targetAmount: 200000,
        currentSaved: 110000,
        targetDate: '2027-04-30'
      },
      {
        id: 3,
        name: '🏖️ Bali Vacation',
        targetAmount: 50000,
        currentSaved: 50000,
        targetDate: '2026-11-15'
      }
    ];

    bbSavingsSaveGoals(seedGoals);

    return seedGoals;
  }

  function bbSavingsSaveGoals(goals) {
    try {
      localStorage.setItem(
        BB_SAVINGS_GOALS_KEY,
        JSON.stringify(goals)
      );

      bbAnalyticsState.savingsGoals = goals;
    } catch (error) {
      console.error(
        'BroBudget Analytics: Failed to save savings goals.',
        error
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. Monthly Aggregation Engine
  // --------------------------------------------------------------------------

  /**
   * IMPORTANT ARCHITECTURE FIX
   *
   * If transaction storage exists:
   *
   *     transactions → analytics
   *
   * Dashboard data is NOT added to transactions.
   *
   * This prevents:
   *
   *     dashboard totals + transaction totals
   *
   * from being counted twice.
   *
   * If transactions storage does not exist at all, dashboard data is used
   * only as a demo fallback.
   */
  function bbAnalyticsBuildMonthlySummary() {
    const summary = {};

    let transactionStorageExists = false;

    try {
      transactionStorageExists =
        localStorage.getItem(BB_TRANSACTIONS_KEY) !== null;
    } catch (error) {
      transactionStorageExists = false;
    }

    // ------------------------------------------------------------------------
    // SOURCE OF TRUTH: Transactions
    // ------------------------------------------------------------------------

    if (transactionStorageExists) {
      const txList = Array.isArray(bbAnalyticsState.transactions)
        ? bbAnalyticsState.transactions
        : [];

      txList.forEach(transaction => {
        if (!transaction || !transaction.date) {
          return;
        }

        const monthKey = bbAnalyticsGetMonthKey(transaction.date);

        if (!monthKey) {
          return;
        }

        if (!summary[monthKey]) {
          summary[monthKey] = bbAnalyticsCreateEmptyMonth();
        }

        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        summary[monthKey].transactionsCount += 1;

        const type = String(transaction.type || '')
          .trim()
          .toLowerCase();

        if (type === 'income') {
          summary[monthKey].income += amount;
        } else if (type === 'expense') {
          summary[monthKey].expenses += amount;

          const category =
            bbAnalyticsNormalizeCategory(transaction.category);

          summary[monthKey].categories[category] =
            (summary[monthKey].categories[category] || 0) + amount;
        }
      });

      Object.keys(summary).forEach(key => {
        bbAnalyticsRecalculateMonth(summary[key]);
      });

      bbAnalyticsState.monthlySummary = summary;

      // If there is no transaction data, clear the selected report month
      // rather than showing fake dashboard values.
      const keys = Object.keys(summary).sort();

      if (
        keys.length > 0 &&
        !summary[bbAnalyticsState.activeReportMonthKey]
      ) {
        bbAnalyticsState.activeReportMonthKey =
          keys[keys.length - 1];
      }

      return summary;
    }

    // ------------------------------------------------------------------------
    // DEMO FALLBACK
    // ------------------------------------------------------------------------
    //
    // Used only when transactions.js has never created its LocalStorage key.
    // This keeps a fresh Analytics page populated.
    // ------------------------------------------------------------------------

    try {
      const storedDashboard =
        localStorage.getItem(BB_DASHBOARD_KEY);

      if (storedDashboard) {
        const dashboardData = JSON.parse(storedDashboard);

        if (
          dashboardData &&
          dashboardData.months &&
          typeof dashboardData.months === 'object'
        ) {
          Object.keys(dashboardData.months).forEach(key => {
            const month = dashboardData.months[key];

            if (!month) {
              return;
            }

            const record = bbAnalyticsCreateEmptyMonth();

            record.income = Number(month.income) || 0;
            record.expenses = Number(month.expenses) || 0;

            if (
              month.categories &&
              typeof month.categories === 'object'
            ) {
              Object.keys(month.categories).forEach(category => {
                const canonicalCategory =
                  bbAnalyticsNormalizeCategory(category);

                const amount =
                  Number(month.categories[category]) || 0;

                if (amount > 0) {
                  record.categories[canonicalCategory] =
                    (record.categories[canonicalCategory] || 0) +
                    amount;
                }
              });
            }

            /*
             * Do not trust dashboard transaction counts as exact
             * transaction counts.
             *
             * Demo fallback gets zero unless dashboard has a real
             * numeric count.
             */
            record.transactionsCount =
              Number(month.transactionsCount) || 0;

            bbAnalyticsRecalculateMonth(record);

            summary[key] = record;
          });
        }
      }
    } catch (error) {
      console.warn(
        'BroBudget Analytics: Dashboard fallback unavailable.',
        error
      );
    }

    // ------------------------------------------------------------------------
    // If dashboard is also unavailable, use demo months.
    // ------------------------------------------------------------------------

    if (Object.keys(summary).length === 0) {
      const defaultMonths = {
        '2026-6': {
          income: 52000,
          expenses: 33000,
          categories: {
            rent: 12000,
            food: 9000,
            transport: 4000,
            bills: 4000,
            entertainment: 4000
          }
        },

        '2026-7': {
          income: 54000,
          expenses: 32000,
          categories: {
            rent: 12000,
            food: 9000,
            transport: 4000,
            bills: 3500,
            entertainment: 3500
          }
        },

        '2026-8': {
          income: 54000,
          expenses: 31000,
          categories: {
            rent: 12000,
            food: 8500,
            transport: 3800,
            bills: 3200,
            entertainment: 3500
          }
        },

        '2026-9': {
          income: 50000,
          expenses: 30000,
          categories: {
            rent: 12000,
            food: 8000,
            transport: 3500,
            bills: 3500,
            entertainment: 3000
          }
        },

        '2026-10': {
          income: 55000,
          expenses: 33000,
          categories: {
            rent: 12000,
            food: 9000,
            transport: 4000,
            bills: 4000,
            entertainment: 4000
          }
        },

        '2026-11': {
          income: 60000,
          expenses: 38000,
          categories: {
            rent: 12000,
            food: 11000,
            transport: 5000,
            bills: 4500,
            entertainment: 5500
          }
        }
      };

      Object.keys(defaultMonths).forEach(key => {
        const source = defaultMonths[key];

        const record = bbAnalyticsCreateEmptyMonth();

        record.income = source.income;
        record.expenses = source.expenses;
        record.categories = {
          ...source.categories
        };

        record.transactionsCount = 0;

        bbAnalyticsRecalculateMonth(record);

        summary[key] = record;
      });
    }

    bbAnalyticsState.monthlySummary = summary;

    const keys = Object.keys(summary).sort();

    if (
      keys.length > 0 &&
      !summary[bbAnalyticsState.activeReportMonthKey]
    ) {
      bbAnalyticsState.activeReportMonthKey =
        keys[keys.length - 1];
    }

    return summary;
  }

  // --------------------------------------------------------------------------
  // 7. Formatting Utilities
  // --------------------------------------------------------------------------

  function bbAnalyticsFormatCurrency(amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return '₹0';
    }

    const isNegative = numericAmount < 0;
    const absoluteValue = Math.abs(Math.round(numericAmount));

    return (
      (isNegative ? '-₹' : '₹') +
      absoluteValue.toLocaleString('en-IN')
    );
  }

  function bbAnalyticsFormatPercentage(pct) {
    const numericPct = Number(pct);

    if (!Number.isFinite(numericPct)) {
      return '0.0%';
    }

    return `${numericPct.toFixed(1)}%`;
  }

  // --------------------------------------------------------------------------
  // 8. KPI Overview
  // --------------------------------------------------------------------------

  function bbAnalyticsRenderKPIs() {
    const summary = bbAnalyticsState.monthlySummary;
    const keys = Object.keys(summary).sort();

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavings = 0;

    keys.forEach(key => {
      const record = summary[key];

      totalIncome += Number(record.income) || 0;
      totalExpenses += Number(record.expenses) || 0;
      totalSavings += Number(record.savings) || 0;
    });

    const averageSavingsRate =
      totalIncome > 0
        ? (totalSavings / totalIncome) * 100
        : 0;

    const incomeElement =
      document.getElementById('bb-kpi-total-income');

    const expenseElement =
      document.getElementById('bb-kpi-total-expenses');

    const savingsElement =
      document.getElementById('bb-kpi-total-savings');

    const rateElement =
      document.getElementById('bb-kpi-savings-rate');

    if (incomeElement) {
      incomeElement.textContent =
        bbAnalyticsFormatCurrency(totalIncome);
    }

    if (expenseElement) {
      expenseElement.textContent =
        bbAnalyticsFormatCurrency(totalExpenses);
    }

    if (savingsElement) {
      savingsElement.textContent =
        bbAnalyticsFormatCurrency(totalSavings);

      savingsElement.style.color =
        totalSavings < 0
          ? 'var(--bb-color-expense-light)'
          : '#ffffff';
    }

    if (rateElement) {
      rateElement.textContent =
        bbAnalyticsFormatPercentage(averageSavingsRate);
    }
  }

  // --------------------------------------------------------------------------
  // 9. Financial Insights
  // --------------------------------------------------------------------------

  function bbAnalyticsGenerateInsights() {
    const container =
      document.getElementById('bb-insights-grid');

    if (!container) {
      return;
    }

    const summary = bbAnalyticsState.monthlySummary;
    const keys = Object.keys(summary).sort();

    if (keys.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;padding:20px;text-align:center;color:var(--bb-text-muted);">
          No transaction history available yet. Record income and expenses to unlock automated financial insights.
        </div>
      `;

      return;
    }

    let currentKey =
      bbAnalyticsState.activeReportMonthKey;

    if (!summary[currentKey]) {
      currentKey = keys[keys.length - 1];
      bbAnalyticsState.activeReportMonthKey = currentKey;
    }

    const currentMonth =
      summary[currentKey] || bbAnalyticsCreateEmptyMonth();

    const currentIndex = keys.indexOf(currentKey);

    const previousKey =
      currentIndex > 0
        ? keys[currentIndex - 1]
        : null;

    const previousMonth =
      previousKey
        ? summary[previousKey]
        : null;

    const insights = [];

    // Savings rate
    if (currentMonth.income > 0) {
      if (currentMonth.savingsPercentage >= 30) {
        insights.push({
          icon: '💎',
          tag: 'Savings Benchmark',
          text:
            `You saved <strong>${bbAnalyticsFormatPercentage(currentMonth.savingsPercentage)}</strong> of your income this month (${bbAnalyticsFormatCurrency(currentMonth.savings)} retained).`
        });
      } else if (currentMonth.savingsPercentage > 0) {
        insights.push({
          icon: '🎯',
          tag: 'Retention Rate',
          text:
            `You saved <strong>${bbAnalyticsFormatPercentage(currentMonth.savingsPercentage)}</strong> of your earnings this month.`
        });
      } else {
        insights.push({
          icon: '⚠️',
          tag: 'Deficit Warning',
          text:
            `Your expenditures exceeded your monthly income by <strong>${bbAnalyticsFormatCurrency(Math.abs(currentMonth.savings))}</strong>.`
        });
      }
    } else {
      insights.push({
        icon: 'ℹ️',
        tag: 'Income Status',
        text:
          `No income has been registered for this selected period (${bbAnalyticsFormatCurrency(currentMonth.expenses)} in recorded outflow).`
      });
    }

    // Highest expense category
    const categories =
      currentMonth.categories || {};

    let highestCategory = null;
    let highestAmount = 0;

    Object.keys(categories).forEach(category => {
      const amount = Number(categories[category]) || 0;

      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    if (highestCategory && highestAmount > 0) {
      const categoryName =
        highestCategory.charAt(0).toUpperCase() +
        highestCategory.slice(1);

      const categoryPercentage =
        currentMonth.expenses > 0
          ? Math.round(
              (highestAmount / currentMonth.expenses) * 100
            )
          : 0;

      insights.push({
        icon: '📊',
        tag: 'Top Expenditure',
        text:
          `<strong>${bbAnalyticsEscapeHtml(categoryName)}</strong> is your highest expense category at <strong>${bbAnalyticsFormatCurrency(highestAmount)}</strong> (${categoryPercentage}% of total monthly outflows).`
      });
    } else {
      insights.push({
        icon: '📊',
        tag: 'Expense Breakdown',
        text:
          'No categorized expenses are recorded for this period yet.'
      });
    }

    // Month-over-month comparison
    if (
      previousMonth &&
      previousMonth.income > 0 &&
      currentMonth.income > 0
    ) {
      const savingsDelta =
        currentMonth.savings -
        previousMonth.savings;

      const expenseDelta =
        currentMonth.expenses -
        previousMonth.expenses;

      if (savingsDelta > 0) {
        insights.push({
          icon: '📈',
          tag: 'Savings Trend',
          text:
            `Savings increased by <strong>${bbAnalyticsFormatCurrency(savingsDelta)}</strong> compared with the previous recorded month.`
        });
      } else if (savingsDelta < 0) {
        insights.push({
          icon: '📉',
          tag: 'Savings Trend',
          text:
            `Savings decreased by <strong>${bbAnalyticsFormatCurrency(Math.abs(savingsDelta))}</strong> compared with the previous recorded month.`
        });
      } else {
        insights.push({
          icon: '➡️',
          tag: 'Savings Trend',
          text:
            'Savings were unchanged compared with the previous recorded month.'
        });
      }

      if (expenseDelta > 0) {
        insights.push({
          icon: '💸',
          tag: 'Expense Trend',
          text:
            `Expenses increased by <strong>${bbAnalyticsFormatCurrency(expenseDelta)}</strong> compared with the previous recorded month.`
        });
      } else if (expenseDelta < 0) {
        insights.push({
          icon: '🛡️',
          tag: 'Expense Trend',
          text:
            `Expenses decreased by <strong>${bbAnalyticsFormatCurrency(Math.abs(expenseDelta))}</strong> compared with the previous recorded month.`
        });
      }
    } else {
      insights.push({
        icon: '📅',
        tag: 'Historical Baseline',
        text:
          'BroBudget is tracking your financial periods. More recorded months will provide stronger month-over-month comparisons.'
      });
    }

    let html = '';

    insights.slice(0, 4).forEach(item => {
      html += `
        <article class="bb-analytics-insight-item">
          <div class="bb-insight-tag">
            <span>${item.icon}</span>
            <span>${bbAnalyticsEscapeHtml(item.tag)}</span>
          </div>

          <div class="bb-insight-text">
            ${item.text}
          </div>
        </article>
      `;
    });

    container.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // 10. Chart Engine
  // --------------------------------------------------------------------------

  function bbAnalyticsRenderCharts() {
    if (typeof window.Chart !== 'undefined') {
      bbAnalyticsRenderChartJs();
    } else {
      bbAnalyticsRenderFallbackCanvas();
    }
  }

  // --------------------------------------------------------------------------
  // 11. Chart.js Renderer
  // --------------------------------------------------------------------------

  function bbAnalyticsRenderChartJs() {
    const summary =
      bbAnalyticsState.monthlySummary;

    const sortedKeys =
      Object.keys(summary).sort();

    const labels = sortedKeys.map(key => {
      const parts = key.split('-');
      const monthIndex = Number(parts[1]);

      return bbMonthNames[monthIndex]
        ? bbMonthNames[monthIndex].substring(0, 3)
        : key;
    });

    const incomeSeries =
      sortedKeys.map(key => summary[key].income);

    const expenseSeries =
      sortedKeys.map(key => summary[key].expenses);

    const savingsSeries =
      sortedKeys.map(key => summary[key].savings);

    let activeKey =
      bbAnalyticsState.activeReportMonthKey;

    if (!summary[activeKey]) {
      activeKey =
        sortedKeys.length > 0
          ? sortedKeys[sortedKeys.length - 1]
          : null;
    }

    const activeRecord =
      activeKey && summary[activeKey]
        ? summary[activeKey]
        : bbAnalyticsCreateEmptyMonth();

    const categoryMap =
      activeRecord.categories || {};

    const categoryKeys =
      Object.keys(categoryMap);

    const categoryLabels =
      categoryKeys.map(category =>
        category.charAt(0).toUpperCase() +
        category.slice(1)
      );

    const categoryValues =
      categoryKeys.map(category =>
        Number(categoryMap[category]) || 0
      );

    const categoryPalette =
      categoryKeys.map(category =>
        bbCategoryColors[
          bbAnalyticsNormalizeCategory(category)
        ] || '#8b5cf6'
      );

    // ------------------------------------------------------------------------
    // Doughnut
    // ------------------------------------------------------------------------

    const categoryCanvas =
      document.getElementById(
        'bb-chart-category-doughnut'
      );

    if (categoryCanvas) {
      if (
        bbAnalyticsState.chartInstances.categoryDoughnut
      ) {
        bbAnalyticsState.chartInstances.categoryDoughnut.destroy();

        bbAnalyticsState.chartInstances.categoryDoughnut =
          null;
      }

      bbAnalyticsState.chartInstances.categoryDoughnut =
        new window.Chart(categoryCanvas, {
          type: 'doughnut',

          data: {
            labels:
              categoryLabels.length > 0
                ? categoryLabels
                : ['No Expenses'],

            datasets: [
              {
                data:
                  categoryValues.length > 0
                    ? categoryValues
                    : [1],

                backgroundColor:
                  categoryValues.length > 0
                    ? categoryPalette
                    : ['#334155'],

                borderColor: '#0f172a',
                borderWidth: 2,
                hoverOffset: 6
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
              legend: {
                position: 'bottom',

                labels: {
                  color: '#94a3b8',
                  font: {
                    family: 'Inter',
                    size: 12
                  }
                }
              },

              tooltip: {
                callbacks: {
                  label: function (context) {
                    return (
                      ` ${context.label}: ` +
                      bbAnalyticsFormatCurrency(
                        Number(context.raw) || 0
                      )
                    );
                  }
                }
              }
            },

            cutout: '70%'
          }
        });
    }

    // ------------------------------------------------------------------------
    // Income / Expense Bar
    // ------------------------------------------------------------------------

    const barCanvas =
      document.getElementById(
        'bb-chart-income-expense-bar'
      );

    if (barCanvas) {
      if (
        bbAnalyticsState.chartInstances.incomeExpenseBar
      ) {
        bbAnalyticsState.chartInstances.incomeExpenseBar.destroy();

        bbAnalyticsState.chartInstances.incomeExpenseBar =
          null;
      }

      bbAnalyticsState.chartInstances.incomeExpenseBar =
        new window.Chart(barCanvas, {
          type: 'bar',

          data: {
            labels,

            datasets: [
              {
                label: 'Income',
                data: incomeSeries,
                backgroundColor:
                  'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderRadius: 6
              },

              {
                label: 'Expenses',
                data: expenseSeries,
                backgroundColor:
                  'rgba(244, 63, 94, 0.8)',
                borderColor: '#f43f5e',
                borderRadius: 6
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
              x: {
                grid: {
                  color: 'rgba(255,255,255,0.05)'
                },

                ticks: {
                  color: '#94a3b8'
                }
              },

              y: {
                grid: {
                  color: 'rgba(255,255,255,0.05)'
                },

                ticks: {
                  color: '#94a3b8',

                  callback: function (value) {
                    return `₹${(value / 1000).toFixed(0)}k`;
                  }
                }
              }
            },

            plugins: {
              legend: {
                position: 'top',

                labels: {
                  color: '#94a3b8'
                }
              }
            }
          }
        });
    }

    // ------------------------------------------------------------------------
    // Savings Line
    // ------------------------------------------------------------------------

    const lineCanvas =
      document.getElementById(
        'bb-chart-savings-trend-line'
      );

    if (lineCanvas) {
      if (
        bbAnalyticsState.chartInstances.savingsLine
      ) {
        bbAnalyticsState.chartInstances.savingsLine.destroy();

        bbAnalyticsState.chartInstances.savingsLine =
          null;
      }

      bbAnalyticsState.chartInstances.savingsLine =
        new window.Chart(lineCanvas, {
          type: 'line',

          data: {
            labels,

            datasets: [
              {
                label: 'Net Savings',
                data: savingsSeries,

                borderColor: '#8b5cf6',

                backgroundColor:
                  'rgba(139, 92, 246, 0.15)',

                borderWidth: 3,
                fill: true,
                tension: 0.38,

                pointBackgroundColor:
                  '#a78bfa',

                pointBorderColor:
                  '#0f172a',

                pointRadius: 5,
                pointHoverRadius: 8
              }
            ]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
              x: {
                grid: {
                  color: 'rgba(255,255,255,0.05)'
                },

                ticks: {
                  color: '#94a3b8'
                }
              },

              y: {
                grid: {
                  color: 'rgba(255,255,255,0.05)'
                },

                ticks: {
                  color: '#94a3b8',

                  callback: function (value) {
                    return `₹${(value / 1000).toFixed(0)}k`;
                  }
                }
              }
            },

            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
    }
  }

  // --------------------------------------------------------------------------
  // 12. Canvas Fallback
  // --------------------------------------------------------------------------

  function bbAnalyticsPrepareCanvas(canvas, fallbackWidth, fallbackHeight) {
    if (!canvas || !canvas.getContext) {
      return null;
    }

    const ctx = canvas.getContext('2d');

    const dpr =
      window.devicePixelRatio || 1;

    const rect =
      canvas.getBoundingClientRect();

    const width =
      rect.width || fallbackWidth;

    const height =
      rect.height || fallbackHeight;

    canvas.width =
      Math.round(width * dpr);

    canvas.height =
      Math.round(height * dpr);

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    return {
      ctx,
      width,
      height
    };
  }

  function bbAnalyticsRenderFallbackCanvas() {
    const summary =
      bbAnalyticsState.monthlySummary;

    const sortedKeys =
      Object.keys(summary).sort();

    // ------------------------------------------------------------------------
    // Doughnut
    // ------------------------------------------------------------------------

    const categoryCanvas =
      document.getElementById(
        'bb-chart-category-doughnut'
      );

    const categorySurface =
      bbAnalyticsPrepareCanvas(
        categoryCanvas,
        300,
        260
      );

    if (categorySurface) {
      const ctx = categorySurface.ctx;
      const width = categorySurface.width;
      const height = categorySurface.height;

      let activeKey =
        bbAnalyticsState.activeReportMonthKey;

      if (!summary[activeKey]) {
        activeKey =
          sortedKeys.length > 0
            ? sortedKeys[sortedKeys.length - 1]
            : null;
      }

      const categories =
        activeKey && summary[activeKey]
          ? summary[activeKey].categories || {}
          : {};

      const categoryKeys =
        Object.keys(categories);

      const total =
        categoryKeys.reduce(
          (sum, category) =>
            sum +
            (Number(categories[category]) || 0),
          0
        );

      const centerX = width / 2;
      const centerY = height / 2 - 15;

      const radius =
        Math.max(
          20,
          Math.min(centerX, centerY) - 20
        );

      if (total <= 0) {
        ctx.beginPath();

        ctx.arc(
          centerX,
          centerY,
          radius,
          0,
          2 * Math.PI
        );

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 28;
        ctx.stroke();
      } else {
        let startAngle = -Math.PI / 2;

        categoryKeys.forEach(category => {
          const amount =
            Number(categories[category]) || 0;

          const sliceAngle =
            (amount / total) *
            2 *
            Math.PI;

          ctx.beginPath();

          ctx.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            startAngle + sliceAngle
          );

          ctx.strokeStyle =
            bbCategoryColors[
              bbAnalyticsNormalizeCategory(category)
            ] || '#8b5cf6';

          ctx.lineWidth = 28;
          ctx.stroke();

          startAngle += sliceAngle;
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.font =
        'bold 15px Inter, sans-serif';

      ctx.textAlign = 'center';

      ctx.fillText(
        bbAnalyticsFormatCurrency(total),
        centerX,
        centerY + 5
      );
    }

    // ------------------------------------------------------------------------
    // Bar Chart
    // ------------------------------------------------------------------------

    const barCanvas =
      document.getElementById(
        'bb-chart-income-expense-bar'
      );

    const barSurface =
      bbAnalyticsPrepareCanvas(
        barCanvas,
        300,
        260
      );

    if (barSurface) {
      const ctx = barSurface.ctx;
      const width = barSurface.width;
      const height = barSurface.height;

      if (sortedKeys.length === 0) {
        return;
      }

      const maxValue = Math.max(
        ...sortedKeys.map(key =>
          Math.max(
            Number(summary[key].income) || 0,
            Number(summary[key].expenses) || 0
          )
        ),
        1000
      );

      const chartHeight =
        height - 50;

      const groupWidth =
        (width - 40) /
        Math.max(sortedKeys.length, 1);

      sortedKeys.forEach((key, index) => {
        const x =
          30 + index * groupWidth;

        const income =
          Number(summary[key].income) || 0;

        const expenses =
          Number(summary[key].expenses) || 0;

        const incomeHeight =
          (income / maxValue) *
          chartHeight;

        const expenseHeight =
          (expenses / maxValue) *
          chartHeight;

        const barWidth =
          Math.min(
            groupWidth / 2 - 4,
            16
          );

        ctx.fillStyle = '#10b981';

        ctx.fillRect(
          x,
          chartHeight -
            incomeHeight +
            20,
          barWidth,
          incomeHeight
        );

        ctx.fillStyle = '#f43f5e';

        ctx.fillRect(
          x + barWidth + 2,
          chartHeight -
            expenseHeight +
            20,
          barWidth,
          expenseHeight
        );

        const parts =
          key.split('-');

        const monthIndex =
          Number(parts[1]);

        ctx.fillStyle = '#94a3b8';
        ctx.font =
          '11px Inter, sans-serif';

        ctx.textAlign = 'center';

        ctx.fillText(
          bbMonthNames[monthIndex]
            ? bbMonthNames[monthIndex]
                .substring(0, 3)
            : '',
          x + barWidth,
          chartHeight + 36
        );
      });
    }

    // ------------------------------------------------------------------------
    // Savings Line
    // ------------------------------------------------------------------------

    const lineCanvas =
      document.getElementById(
        'bb-chart-savings-trend-line'
      );

    const lineSurface =
      bbAnalyticsPrepareCanvas(
        lineCanvas,
        600,
        260
      );

    if (lineSurface) {
      const ctx = lineSurface.ctx;
      const width = lineSurface.width;
      const height = lineSurface.height;

      if (sortedKeys.length === 0) {
        return;
      }

      const savings =
        sortedKeys.map(key =>
          Number(summary[key].savings) || 0
        );

      const maxSavings =
        Math.max(...savings, 1000);

      const minSavings =
        Math.min(...savings, 0);

      const range =
        maxSavings -
        minSavings ||
        1;

      const chartHeight =
        height - 50;

      const stepX =
        (width - 60) /
        Math.max(
          sortedKeys.length - 1,
          1
        );

      ctx.beginPath();

      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 3;

      sortedKeys.forEach((key, index) => {
        const x =
          30 + index * stepX;

        const y =
          chartHeight -
          (
            (
              (Number(summary[key].savings) || 0) -
              minSavings
            ) /
            range
          ) *
          chartHeight +
          20;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      sortedKeys.forEach((key, index) => {
        const x =
          30 + index * stepX;

        const y =
          chartHeight -
          (
            (
              (Number(summary[key].savings) || 0) -
              minSavings
            ) /
            range
          ) *
          chartHeight +
          20;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          4,
          0,
          2 * Math.PI
        );

        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 13. Savings Goals
  // --------------------------------------------------------------------------

  function bbSavingsRenderGoals() {
    const container =
      document.getElementById(
        'bb-savings-goals-grid'
      );

    if (!container) {
      return;
    }

    const goals =
      bbAnalyticsState.savingsGoals ||
      bbSavingsGetGoals();

    if (goals.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--bb-text-muted);">
          No active savings goals found. Click <strong>+ Create New Goal</strong> to set your first target!
        </div>
      `;

      return;
    }

    let html = '';

    goals.forEach(goal => {
      const target =
        Number(goal.targetAmount) || 1;

      const current =
        Number(goal.currentSaved) || 0;

      const percentage =
        Math.min(
          Math.max(
            Number(
              (
                (current / target) *
                100
              ).toFixed(2)
            ),
            0
          ),
          100
        );

      const completed =
        percentage >= 100;

      const safeName =
        bbAnalyticsEscapeHtml(goal.name);

      const safeDate =
        bbAnalyticsEscapeHtml(
          goal.targetDate || 'Ongoing'
        );

      html += `
        <article
          class="bb-savings-card ${completed ? 'bb-goal-completed' : ''}"
          id="bb-goal-card-${goal.id}"
        >

          <div class="bb-savings-card-header">
            <h3 class="bb-savings-goal-name">
              ${safeName}
            </h3>

            <span class="bb-savings-goal-tag">
              ${completed ? 'Completed' : 'In Progress'}
            </span>
          </div>

          <div class="bb-savings-amounts-row">
            <div>
              <div class="bb-savings-saved-label">
                Current Saved
              </div>

              <div class="bb-savings-saved-val">
                ${bbAnalyticsFormatCurrency(current)}
              </div>
            </div>

            <div style="text-align:right;">
              <div class="bb-savings-saved-label">
                Target Goal
              </div>

              <div class="bb-savings-target-val">
                ${bbAnalyticsFormatCurrency(target)}
              </div>
            </div>
          </div>

          <div class="bb-savings-progress-track">
            <div
              class="bb-savings-progress-fill"
              style="width:${percentage}%"
            ></div>
          </div>

          <div class="bb-savings-progress-meta">
            <span>
              Target: ${safeDate}
            </span>

            <span class="bb-savings-pct-val">
              ${percentage.toFixed(1)}%
            </span>
          </div>

          <div class="bb-savings-achieved-badge">
            🎉 Goal Achieved!
          </div>

          <div class="bb-savings-card-actions">
            <button
              type="button"
              class="bb-savings-btn-deposit"
              onclick="window.BBAnalytics.openDepositModal(${Number(goal.id)})"
            >
              + Add Funds
            </button>

            <button
              type="button"
              class="bb-savings-btn-delete"
              title="Delete Goal"
              aria-label="Delete Goal ${safeName}"
              onclick="window.BBAnalytics.deleteGoal(${Number(goal.id)})"
            >
              🗑️
            </button>
          </div>

        </article>
      `;
    });

    container.innerHTML = html;
  }

  function bbSavingsCreateGoal(goalData) {
    const goals =
      bbSavingsGetGoals();

    const name =
      String(goalData.name || '').trim();

    const targetAmount =
      Number(goalData.targetAmount);

    const currentSaved =
      Number(goalData.currentSaved) || 0;

    if (
      !name ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return null;
    }

    const newGoal = {
      id: Date.now(),
      name,
      targetAmount,
      currentSaved:
        Math.max(currentSaved, 0),
      targetDate:
        goalData.targetDate || ''
    };

    goals.unshift(newGoal);

    bbSavingsSaveGoals(goals);

    bbSavingsRenderGoals();

    bbAnalyticsShowToast(
      'Goal Created',
      `Target for "${bbAnalyticsEscapeHtml(newGoal.name)}" established!`,
      '🎯'
    );

    return newGoal;
  }

  function bbSavingsAddDeposit(goalId, amount) {
    const goals =
      bbSavingsGetGoals();

    const goal =
      goals.find(
        item =>
          String(item.id) ===
          String(goalId)
      );

    if (!goal) {
      return false;
    }

    const deposit =
      Number(amount);

    if (
      !Number.isFinite(deposit) ||
      deposit <= 0
    ) {
      return false;
    }

    goal.currentSaved =
      (Number(goal.currentSaved) || 0) +
      deposit;

    bbSavingsSaveGoals(goals);

    bbSavingsRenderGoals();

    bbAnalyticsShowToast(
      'Funds Deposited',
      `Added ${bbAnalyticsFormatCurrency(deposit)} to "${bbAnalyticsEscapeHtml(goal.name)}".`,
      '💰'
    );

    return true;
  }

  function bbSavingsDeleteGoal(goalId) {
    const goals =
      bbSavingsGetGoals();

    const target =
      goals.find(
        item =>
          String(item.id) ===
          String(goalId)
      );

    const updatedGoals =
      goals.filter(
        item =>
          String(item.id) !==
          String(goalId)
      );

    bbSavingsSaveGoals(updatedGoals);

    bbSavingsRenderGoals();

    if (target) {
      bbAnalyticsShowToast(
        'Goal Removed',
        `Deleted "${bbAnalyticsEscapeHtml(target.name)}".`,
        '🗑️'
      );

      return true;
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // 14. Monthly Report
  // --------------------------------------------------------------------------

  function bbReportsRenderMonthlyReport() {
    const summary =
      bbAnalyticsState.monthlySummary;

    const sortedKeys =
      Object.keys(summary).sort();

    const select =
      document.getElementById(
        'bb-report-month-select'
      );

    if (select) {
      const currentValue =
        bbAnalyticsState.activeReportMonthKey;

      select.innerHTML = '';

      sortedKeys.forEach(key => {
        const parts =
          key.split('-');

        const year =
          Number(parts[0]);

        const monthIndex =
          Number(parts[1]);

        const option =
          document.createElement('option');

        option.value = key;

        option.textContent =
          `${bbMonthNames[monthIndex] || 'Month'} ${year}`;

        select.appendChild(option);
      });

      if (
        sortedKeys.length > 0 &&
        sortedKeys.includes(currentValue)
      ) {
        select.value = currentValue;
      } else if (sortedKeys.length > 0) {
        bbAnalyticsState.activeReportMonthKey =
          sortedKeys[sortedKeys.length - 1];

        select.value =
          bbAnalyticsState.activeReportMonthKey;
      }
    }

    const activeKey =
      bbAnalyticsState.activeReportMonthKey;

    const data =
      summary[activeKey] ||
      bbAnalyticsCreateEmptyMonth();

    let topCategory = 'None';
    let topCategoryAmount = 0;

    Object.keys(
      data.categories || {}
    ).forEach(category => {
      const amount =
        Number(data.categories[category]) || 0;

      if (amount > topCategoryAmount) {
        topCategoryAmount = amount;

        topCategory =
          category.charAt(0).toUpperCase() +
          category.slice(1);
      }
    });

    const incomeElement =
      document.getElementById(
        'bb-rep-income'
      );

    const expensesElement =
      document.getElementById(
        'bb-rep-expenses'
      );

    const savingsElement =
      document.getElementById(
        'bb-rep-savings'
      );

    const rateElement =
      document.getElementById(
        'bb-rep-rate'
      );

    const topElement =
      document.getElementById(
        'bb-rep-top-category'
      );

    const countElement =
      document.getElementById(
        'bb-rep-tx-count'
      );

    if (incomeElement) {
      incomeElement.textContent =
        bbAnalyticsFormatCurrency(
          data.income
        );
    }

    if (expensesElement) {
      expensesElement.textContent =
        bbAnalyticsFormatCurrency(
          data.expenses
        );
    }

    if (savingsElement) {
      savingsElement.textContent =
        bbAnalyticsFormatCurrency(
          data.savings
        );

      savingsElement.style.color =
        data.savings < 0
          ? 'var(--bb-color-expense-light)'
          : 'var(--bb-color-income-light)';
    }

    if (rateElement) {
      rateElement.textContent =
        bbAnalyticsFormatPercentage(
          data.savingsPercentage
        );
    }

    if (topElement) {
      topElement.textContent =
        topCategoryAmount > 0
          ? `${topCategory} (${bbAnalyticsFormatCurrency(topCategoryAmount)})`
          : 'None';
    }

    if (countElement) {
      countElement.textContent =
        String(
          Number(data.transactionsCount) || 0
        );
    }
  }

  // --------------------------------------------------------------------------
  // 15. Monthly History
  // --------------------------------------------------------------------------

  function bbReportsRenderHistoryTable() {
    const tableBody =
      document.getElementById(
        'bb-history-table-body'
      );

    if (!tableBody) {
      return;
    }

    const summary =
      bbAnalyticsState.monthlySummary;

    const list =
      Object.keys(summary).map(key => {
        const parts =
          key.split('-');

        const year =
          Number(parts[0]);

        const monthIndex =
          Number(parts[1]);

        return {
          key,
          year,
          monthIndex,

          monthName:
            `${bbMonthNames[monthIndex] || 'Month'} ${year}`,

          income:
            Number(summary[key].income) || 0,

          expenses:
            Number(summary[key].expenses) || 0,

          savings:
            Number(summary[key].savings) || 0,

          savingsPercentage:
            Number(summary[key].savingsPercentage) || 0
        };
      });

    const column =
      bbAnalyticsState.historySortColumn;

    const ascending =
      bbAnalyticsState.historySortAsc;

    list.sort((a, b) => {
      let valueA;
      let valueB;

      if (column === 'month') {
        valueA =
          a.year * 100 +
          a.monthIndex;

        valueB =
          b.year * 100 +
          b.monthIndex;
      } else {
        valueA = Number(a[column]) || 0;
        valueB = Number(b[column]) || 0;
      }

      if (valueA === valueB) {
        return 0;
      }

      return ascending
        ? valueA - valueB
        : valueB - valueA;
    });

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td
            colspan="5"
            style="text-align:center;padding:30px;color:var(--bb-text-muted);"
          >
            No monthly data available yet.
          </td>
        </tr>
      `;

      return;
    }

    let html = '';

    list.forEach(item => {
      const rateColor =
        item.savingsPercentage >= 20
          ? 'var(--bb-color-income-light)'
          : '#fbbf24';

      const savingsColor =
        item.savings < 0
          ? 'var(--bb-color-expense-light)'
          : '#ffffff';

      html += `
        <tr>
          <td data-label="Month">
            <strong>
              ${bbAnalyticsEscapeHtml(item.monthName)}
            </strong>
          </td>

          <td
            data-label="Income"
            style="color:var(--bb-color-income-light);"
          >
            ${bbAnalyticsFormatCurrency(item.income)}
          </td>

          <td
            data-label="Expenses"
            style="color:var(--bb-color-expense-light);"
          >
            ${bbAnalyticsFormatCurrency(item.expenses)}
          </td>

          <td
            data-label="Savings"
            style="color:${savingsColor};"
          >
            ${bbAnalyticsFormatCurrency(item.savings)}
          </td>

          <td
            data-label="Savings %"
            style="color:${rateColor};font-weight:700;"
          >
            ${bbAnalyticsFormatPercentage(item.savingsPercentage)}
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  function bbReportsSetupTableSorting() {
    const headers =
      document.querySelectorAll(
        '.bb-report-table th[data-sort]'
      );

    headers.forEach(header => {
      if (
        header.dataset.bbSortingBound === 'true'
      ) {
        return;
      }

      header.dataset.bbSortingBound = 'true';

      header.addEventListener(
        'click',
        () => {
          const column =
            header.getAttribute('data-sort');

          if (
            bbAnalyticsState.historySortColumn ===
            column
          ) {
            bbAnalyticsState.historySortAsc =
              !bbAnalyticsState.historySortAsc;
          } else {
            bbAnalyticsState.historySortColumn =
              column;

            bbAnalyticsState.historySortAsc =
              false;
          }

          bbReportsRenderHistoryTable();
        }
      );
    });
  }

  // --------------------------------------------------------------------------
  // 16. Modal Handlers
  // --------------------------------------------------------------------------

  function bbAnalyticsSetupModals() {
    const goalModal =
      document.getElementById(
        'bb-goal-modal'
      );

    const openGoalButton =
      document.getElementById(
        'bb-btn-open-goal-modal'
      );

    const closeGoalButton =
      document.getElementById(
        'bb-btn-close-goal-modal'
      );

    const goalForm =
      document.getElementById(
        'bb-goal-form'
      );

    if (
      openGoalButton &&
      goalModal &&
      openGoalButton.dataset.bbBound !== 'true'
    ) {
      openGoalButton.dataset.bbBound = 'true';

      openGoalButton.addEventListener(
        'click',
        () => {
          goalModal.classList.add(
            'bb-modal-active'
          );
        }
      );
    }

    if (
      closeGoalButton &&
      goalModal &&
      closeGoalButton.dataset.bbBound !== 'true'
    ) {
      closeGoalButton.dataset.bbBound = 'true';

      closeGoalButton.addEventListener(
        'click',
        () => {
          goalModal.classList.remove(
            'bb-modal-active'
          );
        }
      );
    }

    if (
      goalForm &&
      goalForm.dataset.bbBound !== 'true'
    ) {
      goalForm.dataset.bbBound = 'true';

      goalForm.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          const nameElement =
            document.getElementById(
              'bb-input-goal-name'
            );

          const targetElement =
            document.getElementById(
              'bb-input-goal-target'
            );

          const savedElement =
            document.getElementById(
              'bb-input-goal-saved'
            );

          const dateElement =
            document.getElementById(
              'bb-input-goal-date'
            );

          const name =
            nameElement
              ? nameElement.value.trim()
              : '';

          const target =
            targetElement
              ? Number(targetElement.value)
              : 0;

          const saved =
            savedElement
              ? Number(savedElement.value) || 0
              : 0;

          const date =
            dateElement
              ? dateElement.value
              : '';

          if (
            !name ||
            !Number.isFinite(target) ||
            target <= 0
          ) {
            alert(
              'Please enter a valid goal name and positive target amount.'
            );

            return;
          }

          bbSavingsCreateGoal({
            name,
            targetAmount: target,
            currentSaved: saved,
            targetDate: date
          });

          goalForm.reset();

          if (goalModal) {
            goalModal.classList.remove(
              'bb-modal-active'
            );
          }
        }
      );
    }

    const depositModal =
      document.getElementById(
        'bb-deposit-modal'
      );

    const closeDepositButton =
      document.getElementById(
        'bb-btn-close-deposit-modal'
      );

    const depositForm =
      document.getElementById(
        'bb-deposit-form'
      );

    if (
      closeDepositButton &&
      depositModal &&
      closeDepositButton.dataset.bbBound !== 'true'
    ) {
      closeDepositButton.dataset.bbBound = 'true';

      closeDepositButton.addEventListener(
        'click',
        () => {
          depositModal.classList.remove(
            'bb-modal-active'
          );

          bbActiveDepositGoalId = null;
        }
      );
    }

    if (
      depositForm &&
      depositForm.dataset.bbBound !== 'true'
    ) {
      depositForm.dataset.bbBound = 'true';

      depositForm.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          const amountElement =
            document.getElementById(
              'bb-input-deposit-amt'
            );

          const amount =
            amountElement
              ? Number(amountElement.value)
              : 0;

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            alert(
              'Please enter a valid deposit amount greater than ₹0.'
            );

            return;
          }

          if (
            bbActiveDepositGoalId !== null
          ) {
            bbSavingsAddDeposit(
              bbActiveDepositGoalId,
              amount
            );
          }

          depositForm.reset();

          if (depositModal) {
            depositModal.classList.remove(
              'bb-modal-active'
            );
          }

          bbActiveDepositGoalId = null;
        }
      );
    }

    [goalModal, depositModal].forEach(
      modal => {
        if (
          !modal ||
          modal.dataset.bbBackdropBound ===
            'true'
        ) {
          return;
        }

        modal.dataset.bbBackdropBound =
          'true';

        modal.addEventListener(
          'click',
          event => {
            if (event.target === modal) {
              modal.classList.remove(
                'bb-modal-active'
              );

              bbActiveDepositGoalId = null;
            }
          }
        );
      }
    );
  }

  function bbSavingsOpenDepositModal(goalId) {
    bbActiveDepositGoalId = goalId;

    const modal =
      document.getElementById(
        'bb-deposit-modal'
      );

    if (modal) {
      modal.classList.add(
        'bb-modal-active'
      );
    }
  }

  // --------------------------------------------------------------------------
  // 17. Toast Notifications
  // --------------------------------------------------------------------------

  function bbAnalyticsShowToast(
    title,
    message,
    icon = 'ℹ️'
  ) {
    let container =
      document.getElementById(
        'bb-toast-container'
      );

    if (!container) {
      container =
        document.createElement('div');

      container.id =
        'bb-toast-container';

      container.className =
        'bb-toast-container';

      document.body.appendChild(
        container
      );
    }

    const toast =
      document.createElement('div');

    toast.className =
      'bb-toast-message';

    toast.setAttribute(
      'role',
      'alert'
    );

    const iconElement =
      document.createElement('div');

    iconElement.className =
      'bb-toast-icon';

    iconElement.textContent =
      icon;

    const bodyElement =
      document.createElement('div');

    bodyElement.className =
      'bb-toast-body';

    const titleElement =
      document.createElement('div');

    titleElement.className =
      'bb-toast-title';

    titleElement.textContent =
      String(title || '');

    const messageElement =
      document.createElement('div');

    messageElement.className =
      'bb-toast-desc';

    messageElement.textContent =
      String(message || '');

    const closeButton =
      document.createElement('button');

    closeButton.type =
      'button';

    closeButton.className =
      'bb-toast-close-btn';

    closeButton.setAttribute(
      'aria-label',
      'Close notification'
    );

    closeButton.innerHTML =
      '&times;';

    bodyElement.appendChild(
      titleElement
    );

    bodyElement.appendChild(
      messageElement
    );

    toast.appendChild(
      iconElement
    );

    toast.appendChild(
      bodyElement
    );

    toast.appendChild(
      closeButton
    );

    container.appendChild(
      toast
    );

    requestAnimationFrame(
      () => {
        toast.classList.add(
          'bb-toast-visible'
        );
      }
    );

    const dismiss = () => {
      toast.classList.remove(
        'bb-toast-visible'
      );

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(
            toast
          );
        }
      }, 300);
    };

    closeButton.addEventListener(
      'click',
      dismiss
    );

    setTimeout(
      dismiss,
      3800
    );
  }

  // --------------------------------------------------------------------------
  // 18. Refresh Everything
  // --------------------------------------------------------------------------

  function bbAnalyticsRefreshAll(
    showToast = false
  ) {
    bbAnalyticsState.transactions =
      bbAnalyticsGetTransactions();

    bbAnalyticsState.savingsGoals =
      bbSavingsGetGoals();

    bbAnalyticsBuildMonthlySummary();

    bbAnalyticsRenderKPIs();

    bbAnalyticsGenerateInsights();

    bbReportsRenderMonthlyReport();

    bbReportsRenderHistoryTable();

    bbSavingsRenderGoals();

    bbAnalyticsRenderCharts();

    if (showToast) {
      bbAnalyticsShowToast(
        'Analytics Updated',
        'New transactions are reflected in your analytics.',
        '🔄'
      );
    }
  }

  // --------------------------------------------------------------------------
  // 19. Event Bus & Initialization
  // --------------------------------------------------------------------------

  function bbAnalyticsSetupEvents() {
    if (bbAnalyticsState.eventsBound) {
      return;
    }

    bbAnalyticsState.eventsBound = true;

    /**
     * transactions.js dispatches:
     *
     * bb:financial-data-updated
     *
     * whenever transaction data changes.
     */
    window.addEventListener(
      'bb:financial-data-updated',
      () => {
        bbAnalyticsRefreshAll(true);
      }
    );

    /**
     * Optional direct transaction update event.
     * This makes Analytics work with future modules too.
     */
    window.addEventListener(
      'bb:transactions-updated',
      () => {
        bbAnalyticsRefreshAll(true);
      }
    );

    /**
     * Report month dropdown.
     */
    const reportSelect =
      document.getElementById(
        'bb-report-month-select'
      );

    if (
      reportSelect &&
      reportSelect.dataset.bbChangeBound !== 'true'
    ) {
      reportSelect.dataset.bbChangeBound =
        'true';

      reportSelect.addEventListener(
        'change',
        event => {
          bbAnalyticsState.activeReportMonthKey =
            event.target.value;

          bbReportsRenderMonthlyReport();

          bbAnalyticsGenerateInsights();

          bbAnalyticsRenderCharts();
        }
      );
    }

    /**
     * Escape closes modals.
     */
    window.addEventListener(
      'keydown',
      event => {
        if (event.key !== 'Escape') {
          return;
        }

        const goalModal =
          document.getElementById(
            'bb-goal-modal'
          );

        const depositModal =
          document.getElementById(
            'bb-deposit-modal'
          );

        if (goalModal) {
          goalModal.classList.remove(
            'bb-modal-active'
          );
        }

        if (depositModal) {
          depositModal.classList.remove(
            'bb-modal-active'
          );
        }

        bbActiveDepositGoalId = null;
      }
    );

    /**
     * Canvas fallback redraw on resize.
     */
    if (!bbAnalyticsState.resizeBound) {
      bbAnalyticsState.resizeBound =
        true;

      window.addEventListener(
        'resize',
        () => {
          if (
            typeof window.Chart ===
            'undefined'
          ) {
            bbAnalyticsRenderFallbackCanvas();
          }
        }
      );
    }
  }

  function bbAnalyticsInit() {
    if (bbAnalyticsState.initialized) {
      return;
    }

    bbAnalyticsState.initialized =
      true;

    // Load shared data.
    bbAnalyticsState.transactions =
      bbAnalyticsGetTransactions();

    bbAnalyticsState.savingsGoals =
      bbSavingsGetGoals();

    // Build analytics data.
    bbAnalyticsBuildMonthlySummary();

    // Render page.
    bbAnalyticsRenderKPIs();

    bbAnalyticsGenerateInsights();

    bbReportsRenderMonthlyReport();

    bbReportsRenderHistoryTable();

    bbReportsSetupTableSorting();

    bbSavingsRenderGoals();

    bbAnalyticsSetupModals();

    bbAnalyticsSetupEvents();

    // Give Chart.js time to load from CDN.
    setTimeout(
      () => {
        bbAnalyticsRenderCharts();
      },
      150
    );
  }

  // --------------------------------------------------------------------------
  // 20. Public API
  // --------------------------------------------------------------------------

  window.BBAnalytics = {
    version: '1.1.0',

    module:
      'Developer 3 - Analytics, Savings Goals & Reports',

    getSummary: function () {
      return {
        ...bbAnalyticsState.monthlySummary
      };
    },

    getGoals: function () {
      return bbSavingsGetGoals();
    },

    createGoal:
      bbSavingsCreateGoal,

    deleteGoal:
      bbSavingsDeleteGoal,

    addDeposit:
      bbSavingsAddDeposit,

    openDepositModal:
      bbSavingsOpenDepositModal,

    refresh: function () {
      bbAnalyticsRefreshAll(false);
    }
  };

  // --------------------------------------------------------------------------
  // 21. Start
  // --------------------------------------------------------------------------

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      bbAnalyticsInit
    );
  } else {
    bbAnalyticsInit();
  }

})();
