/**
 * ============================================================================
 * BroBudget - Income & Expense Management
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

  // --------------------------------------------------------------------------
  // 1. Constants
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // 2. State
  // --------------------------------------------------------------------------

  let bbTransactionsState = {
    transactions: [],
    activeFormType: 'expense',
    editingTransactionId: null,
    pendingDeleteId: null,
    initialized: false,
    filters: {
      search: '',
      type: 'all',
      category: 'all',
      month: 'all',
      year: 'all'
    }
  };

  // --------------------------------------------------------------------------
  // 3. Helpers
  // --------------------------------------------------------------------------

  function bbTransactionsEscapeHtml(value) {
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

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function bbTransactionsIsValidDate(dateString) {
    return !!bbTransactionsParseDate(dateString);
  }

  function bbTransactionsGetTodayString() {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  function bbTransactionsFormatDate(dateString) {
    const date = bbTransactionsParseDate(dateString);

    if (!date) {
      return dateString || '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = bbMonthNames[date.getMonth()].substring(0, 3);
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  function bbTransactionsFormatCurrency(amount) {
    const value = Number(amount) || 0;

    return `₹${Math.abs(value).toLocaleString('en-IN')}`;
  }

  function bbTransactionsNormalizeType(type) {
    return type === 'income' ? 'income' : 'expense';
  }

  function bbTransactionsNormalizeAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return Math.round(value * 100) / 100;
  }

  // --------------------------------------------------------------------------
  // 4. Seed Data
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // 5. LocalStorage
  // --------------------------------------------------------------------------

  function bbTransactionsGet() {
    try {
      const stored = localStorage.getItem(
        BB_TRANSACTIONS_STORAGE_KEY
      );

      /*
       * Important:
       * null = first-ever visit → create demo transactions.
       * []   = user deliberately has no transactions → keep it empty.
       */
      if (stored === null) {
        const seed = bbTransactionsGetInitialSeed();
        bbTransactionsWriteStorage(seed);
        return seed;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      return [];
    } catch (error) {
      console.warn(
        'BroBudget: Unable to read transactions.',
        error
      );

      return [];
    }
  }

  function bbTransactionsWriteStorage(transactions) {
    localStorage.setItem(
      BB_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions)
    );
  }

  function bbTransactionsSave(transactions) {
    const safeTransactions = Array.isArray(transactions)
      ? transactions
      : [];

    try {
      bbTransactionsWriteStorage(safeTransactions);

      bbTransactionsState.transactions = safeTransactions;

      /*
       * Dashboard receives the same transaction source.
       * Analytics also reads the transaction store directly.
       */
      bbTransactionsSyncWithDashboard(safeTransactions);

      window.dispatchEvent(
        new CustomEvent('bb:transactions-updated', {
          detail: {
            transactions: safeTransactions,
            transactionsCount: safeTransactions.length
          }
        })
      );

      window.dispatchEvent(
        new CustomEvent('bb:financial-data-updated', {
          detail: {
            source: 'transactions',
            transactionsCount: safeTransactions.length
          }
        })
      );
    } catch (error) {
      console.error(
        'BroBudget: Failed to save transactions.',
        error
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. Dashboard Synchronization
  // --------------------------------------------------------------------------

  function bbTransactionsGetDashboardStorage() {
    try {
      const stored = localStorage.getItem(
        BB_DASHBOARD_STORAGE_KEY
      );

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      if (!parsed.months || typeof parsed.months !== 'object') {
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn(
        'BroBudget: Unable to read dashboard data.',
        error
      );

      return null;
    }
  }

  function bbTransactionsSyncWithDashboard(transactions) {
    try {
      const dashboardData =
        bbTransactionsGetDashboardStorage();

      if (!dashboardData) {
        return;
      }

      const monthlyTotals = {};

      transactions.forEach((transaction) => {
        if (!transaction || !transaction.date) {
          return;
        }

        const parsedDate =
          bbTransactionsParseDate(transaction.date);

        if (!parsedDate) {
          return;
        }

        const year = parsedDate.getFullYear();
        const month = parsedDate.getMonth();

        const key = `${year}-${month}`;

        if (!monthlyTotals[key]) {
          monthlyTotals[key] = {
            income: 0,
            expenses: 0,
            categories: {},
            transactionsCount: 0
          };
        }

        const amount =
          bbTransactionsNormalizeAmount(transaction.amount);

        if (amount <= 0) {
          return;
        }

        monthlyTotals[key].transactionsCount += 1;

        if (transaction.type === 'income') {
          monthlyTotals[key].income += amount;
        } else {
          monthlyTotals[key].expenses += amount;

          const category =
            bbTransactionsCanonicalExpenseCategory(
              transaction.category
            );

          monthlyTotals[key].categories[category] =
            (monthlyTotals[key].categories[category] || 0) +
            amount;
        }
      });

      Object.keys(monthlyTotals).forEach((key) => {
        if (!dashboardData.months[key]) {
          return;
        }

        const totals = monthlyTotals[key];
        const monthData = dashboardData.months[key];

        monthData.income = totals.income;
        monthData.expenses = totals.expenses;
        monthData.savings =
          totals.income - totals.expenses;

        monthData.savingsPercentage =
          totals.income > 0
            ? Number(
                (
                  (monthData.savings / totals.income) *
                  100
                ).toFixed(1)
              )
            : 0;

        monthData.expensePercentage =
          totals.income > 0
            ? Number(
                (
                  (totals.expenses / totals.income) *
                  100
                ).toFixed(1)
              )
            : 0;

        monthData.transactionsCount =
          totals.transactionsCount;

        monthData.categories = totals.categories;
      });

      localStorage.setItem(
        BB_DASHBOARD_STORAGE_KEY,
        JSON.stringify(dashboardData)
      );
    } catch (error) {
      console.warn(
        'BroBudget: Dashboard synchronization skipped.',
        error
      );
    }
  }

  // --------------------------------------------------------------------------
  // 7. Category Normalization
  // --------------------------------------------------------------------------

  function bbTransactionsCanonicalExpenseCategory(
    category
  ) {
    const value = String(category || '')
      .trim()
      .toLowerCase();

    const map = {
      food: 'food',
      rent: 'rent',
      housing: 'rent',
      transport: 'transport',
      transportation: 'transport',
      shopping: 'shopping',
      education: 'education',
      entertainment: 'entertainment',
      health: 'health',
      bills: 'bills',
      bill: 'bills',
      utilities: 'bills',
      other: 'other'
    };

    return map[value] || 'other';
  }

  // --------------------------------------------------------------------------
  // 8. Add / Update / Delete
  // --------------------------------------------------------------------------

  function bbTransactionAdd(transaction) {
    const list = bbTransactionsGet();

    const amount =
      bbTransactionsNormalizeAmount(transaction.amount);

    const newTransaction = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: bbTransactionsNormalizeType(transaction.type),
      category: String(transaction.category || 'Other'),
      description: String(transaction.description || '').trim(),
      amount,
      date: transaction.date
    };

    list.unshift(newTransaction);

    bbTransactionsSave(list);
    bbTransactionsRender();

    bbTransactionsShowToast(
      'Transaction Added',
      `Successfully recorded ${newTransaction.type} of ${bbTransactionsFormatCurrency(
        newTransaction.amount
      )}.`,
      '✅'
    );

    return newTransaction;
  }

  function bbTransactionUpdate(id, updatedData) {
    const list = bbTransactionsGet();

    const index = list.findIndex(
      (transaction) =>
        String(transaction.id) === String(id)
    );

    if (index === -1) {
      console.error(
        `Transaction with ID ${id} not found.`
      );
      return null;
    }

    const updatedTransaction = {
      ...list[index],
      type: bbTransactionsNormalizeType(
        updatedData.type
      ),
      category: String(
        updatedData.category || 'Other'
      ),
      description: String(
        updatedData.description || ''
      ).trim(),
      amount: bbTransactionsNormalizeAmount(
        updatedData.amount
      ),
      date: updatedData.date
    };

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
      (transaction) =>
        String(transaction.id) === String(id)
    );

    if (!target) {
      return false;
    }

    const filtered = list.filter(
      (transaction) =>
        String(transaction.id) !== String(id)
    );

    bbTransactionsSave(filtered);
    bbTransactionsRender();

    bbTransactionsShowToast(
      'Transaction Deleted',
      `Removed ${target.category} (${target.type}).`,
      '🗑️'
    );

    return true;
  }

  // --------------------------------------------------------------------------
  // 9. Filtering
  // --------------------------------------------------------------------------

  function bbTransactionsFilter(criteria = {}) {
    const list =
      bbTransactionsState.transactions ||
      bbTransactionsGet();

    const search =
      String(criteria.search || '')
        .trim()
        .toLowerCase();

    const type =
      criteria.type || 'all';

    const category =
      criteria.category || 'all';

    const month =
      criteria.month !== undefined
        ? String(criteria.month)
        : 'all';

    const year =
      criteria.year !== undefined
        ? String(criteria.year)
        : 'all';

    return list.filter((transaction) => {
      if (
        type !== 'all' &&
        transaction.type !== type
      ) {
        return false;
      }

      if (
        category !== 'all' &&
        transaction.category !== category
      ) {
        return false;
      }

      const date =
        bbTransactionsParseDate(transaction.date);

      if (!date) {
        return false;
      }

      if (
        month !== 'all' &&
        String(date.getMonth()) !== month
      ) {
        return false;
      }

      if (
        year !== 'all' &&
        String(date.getFullYear()) !== year
      ) {
        return false;
      }

      if (search) {
        const categoryText =
          String(transaction.category || '')
            .toLowerCase();

        const descriptionText =
          String(transaction.description || '')
            .toLowerCase();

        const dateText =
          String(transaction.date || '')
            .toLowerCase();

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

  // --------------------------------------------------------------------------
  // 10. Validation
  // --------------------------------------------------------------------------

  function bbTransactionsValidate(formData) {
    const errors = {};

    const amountValue = formData.amount;

    if (
      amountValue === '' ||
      amountValue === null ||
      amountValue === undefined
    ) {
      errors.amount =
        'Please enter a valid amount.';
    } else {
      const amount = Number(amountValue);

      if (!Number.isFinite(amount)) {
        errors.amount =
          'Amount must be a numeric value.';
      } else if (amount <= 0) {
        errors.amount =
          'Amount must be greater than ₹0.';
      }
    }

    if (
      !formData.category ||
      !String(formData.category).trim()
    ) {
      errors.category =
        'Please select a category.';
    }

    if (
      !formData.date ||
      !String(formData.date).trim()
    ) {
      errors.date =
        'Please choose a transaction date.';
    } else if (
      !bbTransactionsIsValidDate(formData.date)
    ) {
      errors.date =
        'Please enter a valid date.';
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

    fields.forEach((field) => {
      const input =
        document.getElementById(
          `bb-input-${field}`
        );

      const error =
        document.getElementById(
          `bb-error-${field}`
        );

      if (input) {
        input.classList.toggle(
          'bb-input-error',
          !!errors[field]
        );
      }

      if (error) {
        error.textContent =
          errors[field] || '';

        error.classList.toggle(
          'bb-error-visible',
          !!errors[field]
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 11. Category Dropdowns
  // --------------------------------------------------------------------------

  function bbTransactionsGetCategoryList(type) {
    return type === 'income'
      ? bbIncomeSources
      : bbExpenseCategories;
  }

  function bbTransactionsGetCategoryIcon(
    categoryName,
    type
  ) {
    const list =
      bbTransactionsGetCategoryList(type);

    const target =
      String(categoryName || '')
        .toLowerCase();

    const match = list.find(
      (category) =>
        category.name.toLowerCase() === target
    );

    if (match) {
      return match.icon;
    }

    return type === 'income'
      ? '💰'
      : '📦';
  }

  function bbTransactionsPopulateCategoryDropdown(
    type,
    selectedCategory = ''
  ) {
    const select =
      document.getElementById(
        'bb-input-category'
      );

    if (!select) {
      return;
    }

    select.innerHTML = '';

    const placeholder =
      document.createElement('option');

    placeholder.value = '';
    placeholder.textContent =
      'Select a category...';
    placeholder.disabled = true;

    if (!selectedCategory) {
      placeholder.selected = true;
    }

    select.appendChild(placeholder);

    const categories =
      bbTransactionsGetCategoryList(type);

    categories.forEach((category) => {
      const option =
        document.createElement('option');

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
  }

  function bbTransactionsPopulateFilterCategoryDropdown() {
    const select =
      document.getElementById(
        'bb-filter-category'
      );

    if (!select) {
      return;
    }

    select.innerHTML =
      '<option value="all">All Categories</option>';

    const incomeGroup =
      document.createElement('optgroup');

    incomeGroup.label =
      'Income Sources';

    bbIncomeSources.forEach((category) => {
      const option =
        document.createElement('option');

      option.value = category.name;
      option.textContent =
        `${category.icon} ${category.name}`;

      incomeGroup.appendChild(option);
    });

    select.appendChild(incomeGroup);

    const expenseGroup =
      document.createElement('optgroup');

    expenseGroup.label =
      'Expense Categories';

    bbExpenseCategories.forEach((category) => {
      const option =
        document.createElement('option');

      option.value = category.name;
      option.textContent =
        `${category.icon} ${category.name}`;

      expenseGroup.appendChild(option);
    });

    select.appendChild(expenseGroup);
  }

  // --------------------------------------------------------------------------
  // 12. Rendering
  // --------------------------------------------------------------------------

  function bbTransactionsRender() {
    const filteredList =
      bbTransactionsFilter(
        bbTransactionsState.filters
      );

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredList.forEach((transaction) => {
      const amount =
        bbTransactionsNormalizeAmount(
          transaction.amount
        );

      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    const netBalance =
      totalIncome - totalExpenses;

    const miniIncome =
      document.getElementById(
        'bb-mini-inflow-val'
      );

    const miniExpenses =
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

    if (miniIncome) {
      miniIncome.textContent =
        bbTransactionsFormatCurrency(
          totalIncome
        );
    }

    if (miniExpenses) {
      miniExpenses.textContent =
        bbTransactionsFormatCurrency(
          totalExpenses
        );
    }

    if (miniNet) {
      miniNet.textContent =
        `${netBalance < 0 ? '-₹' : '₹'}${Math.abs(
          netBalance
        ).toLocaleString('en-IN')}`;

      miniNet.style.color =
        netBalance < 0
          ? 'var(--bb-color-expense-light)'
          : 'var(--bb-color-income-light)';
    }

    if (miniCount) {
      miniCount.textContent =
        filteredList.length;
    }

    const tableBody =
      document.getElementById(
        'bb-table-body'
      );

    const emptyState =
      document.getElementById(
        'bb-table-empty-state'
      );

    const table =
      document.getElementById(
        'bb-transactions-table'
      );

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

    const html =
      filteredList.map((transaction) => {
        const isIncome =
          transaction.type === 'income';

        const icon =
          bbTransactionsGetCategoryIcon(
            transaction.category,
            transaction.type
          );

        const amount =
          bbTransactionsNormalizeAmount(
            transaction.amount
          );

        const description =
          bbTransactionsEscapeHtml(
            transaction.description || '—'
          );

        const category =
          bbTransactionsEscapeHtml(
            transaction.category || 'Other'
          );

        const formattedDate =
          bbTransactionsFormatDate(
            transaction.date
          );

        return `
          <tr
            class="bb-row-enter"
            id="bb-tx-row-${bbTransactionsEscapeHtml(
              transaction.id
            )}"
          >
            <td data-label="Date">
              <span style="font-weight:600;color:var(--bb-text-secondary);">
                ${formattedDate}
              </span>
            </td>

            <td data-label="Type">
              <span class="bb-table-badge-type ${
                isIncome
                  ? 'bb-badge-type-income'
                  : 'bb-badge-type-expense'
              }">
                ${isIncome ? '💰 Inflow' : '💸 Outflow'}
              </span>
            </td>

            <td data-label="Category">
              <span class="bb-table-badge-cat">
                <span>${icon}</span>
                <span>${category}</span>
              </span>
            </td>

            <td data-label="Description">
              <span style="color:var(--bb-text-primary);font-weight:500;">
                ${description}
              </span>
            </td>

            <td data-label="Amount">
              <span class="bb-table-amount ${
                isIncome
                  ? 'bb-amount-income'
                  : 'bb-amount-expense'
              }">
                ${isIncome ? '+' : '-'}₹${amount.toLocaleString(
                  'en-IN'
                )}
              </span>
            </td>

            <td data-label="Actions">
              <div class="bb-table-actions">
                <button
                  type="button"
                  class="bb-table-btn-action bb-table-btn-edit"
                  title="Edit Transaction"
                  aria-label="Edit transaction"
                  onclick="window.BBTransactions.openEdit(${JSON.stringify(
                    transaction.id
                  )})"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  class="bb-table-btn-action bb-table-btn-delete"
                  title="Delete Transaction"
                  aria-label="Delete transaction"
                  onclick="window.BBTransactions.openDelete(${JSON.stringify(
                    transaction.id
                  )})"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    tableBody.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // 13. Form Type Switching
  // --------------------------------------------------------------------------

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

    const submitButton =
      document.getElementById(
        'bb-form-submit-btn'
      );

    const editing =
      !!bbTransactionsState.editingTransactionId;

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

      if (submitButton) {
        submitButton.className =
          'bb-form-submit-btn bb-submit-income';

        submitButton.textContent =
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

      if (submitButton) {
        submitButton.className =
          'bb-form-submit-btn bb-submit-expense';

        submitButton.textContent =
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

  // --------------------------------------------------------------------------
  // 14. Form Submit
  // --------------------------------------------------------------------------

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

    if (
      !dateInput ||
      !categoryInput ||
      !descriptionInput ||
      !amountInput
    ) {
      return;
    }

    const formData = {
      type:
        bbTransactionsState.activeFormType,

      date: dateInput.value,

      category:
        categoryInput.value,

      description:
        descriptionInput.value.trim(),

      amount:
        amountInput.value
    };

    const validation =
      bbTransactionsValidate(formData);

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
      bbTransactionUpdate(
        bbTransactionsState.editingTransactionId,
        formData
      );

      bbTransactionsCancelEdit();
    } else {
      bbTransactionAdd(formData);

      amountInput.value = '';
      descriptionInput.value = '';

      if (categoryInput) {
        categoryInput.selectedIndex = 0;
      }

      amountInput.focus();
    }
  }

  // --------------------------------------------------------------------------
  // 15. Edit
  // --------------------------------------------------------------------------

  function bbTransactionsOpenEdit(id) {
    const list =
      bbTransactionsGet();

    const target =
      list.find(
        (transaction) =>
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
        target.date || '';
    }

    bbTransactionsPopulateCategoryDropdown(
      target.type,
      target.category
    );

    if (descriptionInput) {
      descriptionInput.value =
        target.description || '';
    }

    if (amountInput) {
      amountInput.value =
        target.amount || '';
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

    const dateInput =
      document.getElementById(
        'bb-input-date'
      );

    if (amountInput) {
      amountInput.value = '';
    }

    if (descriptionInput) {
      descriptionInput.value = '';
    }

    if (
      dateInput &&
      !dateInput.value
    ) {
      dateInput.value =
        bbTransactionsGetTodayString();
    }

    bbTransactionsSwitchFormType(
      bbTransactionsState.activeFormType
    );

    bbTransactionsShowErrors({});
  }

  // --------------------------------------------------------------------------
  // 16. Delete Modal
  // --------------------------------------------------------------------------

  function bbTransactionsOpenDeleteModal(id) {
    const list =
      bbTransactionsGet();

    const target =
      list.find(
        (transaction) =>
          String(transaction.id) ===
          String(id)
      );

    if (!target) {
      return;
    }

    bbTransactionsState.pendingDeleteId =
      target.id;

    const details =
      document.getElementById(
        'bb-modal-delete-details'
      );

    if (details) {
      const safeType =
        target.type === 'income'
          ? 'INCOME'
          : 'EXPENSE';

      const safeCategory =
        bbTransactionsEscapeHtml(
          target.category
        );

      const safeDescription =
        bbTransactionsEscapeHtml(
          target.description || 'None'
        );

      details.innerHTML = `
        <strong>${safeType}:</strong>
        ${bbTransactionsFormatCurrency(
          target.amount
        )}<br>

        <strong>Category:</strong>
        ${safeCategory}
        |
        <strong>Date:</strong>
        ${bbTransactionsFormatDate(
          target.date
        )}<br>

        <strong>Description:</strong>
        ${safeDescription}
      `;
    }

    const modal =
      document.getElementById(
        'bb-delete-modal'
      );

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

  // --------------------------------------------------------------------------
  // 17. Filters
  // --------------------------------------------------------------------------

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
        (event) => {
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

            bbTransactionsState.filters.search =
              '';

            searchClear.classList.remove(
              'bb-clear-visible'
            );

            bbTransactionsRender();
            searchInput.focus();
          }
        }
      );
    }

    const typeButtons =
      document.querySelectorAll(
        '.bb-filter-type-btn'
      );

    typeButtons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          typeButtons.forEach(
            (item) =>
              item.classList.remove(
                'bb-filter-type-active'
              )
          );

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

    const categoryFilter =
      document.getElementById(
        'bb-filter-category'
      );

    if (categoryFilter) {
      categoryFilter.addEventListener(
        'change',
        (event) => {
          bbTransactionsState.filters.category =
            event.target.value;

          bbTransactionsRender();
        }
      );
    }

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

          option.value = String(index);
          option.textContent = month;

          monthFilter.appendChild(
            option
          );
        }
      );

      monthFilter.addEventListener(
        'change',
        (event) => {
          bbTransactionsState.filters.month =
            event.target.value;

          bbTransactionsRender();
        }
      );
    }

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

          typeButtons.forEach(
            (button) => {
              const buttonType =
                button.getAttribute(
                  'data-type'
                ) || 'all';

              button.classList.toggle(
                'bb-filter-type-active',
                buttonType === 'all'
              );
            }
          );

          if (categoryFilter) {
            categoryFilter.value =
              'all';
          }

          if (monthFilter) {
            monthFilter.value =
              'all';
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

  // --------------------------------------------------------------------------
  // 18. Toast
  // --------------------------------------------------------------------------

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

    iconElement.textContent = icon;

    const body =
      document.createElement('div');

    body.className =
      'bb-toast-body';

    const titleElement =
      document.createElement('div');

    titleElement.className =
      'bb-toast-title';

    titleElement.textContent =
      title || '';

    const messageElement =
      document.createElement('div');

    messageElement.className =
      'bb-toast-desc';

    messageElement.textContent =
      message || '';

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

  // --------------------------------------------------------------------------
  // 19. Initialization
  // --------------------------------------------------------------------------

  function bbTransactionsInit() {
    if (
      bbTransactionsState.initialized
    ) {
      return;
    }

    bbTransactionsState.initialized =
      true;

    bbTransactionsState.transactions =
      bbTransactionsGet();

    const dateInput =
      document.getElementById(
        'bb-input-date'
      );

    if (
      dateInput &&
      !dateInput.value
    ) {
      dateInput.value =
        bbTransactionsGetTodayString();
    }

    bbTransactionsPopulateCategoryDropdown(
      bbTransactionsState.activeFormType
    );

    bbTransactionsPopulateFilterCategoryDropdown();

    bbTransactionsSetupFilters();

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
        (event) => {
          if (
            event.target === modal
          ) {
            bbTransactionsCloseDeleteModal();
          }
        }
      );
    }

    /*
     * Escape closes the delete modal.
     */
    window.addEventListener(
      'keydown',
      (event) => {
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

    /*
     * If another page/tab changes the transaction store,
     * refresh this page.
     */
    window.addEventListener(
      'storage',
      (event) => {
        if (
          event.key ===
          BB_TRANSACTIONS_STORAGE_KEY
        ) {
          bbTransactionsState.transactions =
            bbTransactionsGet();

          bbTransactionsRender();
        }
      }
    );

    bbTransactionsRender();
  }

  // --------------------------------------------------------------------------
  // 20. Public API
  // --------------------------------------------------------------------------

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

    getState:
      () => ({
        ...bbTransactionsState,
        filters: {
          ...bbTransactionsState.filters
        },
        transactions: [
          ...bbTransactionsState.transactions
        ]
      })
  };

  // Exact global function names retained.
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

  // --------------------------------------------------------------------------
  // 21. Start
  // --------------------------------------------------------------------------

  if (
    document.readyState === 'loading'
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
