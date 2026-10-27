const EMPTY_REPORT_TEXT = 'No data available';

const VIEWS = {
    'ub-today': { tabId: 'tabUbToday', panelId: 'todaySection' },
    'ub-balance': { tabId: 'tabUbBalance', panelId: 'balanceSection' },
    'cheers-today': { tabId: 'tabCheersToday', panelId: 'cheersTodaySection' },
    'cheers-balance': { tabId: 'tabCheersBalance', panelId: 'cheersBalanceSection' }
};

const PRODUCT_COLUMNS = {
    code: { field: 'Product Code', type: 'text', label: 'Code' },
    description: { field: 'Item Description', type: 'text', label: 'Description' },
    saleCase: { field: 'Sale Case', type: 'number', label: 'Sale cases' },
    saleBottles: { field: 'Sale Btls.', type: 'number', label: 'Bottles' },
    closingStock: { field: 'Closing Stock', type: 'number', label: 'Closing stock' }
};

let currentView = 'ub-today';
let productRows = [];
let productSort = { key: 'code', direction: 'asc' };
let productFilter = '';
let productSearchQuery = '';

function renderResult(result) {
    setReportText('todayContent', result.sales?.report_text, 'No sales report available');
    setReportText('balanceContent', result.stock?.report_text, 'No opening balance report available');
    setReportText('cheersTodayContent', result.cheers_sales?.report_text, 'No CHEERS sales report available');
    setReportText('cheersBalanceContent', result.cheers_stock?.report_text, 'No CHEERS opening balance report available');
    renderProductTable(result.rows);
    updateSummary(result);
    updateCopyButtons();
}

function setReportText(elementId, text, fallback) {
    const element = document.getElementById(elementId);
    const hasText = typeof text === 'string' && text.trim().length > 0;
    element.textContent = hasText ? text : fallback;
    element.dataset.empty = String(!hasText);
}

function clearResult() {
    ['todayContent', 'balanceContent', 'cheersTodayContent', 'cheersBalanceContent'].forEach(elementId => {
        const element = document.getElementById(elementId);
        element.textContent = EMPTY_REPORT_TEXT;
        element.dataset.empty = 'true';
    });
    clearSummary();
    clearProductTable();
    updateCopyButtons();
}

function renderProductTable(rows) {
    productRows = Array.isArray(rows) ? rows.slice() : [];
    renderProductTableBody();
}

function clearProductTable() {
    productRows = [];
    productFilter = '';
    productSearchQuery = '';
    productSort = { key: 'code', direction: 'asc' };

    const filterInput = document.getElementById('productFilter');
    if (filterInput) {
        filterInput.value = '';
    }

    renderProductTableBody();
}

