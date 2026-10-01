/**
 * ============================================================================
 * BroBudget - Income & Expense Management Module
 * Connected architecture:
 *
 * Transactions → Dashboard → Analytics
 *
 * LocalStorage:
 * - brobudget_transactions_v1
 * - brobudget_financial_data_v1
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONSTANTS
  // ==========================================================================

  const BB_TRANSACTIONS_STORAGE_KEY = 'brobudget_transactions_v1';
  const BB_DASHBOARD_STORAGE_KEY = 'brobudget_financial_data_v1';

  const bbExpenseCategories = [
    { id: 'Food', name: 'Food', icon: '🍔' },
    { id: 'Rent', name: 'Rent', icon: '🏠' },
    { id: 'Transport', name: 'Transport', icon: '🚗' },
    { id: 'Shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'Education', name: 'Education', icon: '🎓' },
    { id: 'Entertainment', name: 'Entertainment', icon: '🎮' },
    { id: 'Health', name: 'Health', icon: '💊' },
    { id: 'Bills', name: 'Bills', icon: '📱' },
    { id: 'Other', name: 'Other', icon: '📦' }
  ];

  const bbIncomeSources = [
    { id: 'Salary', name: 'Salary', icon: '💼' },
    { id: 'Freelance', name: 'Freelance', icon: '💻' },
    { id: 'Bonus', name: 'Bonus', icon: '🎁' },
    { id: 'Investment', name: 'Investment', icon: '📈' },
    { id: 'Other', name: 'Other', icon: '💰' }
  ];

  const bbMonthNames = [
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

  // ==========================================================================
  // 2. STATE
  // ==========================================================================

  let bbTransactionsState = {
    transactions: [],
    activeFormType: 'expense',
    editingTransactionId: null,
    pendingDeleteId: null,
    filters: {
      search: '',
      type: 'all',
      category: 'all',
      month: 'all',
      year: 'all'
    }
  };

  let bbTransactionsInitialized = false;

  // ==========================================================================
  // 3. DATE HELPERS
  // ==========================================================================

  /**
   * Safely parses YYYY-MM-DD without browser timezone surprises.
   */
  function bbTransactionsParseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

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

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return {
      year,
      monthIndex: month - 1,
      month: month,
      day,
      date
    };
  }

  function bbTransactionsGetMonthKey(dateString) {
    const parsed = bbTransactionsParseDate(dateString);

    if (!parsed) {
      return null;
    }

    return `${parsed.year}-${parsed.monthIndex}`;
  }

  function bbTransactionsGetCurrentDateString() {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  function bbTransactionsFormatDate(dateString) {
    const parsed = bbTransactionsParseDate(dateString);

    if (!parsed) {
      return dateString || '';
    }

    const shortMonth = bbMonthNames[parsed.monthIndex].substring(0, 3);

    return `${String(parsed.day).padStart(2, '0')} ${shortMonth} ${parsed.year}`;
  }

  // ==========================================================================
  // 4. INITIAL SEED
  // ==========================================================================

  function bbTransactionsGetInitialSeed() {
    return [
      {
        id: 1727766000001,
        type: 'income',
        category: 'Salary',
        description: 'Tech Corp Monthly Salary',
        amount: 50000,
        date: '2026-10-01'
      },
      {
        id: 1727766000002,
        type: 'expense',
        category: 'Rent',
        description: 'Apartment Monthly Rent',
        amount: 12000,
        date: '2026-10-01'
      },
      {
        id: 1727766000003,
        type: 'expense',
        category: 'Food',
        description: 'Lunch with team',
        amount: 500,
        date: '2026-10-01'
      },
      {
        id: 1727766000004,
        type: 'expense',
        category: 'Food',
        description: 'Weekly Organic Groceries',
        amount: 3500,
        date: '2026-10-02'
      },
      {
        id: 1727766000005,
        type: 'expense',
        category: 'Transport',
        description: 'Metro Monthly Pass & Fuel',
        amount: 2500,
        date: '2026-10-03'
      },
      {
        id: 1727766000006,
        type: 'expense',
        category: 'Bills',
        description: 'Fiber Internet & Power Bill',
        amount: 3500,
        date: '2026-10-04'
      },
      {
        id: 1727766000007,
        type: 'expense',
        category: 'Entertainment',
        description: 'Cinema & Streaming Subscriptions',
        amount: 1800,
        date: '2026-10-05'
      },
      {
        id: 1727766000008,
        type: 'expense',
        category: 'Shopping',
        description: 'Winter Jacket & Shoes',
        amount: 4200,
        date: '2026-10-06'
      },
      {
        id: 1727766000009,
        type: 'expense',
        category: 'Health',
        description: 'Gym Membership & Vitamins',
        amount: 2000,
        date: '2026-10-07'
      }
    ];
  }

  // ==========================================================================
  // 5. STORAGE
  // ==========================================================================

  function bbTransactionsGet() {
    try {
      const stored = localStorage.getItem(BB_TRANSACTIONS_STORAGE_KEY);

      // IMPORTANT:
      // If the key exists, even if it contains [], respect that empty state.
      if (stored !== null) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(
        'BroBudget: Unable to read transactions from LocalStorage.',
        error
      );
    }

    // Only seed when the transaction storage key does not exist
    // or contains invalid data.
    const seed = bbTransactionsGetInitialSeed();

    try {
      localStorage.setItem(
        BB_TRANSACTIONS_STORAGE_KEY,
        JSON.stringify(seed)
      );
    } catch (error) {
      console.warn(
        'BroBudget: Unable to create initial transaction storage.',
        error
      );
    }

    return seed;
  }

  function bbTransactionsSave(transactions) {
    if (!Array.isArray(transactions)) {
      console.error('BroBudget: transactions must be an array.');
      return false;
    }

    try {
      localStorage.setItem(
        BB_TRANSACTIONS_STORAGE_KEY,
        JSON.stringify(transactions)
      );

      bbTransactionsState.transactions = transactions.slice();

      bbTransactionsSyncWithDashboard(transactions);

      window.dispatchEvent(
        new CustomEvent('bb:transactions-updated', {
          detail: {
            transactions: transactions.slice(),
            transactionsCount: transactions.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error(
        'BroBudget: Failed to save transactions.',
        error
      );

      return false;
    }
  }

  // ==========================================================================
  // 6. TRANSACTION CRUD
  // ==========================================================================

  function bbTransactionAdd(transaction) {
    const list = bbTransactionsGet();

    const newTransaction = {
      id: Date.now(),
      type: transaction.type === 'income' ? 'income' : 'expense',
      category: String(transaction.category || 'Other').trim(),
      description: String(transaction.description || '').trim(),
      amount: Number(transaction.amount),
      date: String(transaction.date || '')
    };

    const validation = bbTransactionsValidate(newTransaction);

    if (!validation.isValid) {
      bbTransactionsShowErrors(validation.errors);
      return null;
    }

    list.unshift(newTransaction);

    bbTransactionsSave(list);
    bbTransactionsRender();

    bbTransactionsShowToast(
      'Transaction Added',
      `Successfully recorded ${
        newTransaction.type
      } of ₹${newTransaction.amount.toLocaleString('en-IN')}`,
      '✅'
    );

    return newTransaction;
  }

  function bbTransactionUpdate(id, updatedData) {
    const list = bbTransactionsGet();

    const index = list.findIndex(
      transaction => String(transaction.id) === String(id)
    );

    if (index === -1) {
      console.error(`Transaction with ID ${id} not found.`);
      return null;
    }

    const updatedTransaction = {
      ...list[index],
      type: updatedData.type === 'income' ? 'income' : 'expense',
      category: String(updatedData.category || 'Other').trim(),
      description: String(updatedData.description || '').trim(),
      amount: Number(updatedData.amount),
      date: String(updatedData.date || '')
    };

    const validation = bbTransactionsValidate(updatedTransaction);

    if (!validation.isValid) {
      bbTransactionsShowErrors(validation.errors);
      return null;
    }

    list[index] = updatedTransaction;

    bbTransactionsSave(list);
    bbTransactionsRender();

    bbTransactionsShowToast(
      'Transaction Updated',
      'Changes saved successfully.',
      '✏️'
    );

    return updatedTransaction;
  }

  function bbTransactionDelete(id) {
    const list = bbTransactionsGet();

    const target = list.find(
      transaction => String(transaction.id) === String(id)
    );

    if (!target) {
      return false;
    }

    const filtered = list.filter(
      transaction => String(transaction.id) !== String(id)
    );

    bbTransactionsSave(filtered);
    bbTransactionsRender();

    bbTransactionsShowToast(
      'Transaction Deleted',
      `Removed ${target.category} (${target.type})`,
      '🗑️'
    );

    return true;
  }

  // ==========================================================================
  // 7. FILTERING
  // ==========================================================================

  function bbTransactionsFilter(criteria = {}) {
    const list = Array.isArray(bbTransactionsState.transactions)
      ? bbTransactionsState.transactions
      : [];

    const search = String(criteria.search || '')
      .trim()
      .toLowerCase();

    const type = criteria.type || 'all';
    const category = criteria.category || 'all';
    const month =
      criteria.month !== undefined
        ? String(criteria.month)
        : 'all';

    const year =
      criteria.year !== undefined
        ? String(criteria.year)
        : 'all';

    return list.filter(transaction => {
      // Type
      if (
        type !== 'all' &&
        transaction.type !== type
      ) {
        return false;
      }

      // Category
      if (
        category !== 'all' &&
        transaction.category !== category
      ) {
        return false;
      }

      // Date
      const parsed = bbTransactionsParseDate(transaction.date);

      if (!parsed) {
        return false;
      }

      // Month
      if (
        month !== 'all' &&
        String(parsed.monthIndex) !== month
      ) {
        return false;
      }

      // Year
      if (
        year !== 'all' &&
        String(parsed.year) !== year
      ) {
        return false;
      }

      // Search
      if (search) {
        const categoryText = String(
          transaction.category || ''
        ).toLowerCase();

        const descriptionText = String(
          transaction.description || ''
        ).toLowerCase();

        const dateText = String(
          transaction.date || ''
        ).toLowerCase();

        if (
          !categoryText.includes(search) &&
          !descriptionText.includes(search) &&
          !dateText.includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // ==========================================================================
  // 8. DASHBOARD SYNC
  // ==========================================================================

  /**
   * Transactions are the source of truth.
   *
   * Every save recalculates dashboard monthly income,
   * expenses and categories directly from transactions.
   */
  function bbTransactionsSyncWithDashboard(transactions) {
    try {
      const storedDashboard = localStorage.getItem(
        BB_DASHBOARD_STORAGE_KEY
      );

      if (!storedDashboard) {
        return;
      }

      const dashboardData = JSON.parse(storedDashboard);

      if (
        !dashboardData ||
        !dashboardData.months ||
        typeof dashboardData.months !== 'object'
      ) {
        return;
      }

      const monthlyTotals = {};

      transactions.forEach(transaction => {
        if (!transaction || !transaction.date) {
          return;
        }

        const parsed = bbTransactionsParseDate(
          transaction.date
        );

        if (!parsed) {
          return;
        }

        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        const key = `${parsed.year}-${parsed.monthIndex}`;

        if (!monthlyTotals[key]) {
          monthlyTotals[key] = {
            income: 0,
            expenses: 0,
            categories: {}
          };
        }

        const type = String(
          transaction.type || ''
        ).toLowerCase();

        if (type === 'income') {
          monthlyTotals[key].income += amount;
          return;
        }

        if (type === 'expense') {
          monthlyTotals[key].expenses += amount;

          const category = bbTransactionsNormalizeCategory(
            transaction.category
          );

          monthlyTotals[key].categories[category] =
            (monthlyTotals[key].categories[category] || 0) +
            amount;
        }
      });

      /*
       * First clear existing transaction-driven months.
       *
       * This is important when a user deletes the final transaction
       * from a month. Without clearing, old dashboard values would remain.
       */
      Object.keys(dashboardData.months).forEach(key => {
        const month = dashboardData.months[key];

        if (!month) {
          return;
        }

        month.income = 0;
        month.expenses = 0;
        month.categories = {};
      });

      /*
       * Apply calculated transaction totals.
       *
       * Existing dashboard month objects are preserved so other
       * dashboard metadata remains intact.
       */
      Object.keys(monthlyTotals).forEach(key => {
        if (!dashboardData.months[key]) {
          return;
        }

        dashboardData.months[key].income =
          monthlyTotals[key].income;

        dashboardData.months[key].expenses =
          monthlyTotals[key].expenses;

        dashboardData.months[key].categories =
          monthlyTotals[key].categories;
      });

      localStorage.setItem(
        BB_DASHBOARD_STORAGE_KEY,
        JSON.stringify(dashboardData)
      );

      window.dispatchEvent(
        new CustomEvent('bb:financial-data-updated', {
          detail: {
            source: 'transactions',
            transactionsCount: transactions.length
          }
        })
      );
    } catch (error) {
      console.warn(
        'BroBudget: Dashboard sync skipped.',
        error
      );
    }
  }

  function bbTransactionsNormalizeCategory(category) {
    const value = String(category || '')
      .trim()
      .toLowerCase();

    const aliases = {
      housing: 'rent',
      utilities: 'bills'
    };

    return aliases[value] || value || 'other';
  }

  // ==========================================================================
  // 9. VALIDATION
  // ==========================================================================

  function bbTransactionsValidate(formData) {
    const errors = {};

    const amountValue = formData.amount;

    if (
      amountValue === '' ||
      amountValue === null ||
      amountValue === undefined
    ) {
      errors.amount = 'Please enter a valid amount.';
    } else {
      const number = Number(amountValue);

      if (!Number.isFinite(number)) {
        errors.amount = 'Amount must be a numeric value.';
      } else if (number <= 0) {
        errors.amount = 'Amount must be greater than ₹0.';
      }
    }

    if (
      !formData.category ||
      String(formData.category).trim() === ''
    ) {
      errors.category = 'Please select a category.';
    }

    if (
      !formData.date ||
      String(formData.date).trim() === ''
    ) {
      errors.date = 'Please choose a transaction date.';
    } else if (!bbTransactionsParseDate(formData.date)) {
      errors.date = 'Please enter a valid date.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  function bbTransactionsShowErrors(errors = {}) {
    const fields = [
      'amount',
      'category',
      'date',
      'description'
    ];

    fields.forEach(field => {
      const input = document.getElementById(
        `bb-input-${field}`
      );

      const error = document.getElementById(
        `bb-error-${field}`
      );

      if (input) {
        input.classList.toggle(
          'bb-input-error',
          Boolean(errors[field])
        );
      }

      if (error) {
        error.textContent = errors[field] || '';

        error.classList.toggle(
          'bb-error-visible',
          Boolean(errors[field])
        );
      }
    });
  }

  // ==========================================================================
  // 10. CATEGORY HELPERS
  // ==========================================================================

  function bbTransactionsGetCategoryList(type) {
    return type === 'income'
      ? bbIncomeSources
      : bbExpenseCategories;
  }

  function bbTransactionsGetCategoryIcon(
    categoryName,
    type
  ) {
    const list = bbTransactionsGetCategoryList(type);

    const match = list.find(
      category =>
        category.name.toLowerCase() ===
        String(categoryName || '').toLowerCase()
    );

    if (match) {
      return match.icon;
    }

    return type === 'income' ? '💰' : '📦';
  }

  function bbTransactionsPopulateCategoryDropdown(
    type,
    selectedCategory = ''
  ) {
    const select = document.getElementById(
      'bb-input-category'
    );

    if (!select) {
      return;
    }

    select.innerHTML =
      '<option value="" disabled>Select a category...</option>';

    const categories =
      bbTransactionsGetCategoryList(type);

    categories.forEach(category => {
      const option = document.createElement('option');

      option.value = category.name;
      option.textContent =
        `${category.icon} ${category.name}`;

      if (
        selectedCategory &&
        selectedCategory.toLowerCase() ===
          category.name.toLowerCase()
      ) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    if (!selectedCategory) {
      select.selectedIndex = 0;
    }
  }

  function bbTransactionsPopulateFilterCategoryDropdown() {
    const select = document.getElementById(
      'bb-filter-category'
    );

    if (!select) {
      return;
    }

    select.innerHTML =
      '<option value="all">All Categories</option>';

    const incomeGroup =
      document.createElement('optgroup');

    incomeGroup.label = 'Income Sources';

    bbIncomeSources.forEach(category => {
      const option = document.createElement('option');

      option.value = category.name;
      option.textContent =
        `${category.icon} ${category.name}`;

      incomeGroup.appendChild(option);
    });

    select.appendChild(incomeGroup);

    const expenseGroup =
      document.createElement('optgroup');

    expenseGroup.label = 'Expense Categories';

    bbExpenseCategories.forEach(category => {
      const option = document.createElement('option');

      option.value = category.name;
      option.textContent =
        `${category.icon} ${category.name}`;

      expenseGroup.appendChild(option);
    });

    select.appendChild(expenseGroup);
  }

  // ==========================================================================
  // 11. RENDERING
  // ==========================================================================

  function bbTransactionsRender() {
    const filteredList =
      bbTransactionsFilter(
        bbTransactionsState.filters
      );

    const tableBody =
      document.getElementById('bb-table-body');

    const emptyState =
      document.getElementById(
        'bb-table-empty-state'
      );

    const table =
      document.getElementById(
        'bb-transactions-table'
      );

    // ------------------------------------------------------------------------
    // Metrics
    // ------------------------------------------------------------------------

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredList.forEach(transaction => {
      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount)) {
        return;
      }

      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += amount;
      }
    });

    const net = totalIncome - totalExpenses;

    const miniInflow =
      document.getElementById(
        'bb-mini-inflow-val'
      );

    const miniOutflow =
      document.getElementById(
        'bb-mini-outflow-val'
      );

    const miniNet =
      document.getElementById(
        'bb-mini-net-val'
      );

    const miniCount =
      document.getElementById(
        'bb-mini-count-val'
      );

    if (miniInflow) {
      miniInflow.textContent =
        `₹${totalIncome.toLocaleString('en-IN')}`;
    }

    if (miniOutflow) {
      miniOutflow.textContent =
        `₹${totalExpenses.toLocaleString('en-IN')}`;
    }

    if (miniNet) {
      const prefix = net < 0 ? '-₹' : '₹';

      miniNet.textContent =
        `${prefix}${Math.abs(net).toLocaleString('en-IN')}`;

      miniNet.style.color =
        net < 0
          ? 'var(--bb-color-expense-light)'
          : 'var(--bb-color-income-light)';
    }

    if (miniCount) {
      miniCount.textContent =
        String(filteredList.length);
    }

    // ------------------------------------------------------------------------
    // Table
    // ------------------------------------------------------------------------

    if (!tableBody) {
      return;
    }

    if (filteredList.length === 0) {
      tableBody.innerHTML = '';

      if (emptyState) {
        emptyState.style.display = 'flex';
      }

      if (table) {
        table.style.display = 'none';
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    if (table) {
      table.style.display = 'table';
    }

    let html = '';

    filteredList.forEach(transaction => {
      const isIncome =
        transaction.type === 'income';

      const icon =
        bbTransactionsGetCategoryIcon(
          transaction.category,
          transaction.type
        );

      const formattedDate =
        bbTransactionsFormatDate(
          transaction.date
        );

      const typeClass = isIncome
        ? 'bb-badge-type-income'
        : 'bb-badge-type-expense';

      const amountClass = isIncome
        ? 'bb-amount-income'
        : 'bb-amount-expense';

      const amountPrefix = isIncome
        ? '+₹'
        : '-₹';

      const amount =
        Number(transaction.amount) || 0;

      const description =
        transaction.description || '—';

      const safeDescription =
        bbTransactionsEscapeHtml(
          description
        );

      const safeCategory =
        bbTransactionsEscapeHtml(
          transaction.category
        );

      html += `
        <tr
          class="bb-row-enter"
          id="bb-tx-row-${transaction.id}"
        >
          <td data-label="Date">
            <span
              style="
                font-weight:600;
                color:var(--bb-text-secondary);
              "
            >
              ${formattedDate}
            </span>
          </td>

          <td data-label="Type">
            <span
              class="bb-table-badge-type ${typeClass}"
            >
              ${isIncome ? '💰 Inflow' : '💸 Outflow'}
            </span>
          </td>

          <td data-label="Category">
            <span class="bb-table-badge-cat">
              <span>${icon}</span>
              <span>${safeCategory}</span>
            </span>
          </td>

          <td data-label="Description">
            <span
              style="
                color:var(--bb-text-primary);
                font-weight:500;
              "
            >
              ${safeDescription}
            </span>
          </td>

          <td data-label="Amount">
            <span
              class="bb-table-amount ${amountClass}"
            >
              ${amountPrefix}${amount.toLocaleString('en-IN')}
            </span>
          </td>

          <td data-label="Actions">
            <div class="bb-table-actions">

              <button
                type="button"
                class="bb-table-btn-action bb-table-btn-edit"
                title="Edit Transaction"
                aria-label="Edit transaction"
                onclick="window.BBTransactions.openEdit(${Number(transaction.id)})"
              >
                ✏️
              </button>

              <button
                type="button"
                class="bb-table-btn-action bb-table-btn-delete"
                title="Delete Transaction"
                aria-label="Delete transaction"
                onclick="window.BBTransactions.openDelete(${Number(transaction.id)})"
              >
                🗑️
              </button>

            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  function bbTransactionsEscapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // 12. FORM
  // ==========================================================================

  function bbTransactionsSwitchFormType(type) {
    const normalizedType =
      type === 'income'
        ? 'income'
        : 'expense';

    bbTransactionsState.activeFormType =
      normalizedType;

    const expenseButton =
      document.getElementById(
        'bb-switch-btn-expense'
      );

    const incomeButton =
      document.getElementById(
        'bb-switch-btn-income'
      );

    const title =
      document.getElementById(
        'bb-form-title-text'
      );

    const submit =
      document.getElementById(
        'bb-form-submit-btn'
      );

    const editing =
      Boolean(
        bbTransactionsState.editingTransactionId
      );

    if (normalizedType === 'income') {
      if (incomeButton) {
        incomeButton.className =
          'bb-form-switcher-btn bb-switch-active-income';
      }

      if (expenseButton) {
        expenseButton.className =
          'bb-form-switcher-btn';
      }

      if (title) {
        title.textContent =
          editing
            ? 'Edit Income'
            : 'Record Income';
      }

      if (submit) {
        submit.className =
          'bb-form-submit-btn bb-submit-income';

        submit.textContent =
          editing
            ? 'Update Income'
            : 'Add Income';
      }
    } else {
      if (expenseButton) {
        expenseButton.className =
          'bb-form-switcher-btn bb-switch-active-expense';
      }

      if (incomeButton) {
        incomeButton.className =
          'bb-form-switcher-btn';
      }

      if (title) {
        title.textContent =
          editing
            ? 'Edit Expense'
            : 'Record Expense';
      }

      if (submit) {
        submit.className =
          'bb-form-submit-btn bb-submit-expense';

        submit.textContent =
          editing
            ? 'Update Expense'
            : 'Add Expense';
      }
    }

    bbTransactionsPopulateCategoryDropdown(
      normalizedType
    );

    bbTransactionsShowErrors({});
  }

  function bbTransactionsHandleFormSubmit(event) {
    event.preventDefault();

    const dateInput =
      document.getElementById(
        'bb-input-date'
      );

    const categoryInput =
      document.getElementById(
        'bb-input-category'
      );

    const descriptionInput =
      document.getElementById(
        'bb-input-description'
      );

    const amountInput =
      document.getElementById(
        'bb-input-amount'
      );

    const formData = {
      type:
        bbTransactionsState.activeFormType,

      date:
        dateInput
          ? dateInput.value
          : '',

      category:
        categoryInput
          ? categoryInput.value
          : '',

      description:
        descriptionInput
          ? descriptionInput.value.trim()
          : '',

      amount:
        amountInput
          ? amountInput.value
          : ''
    };

    const validation =
      bbTransactionsValidate(
        formData
      );

    if (!validation.isValid) {
      bbTransactionsShowErrors(
        validation.errors
      );

      const firstError =
        Object.keys(
          validation.errors
        )[0];

      const firstElement =
        document.getElementById(
          `bb-input-${firstError}`
        );

      if (firstElement) {
        firstElement.focus();
      }

      return;
    }

    bbTransactionsShowErrors({});

    if (
      bbTransactionsState.editingTransactionId
    ) {
      const updated =
        bbTransactionUpdate(
          bbTransactionsState.editingTransactionId,
          formData
        );

      if (updated) {
        bbTransactionsCancelEdit();
      }

      return;
    }

    const added =
      bbTransactionAdd(formData);

    if (!added) {
      return;
    }

    if (amountInput) {
      amountInput.value = '';
    }

    if (descriptionInput) {
      descriptionInput.value = '';
    }

    if (categoryInput) {
      categoryInput.selectedIndex = 0;
    }
  }

  function bbTransactionsOpenEdit(id) {
    const list =
      bbTransactionsGet();

    const target =
      list.find(
        transaction =>
          String(transaction.id) ===
          String(id)
      );

    if (!target) {
      return;
    }

    bbTransactionsState.editingTransactionId =
      target.id;

    bbTransactionsSwitchFormType(
      target.type
    );

    const dateInput =
      document.getElementById(
        'bb-input-date'
      );

    const categoryInput =
      document.getElementById(
        'bb-input-category'
      );

    const descriptionInput =
      document.getElementById(
        'bb-input-description'
      );

    const amountInput =
      document.getElementById(
        'bb-input-amount'
      );

    if (dateInput) {
      dateInput.value =
        target.date;
    }

    bbTransactionsPopulateCategoryDropdown(
      target.type,
      target.category
    );

    if (categoryInput) {
      categoryInput.value =
        target.category;
    }

    if (descriptionInput) {
      descriptionInput.value =
        target.description || '';
    }

    if (amountInput) {
      amountInput.value =
        target.amount;
    }

    const banner =
      document.getElementById(
        'bb-form-edit-banner'
      );

    const cancelButton =
      document.getElementById(
        'bb-form-cancel-btn'
      );

    if (banner) {
      banner.classList.add(
        'bb-banner-visible'
      );
    }

    if (cancelButton) {
      cancelButton.classList.add(
        'bb-cancel-visible'
      );
    }

    const formCard =
      document.getElementById(
        'bb-form-card'
      );

    if (formCard) {
      formCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  function bbTransactionsCancelEdit() {
    bbTransactionsState.editingTransactionId =
      null;

    const banner =
      document.getElementById(
        'bb-form-edit-banner'
      );

    const cancelButton =
      document.getElementById(
        'bb-form-cancel-btn'
      );

    if (banner) {
      banner.classList.remove(
        'bb-banner-visible'
      );
    }

    if (cancelButton) {
      cancelButton.classList.remove(
        'bb-cancel-visible'
      );
    }

    const amountInput =
      document.getElementById(
        'bb-input-amount'
      );

    const descriptionInput =
      document.getElementById(
        'bb-input-description'
      );

    if (amountInput) {
      amountInput.value = '';
    }

    if (descriptionInput) {
      descriptionInput.value = '';
    }

    bbTransactionsSwitchFormType(
      bbTransactionsState.activeFormType
    );

    bbTransactionsShowErrors({});
  }

  // ==========================================================================
  // 13. DELETE MODAL
  // ==========================================================================

  function bbTransactionsOpenDeleteModal(id) {
    const list =
      bbTransactionsGet();

    const target =
      list.find(
        transaction =>
          String(transaction.id) ===
          String(id)
      );

    if (!target) {
      return;
    }

    bbTransactionsState.pendingDeleteId =
      id;

    const modal =
      document.getElementById(
        'bb-delete-modal'
      );

    const details =
      document.getElementById(
        'bb-modal-delete-details'
      );

    if (details) {
      const amount =
        Number(target.amount) || 0;

      const safeCategory =
        bbTransactionsEscapeHtml(
          target.category
        );

      const safeDescription =
        bbTransactionsEscapeHtml(
          target.description || 'None'
        );

      details.innerHTML = `
        <strong>${String(target.type).toUpperCase()}:</strong>
        ₹${amount.toLocaleString('en-IN')}
        <br>

        <strong>Category:</strong>
        ${safeCategory}

        |

        <strong>Date:</strong>
        ${bbTransactionsFormatDate(target.date)}

        <br>

        <strong>Description:</strong>
        ${safeDescription}
      `;
    }

    if (modal) {
      modal.classList.add(
        'bb-modal-active'
      );
    }
  }

  function bbTransactionsConfirmDelete() {
    const id =
      bbTransactionsState.pendingDeleteId;

    if (
      id === null ||
      id === undefined
    ) {
      return;
    }

    const row =
      document.getElementById(
        `bb-tx-row-${id}`
      );

    if (row) {
      row.classList.add(
        'bb-row-delete-animate'
      );

      setTimeout(() => {
        bbTransactionDelete(id);
        bbTransactionsCloseDeleteModal();
      }, 250);
    } else {
      bbTransactionDelete(id);
      bbTransactionsCloseDeleteModal();
    }
  }

  function bbTransactionsCloseDeleteModal() {
    bbTransactionsState.pendingDeleteId =
      null;

    const modal =
      document.getElementById(
        'bb-delete-modal'
      );

    if (modal) {
      modal.classList.remove(
        'bb-modal-active'
      );
    }
  }

  // ==========================================================================
  // 14. FILTER SETUP
  // ==========================================================================

  function bbTransactionsSetupFilters() {
    const searchInput =
      document.getElementById(
        'bb-search-input'
      );

    const searchClear =
      document.getElementById(
        'bb-search-clear'
      );

    if (searchInput) {
      searchInput.addEventListener(
        'input',
        event => {
          bbTransactionsState.filters.search =
            event.target.value;

          if (searchClear) {
            searchClear.classList.toggle(
              'bb-clear-visible',
              event.target.value.length > 0
            );
          }

          bbTransactionsRender();
        }
      );
    }

    if (searchClear) {
      searchClear.addEventListener(
        'click',
        () => {
          if (searchInput) {
            searchInput.value = '';
          }

          bbTransactionsState.filters.search =
            '';

          searchClear.classList.remove(
            'bb-clear-visible'
          );

          bbTransactionsRender();

          if (searchInput) {
            searchInput.focus();
          }
        }
      );
    }

    // Type buttons
    const typeButtons =
      document.querySelectorAll(
        '.bb-filter-type-btn'
      );

    typeButtons.forEach(button => {
      button.addEventListener(
        'click',
        () => {
          typeButtons.forEach(item => {
            item.classList.remove(
              'bb-filter-type-active'
            );
          });

          button.classList.add(
            'bb-filter-type-active'
          );

          bbTransactionsState.filters.type =
            button.getAttribute(
              'data-type'
            ) || 'all';

          bbTransactionsRender();
        }
      );
    });

    // Category
    const categoryFilter =
      document.getElementById(
        'bb-filter-category'
      );

    if (categoryFilter) {
      categoryFilter.addEventListener(
        'change',
        event => {
          bbTransactionsState.filters.category =
            event.target.value;

          bbTransactionsRender();
        }
      );
    }

    // Month
    const monthFilter =
      document.getElementById(
        'bb-filter-month'
      );

    if (monthFilter) {
      monthFilter.innerHTML =
        '<option value="all">All Months</option>';

      bbMonthNames.forEach(
        (month, index) => {
          const option =
            document.createElement(
              'option'
            );

          option.value = index;
          option.textContent = month;

          monthFilter.appendChild(
            option
          );
        }
      );

      monthFilter.addEventListener(
        'change',
        event => {
          bbTransactionsState.filters.month =
            event.target.value;

          bbTransactionsRender();
        }
      );
    }

    // Reset
    const resetButton =
      document.getElementById(
        'bb-btn-reset-filters'
      );

    if (resetButton) {
      resetButton.addEventListener(
        'click',
        () => {
          bbTransactionsState.filters = {
            search: '',
            type: 'all',
            category: 'all',
            month: 'all',
            year: 'all'
          };

          if (searchInput) {
            searchInput.value = '';
          }

          if (searchClear) {
            searchClear.classList.remove(
              'bb-clear-visible'
            );
          }

          typeButtons.forEach(button => {
            button.classList.toggle(
              'bb-filter-type-active',
              button.getAttribute(
                'data-type'
              ) === 'all'
            );
          });

          if (categoryFilter) {
            categoryFilter.value = 'all';
          }

          if (monthFilter) {
            monthFilter.value = 'all';
          }

          bbTransactionsRender();

          bbTransactionsShowToast(
            'Filters Reset',
            'Showing all transactions.',
            '🔄'
          );
        }
      );
    }
  }

  // ==========================================================================
  // 15. TOAST
  // ==========================================================================

  function bbTransactionsShowToast(
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
      title;

    const messageElement =
      document.createElement('div');

    messageElement.className =
      'bb-toast-desc';

    messageElement.textContent =
      message;

    const closeButton =
      document.createElement('button');

    closeButton.type = 'button';
    closeButton.className =
      'bb-toast-close-btn';
    closeButton.setAttribute(
      'aria-label',
      'Close notification'
    );
    closeButton.innerHTML = '&times;';

    body.appendChild(
      titleElement
    );

    body.appendChild(
      messageElement
    );

    toast.appendChild(
      iconElement
    );

    toast.appendChild(
      body
    );

    toast.appendChild(
      closeButton
    );

    container.appendChild(
      toast
    );

    requestAnimationFrame(() => {
      toast.classList.add(
        'bb-toast-visible'
      );
    });

    let dismissed = false;

    const dismiss = () => {
      if (dismissed) {
        return;
      }

      dismissed = true;

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

  // ==========================================================================
  // 16. CROSS-TAB STORAGE SYNC
  // ==========================================================================

  function bbTransactionsSetupStorageSync() {
    window.addEventListener(
      'storage',
      event => {
        if (
          event.key !==
          BB_TRANSACTIONS_STORAGE_KEY
        ) {
          return;
        }

        try {
          const parsed =
            event.newValue
              ? JSON.parse(
                  event.newValue
                )
              : [];

          if (Array.isArray(parsed)) {
            bbTransactionsState.transactions =
              parsed;

            bbTransactionsRender();
          }
        } catch (error) {
          console.warn(
            'BroBudget: Unable to sync transaction storage event.',
            error
          );
        }
      }
    );
  }

  // ==========================================================================
  // 17. INITIALIZATION
  // ==========================================================================

  function bbTransactionsInit() {
    if (bbTransactionsInitialized) {
      return;
    }

    bbTransactionsInitialized = true;

    // Load transactions
    bbTransactionsState.transactions =
      bbTransactionsGet();

    // Default date
    const dateInput =
      document.getElementById(
        'bb-input-date'
      );

    if (
      dateInput &&
      !dateInput.value
    ) {
      dateInput.value =
        bbTransactionsGetCurrentDateString();
    }

    // Dropdowns
    bbTransactionsPopulateCategoryDropdown(
      bbTransactionsState.activeFormType
    );

    bbTransactionsPopulateFilterCategoryDropdown();

    // Filters
    bbTransactionsSetupFilters();

    // Storage sync
    bbTransactionsSetupStorageSync();

    // Form switch buttons
    const expenseButton =
      document.getElementById(
        'bb-switch-btn-expense'
      );

    const incomeButton =
      document.getElementById(
        'bb-switch-btn-income'
      );

    if (expenseButton) {
      expenseButton.addEventListener(
        'click',
        () =>
          bbTransactionsSwitchFormType(
            'expense'
          )
      );
    }

    if (incomeButton) {
      incomeButton.addEventListener(
        'click',
        () =>
          bbTransactionsSwitchFormType(
            'income'
          )
      );
    }

    // Form submit
    const form =
      document.getElementById(
        'bb-transaction-form'
      );

    if (form) {
      form.addEventListener(
        'submit',
        bbTransactionsHandleFormSubmit
      );
    }

    // Cancel edit
    const cancelButton =
      document.getElementById(
        'bb-form-cancel-btn'
      );

    if (cancelButton) {
      cancelButton.addEventListener(
        'click',
        bbTransactionsCancelEdit
      );
    }

    // Delete modal
    const confirmDelete =
      document.getElementById(
        'bb-modal-btn-confirm-delete'
      );

    const cancelDelete =
      document.getElementById(
        'bb-modal-btn-cancel-delete'
      );

    const modal =
      document.getElementById(
        'bb-delete-modal'
      );

    if (confirmDelete) {
      confirmDelete.addEventListener(
        'click',
        bbTransactionsConfirmDelete
      );
    }

    if (cancelDelete) {
      cancelDelete.addEventListener(
        'click',
        bbTransactionsCloseDeleteModal
      );
    }

    if (modal) {
      modal.addEventListener(
        'click',
        event => {
          if (
            event.target === modal
          ) {
            bbTransactionsCloseDeleteModal();
          }
        }
      );
    }

    // Escape
    window.addEventListener(
      'keydown',
      event => {
        if (event.key !== 'Escape') {
          return;
        }

        bbTransactionsCloseDeleteModal();

        if (
          bbTransactionsState.editingTransactionId
        ) {
          bbTransactionsCancelEdit();
        }
      }
    );

    // Initial render
    bbTransactionsRender();
  }

  // ==========================================================================
  // 18. PUBLIC API
  // ==========================================================================

  window.BBTransactions = {
    version: '2.0.0',

    module:
      'Income & Expense Management',

    get:
      bbTransactionsGet,

    save:
      bbTransactionsSave,

    add:
      bbTransactionAdd,

    update:
      bbTransactionUpdate,

    delete:
      bbTransactionDelete,

    filter:
      bbTransactionsFilter,

    openEdit:
      bbTransactionsOpenEdit,

    openDelete:
      bbTransactionsOpenDeleteModal,

    cancelEdit:
      bbTransactionsCancelEdit,

    refresh:
      bbTransactionsRender,

    switchType:
      bbTransactionsSwitchFormType,

    getState: () => ({
      ...bbTransactionsState,
      transactions:
        bbTransactionsState.transactions.slice()
    })
  };

  // Global compatibility functions
  window.bbTransactionsGet =
    bbTransactionsGet;

  window.bbTransactionsSave =
    bbTransactionsSave;

  window.bbTransactionAdd =
    bbTransactionAdd;

  window.bbTransactionUpdate =
    bbTransactionUpdate;

  window.bbTransactionDelete =
    bbTransactionDelete;

  window.bbTransactionsFilter =
    bbTransactionsFilter;

  // ==========================================================================
  // 19. DOM READY
  // ==========================================================================

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      bbTransactionsInit,
      { once: true }
    );
  } else {
    bbTransactionsInit();
  }

})();
