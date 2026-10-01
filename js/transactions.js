/**
 * ============================================================================
 * BroBudget - Income & Expense Management Module
 * Developer 2 (Transactions CRUD, Filtering, Search, LocalStorage)
 * 
 * GitHub Team Architecture Guidelines:
 * - All function names prefixed with `bbTransactions`
 * - Modular design with zero dependencies
 * - Shared LocalStorage schema for seamless merge with Developer 1 & 3
 * - Public API exported at `window.BBTransactions`
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Configuration
  // --------------------------------------------------------------------------
  const BB_TRANSACTIONS_STORAGE_KEY = 'brobudget_transactions_v1';
  const BB_DASHBOARD_STORAGE_KEY = 'brobudget_financial_data_v1';

  // Expense Categories with Icons
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

  // Income Sources with Icons
  const bbIncomeSources = [
    { id: 'Salary', name: 'Salary', icon: '💼' },
    { id: 'Freelance', name: 'Freelance', icon: '💻' },
    { id: 'Bonus', name: 'Bonus', icon: '🎁' },
    { id: 'Investment', name: 'Investment', icon: '📈' },
    { id: 'Other', name: 'Other', icon: '💰' }
  ];

  const bbMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------
  let bbTransactionsState = {
    transactions: [],
    activeFormType: 'expense', // 'expense' | 'income'
    editingTransactionId: null,
    pendingDeleteId: null,
    filters: {
      search: '',
      type: 'all', // 'all' | 'income' | 'expense'
      category: 'all',
      month: 'all' // 'all' | '0'...'11'
    }
  };

  // --------------------------------------------------------------------------
  // 3. Initial Seed Data (Realistic Transactions)
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
  // 4. Reusable Core Functions (Prompt Required API)
  // --------------------------------------------------------------------------
  
  /**
   * Retrieves all transactions from LocalStorage
   */
  function bbTransactionsGet() {
    try {
      const stored = localStorage.getItem(BB_TRANSACTIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('BroBudget: Unable to read transactions from LocalStorage, using fallback.', err);
    }

    const defaultSeed = bbTransactionsGetInitialSeed();
    bbTransactionsSave(defaultSeed);
    return defaultSeed;
  }

  /**
   * Persists transactions to LocalStorage and synchronizes with Dashboard
   */
  function bbTransactionsSave(transactions) {
    try {
      localStorage.setItem(BB_TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      bbTransactionsState.transactions = transactions;
      bbTransactionsSyncWithDashboard(transactions);
    } catch (err) {
      console.error('BroBudget: Failed to save transactions to LocalStorage.', err);
    }
  }

  /**
   * Adds a new transaction, saves, and updates UI
   */
  function bbTransactionAdd(transaction) {
    const list = bbTransactionsGet();
    const newTx = {
      id: Date.now(),
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || '',
      amount: Number(transaction.amount),
      date: transaction.date
    };

    list.unshift(newTx);
    bbTransactionsSave(list);
    bbTransactionsRender();
    bbTransactionsShowToast('Transaction Added', `Successfully recorded ${newTx.type} of ₹${newTx.amount.toLocaleString('en-IN')}`, '✅');
    return newTx;
  }

  /**
   * Updates an existing transaction by ID
   */
  function bbTransactionUpdate(id, updatedData) {
    const list = bbTransactionsGet();
    const index = list.findIndex(t => String(t.id) === String(id));
    if (index === -1) {
      console.error(`Transaction with ID ${id} not found.`);
      return null;
    }

    list[index] = {
      ...list[index],
      type: updatedData.type,
      category: updatedData.category,
      description: updatedData.description || '',
      amount: Number(updatedData.amount),
      date: updatedData.date
    };

    bbTransactionsSave(list);
    bbTransactionsRender();
    bbTransactionsShowToast('Transaction Updated', 'Changes saved successfully.', '✏️');
    return list[index];
  }

  /**
   * Deletes a transaction by ID
   */
  function bbTransactionDelete(id) {
    const list = bbTransactionsGet();
    const target = list.find(t => String(t.id) === String(id));
    const filtered = list.filter(t => String(t.id) !== String(id));
    bbTransactionsSave(filtered);
    bbTransactionsRender();
    if (target) {
      bbTransactionsShowToast('Transaction Deleted', `Removed ${target.category} (${target.type})`, '🗑️');
    }
    return true;
  }

  /**
   * Filters transactions based on criteria object
   */
  function bbTransactionsFilter(criteria = {}) {
    const list = bbTransactionsState.transactions || bbTransactionsGet();
    const search = (criteria.search || '').trim().toLowerCase();
    const type = criteria.type || 'all';
    const category = criteria.category || 'all';
    const month = criteria.month !== undefined ? String(criteria.month) : 'all';

    return list.filter(t => {
      // 1. Type Match
      if (type !== 'all' && t.type !== type) return false;

      // 2. Category Match
      if (category !== 'all' && t.category !== category) return false;

      // 3. Month Match (Date is YYYY-MM-DD)
      if (month !== 'all') {
        const txMonth = new Date(t.date).getMonth();
        if (String(txMonth) !== month) return false;
      }

      // 4. Search Match (Category, Description, Date)
      if (search) {
        const catMatch = (t.category || '').toLowerCase().includes(search);
        const descMatch = (t.description || '').toLowerCase().includes(search);
        const dateMatch = (t.date || '').toLowerCase().includes(search);
        if (!catMatch && !descMatch && !dateMatch) return false;
      }

      return true;
    });
  }

  // --------------------------------------------------------------------------
  // 5. Cross-Module Sync (Seamless GitHub Integration with Developer 1)
  // --------------------------------------------------------------------------
  /**
   * Automatically calculates monthly totals from all transactions and
   * synchronizes with Developer 1's dashboard LocalStorage and event bus.
   */
  function bbTransactionsSyncWithDashboard(transactions) {
    try {
      const storedDashboard = localStorage.getItem(BB_DASHBOARD_STORAGE_KEY);
      let dashboardData = storedDashboard ? JSON.parse(storedDashboard) : null;
      if (!dashboardData || !dashboardData.months) return;

      // Group totals by Year-Month
      const monthlyTotals = {};
      transactions.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${month}`;

        if (!monthlyTotals[key]) {
          monthlyTotals[key] = { income: 0, expenses: 0, categories: {} };
        }

        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          monthlyTotals[key].income += amt;
        } else {
          monthlyTotals[key].expenses += amt;
          const catKey = (t.category || 'other').toLowerCase();
          monthlyTotals[key].categories[catKey] = (monthlyTotals[key].categories[catKey] || 0) + amt;
        }
      });

      // Update matching months
      Object.keys(monthlyTotals).forEach(key => {
        if (dashboardData.months[key]) {
          dashboardData.months[key].income = monthlyTotals[key].income;
          dashboardData.months[key].expenses = monthlyTotals[key].expenses;
          dashboardData.months[key].categories = monthlyTotals[key].categories;
        }
      });

      localStorage.setItem(BB_DASHBOARD_STORAGE_KEY, JSON.stringify(dashboardData));

      // Dispatch event to live dashboard if open in another window/tab or embedded
      window.dispatchEvent(new CustomEvent('bb:financial-data-updated', {
        detail: { transactionsCount: transactions.length }
      }));
    } catch (e) {
      // Non-blocking sync error
      console.warn('BroBudget: Dashboard sync skipped.', e);
    }
  }

  // --------------------------------------------------------------------------
  // 6. Form Validation & Error Handling
  // --------------------------------------------------------------------------
  /**
   * Validates form fields and displays friendly error messages
   */
  function bbTransactionsValidate(formData) {
    const errors = {};

    // 1. Amount Validation
    const amountVal = formData.amount;
    if (amountVal === '' || amountVal === null || amountVal === undefined) {
      errors.amount = 'Please enter a valid amount.';
    } else {
      const num = Number(amountVal);
      if (isNaN(num)) {
        errors.amount = 'Amount must be a numeric value.';
      } else if (num <= 0) {
        errors.amount = 'Amount must be greater than ₹0.';
      }
    }

    // 2. Category Validation
    if (!formData.category || formData.category.trim() === '') {
      errors.category = 'Please select a category.';
    }

    // 3. Date Validation
    if (!formData.date || formData.date.trim() === '') {
      errors.date = 'Please choose a transaction date.';
    } else {
      const parsedDate = new Date(formData.date);
      if (isNaN(parsedDate.getTime())) {
        errors.date = 'Invalid date format.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Displays or clears inline validation error messages
   */
  function bbTransactionsShowErrors(errors = {}) {
    const fields = ['amount', 'category', 'date', 'description'];
    fields.forEach(field => {
      const inputEl = document.getElementById(`bb-input-${field}`);
      const errorEl = document.getElementById(`bb-error-${field}`);

      if (inputEl) {
        if (errors[field]) {
          inputEl.classList.add('bb-input-error');
        } else {
          inputEl.classList.remove('bb-input-error');
        }
      }

      if (errorEl) {
        if (errors[field]) {
          errorEl.textContent = errors[field];
          errorEl.classList.add('bb-error-visible');
        } else {
          errorEl.textContent = '';
          errorEl.classList.remove('bb-error-visible');
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. Dynamic Category Populate Helpers
  // --------------------------------------------------------------------------
  /**
   * Returns list of category options based on type
   */
  function bbTransactionsGetCategoryList(type) {
    return type === 'income' ? bbIncomeSources : bbExpenseCategories;
  }

  /**
   * Finds icon for a given category name
   */
  function bbTransactionsGetCategoryIcon(categoryName, type) {
    const list = type === 'income' ? bbIncomeSources : bbExpenseCategories;
    const match = list.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    if (match) return match.icon;
    return type === 'income' ? '💰' : '📦';
  }

  /**
   * Populates the category `<select>` dropdown
   */
  function bbTransactionsPopulateCategoryDropdown(type, selectedCategory = '') {
    const selectEl = document.getElementById('bb-input-category');
    if (!selectEl) return;

    selectEl.innerHTML = '<option value="" disabled selected>Select a category...</option>';
    const categories = bbTransactionsGetCategoryList(type);

    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.icon} ${cat.name}`;
      if (selectedCategory && selectedCategory.toLowerCase() === cat.name.toLowerCase()) {
        opt.selected = true;
      }
      selectEl.appendChild(opt);
    });
  }

  /**
   * Populates filter category dropdown based on all available categories
   */
  function bbTransactionsPopulateFilterCategoryDropdown() {
    const selectEl = document.getElementById('bb-filter-category');
    if (!selectEl) return;

    selectEl.innerHTML = '<option value="all">All Categories</option>';
    
    // Group Income Categories
    const incGroup = document.createElement('optgroup');
    incGroup.label = 'Income Sources';
    bbIncomeSources.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.icon} ${cat.name}`;
      incGroup.appendChild(opt);
    });
    selectEl.appendChild(incGroup);

    // Group Expense Categories
    const expGroup = document.createElement('optgroup');
    expGroup.label = 'Expense Categories';
    bbExpenseCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.icon} ${cat.name}`;
      expGroup.appendChild(opt);
    });
    selectEl.appendChild(expGroup);
  }

  // --------------------------------------------------------------------------
  // 8. Date Formatter Helper
  // --------------------------------------------------------------------------
  /**
   * Formats YYYY-MM-DD into "01 Oct 2026"
   */
  function bbTransactionsFormatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const monthIdx = parseInt(month, 10) - 1;
      const shortMonth = bbMonthNames[monthIdx] ? bbMonthNames[monthIdx].substring(0, 3) : month;
      return `${day} ${shortMonth} ${year}`;
    } catch (e) {
      return dateStr;
    }
  }

  // --------------------------------------------------------------------------
  // 9. UI Rendering: Table & Overview Summary
  // --------------------------------------------------------------------------
  /**
   * Renders the transaction rows and overview metric cards
   */
  function bbTransactionsRender() {
    const filteredList = bbTransactionsFilter(bbTransactionsState.filters);
    const tableBody = document.getElementById('bb-table-body');
    const emptyState = document.getElementById('bb-table-empty-state');
    const tableElement = document.getElementById('bb-transactions-table');

    // 1. Calculate Mini Overview Metrics for Filtered Set
    let totalInflow = 0;
    let totalOutflow = 0;
    filteredList.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
      }
    });
    const netBalance = totalInflow - totalOutflow;

    // Update Overview Metric Cards in DOM
    const miniInflowEl = document.getElementById('bb-mini-inflow-val');
    const miniOutflowEl = document.getElementById('bb-mini-outflow-val');
    const miniNetEl = document.getElementById('bb-mini-net-val');
    const miniCountEl = document.getElementById('bb-mini-count-val');

    if (miniInflowEl) miniInflowEl.textContent = `₹${totalInflow.toLocaleString('en-IN')}`;
    if (miniOutflowEl) miniOutflowEl.textContent = `₹${totalOutflow.toLocaleString('en-IN')}`;
    if (miniNetEl) {
      const prefix = netBalance < 0 ? '-₹' : '₹';
      miniNetEl.textContent = `${prefix}${Math.abs(netBalance).toLocaleString('en-IN')}`;
      miniNetEl.style.color = netBalance < 0 ? 'var(--bb-color-expense-light)' : 'var(--bb-color-income-light)';
    }
    if (miniCountEl) miniCountEl.textContent = filteredList.length;

    // 2. Render Table Rows
    if (!tableBody) return;

    if (filteredList.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (tableElement) tableElement.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableElement) tableElement.style.display = 'table';

    let html = '';
    filteredList.forEach(tx => {
      const isIncome = tx.type === 'income';
      const icon = bbTransactionsGetCategoryIcon(tx.category, tx.type);
      const formattedDate = bbTransactionsFormatDate(tx.date);
      const typeBadgeClass = isIncome ? 'bb-badge-type-income' : 'bb-badge-type-expense';
      const amountClass = isIncome ? 'bb-amount-income' : 'bb-amount-expense';
      const amountPrefix = isIncome ? '+₹' : '-₹';
      const formattedAmount = `${amountPrefix}${(Number(tx.amount) || 0).toLocaleString('en-IN')}`;

      html += `
        <tr class="bb-row-enter" id="bb-tx-row-${tx.id}">
          <td data-label="Date">
            <span style="font-weight:600; color:var(--bb-text-secondary);">${formattedDate}</span>
          </td>
          <td data-label="Type">
            <span class="bb-table-badge-type ${typeBadgeClass}">
              ${isIncome ? '💰 Inflow' : '💸 Outflow'}
            </span>
          </td>
          <td data-label="Category">
            <span class="bb-table-badge-cat">
              <span>${icon}</span>
              <span>${tx.category}</span>
            </span>
          </td>
          <td data-label="Description">
            <span style="color:var(--bb-text-primary); font-weight:500;">
              ${escapeHtml(tx.description || '—')}
            </span>
          </td>
          <td data-label="Amount">
            <span class="bb-table-amount ${amountClass}">${formattedAmount}</span>
          </td>
          <td data-label="Actions">
            <div class="bb-table-actions">
              <button type="button" class="bb-table-btn-action bb-table-btn-edit" 
                title="Edit Transaction" 
                aria-label="Edit transaction ${escapeHtml(tx.description || tx.category)}"
                onclick="window.BBTransactions.openEdit(${tx.id})">
                ✏️
              </button>
              <button type="button" class="bb-table-btn-action bb-table-btn-delete" 
                title="Delete Transaction" 
                aria-label="Delete transaction ${escapeHtml(tx.description || tx.category)}"
                onclick="window.BBTransactions.openDelete(${tx.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --------------------------------------------------------------------------
  // 10. Form Actions (Switch Type, Submit, Edit, Cancel)
  // --------------------------------------------------------------------------
  /**
   * Switches the active form mode between 'expense' and 'income'
   */
  function bbTransactionsSwitchFormType(type) {
    bbTransactionsState.activeFormType = type;
    const btnExpense = document.getElementById('bb-switch-btn-expense');
    const btnIncome = document.getElementById('bb-switch-btn-income');
    const formTitle = document.getElementById('bb-form-title-text');
    const submitBtn = document.getElementById('bb-form-submit-btn');

    if (type === 'income') {
      if (btnIncome) btnIncome.className = 'bb-form-switcher-btn bb-switch-active-income';
      if (btnExpense) btnExpense.className = 'bb-form-switcher-btn';
      if (formTitle) formTitle.textContent = bbTransactionsState.editingTransactionId ? 'Edit Income' : 'Record Income';
      if (submitBtn) {
        submitBtn.className = 'bb-form-submit-btn bb-submit-income';
        submitBtn.textContent = bbTransactionsState.editingTransactionId ? 'Update Income' : 'Add Income';
      }
    } else {
      if (btnExpense) btnExpense.className = 'bb-form-switcher-btn bb-switch-active-expense';
      if (btnIncome) btnIncome.className = 'bb-form-switcher-btn';
      if (formTitle) formTitle.textContent = bbTransactionsState.editingTransactionId ? 'Edit Expense' : 'Record Expense';
      if (submitBtn) {
        submitBtn.className = 'bb-form-submit-btn bb-submit-expense';
        submitBtn.textContent = bbTransactionsState.editingTransactionId ? 'Update Expense' : 'Add Expense';
      }
    }

    bbTransactionsPopulateCategoryDropdown(type);
    bbTransactionsShowErrors({}); // clear any validation error
  }

  /**
   * Handles Form Submission (Add or Update)
   */
  function bbTransactionsHandleFormSubmit(e) {
    e.preventDefault();

    const dateVal = document.getElementById('bb-input-date').value;
    const catVal = document.getElementById('bb-input-category').value;
    const descVal = document.getElementById('bb-input-description').value;
    const amountVal = document.getElementById('bb-input-amount').value;

    const formData = {
      type: bbTransactionsState.activeFormType,
      date: dateVal,
      category: catVal,
      description: descVal.trim(),
      amount: amountVal
    };

    // Validate
    const validation = bbTransactionsValidate(formData);
    if (!validation.isValid) {
      bbTransactionsShowErrors(validation.errors);
      // Focus first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      const el = document.getElementById(`bb-input-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    // Clear errors
    bbTransactionsShowErrors({});

    if (bbTransactionsState.editingTransactionId) {
      // Update
      bbTransactionUpdate(bbTransactionsState.editingTransactionId, formData);
      bbTransactionsCancelEdit();
    } else {
      // Add
      bbTransactionAdd(formData);
      // Reset form fields except date
      document.getElementById('bb-input-amount').value = '';
      document.getElementById('bb-input-description').value = '';
      document.getElementById('bb-input-category').selectedIndex = 0;
    }
  }

  /**
   * Sets up Edit Mode: loads transaction into form
   */
  function bbTransactionsOpenEdit(id) {
    const list = bbTransactionsGet();
    const target = list.find(t => String(t.id) === String(id));
    if (!target) return;

    bbTransactionsState.editingTransactionId = target.id;
    bbTransactionsSwitchFormType(target.type);

    document.getElementById('bb-input-date').value = target.date;
    bbTransactionsPopulateCategoryDropdown(target.type, target.category);
    document.getElementById('bb-input-description').value = target.description || '';
    document.getElementById('bb-input-amount').value = target.amount;

    // Show Edit Banner & Cancel Button
    const banner = document.getElementById('bb-form-edit-banner');
    const cancelBtn = document.getElementById('bb-form-cancel-btn');
    if (banner) banner.classList.add('bb-banner-visible');
    if (cancelBtn) cancelBtn.classList.add('bb-cancel-visible');

    // Scroll form into view smoothly on mobile
    const formCard = document.getElementById('bb-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Cancels Edit Mode and resets form
   */
  function bbTransactionsCancelEdit() {
    bbTransactionsState.editingTransactionId = null;

    const banner = document.getElementById('bb-form-edit-banner');
    const cancelBtn = document.getElementById('bb-form-cancel-btn');
    if (banner) banner.classList.remove('bb-banner-visible');
    if (cancelBtn) cancelBtn.classList.remove('bb-cancel-visible');

    // Reset fields
    document.getElementById('bb-input-amount').value = '';
    document.getElementById('bb-input-description').value = '';
    document.getElementById('bb-input-category').selectedIndex = 0;

    bbTransactionsSwitchFormType(bbTransactionsState.activeFormType);
    bbTransactionsShowErrors({});
  }

  // --------------------------------------------------------------------------
  // 11. Delete Confirmation Modal
  // --------------------------------------------------------------------------
  /**
   * Opens the confirmation modal before deletion
   */
  function bbTransactionsOpenDeleteModal(id) {
    const list = bbTransactionsGet();
    const target = list.find(t => String(t.id) === String(id));
    if (!target) return;

    bbTransactionsState.pendingDeleteId = id;
    const modal = document.getElementById('bb-delete-modal');
    const detailsEl = document.getElementById('bb-modal-delete-details');

    if (detailsEl) {
      const formattedDate = bbTransactionsFormatDate(target.date);
      detailsEl.innerHTML = `
        <strong>${target.type.toUpperCase()}:</strong> ₹${(Number(target.amount) || 0).toLocaleString('en-IN')}<br>
        <strong>Category:</strong> ${target.category} | <strong>Date:</strong> ${formattedDate}<br>
        <strong>Description:</strong> ${escapeHtml(target.description || 'None')}
      `;
    }

    if (modal) modal.classList.add('bb-modal-active');
  }

  /**
   * Confirms and executes transaction deletion
   */
  function bbTransactionsConfirmDelete() {
    const id = bbTransactionsState.pendingDeleteId;
    if (!id) return;

    const row = document.getElementById(`bb-tx-row-${id}`);
    if (row) {
      row.classList.add('bb-row-delete-animate');
      setTimeout(() => {
        bbTransactionDelete(id);
        bbTransactionsCloseDeleteModal();
      }, 250);
    } else {
      bbTransactionDelete(id);
      bbTransactionsCloseDeleteModal();
    }
  }

  /**
   * Closes confirmation modal
   */
  function bbTransactionsCloseDeleteModal() {
    bbTransactionsState.pendingDeleteId = null;
    const modal = document.getElementById('bb-delete-modal');
    if (modal) modal.classList.remove('bb-modal-active');
  }

  // --------------------------------------------------------------------------
  // 12. Search & Filters Setup
  // --------------------------------------------------------------------------
  function bbTransactionsSetupFilters() {
    // 1. Search Box (Live Search)
    const searchInput = document.getElementById('bb-search-input');
    const searchClear = document.getElementById('bb-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        bbTransactionsState.filters.search = e.target.value;
        if (searchClear) {
          if (e.target.value.length > 0) {
            searchClear.classList.add('bb-clear-visible');
          } else {
            searchClear.classList.remove('bb-clear-visible');
          }
        }
        bbTransactionsRender();
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          bbTransactionsState.filters.search = '';
          searchClear.classList.remove('bb-clear-visible');
          bbTransactionsRender();
          searchInput.focus();
        }
      });
    }

    // 2. Type Filter Pills [All, Income, Expense]
    const typeButtons = document.querySelectorAll('.bb-filter-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('bb-filter-type-active'));
        btn.classList.add('bb-filter-type-active');
        bbTransactionsState.filters.type = btn.getAttribute('data-type') || 'all';
        bbTransactionsRender();
      });
    });

    // 3. Category Filter Dropdown
    const catFilter = document.getElementById('bb-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        bbTransactionsState.filters.category = e.target.value;
        bbTransactionsRender();
      });
    }

    // 4. Month Filter Dropdown
    const monthFilter = document.getElementById('bb-filter-month');
    if (monthFilter) {
      monthFilter.innerHTML = '<option value="all">All Months</option>';
      bbMonthNames.forEach((month, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = month;
        monthFilter.appendChild(opt);
      });

      monthFilter.addEventListener('change', (e) => {
        bbTransactionsState.filters.month = e.target.value;
        bbTransactionsRender();
      });
    }

    // 5. Reset Filters Button
    const resetBtn = document.getElementById('bb-btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        bbTransactionsState.filters = {
          search: '',
          type: 'all',
          category: 'all',
          month: 'all'
        };
        if (searchInput) {
          searchInput.value = '';
          if (searchClear) searchClear.classList.remove('bb-clear-visible');
        }
        typeButtons.forEach(b => {
          if (b.getAttribute('data-type') === 'all') {
            b.classList.add('bb-filter-type-active');
          } else {
            b.classList.remove('bb-filter-type-active');
          }
        });
        if (catFilter) catFilter.value = 'all';
        if (monthFilter) monthFilter.value = 'all';
        bbTransactionsRender();
        bbTransactionsShowToast('Filters Reset', 'Showing all transactions.', '🔄');
      });
    }
  }

  // --------------------------------------------------------------------------
  // 13. Toast Notification System (bb-toast-)
  // --------------------------------------------------------------------------
  function bbTransactionsShowToast(title, message, icon = 'ℹ️') {
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
    setTimeout(dismiss, 3800);
  }

  // --------------------------------------------------------------------------
  // 14. Initialization
  // --------------------------------------------------------------------------
  function bbTransactionsInit() {
    // 1. Load transactions from storage
    bbTransactionsState.transactions = bbTransactionsGet();

    // 2. Set default date to today's date formatted as YYYY-MM-DD
    const dateInput = document.getElementById('bb-input-date');
    if (dateInput && !dateInput.value) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // 3. Populate dropdowns
    bbTransactionsPopulateCategoryDropdown(bbTransactionsState.activeFormType);
    bbTransactionsPopulateFilterCategoryDropdown();

    // 4. Setup filter controls
    bbTransactionsSetupFilters();

    // 5. Switcher button events
    const btnExpense = document.getElementById('bb-switch-btn-expense');
    const btnIncome = document.getElementById('bb-switch-btn-income');
    if (btnExpense) {
      btnExpense.addEventListener('click', () => bbTransactionsSwitchFormType('expense'));
    }
    if (btnIncome) {
      btnIncome.addEventListener('click', () => bbTransactionsSwitchFormType('income'));
    }

    // 6. Form submit & cancel events
    const formEl = document.getElementById('bb-transaction-form');
    if (formEl) {
      formEl.addEventListener('submit', bbTransactionsHandleFormSubmit);
    }
    const cancelBtn = document.getElementById('bb-form-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', bbTransactionsCancelEdit);
    }

    // 7. Modal buttons
    const modalConfirmBtn = document.getElementById('bb-modal-btn-confirm-delete');
    const modalCancelBtn = document.getElementById('bb-modal-btn-cancel-delete');
    const modalOverlay = document.getElementById('bb-delete-modal');

    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', bbTransactionsConfirmDelete);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', bbTransactionsCloseDeleteModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) bbTransactionsCloseDeleteModal();
      });
    }

    // 8. Escape key closes modal & cancels edit
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        bbTransactionsCloseDeleteModal();
        if (bbTransactionsState.editingTransactionId) {
          bbTransactionsCancelEdit();
        }
      }
    });

    // 9. Initial Render
    bbTransactionsRender();
  }

  // --------------------------------------------------------------------------
  // 15. Export Global Public API
  // --------------------------------------------------------------------------
  window.BBTransactions = {
    version: '1.0.0',
    module: 'Developer 2 - Income & Expense Management',
    get: bbTransactionsGet,
    save: bbTransactionsSave,
    add: bbTransactionAdd,
    update: bbTransactionUpdate,
    delete: bbTransactionDelete,
    filter: bbTransactionsFilter,
    openEdit: bbTransactionsOpenEdit,
    openDelete: bbTransactionsOpenDeleteModal,
    cancelEdit: bbTransactionsCancelEdit,
    refresh: bbTransactionsRender,
    switchType: bbTransactionsSwitchFormType,
    getState: () => ({ ...bbTransactionsState })
  };

  // Expose global functions matching exact prompt function names
  window.bbTransactionsGet = bbTransactionsGet;
  window.bbTransactionsSave = bbTransactionsSave;
  window.bbTransactionAdd = bbTransactionAdd;
  window.bbTransactionUpdate = bbTransactionUpdate;
  window.bbTransactionDelete = bbTransactionDelete;
  window.bbTransactionsFilter = bbTransactionsFilter;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bbTransactionsInit);
  } else {
    bbTransactionsInit();
  }

})();