function renderProductTableBody() {
    const tbody = document.getElementById('productTableBody');
    const summary = document.getElementById('productsSummary');
    const empty = document.getElementById('productTableEmpty');
    const wrap = document.getElementById('productTableWrap');
    if (!tbody) {
        return;
    }

    const filter = productFilter.trim();
    const search = productSearchQuery.trim();
    const filteredRows = filter
        ? productRows.filter(row => rowMatchesFilter(row, filter))
        : productRows.slice();
    const sortedRows = sortProductRows(filteredRows);
    const searchMatchCount = search
        ? productRows.filter(row => rowMatchesQuery(row, search)).length
        : 0;

    tbody.textContent = '';

    sortedRows.forEach(row => {
        const code = String(row['Product Code'] || '').trim();
        const tableRow = document.createElement('tr');
        tableRow.dataset.code = code.toUpperCase();
        tableRow.tabIndex = -1;

        if (search && rowMatchesQuery(row, search)) {
            tableRow.classList.add('search-match');
        }

        const codeCell = document.createElement('td');
        codeCell.className = 'product-code';
        appendHighlightedText(codeCell, code, search);
        tableRow.appendChild(codeCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.className = 'product-desc';
        appendHighlightedText(descriptionCell, String(row['Item Description'] || '').trim(), search);
        tableRow.appendChild(descriptionCell);

        ['Sale Case', 'Sale Btls.', 'Closing Stock'].forEach(field => {
            const cell = document.createElement('td');
            cell.className = 'num';
            cell.textContent = formatProductNumber(row[field]);
            tableRow.appendChild(cell);
        });

        tbody.appendChild(tableRow);
    });

    if (summary) {
        if (!productRows.length) {
            summary.textContent = 'No products loaded';
        } else {
            let text = `${productRows.length} product${productRows.length === 1 ? '' : 's'}`;
            if (filter) {
                text += ` · ${filteredRows.length} shown`;
            }
            if (search) {
                text += ` · ${searchMatchCount} matching "${search}"`;
            }
            summary.textContent = text;
        }
    }

    if (empty) {
        if (!productRows.length) {
            empty.textContent = 'No products in this report.';
            empty.hidden = false;
        } else if (!filteredRows.length) {
            empty.textContent = 'No products match this filter.';
            empty.hidden = false;
        } else {
            empty.hidden = true;
        }
    }

    if (wrap) {
        wrap.hidden = !productRows.length;
    }

    updateSortHeaders();
    updateProductFilterClear();
}

function setProductSearchQuery(query) {
    productSearchQuery = String(query || '').trim();
    renderProductTableBody();
}

function setProductFilter(value) {
    productFilter = String(value || '');
    renderProductTableBody();
}

function clearProductFilter() {
    const input = document.getElementById('productFilter');
    if (input) {
        input.value = '';
    }
    productFilter = '';
    renderProductTableBody();
}

function sortProductTable(key) {
    if (!PRODUCT_COLUMNS[key]) {
        return;
    }

    if (productSort.key === key) {
        productSort.direction = productSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        productSort = { key, direction: 'asc' };
    }

    renderProductTableBody();
}

function updateSortHeaders() {
    document.querySelectorAll('.sort-button').forEach(button => {
        const key = button.dataset.sort;
        const column = PRODUCT_COLUMNS[key];
        const header = button.closest('th');
        const indicator = button.querySelector('.sort-indicator');
        const active = key === productSort.key;

        if (!column || !header) {
            return;
        }

        header.setAttribute('aria-sort', active
            ? (productSort.direction === 'asc' ? 'ascending' : 'descending')
            : 'none');

        if (indicator) {
            indicator.textContent = active
                ? (productSort.direction === 'asc' ? '↑' : '↓')
                : '';
        }

        button.setAttribute('aria-label', active
            ? `Sort by ${column.label}, currently ${productSort.direction === 'asc' ? 'ascending' : 'descending'}`
            : `Sort by ${column.label}`);
    });
}

function sortProductRows(rows) {
    const column = PRODUCT_COLUMNS[productSort.key] || PRODUCT_COLUMNS.code;
    const direction = productSort.direction === 'desc' ? -1 : 1;

    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const aValue = a.row[column.field];
            const bValue = b.row[column.field];
            let result;

            if (column.type === 'number') {
                result = (Number(aValue) || 0) - (Number(bValue) || 0);
            } else {
                result = String(aValue || '').localeCompare(String(bValue || ''), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            }

            if (result === 0) {
                result = a.index - b.index;
            }
            return result * direction;
        })
        .map(item => item.row);
}

function rowMatchesFilter(row, filter) {
    const needle = String(filter || '').toLowerCase();
    return String(row['Product Code'] || '').toLowerCase().includes(needle)
        || String(row['Item Description'] || '').toLowerCase().includes(needle);
}

function rowMatchesQuery(row, query) {
    const needle = String(query || '').toLowerCase();
    if (!needle) {
        return false;
    }
    return String(row['Product Code'] || '').toLowerCase().includes(needle)
        || String(row['Item Description'] || '').toLowerCase().includes(needle);
}

function formatProductNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : String(value ?? '');
}

function appendHighlightedText(element, text, query) {
    const value = String(text ?? '');
    const needle = String(query || '').trim();

    if (!needle) {
        element.textContent = value;
        return;
    }

    const lowerValue = value.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let cursor = 0;
    let index = lowerValue.indexOf(lowerNeedle);

    if (index === -1) {
        element.textContent = value;
        return;
    }

    while (index !== -1) {
        if (index > cursor) {
            element.appendChild(document.createTextNode(value.slice(cursor, index)));
        }

        const mark = document.createElement('mark');
        mark.textContent = value.slice(index, index + needle.length);
        element.appendChild(mark);

        cursor = index + needle.length;
        index = lowerValue.indexOf(lowerNeedle, cursor);
    }

    if (cursor < value.length) {
        element.appendChild(document.createTextNode(value.slice(cursor)));
    }
}

