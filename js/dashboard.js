/**
 * ============================================================================
 * BroBudget - Dashboard & Financial Overview Module
 * Developer 1 (Main Dashboard, Summary Cards, Month Selector, Overview)
 * 
 * GitHub Team Architecture Guidelines:
 * - All function names prefixed with `bbDashboard`
 * - Modular design with zero dependencies
 * - Shared LocalStorage schema for Developer 2 (Expenses) and Developer 3 (Charts)
 * - Public API exported at `window.BBDashboard`
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Configuration
  // --------------------------------------------------------------------------
  const BB_STORAGE_KEY = 'brobudget_financial_data_v1';
  const BB_DEFAULT_YEAR = 2026;
  const BB_DEFAULT_MONTH_INDEX = 9; // October (0-indexed: Jan=0 ... Oct=9)

  const bbDashboardMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const bbDashboardMonthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------
  let bbDashboardState = {
    selectedYear: BB_DEFAULT_YEAR,
    selectedMonthIndex: BB_DEFAULT_MONTH_INDEX,
    previousMetrics: null,
    currentMetrics: null,
    dataStore: null,
    animationTimers: {}
  };

  // --------------------------------------------------------------------------
  // 3. Realistic Demo Seed Data for All 12 Months
  // --------------------------------------------------------------------------
  /**
   * Generates initial seed data for all months so the dashboard is immediately
   * functional upon first launch. Developers 2 & 3 can append or modify records.
   */
  function bbDashboardGetSeedData() {
    return {
      version: '1.0.0',
      currency: '₹',
      selectedYear: BB_DEFAULT_YEAR,
      selectedMonth: BB_DEFAULT_MONTH_INDEX,
      months: {
        '2026-0': {
          income: 48000,
          expenses: 32000,
          categories: { housing: 12000, food: 8000, transport: 4000, utilities: 3500, entertainment: 4500 }
        },
        '2026-1': {
          income: 48000,
          expenses: 29000,
          categories: { housing: 12000, food: 7500, transport: 3500, utilities: 3000, entertainment: 3000 }
        },
        '2026-2': {
          income: 50000,
          expenses: 31000,
          categories: { housing: 12000, food: 8500, transport: 4000, utilities: 3500, entertainment: 3000 }
        },
        '2026-3': {
          income: 50000,
          expenses: 34000,
          categories: { housing: 12000, food: 9500, transport: 4500, utilities: 4000, entertainment: 4000 }
        },
        '2026-4': {
          income: 52000,
          expenses: 30000,
          categories: { housing: 12000, food: 8000, transport: 3500, utilities: 3500, entertainment: 3000 }
        },
        '2026-5': {
          income: 52000,
          expenses: 28000,
          categories: { housing: 12000, food: 7000, transport: 3000, utilities: 3000, entertainment: 3000 }
        },
        '2026-6': {
          income: 52000,
          expenses: 33000,
          categories: { housing: 12000, food: 9000, transport: 4000, utilities: 4000, entertainment: 4000 }
        },
        '2026-7': {
          income: 54000,
          expenses: 32000,
          categories: { housing: 12000, food: 9000, transport: 4000, utilities: 3500, entertainment: 3500 }
        },
        '2026-8': {
          income: 54000,
          expenses: 31000,
          categories: { housing: 12000, food: 8500, transport: 3800, utilities: 3200, entertainment: 3500 }
        },
        // October: Matches prompt's exact example: Income ₹50,000, Expenses ₹30,000, Balance ₹20,000, Savings ₹20,000
        '2026-9': {
          income: 50000,
          expenses: 30000,
          categories: { housing: 12000, food: 8000, transport: 3500, utilities: 3500, entertainment: 3000 }
        },
        '2026-10': {
          income: 55000,
          expenses: 33000,
          categories: { housing: 12000, food: 9000, transport: 4000, utilities: 4000, entertainment: 4000 }
        },
        '2026-11': {
          income: 60000,
          expenses: 38000,
          categories: { housing: 12000, food: 11000, transport: 5000, utilities: 4500, entertainment: 5500 }
        }
      }
    };
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage Management
  // --------------------------------------------------------------------------
  /**
   * Retrieves data from LocalStorage or sets default seed data
   */
  function bbDashboardLoadData() {
    try {
      const stored = localStorage.getItem(BB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.months) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('BroBudget: Unable to read from LocalStorage, falling back to seed data.', err);
    }

    const defaultSeed = bbDashboardGetSeedData();
    bbDashboardSaveData(defaultSeed);
    return defaultSeed;
  }

  /**
   * Persists data safely to LocalStorage
   */
  function bbDashboardSaveData(data) {
    try {
      localStorage.setItem(BB_STORAGE_KEY, JSON.stringify(data));
      bbDashboardState.dataStore = data;
    } catch (err) {
      console.error('BroBudget: Failed to persist to LocalStorage.', err);
    }
  }

  /**
   * Retrieves month record for a specific year and month index
   */
  function bbDashboardGetMonthRecord(year, monthIndex) {
    const key = `${year}-${monthIndex}`;
    if (bbDashboardState.dataStore && bbDashboardState.dataStore.months[key]) {
      return bbDashboardState.dataStore.months[key];
    }
    // Safe default if not present
    return {
      income: 0,
      expenses: 0,
      categories: { housing: 0, food: 0, transport: 0, utilities: 0, entertainment: 0 }
    };
  }

  // --------------------------------------------------------------------------
  // 5. Core Financial Calculations
  // --------------------------------------------------------------------------
  /**
   * Calculates Balance, Savings, and Savings Percentage safely.
   * Prevents NaN, Infinity, or -Infinity when income is zero or values are invalid.
   */
  function bbDashboardCalculateMetrics(rawIncome, rawExpenses) {
    // Robust type sanitization
    const income = typeof rawIncome === 'number' && !isNaN(rawIncome) ? Math.max(0, rawIncome) : 0;
    const expenses = typeof rawExpenses === 'number' && !isNaN(rawExpenses) ? Math.max(0, rawExpenses) : 0;

    // Required formulas:
    // Balance = Income - Expenses
    // Savings = Income - Expenses
    const balance = income - expenses;
    const savings = income - expenses;

    // Savings Percentage: Savings / Income × 100
    // Zero income safe handling:
    let savingsPercentage = 0;
    if (income > 0) {
      savingsPercentage = (savings / income) * 100;
    }

    // Expense Percentage of Income
    let expensePercentage = 0;
    if (income > 0) {
      expensePercentage = (expenses / income) * 100;
    }

    return {
      income,
      expenses,
      balance,
      savings,
      savingsPercentage: Number(savingsPercentage.toFixed(1)),
      expensePercentage: Number(expensePercentage.toFixed(1)),
      isDeficit: balance < 0,
      isZeroIncome: income === 0
    };
  }

  // --------------------------------------------------------------------------
  // 6. Number Formatting Utilities
  // --------------------------------------------------------------------------
  /**
   * Formats numbers into Indian Currency format (₹xx,xxx)
   */
  function bbDashboardFormatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0';
    }
    const isNegative = amount < 0;
    const absoluteVal = Math.abs(Math.round(amount));
    const formatted = absoluteVal.toLocaleString('en-IN');
    return isNegative ? `-₹${formatted}` : `₹${formatted}`;
  }

  /**
   * Formats percentage with safe suffix
   */
  function bbDashboardFormatPercentage(percent) {
    if (typeof percent !== 'number' || isNaN(percent) || !isFinite(percent)) {
      return '0.0%';
    }
    return `${percent.toFixed(1)}%`;
  }

  // --------------------------------------------------------------------------
  // 7. High-Performance Number Counting Animation
  // --------------------------------------------------------------------------
  /**
   * Smoothly animates numbers from startVal to targetVal using requestAnimationFrame
   * with an ease-out cubic curve. Avoids layout thrashing and prevents NaN errors.
   */
  function bbDashboardAnimateCounter(elementId, startVal, targetVal, isCurrency = true, duration = 600) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Cancel existing animation on this element if active
    if (bbDashboardState.animationTimers[elementId]) {
      cancelAnimationFrame(bbDashboardState.animationTimers[elementId]);
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || duration <= 0) {
      el.textContent = isCurrency ? bbDashboardFormatCurrency(targetVal).replace('₹', '') : targetVal;
      return;
    }

    const start = typeof startVal === 'number' && !isNaN(startVal) ? startVal : 0;
    const end = typeof targetVal === 'number' && !isNaN(targetVal) ? targetVal : 0;
    const change = end - start;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + change * easeOut);

      const formattedVal = Math.abs(currentVal).toLocaleString('en-IN');
      el.textContent = (currentVal < 0 ? '-' : '') + formattedVal;

      if (progress < 1) {
        bbDashboardState.animationTimers[elementId] = requestAnimationFrame(step);
      } else {
        const finalVal = Math.abs(end).toLocaleString('en-IN');
        el.textContent = (end < 0 ? '-' : '') + finalVal;
        delete bbDashboardState.animationTimers[elementId];
      }
    }

    bbDashboardState.animationTimers[elementId] = requestAnimationFrame(step);
  }

  // --------------------------------------------------------------------------
  // 8. Render & Update Summary Cards
  // --------------------------------------------------------------------------
  /**
   * Updates the 4 main financial cards:
   * 1. Income
   * 2. Expenses
   * 3. Balance
   * 4. Savings
   */
  function bbDashboardUpdateCards(metrics, previousMetrics) {
    const prev = previousMetrics || { income: 0, expenses: 0, balance: 0, savings: 0 };

    // 1. Income Card
    bbDashboardAnimateCounter('bb-amount-income', prev.income, metrics.income, true);
    const incomeDescEl = document.getElementById('bb-desc-income');
    if (incomeDescEl) {
      if (metrics.isZeroIncome) {
        incomeDescEl.innerHTML = '<strong>No income</strong> registered this month';
      } else {
        incomeDescEl.innerHTML = '<strong>Primary gross inflows</strong> recorded';
      }
    }

    // 2. Expenses Card
    bbDashboardAnimateCounter('bb-amount-expenses', prev.expenses, metrics.expenses, true);
    const expenseDescEl = document.getElementById('bb-desc-expenses');
    if (expenseDescEl) {
      if (metrics.isZeroIncome) {
        expenseDescEl.innerHTML = `Total monthly expenditures: <strong>${bbDashboardFormatCurrency(metrics.expenses)}</strong>`;
      } else {
        expenseDescEl.innerHTML = `<strong>${metrics.expensePercentage}%</strong> of monthly income spent`;
      }
    }

    // 3. Balance Card
    bbDashboardAnimateCounter('bb-amount-balance', prev.balance, metrics.balance, true);
    const balanceDescEl = document.getElementById('bb-desc-balance');
    const balanceCurrencyEl = document.getElementById('bb-currency-balance');
    if (balanceCurrencyEl) {
      balanceCurrencyEl.style.color = metrics.isDeficit ? 'var(--bb-color-expense-light)' : 'var(--bb-text-secondary)';
    }
    if (balanceDescEl) {
      if (metrics.isDeficit) {
        balanceDescEl.innerHTML = '<span style="color:var(--bb-color-expense-light); font-weight:700;">Deficit:</span> Expenditures exceed income';
      } else {
        balanceDescEl.innerHTML = '<strong>Net cash available</strong> after monthly outflow';
      }
    }

    // 4. Savings Card
    bbDashboardAnimateCounter('bb-amount-savings', prev.savings, metrics.savings, true);
    const savingsDescEl = document.getElementById('bb-desc-savings');
    if (savingsDescEl) {
      if (metrics.isZeroIncome) {
        savingsDescEl.innerHTML = 'Savings Rate: <strong>0.0%</strong> (No income)';
      } else if (metrics.isDeficit) {
        savingsDescEl.innerHTML = '<span style="color:var(--bb-color-expense-light); font-weight:700;">Negative Savings:</span> Drawdown mode';
      } else {
        savingsDescEl.innerHTML = `Savings Rate: <strong>${bbDashboardFormatPercentage(metrics.savingsPercentage)}</strong>`;
      }
    }

    // Trigger visual pulse on cards
    const cards = document.querySelectorAll('.bb-summary-card');
    cards.forEach((card) => {
      card.classList.remove('bb-animate-fade-in');
      void card.offsetWidth; // Force reflow
      card.classList.add('bb-animate-fade-in');
    });
  }

  // --------------------------------------------------------------------------
  // 9. Render Monthly Financial Overview
  // --------------------------------------------------------------------------
  /**
   * Renders the comprehensive Monthly Overview section:
   * - Financial Health Status badge
   * - Cash flow allocation multi-segment progress bar
   * - Daily spend burn rate
   * - 50/30/20 guideline comparison
   * - Category preview distribution bars
   */
  function bbDashboardRenderOverview(metrics, monthRecord, monthIndex, year) {
    // 1. Determine Health Status
    const healthBadge = document.getElementById('bb-overview-health-badge');
    if (healthBadge) {
      healthBadge.className = 'bb-dashboard-health-badge';
      if (metrics.isDeficit) {
        healthBadge.classList.add('bb-health-danger');
        healthBadge.textContent = 'Deficit Alert';
      } else if (metrics.savingsPercentage >= 35) {
        healthBadge.classList.add('bb-health-excellent');
        healthBadge.textContent = `Excellent (${metrics.savingsPercentage}% Saved)`;
      } else if (metrics.savingsPercentage >= 20) {
        healthBadge.classList.add('bb-health-good');
        healthBadge.textContent = `Healthy (${metrics.savingsPercentage}% Saved)`;
      } else {
        healthBadge.classList.add('bb-health-warning');
        healthBadge.textContent = `Moderate (${metrics.savingsPercentage}% Saved)`;
      }
    }

    // 2. Savings Rate Tag
    const rateTag = document.getElementById('bb-overview-savings-rate');
    if (rateTag) {
      rateTag.textContent = bbDashboardFormatPercentage(metrics.savingsPercentage);
    }

    // 3. Multi-segment Cash Flow Bar
    const expenseBar = document.getElementById('bb-overview-bar-expense');
    const savingsBar = document.getElementById('bb-overview-bar-savings');

    let expWidth = 0;
    let savWidth = 0;
    if (metrics.income > 0) {
      expWidth = Math.min(Math.max((metrics.expenses / metrics.income) * 100, 0), 100);
      savWidth = Math.min(Math.max((metrics.savings / metrics.income) * 100, 0), 100);
      if (metrics.isDeficit) {
        expWidth = 100;
        savWidth = 0;
      }
    } else if (metrics.expenses > 0) {
      expWidth = 100;
      savWidth = 0;
    }

    if (expenseBar) expenseBar.style.width = `${expWidth}%`;
    if (savingsBar) savingsBar.style.width = `${savWidth}%`;

    // 4. Key Financial Indicators
    // Days in selected month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dailyAverageSpend = Math.round(metrics.expenses / daysInMonth);

    const dailySpendEl = document.getElementById('bb-sub-daily-spend');
    if (dailySpendEl) {
      dailySpendEl.textContent = bbDashboardFormatCurrency(dailyAverageSpend);
    }

    const netStatusEl = document.getElementById('bb-sub-net-status');
    const netStatusDescEl = document.getElementById('bb-sub-net-desc');
    if (netStatusEl) {
      if (metrics.isDeficit) {
        netStatusEl.textContent = 'Net Deficit';
        netStatusEl.style.color = 'var(--bb-color-expense-light)';
        if (netStatusDescEl) netStatusDescEl.textContent = 'Expenses exceeded income';
      } else {
        netStatusEl.textContent = 'Net Surplus';
        netStatusEl.style.color = 'var(--bb-color-income-light)';
        if (netStatusDescEl) netStatusDescEl.textContent = 'Retained positive liquid buffer';
      }
    }

    const rule503020El = document.getElementById('bb-sub-rule-status');
    if (rule503020El) {
      if (metrics.savingsPercentage >= 20) {
        rule503020El.textContent = 'Target Met (≥20%)';
        rule503020El.style.color = 'var(--bb-color-savings-light)';
      } else {
        rule503020El.textContent = 'Below Target (<20%)';
        rule503020El.style.color = '#fbbf24';
      }
    }

    // 5. Category Breakdown Preview
    bbDashboardRenderCategories(monthRecord, metrics.expenses);

    // 6. Update Month Label in Header
    const currentMonthLabel = document.getElementById('bb-current-month-label');
    if (currentMonthLabel) {
      currentMonthLabel.textContent = `${bbDashboardMonthNames[monthIndex]} ${year}`;
    }
  }

  /**
   * Renders the category distribution mini-bars
   */
  function bbDashboardRenderCategories(monthRecord, totalExpenses) {
    const listContainer = document.getElementById('bb-category-list');
    if (!listContainer) return;

    const categories = monthRecord.categories || {};
    const keys = Object.keys(categories);

    if (keys.length === 0 || totalExpenses <= 0) {
      listContainer.innerHTML = `
        <div style="padding: 20px 0; text-align: center; color: var(--bb-text-muted); font-size: 13px;">
          No expense categorization recorded for this month.
        </div>
      `;
      return;
    }

    const categoryIcons = {
      housing: '🏠 Housing & Rent',
      food: '🍔 Food & Groceries',
      transport: '🚗 Transport & Fuel',
      utilities: '⚡ Bills & Utilities',
      entertainment: '🎬 Entertainment'
    };

    const categoryColors = [
      '#f43f5e', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'
    ];

    let html = '';
    keys.forEach((catKey, index) => {
      const amount = categories[catKey] || 0;
      const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      const color = categoryColors[index % categoryColors.length];
      const displayName = categoryIcons[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1);

      html += `
        <div class="bb-dashboard-cat-item">
          <div class="bb-dashboard-cat-top">
            <span class="bb-dashboard-cat-name">${displayName}</span>
            <span class="bb-dashboard-cat-amount">${bbDashboardFormatCurrency(amount)} (${pct}%)</span>
          </div>
          <div class="bb-dashboard-cat-bar">
            <div class="bb-dashboard-cat-fill" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // 10. Month Selector Component Logic
  // --------------------------------------------------------------------------
  /**
   * Initializes month selector dropdown and quick-nav pills
   */
  function bbDashboardSetupMonthSelector() {
    const dropdown = document.getElementById('bb-month-select-dropdown');
    const pillsContainer = document.getElementById('bb-month-pills-container');

    // Populate Dropdown
    if (dropdown) {
      dropdown.innerHTML = '';
      bbDashboardMonthNames.forEach((month, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `${month} ${bbDashboardState.selectedYear}`;
        if (idx === bbDashboardState.selectedMonthIndex) {
          option.selected = true;
        }
        dropdown.appendChild(option);
      });

      dropdown.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value, 10);
        bbDashboardOnMonthChange(selectedIndex);
      });
    }

    // Populate Pills Carousel
    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      bbDashboardMonthShortNames.forEach((shortName, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `bb-month-pill-btn ${idx === bbDashboardState.selectedMonthIndex ? 'bb-month-pill-active' : ''}`;
        btn.textContent = shortName;
        btn.setAttribute('aria-label', `Select ${bbDashboardMonthNames[idx]}`);
        btn.addEventListener('click', () => {
          bbDashboardOnMonthChange(idx);
        });
        pillsContainer.appendChild(btn);
      });
    }

    // Previous & Next Month Navigation Buttons
    const prevBtn = document.getElementById('bb-btn-prev-month');
    const nextBtn = document.getElementById('bb-btn-next-month');
    const currentBtn = document.getElementById('bb-btn-today-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        let newIndex = bbDashboardState.selectedMonthIndex - 1;
        if (newIndex < 0) newIndex = 11;
        bbDashboardOnMonthChange(newIndex);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        let newIndex = bbDashboardState.selectedMonthIndex + 1;
        if (newIndex > 11) newIndex = 0;
        bbDashboardOnMonthChange(newIndex);
      });
    }

    if (currentBtn) {
      currentBtn.addEventListener('click', () => {
        const realCurrentMonth = new Date().getMonth();
        bbDashboardOnMonthChange(realCurrentMonth);
      });
    }
  }

  /**
   * Handles month change action
   */
  function bbDashboardOnMonthChange(monthIndex) {
    if (monthIndex < 0 || monthIndex > 11) return;

    // Cache previous metrics for smooth transition animation
    bbDashboardState.previousMetrics = bbDashboardState.currentMetrics;
    bbDashboardState.selectedMonthIndex = monthIndex;

    // Update Dropdown value
    const dropdown = document.getElementById('bb-month-select-dropdown');
    if (dropdown) dropdown.value = monthIndex;

    // Update Pills active class
    const pills = document.querySelectorAll('.bb-month-pill-btn');
    pills.forEach((pill, idx) => {
      if (idx === monthIndex) {
        pill.classList.add('bb-month-pill-active');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        pill.classList.remove('bb-month-pill-active');
      }
    });

    // Load new month data
    const monthRecord = bbDashboardGetMonthRecord(bbDashboardState.selectedYear, monthIndex);
    const newMetrics = bbDashboardCalculateMetrics(monthRecord.income, monthRecord.expenses);
    bbDashboardState.currentMetrics = newMetrics;

    // Update UI Cards and Overview
    bbDashboardUpdateCards(newMetrics, bbDashboardState.previousMetrics);
    bbDashboardRenderOverview(newMetrics, monthRecord, monthIndex, bbDashboardState.selectedYear);

    // Save selected month preference to store
    if (bbDashboardState.dataStore) {
      bbDashboardState.dataStore.selectedMonth = monthIndex;
      bbDashboardSaveData(bbDashboardState.dataStore);
    }

    // Dispatch custom event for Developer 2 and Developer 3 modules to synchronize
    window.dispatchEvent(new CustomEvent('bb:month-changed', {
      detail: {
        year: bbDashboardState.selectedYear,
        monthIndex: monthIndex,
        monthName: bbDashboardMonthNames[monthIndex],
        metrics: newMetrics
      }
    }));
  }

  // --------------------------------------------------------------------------
  // 11. Sidebar Navigation & Placeholder Handlers
  // --------------------------------------------------------------------------
  /**
   * Sets up responsive sidebar drawer behavior and placeholder actions
   */
  function bbDashboardSetupSidebar() {
    const aside = document.getElementById('bb-sidebar');
    const toggleBtn = document.getElementById('bb-sidebar-toggle');
    const backdrop = document.getElementById('bb-sidebar-backdrop');

    function openSidebar() {
      if (aside) aside.classList.add('bb-sidebar-mobile-open');
      if (backdrop) backdrop.classList.add('bb-sidebar-backdrop-active');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      if (aside) aside.classList.remove('bb-sidebar-mobile-open');
      if (backdrop) backdrop.classList.remove('bb-sidebar-backdrop-active');
      document.body.style.overflow = '';
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (aside && aside.classList.contains('bb-sidebar-mobile-open')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeSidebar);
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aside && aside.classList.contains('bb-sidebar-mobile-open')) {
        closeSidebar();
      }
    });

    // Setup placeholder clicks for other developer modules
    const placeholderItems = document.querySelectorAll('[data-bb-module]');
    placeholderItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const moduleName = item.getAttribute('data-bb-module') || 'Feature';
        const devOwner = item.getAttribute('data-bb-dev') || 'Team';
        bbDashboardShowToast(
          `${moduleName} Module`,
          `This section is reserved for ${devOwner}. BroBudget event bus is ready for seamless GitHub module integration.`,
          '⚡'
        );
        // On mobile, close sidebar after clicking
        if (window.innerWidth <= 992) {
          closeSidebar();
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 12. Toast Notification System (bb-toast-)
  // --------------------------------------------------------------------------
  /**
   * Displays a modern non-intrusive toast notification
   */
  function bbDashboardShowToast(title, message, icon = 'ℹ️') {
    let container = document.getElementById('bb-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bb-toast-container';
      container.className = 'bb-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bb-toast-message';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="bb-toast-icon">${icon}</div>
      <div class="bb-toast-body">
        <div class="bb-toast-title">${title}</div>
        <div class="bb-toast-desc">${message}</div>
      </div>
      <button type="button" class="bb-toast-close-btn" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      toast.classList.add('bb-toast-visible');
    });

    const closeBtn = toast.querySelector('.bb-toast-close-btn');
    const dismiss = () => {
      toast.classList.remove('bb-toast-visible');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4200);
  }

  // --------------------------------------------------------------------------
  // 13. Public API & Event Bus for Developer 2 & Developer 3
  // --------------------------------------------------------------------------
  /**
   * Exposes a standardized interface for Developer 2 and Developer 3 to hook into.
   */
  function bbDashboardSetupDevHooks() {
    window.BBDashboard = {
      version: '1.0.0',
      module: 'Developer 1 - Dashboard & Financial Overview',
      
      /**
       * Returns currently active metrics
       */
      getMetrics: function () {
        return { ...bbDashboardState.currentMetrics };
      },

      /**
       * Returns currently selected month index & year
       */
      getSelectedPeriod: function () {
        return {
          monthIndex: bbDashboardState.selectedMonthIndex,
          monthName: bbDashboardMonthNames[bbDashboardState.selectedMonthIndex],
          year: bbDashboardState.selectedYear
        };
      },

      /**
       * Allows Developer 2 (Expense Entry) or Dev 3 to programmatically update monthly values
       */
      updateMonthFinancials: function (year, monthIndex, { income, expenses, categories }) {
        const key = `${year}-${monthIndex}`;
        if (!bbDashboardState.dataStore.months[key]) {
          bbDashboardState.dataStore.months[key] = { income: 0, expenses: 0, categories: {} };
        }

        if (typeof income === 'number') bbDashboardState.dataStore.months[key].income = income;
        if (typeof expenses === 'number') bbDashboardState.dataStore.months[key].expenses = expenses;
        if (categories && typeof categories === 'object') {
          bbDashboardState.dataStore.months[key].categories = {
            ...bbDashboardState.dataStore.months[key].categories,
            ...categories
          };
        }

        bbDashboardSaveData(bbDashboardState.dataStore);

        // If updated month is currently viewed, refresh UI
        if (year === bbDashboardState.selectedYear && monthIndex === bbDashboardState.selectedMonthIndex) {
          bbDashboardOnMonthChange(monthIndex);
        }
      },

      /**
       * Forces UI re-calculation and refresh
       */
      refresh: function () {
        bbDashboardOnMonthChange(bbDashboardState.selectedMonthIndex);
      },

      /**
       * Resets LocalStorage to initial seed defaults
       */
      resetDefaults: function () {
        const seed = bbDashboardGetSeedData();
        bbDashboardSaveData(seed);
        bbDashboardOnMonthChange(BB_DEFAULT_MONTH_INDEX);
        bbDashboardShowToast('Data Reset', 'BroBudget financial data restored to defaults.', '🔄');
      },

      /**
       * Helper calculation method for external modules
       */
      calculate: bbDashboardCalculateMetrics,
      formatCurrency: bbDashboardFormatCurrency
    };

    // Listen for custom event from Developer 2 or 3
    window.addEventListener('bb:financial-data-updated', (event) => {
      if (event.detail) {
        const { year, monthIndex, income, expenses, categories } = event.detail;
        window.BBDashboard.updateMonthFinancials(
          year || bbDashboardState.selectedYear,
          typeof monthIndex === 'number' ? monthIndex : bbDashboardState.selectedMonthIndex,
          { income, expenses, categories }
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 14. Application Initialization
  // --------------------------------------------------------------------------
  function bbDashboardInit() {
    // 1. Load data from LocalStorage or seed defaults
    bbDashboardState.dataStore = bbDashboardLoadData();

    // 2. Determine initial month (Oct by default or saved preference)
    if (typeof bbDashboardState.dataStore.selectedMonth === 'number') {
      bbDashboardState.selectedMonthIndex = bbDashboardState.dataStore.selectedMonth;
    }

    // 3. Setup Month Selector and Sidebar
    bbDashboardSetupMonthSelector();
    bbDashboardSetupSidebar();

    // 4. Setup Developer Integration API
    bbDashboardSetupDevHooks();

    // 5. Initial Render
    const initialRecord = bbDashboardGetMonthRecord(
      bbDashboardState.selectedYear,
      bbDashboardState.selectedMonthIndex
    );
    const initialMetrics = bbDashboardCalculateMetrics(initialRecord.income, initialRecord.expenses);
    bbDashboardState.currentMetrics = initialMetrics;

    bbDashboardUpdateCards(initialMetrics, { income: 0, expenses: 0, balance: 0, savings: 0 });
    bbDashboardRenderOverview(
      initialMetrics,
      initialRecord,
      bbDashboardState.selectedMonthIndex,
      bbDashboardState.selectedYear
    );
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bbDashboardInit);
  } else {
    bbDashboardInit();
  }

})();
