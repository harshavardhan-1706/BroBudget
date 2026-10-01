/* ==========================================================================
   BroBudget - Dashboard & Financial Overview
   Connected Version
   --------------------------------------------------------------------------
   Data flow:

   Transactions
        ↓
   brobudget_transactions_v1
        ↓
   Dashboard monthly totals
        ↓
   Dashboard UI

   Analytics reads the same transaction data independently.
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Configuration
  // --------------------------------------------------------------------------

  const BB_DASHBOARD_STORAGE_KEY = 'brobudget_financial_data_v1';

  const BB_MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const BB_DEFAULT_YEAR = 2026;
  const BB_DEFAULT_MONTH_INDEX = 9; // October

  // --------------------------------------------------------------------------
  // 2. Dashboard State
  // --------------------------------------------------------------------------

  const bbDashboardState = {
    dataStore: null,
    selectedYear: BB_DEFAULT_YEAR,
    selectedMonthIndex: BB_DEFAULT_MONTH_INDEX,
    currentMetrics: {
      income: 0,
      expenses: 0,
      balance: 0,
      savings: 0,
      savingsPercentage: 0,
      expensePercentage: 0,
      isDeficit: false
    },
    initialized: false,
    refreshingFromExternalUpdate: false
  };

  // --------------------------------------------------------------------------
  // 3. Utility Functions
  // --------------------------------------------------------------------------

  function bbDashboardSafeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function bbDashboardGetMonthKey(year, monthIndex) {
    return `${year}-${monthIndex}`;
  }

  function bbDashboardFormatCurrency(value) {
    const amount = bbDashboardSafeNumber(value);

    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  }

  function bbDashboardClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Default Dashboard Data
  // --------------------------------------------------------------------------

  function bbDashboardGetSeedData() {
    const months = {};

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const key = bbDashboardGetMonthKey(
        BB_DEFAULT_YEAR,
        monthIndex
      );

      months[key] = {
        income: 0,
        expenses: 0,
        categories: {}
      };
    }

    // October 2026 demo values.
    // These are intentionally compatible with the initial transaction seed.
    months['2026-9'] = {
      income: 50000,
      expenses: 30000,
      categories: {
        food: 4000,
        rent: 12000,
        transport: 2500,
        bills: 3500,
        entertainment: 1800,
        shopping: 4200,
        health: 2000
      }
    };

    return {
      version: 1,
      selectedYear: BB_DEFAULT_YEAR,
      selectedMonth: BB_DEFAULT_MONTH_INDEX,
      months
    };
  }

  // --------------------------------------------------------------------------
  // 5. Storage
  // --------------------------------------------------------------------------

  function bbDashboardSaveData(data) {
    try {
      localStorage.setItem(
        BB_DASHBOARD_STORAGE_KEY,
        JSON.stringify(data)
      );

      bbDashboardState.dataStore = data;

      return true;
    } catch (error) {
      console.error(
        'BroBudget Dashboard: Unable to save financial data.',
        error
      );

      return false;
    }
  }

  function bbDashboardLoadData() {
    try {
      const stored = localStorage.getItem(
        BB_DASHBOARD_STORAGE_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.months &&
          typeof parsed.months === 'object'
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(
        'BroBudget Dashboard: Stored data could not be loaded. Using defaults.',
        error
      );
    }

    const seed = bbDashboardGetSeedData();

    bbDashboardSaveData(seed);

    return seed;
  }

  // --------------------------------------------------------------------------
  // 6. Ensure Month Exists
  // --------------------------------------------------------------------------

  function bbDashboardEnsureMonth(year, monthIndex) {
    if (!bbDashboardState.dataStore) {
      bbDashboardState.dataStore = bbDashboardGetSeedData();
    }

    if (!bbDashboardState.dataStore.months) {
      bbDashboardState.dataStore.months = {};
    }

    const key = bbDashboardGetMonthKey(
      year,
      monthIndex
    );

    if (!bbDashboardState.dataStore.months[key]) {
      bbDashboardState.dataStore.months[key] = {
        income: 0,
        expenses: 0,
        categories: {}
      };
    }

    if (
      !bbDashboardState.dataStore.months[key].categories ||
      typeof bbDashboardState.dataStore.months[key].categories !== 'object'
    ) {
      bbDashboardState.dataStore.months[key].categories = {};
    }

    return bbDashboardState.dataStore.months[key];
  }

  // --------------------------------------------------------------------------
  // 7. Calculate Metrics
  // --------------------------------------------------------------------------

  function bbDashboardCalculateMetrics(
    income,
    expenses
  ) {
    const safeIncome = bbDashboardSafeNumber(income);
    const safeExpenses = bbDashboardSafeNumber(expenses);

    const balance = safeIncome - safeExpenses;

    const savings = Math.max(balance, 0);

    const savingsPercentage =
      safeIncome > 0
        ? (savings / safeIncome) * 100
        : 0;

    const expensePercentage =
      safeIncome > 0
        ? (safeExpenses / safeIncome) * 100
        : 0;

    return {
      income: safeIncome,
      expenses: safeExpenses,
      balance,
      savings,
      savingsPercentage,
      expensePercentage,
      isDeficit: balance < 0
    };
  }

  // --------------------------------------------------------------------------
  // 8. Read Current Month
  // --------------------------------------------------------------------------

  function bbDashboardGetCurrentMonthData() {
    const month = bbDashboardEnsureMonth(
      bbDashboardState.selectedYear,
      bbDashboardState.selectedMonthIndex
    );

    return {
      income: bbDashboardSafeNumber(month.income),
      expenses: bbDashboardSafeNumber(month.expenses),
      categories: {
        ...(month.categories || {})
      }
    };
  }

  // --------------------------------------------------------------------------
  // 9. Update Metrics
  // --------------------------------------------------------------------------

  function bbDashboardUpdateCurrentMetrics() {
    const month = bbDashboardGetCurrentMonthData();

    bbDashboardState.currentMetrics =
      bbDashboardCalculateMetrics(
        month.income,
        month.expenses
      );

    return bbDashboardState.currentMetrics;
  }

  // --------------------------------------------------------------------------
  // 10. DOM Helpers
  // --------------------------------------------------------------------------

  function bbDashboardSetText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  // --------------------------------------------------------------------------
  // 11. Render Summary Cards
  // --------------------------------------------------------------------------

  function bbDashboardRenderSummary() {
    const metrics =
      bbDashboardState.currentMetrics;

    bbDashboardSetText(
      'bb-total-income',
      bbDashboardFormatCurrency(metrics.income)
    );

    bbDashboardSetText(
      'bb-total-expenses',
      bbDashboardFormatCurrency(metrics.expenses)
    );

    bbDashboardSetText(
      'bb-total-savings',
      bbDashboardFormatCurrency(metrics.savings)
    );

    bbDashboardSetText(
      'bb-total-balance',
      bbDashboardFormatCurrency(metrics.balance)
    );

    bbDashboardSetText(
      'bb-income-value',
      bbDashboardFormatCurrency(metrics.income)
    );

    bbDashboardSetText(
      'bb-expenses-value',
      bbDashboardFormatCurrency(metrics.expenses)
    );

    bbDashboardSetText(
      'bb-savings-value',
      bbDashboardFormatCurrency(metrics.savings)
    );

    bbDashboardSetText(
      'bb-balance-value',
      bbDashboardFormatCurrency(metrics.balance)
    );

    bbDashboardSetText(
      'bb-savings-percentage',
      `${metrics.savingsPercentage.toFixed(1)}%`
    );

    bbDashboardSetText(
      'bb-expense-percentage',
      `${metrics.expensePercentage.toFixed(1)}%`
    );

    bbDashboardSetText(
      'bb-current-month-label',
      `${BB_MONTH_NAMES[bbDashboardState.selectedMonthIndex]} ${bbDashboardState.selectedYear}`
    );
  }

  // --------------------------------------------------------------------------
  // 12. Render Month Selector
  // --------------------------------------------------------------------------

  function bbDashboardSetupMonthSelector() {
    const selector =
      document.getElementById('bb-month-selector');

    if (!selector) {
      return;
    }

    selector.innerHTML = '';

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const option = document.createElement('option');

      option.value = String(monthIndex);
      option.textContent =
        BB_MONTH_NAMES[monthIndex];

      if (
        monthIndex ===
        bbDashboardState.selectedMonthIndex
      ) {
        option.selected = true;
      }

      selector.appendChild(option);
    }

    selector.addEventListener('change', function () {
      const selectedMonth = Number(this.value);

      if (
        Number.isInteger(selectedMonth) &&
        selectedMonth >= 0 &&
        selectedMonth <= 11
      ) {
        bbDashboardState.selectedMonthIndex =
          selectedMonth;

        if (bbDashboardState.dataStore) {
          bbDashboardState.dataStore.selectedMonth =
            selectedMonth;

          bbDashboardSaveData(
            bbDashboardState.dataStore
          );
        }

        bbDashboardOnMonthChange(selectedMonth);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 13. Month Change
  // --------------------------------------------------------------------------

  function bbDashboardOnMonthChange(monthIndex) {
    bbDashboardState.selectedMonthIndex =
      Number(monthIndex);

    bbDashboardUpdateCurrentMetrics();
    bbDashboardRenderSummary();

    window.dispatchEvent(
      new CustomEvent('bb:month-changed', {
        detail: {
          year: bbDashboardState.selectedYear,
          monthIndex:
            bbDashboardState.selectedMonthIndex,
          monthName:
            BB_MONTH_NAMES[
              bbDashboardState.selectedMonthIndex
            ],
          metrics:
            bbDashboardClone(
              bbDashboardState.currentMetrics
            )
        }
      })
    );
  }

  // --------------------------------------------------------------------------
  // 14. Public Financial Update API
  // --------------------------------------------------------------------------

  function bbDashboardUpdateMonthFinancials(
    year,
    monthIndex,
    values = {}
  ) {
    const safeYear =
      Number.isInteger(Number(year))
        ? Number(year)
        : bbDashboardState.selectedYear;

    const safeMonth =
      Number.isInteger(Number(monthIndex))
        ? Number(monthIndex)
        : bbDashboardState.selectedMonthIndex;

    const month =
      bbDashboardEnsureMonth(
        safeYear,
        safeMonth
      );

    if (
      Object.prototype.hasOwnProperty.call(
        values,
        'income'
      )
    ) {
      month.income =
        Math.max(
          0,
          bbDashboardSafeNumber(values.income)
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        values,
        'expenses'
      )
    ) {
      month.expenses =
        Math.max(
          0,
          bbDashboardSafeNumber(values.expenses)
        );
    }

    if (
      values.categories &&
      typeof values.categories === 'object'
    ) {
      // IMPORTANT:
      // Replace category totals rather than endlessly
      // adding them. This prevents double-counting.
      month.categories = {
        ...values.categories
      };
    }

    bbDashboardSaveData(
      bbDashboardState.dataStore
    );

    if (
      safeYear === bbDashboardState.selectedYear &&
      safeMonth === bbDashboardState.selectedMonthIndex
    ) {
      bbDashboardOnMonthChange(
        safeMonth
      );
    }

    return bbDashboardClone(month);
  }

  // --------------------------------------------------------------------------
  // 15. Rebuild Dashboard From Transactions
  // --------------------------------------------------------------------------

  function bbDashboardSyncFromTransactions(
    transactions
  ) {
    if (!Array.isArray(transactions)) {
      return false;
    }

    const monthlyTotals = {};

    transactions.forEach(function (transaction) {
      if (!transaction || !transaction.date) {
        return;
      }

      const dateText =
        String(transaction.date);

      const match =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(
          dateText
        );

      if (!match) {
        return;
      }

      const year =
        Number(match[1]);

      const monthIndex =
        Number(match[2]) - 1;

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(monthIndex) ||
        monthIndex < 0 ||
        monthIndex > 11
      ) {
        return;
      }

      const amount =
        Number(transaction.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return;
      }

      const key =
        bbDashboardGetMonthKey(
          year,
          monthIndex
        );

      if (!monthlyTotals[key]) {
        monthlyTotals[key] = {
          income: 0,
          expenses: 0,
          categories: {}
        };
      }

      const type =
        String(transaction.type || '')
          .trim()
          .toLowerCase();

      if (type === 'income') {
        monthlyTotals[key].income += amount;
        return;
      }

      if (type === 'expense') {
        monthlyTotals[key].expenses += amount;

        const rawCategory =
          String(
            transaction.category || 'Other'
          )
            .trim()
            .toLowerCase();

        let category =
          rawCategory;

        // Keep Dashboard and Transactions
        // category terminology compatible.
        if (category === 'housing') {
          category = 'rent';
        }

        if (category === 'utilities') {
          category = 'bills';
        }

        monthlyTotals[key].categories[category] =
          (
            monthlyTotals[key].categories[category] ||
            0
          ) + amount;
      }
    });

    if (!bbDashboardState.dataStore) {
      bbDashboardState.dataStore =
        bbDashboardLoadData();
    }

    if (!bbDashboardState.dataStore.months) {
      bbDashboardState.dataStore.months = {};
    }

    // Update every month represented by transactions.
    Object.keys(monthlyTotals).forEach(function (key) {
      bbDashboardState.dataStore.months[key] = {
        income:
          monthlyTotals[key].income,
        expenses:
          monthlyTotals[key].expenses,
        categories:
          monthlyTotals[key].categories
      };
    });

    bbDashboardSaveData(
      bbDashboardState.dataStore
    );

    bbDashboardUpdateCurrentMetrics();
    bbDashboardRenderSummary();

    return true;
  }

  // --------------------------------------------------------------------------
  // 16. Refresh
  // --------------------------------------------------------------------------

  function bbDashboardRefresh() {
    bbDashboardState.dataStore =
      bbDashboardLoadData();

    if (
      typeof bbDashboardState.dataStore.selectedMonth ===
      'number'
    ) {
      bbDashboardState.selectedMonthIndex =
        bbDashboardState.dataStore.selectedMonth;
    }

    if (
      typeof bbDashboardState.dataStore.selectedYear ===
      'number'
    ) {
      bbDashboardState.selectedYear =
        bbDashboardState.dataStore.selectedYear;
    }

    bbDashboardUpdateCurrentMetrics();
    bbDashboardRenderSummary();

    return bbDashboardState.currentMetrics;
  }

  // --------------------------------------------------------------------------
  // 17. Reset Defaults
  // --------------------------------------------------------------------------

  function bbDashboardResetDefaults() {
    const seed =
      bbDashboardGetSeedData();

    bbDashboardSaveData(seed);

    bbDashboardState.selectedYear =
      BB_DEFAULT_YEAR;

    bbDashboardState.selectedMonthIndex =
      BB_DEFAULT_MONTH_INDEX;

    bbDashboardSetupMonthSelector();
    bbDashboardOnMonthChange(
      BB_DEFAULT_MONTH_INDEX
    );

    bbDashboardShowToast(
      'Data Reset',
      'BroBudget financial data restored to defaults.',
      '🔄'
    );
  }

  // --------------------------------------------------------------------------
  // 18. Toast
  // --------------------------------------------------------------------------

  function bbDashboardShowToast(
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

    const body =
      document.createElement('div');

    body.className =
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

    const close =
      document.createElement('button');

    close.type = 'button';
    close.className =
      'bb-toast-close-btn';
    close.setAttribute(
      'aria-label',
      'Close notification'
    );
    close.innerHTML = '&times;';

    body.appendChild(titleElement);
    body.appendChild(messageElement);

    toast.appendChild(iconElement);
    toast.appendChild(body);
    toast.appendChild(close);

    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add(
        'bb-toast-visible'
      );
    });

    function dismiss() {
      toast.classList.remove(
        'bb-toast-visible'
      );

      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(
            toast
          );
        }
      }, 300);
    }

    close.addEventListener(
      'click',
      dismiss
    );

    setTimeout(
      dismiss,
      3800
    );
  }

  // --------------------------------------------------------------------------
  // 19. Cross-Module Events
  // --------------------------------------------------------------------------

  function bbDashboardSetupEvents() {
    // Transactions sends this event after saving.
    window.addEventListener(
      'bb:financial-data-updated',
      function (event) {
        if (
          bbDashboardState.refreshingFromExternalUpdate
        ) {
          return;
        }

        bbDashboardState.refreshingFromExternalUpdate =
          true;

        try {
          // If transactions supplied the complete
          // transaction list, rebuild from it.
          if (
            event &&
            event.detail &&
            Array.isArray(
              event.detail.transactions
            )
          ) {
            bbDashboardSyncFromTransactions(
              event.detail.transactions
            );
          } else {
            // Otherwise read transaction storage.
            try {
              const stored =
                localStorage.getItem(
                  'brobudget_transactions_v1'
                );

              if (stored !== null) {
                const transactions =
                  JSON.parse(stored);

                if (
                  Array.isArray(
                    transactions
                  )
                ) {
                  bbDashboardSyncFromTransactions(
                    transactions
                  );
                } else {
                  bbDashboardRefresh();
                }
              } else {
                bbDashboardRefresh();
              }
            } catch (error) {
              bbDashboardRefresh();
            }
          }
        } finally {
          bbDashboardState.refreshingFromExternalUpdate =
            false;
        }
      }
    );

    // Direct transaction event for future compatibility.
    window.addEventListener(
      'bb:transactions-updated',
      function (event) {
        if (
          event &&
          event.detail &&
          Array.isArray(
            event.detail.transactions
          )
        ) {
          bbDashboardSyncFromTransactions(
            event.detail.transactions
          );
        }
      }
    );

    // Browser-level cross-tab update.
    window.addEventListener(
      'storage',
      function (event) {
        if (
          event.key ===
          'brobudget_transactions_v1'
        ) {
          try {
            const transactions =
              event.newValue
                ? JSON.parse(event.newValue)
                : [];

            if (
              Array.isArray(
                transactions
              )
            ) {
              bbDashboardSyncFromTransactions(
                transactions
              );
            }
          } catch (error) {
            console.warn(
              'BroBudget Dashboard: Cross-tab transaction refresh failed.',
              error
            );
          }
        }

        if (
          event.key ===
          BB_DASHBOARD_STORAGE_KEY
        ) {
          bbDashboardRefresh();
        }
      }
    );
  }

  // --------------------------------------------------------------------------
  // 20. Sidebar
  // --------------------------------------------------------------------------

  function bbDashboardSetupSidebar() {
    const toggle =
      document.getElementById(
        'bb-sidebar-toggle'
      );

    const sidebar =
      document.querySelector(
        '.bb-dashboard-sidebar'
      );

    if (
      toggle &&
      sidebar
    ) {
      toggle.addEventListener(
        'click',
        function () {
          sidebar.classList.toggle(
            'bb-sidebar-open'
          );
        }
      );
    }
  }

  // --------------------------------------------------------------------------
  // 21. Initialization
  // --------------------------------------------------------------------------

  function bbDashboardInit() {
    if (
      bbDashboardState.initialized
    ) {
      return;
    }

    bbDashboardState.initialized =
      true;

    bbDashboardState.dataStore =
      bbDashboardLoadData();

    if (
      typeof bbDashboardState.dataStore.selectedMonth ===
      'number'
    ) {
      bbDashboardState.selectedMonthIndex =
        bbDashboardState.dataStore.selectedMonth;
    }

    if (
      typeof bbDashboardState.dataStore.selectedYear ===
      'number'
    ) {
      bbDashboardState.selectedYear =
        bbDashboardState.dataStore.selectedYear;
    }

    bbDashboardSetupMonthSelector();
    bbDashboardSetupSidebar();
    bbDashboardSetupEvents();

    // If transaction storage already exists,
    // immediately synchronize Dashboard from it.
    try {
      const storedTransactions =
        localStorage.getItem(
          'brobudget_transactions_v1'
        );

      if (storedTransactions !== null) {
        const transactions =
          JSON.parse(
            storedTransactions
          );

        if (
          Array.isArray(
            transactions
          )
        ) {
          bbDashboardSyncFromTransactions(
            transactions
          );
        }
      } else {
        bbDashboardUpdateCurrentMetrics();
        bbDashboardRenderSummary();
      }
    } catch (error) {
      bbDashboardUpdateCurrentMetrics();
      bbDashboardRenderSummary();
    }
  }

  // --------------------------------------------------------------------------
  // 22. Public API
  // --------------------------------------------------------------------------

  window.BBDashboard = {
    version: '2.0.0',

    module:
      'BroBudget Dashboard - Connected',

    getMetrics: function () {
      return {
        ...bbDashboardState.currentMetrics
      };
    },

    getSelectedPeriod: function () {
      return {
        monthIndex:
          bbDashboardState.selectedMonthIndex,

        monthName:
          BB_MONTH_NAMES[
            bbDashboardState.selectedMonthIndex
          ],

        year:
          bbDashboardState.selectedYear
      };
    },

    updateMonthFinancials:
      bbDashboardUpdateMonthFinancials,

    syncFromTransactions:
      bbDashboardSyncFromTransactions,

    refresh:
      bbDashboardRefresh,

    resetDefaults:
      bbDashboardResetDefaults,

    calculate:
      bbDashboardCalculateMetrics,

    formatCurrency:
      bbDashboardFormatCurrency
  };

  // --------------------------------------------------------------------------
  // 23. Start Application
  // --------------------------------------------------------------------------

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      bbDashboardInit,
      { once: true }
    );
  } else {
    bbDashboardInit();
  }

})();