function scrollToProduct(code) {
    const targetCode = String(code || '').toUpperCase();
    const target = Array.from(document.querySelectorAll('#productTableBody tr'))
        .find(row => row.dataset.code === targetCode);

    if (!target) {
        return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('row-selected');

    try {
        target.focus({ preventScroll: true });
    } catch (error) {
        target.focus();
    }

    if (target.rowTimer) {
        clearTimeout(target.rowTimer);
    }
    target.rowTimer = setTimeout(() => {
        target.classList.remove('row-selected');
        target.rowTimer = null;
    }, 2000);

    announce(`Showing ${targetCode} in the product table.`);
}

function updateProductFilterClear() {
    const input = document.getElementById('productFilter');
    const button = document.getElementById('clearProductFilter');
    if (input && button) {
        button.hidden = !input.value.trim();
    }
}

function selectView(view) {
    currentView = VIEWS[view] ? view : 'ub-today';

    Object.entries(VIEWS).forEach(([key, config]) => {
        const active = key === currentView;
        const tab = document.getElementById(config.tabId);
        const panel = document.getElementById(config.panelId);

        if (tab) {
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        }
        if (panel) {
            panel.hidden = !active;
        }
    });
}

function updateSummary(result) {
    const sales = result?.sales?.totals || {};
    const stock = result?.stock?.totals || {};
    const cheersSales = result?.cheers_sales?.totals || {};
    const cheersStock = result?.cheers_stock?.totals || {};

    let ubDaySub = 'Cases sold';
    if (hasMetric(sales.ub_day)) {
        ubDaySub = `UB day ${formatMetric(sales.ub_day)}`;
        if (hasMetric(sales.ub_day_percentage)) {
            ubDaySub += ` · ${sales.ub_day_percentage}%`;
        }
    }

    let ubStockSub = 'Opening stock';
    if (hasMetric(stock.ub_total) && hasMetric(stock.opening_balance_total)) {
        ubStockSub = `UB ${formatMetric(stock.ub_total)} of ${formatMetric(stock.opening_balance_total)}`;
        if (hasMetric(stock.ub_percentage)) {
            ubStockSub += ` · ${stock.ub_percentage}%`;
        }
    }

    setSummaryValue('ub-today', sales.grand_total, ubDaySub);
    setSummaryValue('ub-balance', stock.opening_balance_total, ubStockSub);
    setSummaryValue('cheers-today', cheersSales.total, 'Cases sold');
    setSummaryValue('cheers-balance', cheersStock.total, 'Cases in stock');
}

function clearSummary() {
    Object.keys(VIEWS).forEach(view => {
        setSummaryValue(view, null, 'Awaiting report');
    });
}

function setSummaryValue(view, value, sub) {
    const valueElement = document.querySelector(`[data-summary-value="${view}"]`);
    const subElement = document.querySelector(`[data-summary-sub="${view}"]`);

    if (valueElement) {
        valueElement.textContent = formatMetric(value);
    }
    if (subElement) {
        subElement.textContent = sub;
    }
}

function hasMetric(value) {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function formatMetric(value) {
    return hasMetric(value) ? String(Number(value)) : '—';
}

function showWorkspace(show) {
    document.getElementById('workspace').hidden = !show;
}

function showReportBar(show) {
    document.getElementById('reportBar').hidden = !show;
}

function updateReportBar(result, file) {
    const filename = result?.input?.filename || file?.name || 'Uploaded report';
    const date = result?.conversion?.extractedDate || 'Date not found';
    const rows = result?.conversion?.rowsProcessed ?? 0;
    const depot = result?.depot?.raw || 'Depot not detected';
    const source = (result?.sourceType || '').toUpperCase();

    const fileElement = document.getElementById('reportFile');
    fileElement.textContent = filename;
    fileElement.title = filename;

    const parts = [date, depot, `${rows} row${rows === 1 ? '' : 's'}`];
    if (source) {
        parts.push(source);
    }
    document.getElementById('reportMeta').textContent = parts.join(' · ');
}

function showUploadState() {
    document.getElementById('uploadSection').hidden = false;
    document.getElementById('uploadArea').hidden = false;
    document.getElementById('uploadProgress').hidden = true;
    document.getElementById('uploadAnotherBtn').disabled = false;
    document.body.removeAttribute('aria-busy');
    clearResult();
    showReportBar(false);
    showWorkspace(false);
}

function showUploadProgress(show, text) {
    const section = document.getElementById('uploadSection');
    const area = document.getElementById('uploadArea');
    const progress = document.getElementById('uploadProgress');
    const anotherButton = document.getElementById('uploadAnotherBtn');

    if (show) {
        section.hidden = false;
        area.hidden = true;
        progress.hidden = false;
        if (text) {
            setUploadProgressText(text);
        }
        anotherButton.disabled = true;
        document.body.setAttribute('aria-busy', 'true');
        return;
    }

    area.hidden = false;
    progress.hidden = true;
    anotherButton.disabled = false;
    document.body.removeAttribute('aria-busy');
}

function setUploadProgressText(text) {
    const element = document.getElementById('uploadProgressText');
    if (element) {
        element.textContent = text;
    }
}

function focusResults() {
    const panel = document.querySelector('#workspace [role="tabpanel"]:not([hidden])');
    const title = panel?.querySelector('.results-title');
    if (!title) {
        return;
    }

    if (window.matchMedia('(max-width: 768px)').matches) {
        const target = document.querySelector('.summary-tabs') || title.closest('.section');
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
        title.focus({ preventScroll: true });
    } catch (error) {
        title.focus();
    }
}

function copyReport(button) {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target || target.dataset.empty === 'true') {
        return;
    }

    const title = button.closest('.results-box')?.querySelector('.results-title')?.textContent.trim() || 'Report';
    copyToClipboard(target.textContent, button, title);
}

function copyToClipboard(text, button, title) {
    const done = () => {
        showCopyFeedback(button, true);
        announce(`${title} copied.`);
    };
    const failed = () => {
        showCopyFeedback(button, false);
        announce('Copy failed. Select the report text and copy it manually.');
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            navigator.clipboard.writeText(text)
                .then(done)
                .catch(() => {
                    if (fallbackCopy(text)) {
                        done();
                    } else {
                        failed();
                    }
                });
            return;
        } catch (error) {
            // Fall through to the textarea fallback.
        }
    }

    if (fallbackCopy(text)) {
        done();
    } else {
        failed();
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.select();

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch (error) {
        copied = false;
    }

    document.body.removeChild(textArea);
    return copied;
}

function showCopyFeedback(button, success) {
    const label = button.querySelector('.copy-label');
    if (!label) {
        return;
    }

    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = label.textContent;
    }
    if (!button.dataset.defaultAriaLabel) {
        button.dataset.defaultAriaLabel = button.getAttribute('aria-label') || '';
    }
    if (button.copyTimer) {
        clearTimeout(button.copyTimer);
    }

    button.classList.toggle('copied', success);
    button.classList.toggle('copy-failed', !success);
    label.textContent = success ? 'Copied' : 'Try again';
    button.setAttribute('aria-label', success ? 'Report copied' : 'Copy failed. Try again.');

    button.copyTimer = setTimeout(() => {
        button.classList.remove('copied', 'copy-failed');
        label.textContent = button.dataset.defaultLabel;
        button.setAttribute('aria-label', button.dataset.defaultAriaLabel);
        button.copyTimer = null;
    }, 2000);
}

function updateCopyButtons() {
    document.querySelectorAll('.copy-button').forEach(button => {
        const target = document.getElementById(button.dataset.copyTarget);
        button.disabled = !target || target.dataset.empty === 'true';
    });
}

function showMessage(elementId, message, type = 'success', options = {}) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }

    if (container.messageTimer) {
        clearTimeout(container.messageTimer);
        container.messageTimer = null;
    }

    container.textContent = '';

    const item = document.createElement('div');
    item.className = `message ${type}`;

    const text = document.createElement('span');
    text.className = 'message-text';
    text.textContent = message;
    item.appendChild(text);

    if (type === 'error') {
        item.setAttribute('role', 'alert');
    }

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'message-close';
    dismiss.setAttribute('aria-label', 'Dismiss message');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => {
        clearMessage(elementId);

        if (elementId === 'searchMessage') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
            return;
        }

        const anotherButton = document.getElementById('uploadAnotherBtn');
        const uploadArea = document.getElementById('uploadArea');
        if (anotherButton && !anotherButton.closest('[hidden]')) {
            anotherButton.focus();
        } else if (uploadArea && !uploadArea.closest('[hidden]')) {
            uploadArea.focus();
        }
    });
    item.appendChild(dismiss);

    container.appendChild(item);

    if (type !== 'error' && !options.persist) {
        container.messageTimer = setTimeout(() => {
            container.textContent = '';
            container.messageTimer = null;
        }, 6000);
    }
}

function clearMessage(elementId) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }
    if (container.messageTimer) {
        clearTimeout(container.messageTimer);
        container.messageTimer = null;
    }
    container.textContent = '';
}

function announce(message) {
    const live = document.getElementById('liveStatus');
    if (!live) {
        return;
    }
    if (live.messageTimer) {
        clearTimeout(live.messageTimer);
    }
    live.textContent = '';
    live.messageTimer = setTimeout(() => {
        live.textContent = message;
        live.messageTimer = null;
    }, 30);
}

function initUi() {
    clearSummary();
    selectView(currentView);
    updateCopyButtons();
}
