// Vercel rejects request bodies over 4.5 MB. Leave a little room for multipart
// headers so the whole request stays under that limit.
const MAX_REQUEST_BYTES = 4.5 * 1024 * 1024;
const MAX_FILE_BYTES = MAX_REQUEST_BYTES - 16 * 1024;
const RECENT_SEARCH_KEY = 'daysale.recentSearches.v1';
const MAX_RECENT_SEARCHES = 5;

let currentResult = null;
let isUploading = false;
let progressHintTimer = null;

function handleFile(file) {
    if (isUploading) {
        return;
    }

    const validationError = validateFile(file);
    if (validationError) {
        if (!currentResult) {
            showUploadState();
        }
        showMessage('uploadMessage', validationError, 'error');
        announce(validationError);
        return;
    }

    uploadFile(file);
}

async function uploadFile(file) {
    isUploading = true;
    clearMessage('uploadMessage');
    showUploadProgress(true, `Reading ${file.name}…`);
    startProgressHint();

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse', {
            method: 'POST',
            body: formData
        });
        const payload = await readPayload(response);

        if (!response.ok || !payload.success) {
            throw new Error(payload.error || friendlyStatus(response.status));
        }

        const result = payload.result || {};
        const rows = Number(result.conversion?.rowsProcessed || 0);

        if (!rows) {
            throw new Error('No product rows were found. If this is a scanned PDF, upload the HTML report or a text-based PDF.');
        }

        currentResult = result;
        renderResult(result);
        updateReportBar(result, file);
        showReportBar(true);
        showWorkspace(true);
        showUploadProgress(false);
        document.getElementById('uploadSection').hidden = true;
        clearMessage('uploadMessage');

        const query = document.getElementById('searchInput').value.trim();
        if (query) {
            searchProduct({ announceResult: false });
        } else {
            clearMessage('searchMessage');
        }

        announce(`Report loaded. ${rows} row${rows === 1 ? '' : 's'} processed.`);
        focusResults();
    } catch (error) {
        showUploadProgress(false);

        let message = error?.message || 'Upload failed. Please try again.';
        if (/failed to fetch|networkerror|load failed/i.test(message)) {
            message = 'Could not reach the server. Check your connection and try again.';
        }

        if (currentResult) {
            showReportBar(true);
            showWorkspace(true);
            document.getElementById('uploadSection').hidden = true;
        } else {
            showUploadState();
        }

        showMessage('uploadMessage', message, 'error');
        announce(message);
    } finally {
        stopProgressHint();
        isUploading = false;
        document.getElementById('uploadAnotherBtn').disabled = false;
    }
}

function validateFile(file) {
    if (!file) {
        return 'Please choose a file.';
    }
    if (!/\.(html?|pdf)$/i.test(file.name || '')) {
        return 'Please select an HTML, HTM, or PDF file.';
    }
    if (!file.size) {
        return 'This file is empty. Please choose another file.';
    }
    if (file.size > MAX_FILE_BYTES) {
        return `This file is ${formatBytes(file.size)}. The maximum upload size is ${formatBytes(MAX_FILE_BYTES)}.`;
    }
    return '';
}

function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
        return `${Math.ceil(bytes / 1024)} KB`;
    }
    return `${bytes} bytes`;
}

async function readPayload(response) {
    let text = '';
    try {
        text = await response.text();
    } catch (error) {
        return { success: false, error: friendlyStatus(response.status) };
    }

    if (!text) {
        return { success: false, error: 'The server returned an empty response. Please try again.' };
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        return { success: false, error: friendlyStatus(response.status) };
    }
}

function friendlyStatus(status) {
    if (status === 413) {
        return `File is too large. The maximum upload size is ${formatBytes(MAX_FILE_BYTES)}.`;
    }
    if (status === 429) {
        return 'Too many uploads. Please wait a moment and try again.';
    }
    if (status === 504) {
        return 'The report took too long to process. Please try again.';
    }
    if (status >= 500) {
        return 'The server had a problem processing the file. Please try again.';
    }
    return 'Upload failed. Please try again.';
}

function startProgressHint() {
    stopProgressHint();
    progressHintTimer = setTimeout(() => {
        setUploadProgressText('Still reading… large PDFs can take a little longer.');
    }, 8000);
}

function stopProgressHint() {
    if (progressHintTimer) {
        clearTimeout(progressHintTimer);
        progressHintTimer = null;
    }
}

function searchProduct(options = {}) {
    const { announceResult = true, query: requestedQuery } = options;
    const input = document.getElementById('searchInput');
    const query = String(requestedQuery ?? input.value).trim();
    clearMessage('searchMessage');
    clearSearchResults();

    if (!query) {
        setProductSearchQuery('');
        showMessage('searchMessage', 'Please enter a product code or description.', 'error');
        input.focus();
        return;
    }

    if (!currentResult || !Array.isArray(currentResult.rows)) {
        showMessage('searchMessage', 'Upload a file before searching.', 'error');
        return;
    }

    input.value = query;
    updateSearchClearButton();
    setProductSearchQuery(query);

    const matches = findProductMatches(query);
    if (!matches.length) {
        showMessage('searchMessage', `No products match "${query}". Try a product code or part of the description.`, 'error');
        if (announceResult) {
            announce(`No products match ${query}.`);
        }
        renderRecentSearches();
        return;
    }

    saveRecentSearch(query);
    renderRecentSearches();

    const exactMatches = matches.filter(row => productCode(row) === query.toUpperCase());
    if (exactMatches.length === 1) {
        showProductDetail(exactMatches[0]);
        if (matches.length > 1) {
            renderSearchResults(matches, query);
        }
        if (announceResult) {
            announceProduct(exactMatches[0], matches.length);
        }
        return;
    }

    if (matches.length === 1) {
        showProductDetail(matches[0]);
        if (announceResult) {
            announceProduct(matches[0]);
        }
        return;
    }

    showMessage('searchMessage', `${matches.length} products match "${query}". Choose one below.`, 'success', { persist: true });
    renderSearchResults(matches, query);
    if (announceResult) {
        announce(`${matches.length} products match ${query}.`);
    }
}

function findProductMatches(query) {
    const needle = String(query || '').trim().toUpperCase();
    if (!needle || !currentResult || !Array.isArray(currentResult.rows)) {
        return [];
    }

    return currentResult.rows.filter(row => {
        const code = productCode(row);
        const description = String(row['Item Description'] || '').toUpperCase();
        return code.includes(needle) || description.includes(needle);
    });
}

function productCode(row) {
    return String(row?.['Product Code'] || '').trim().toUpperCase();
}

function showProductDetail(row) {
    const code = productCode(row);
    const description = String(row['Item Description'] || '').trim();
    const saleCase = formatNumber(row['Sale Case']);
    const saleBottles = formatNumber(row['Sale Btls.']);
    const closingStock = formatNumber(row['Closing Stock']);
    const hasBottles = Number(row['Sale Btls.']) > 0;

    const parts = [`Product ${code}`];
    if (description) {
        parts.push(description);
    }
    parts.push(`Sale: ${hasBottles ? `${saleCase} cases (${saleBottles} bottles)` : `${saleCase} cases`}`);
    parts.push(`Closing stock: ${closingStock}`);

    showMessage('searchMessage', parts.join(' · '), 'success', { persist: true });
}

function announceProduct(row, matchCount = 1) {
    const code = productCode(row);
    const saleCase = formatNumber(row['Sale Case']);
    const saleBottles = formatNumber(row['Sale Btls.']);
    const closingStock = formatNumber(row['Closing Stock']);
    const saleText = Number(row['Sale Btls.']) > 0
        ? `${saleCase} cases, ${saleBottles} bottles`
        : `${saleCase} cases`;
    const prefix = matchCount > 1 ? `${matchCount} products match. ` : '';

    announce(`${prefix}Product ${code} found. Sale ${saleText}. Closing stock ${closingStock}.`);
}

function renderSearchResults(matches, query) {
    const container = document.getElementById('searchResults');
    if (!container) {
        return;
    }

    container.textContent = '';
    if (!matches.length) {
        container.hidden = true;
        return;
    }

    const list = document.createElement('div');
    list.className = 'search-results';

    matches.forEach(row => {
        const code = productCode(row);
        const description = String(row['Item Description'] || '').trim();
        const saleCase = formatNumber(row['Sale Case']);
        const saleBottles = formatNumber(row['Sale Btls.']);
        const closingStock = formatNumber(row['Closing Stock']);
        const hasBottles = Number(row['Sale Btls.']) > 0;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-result';
        button.dataset.code = code;

        const main = document.createElement('span');
        main.className = 'search-result-main';

        const codeElement = document.createElement('span');
        codeElement.className = 'search-result-code';
        appendHighlightedText(codeElement, code, query);
        main.appendChild(codeElement);

        if (description) {
            const descriptionElement = document.createElement('span');
            descriptionElement.className = 'search-result-description';
            appendHighlightedText(descriptionElement, description, query);
            main.appendChild(descriptionElement);
        }

        const meta = document.createElement('span');
        meta.className = 'search-result-meta';
        meta.textContent = `${hasBottles ? `${saleCase} cases (${saleBottles} btls)` : `${saleCase} cases`} · Closing ${closingStock}`;

        button.appendChild(main);
        button.appendChild(meta);
        button.addEventListener('click', () => {
            document.getElementById('searchInput').value = code;
            clearProductFilter();
            searchProduct({ query: code, announceResult: false });
            scrollToProduct(code);
        });

        list.appendChild(button);
    });

    container.appendChild(list);
    container.hidden = false;
}

function clearSearchResults() {
    const container = document.getElementById('searchResults');
    if (!container) {
        return;
    }
    container.textContent = '';
    container.hidden = true;
}

function clearSearch(options = {}) {
    const { focus = true } = options;
    const input = document.getElementById('searchInput');
    input.value = '';
    clearMessage('searchMessage');
    clearSearchResults();
    setProductSearchQuery('');
    updateSearchClearButton();
    renderRecentSearches();
    if (focus) {
        input.focus();
    }
}

function handleSearchInput() {
    clearMessage('searchMessage');
    clearSearchResults();
    setProductSearchQuery('');
    updateSearchClearButton();
    renderRecentSearches();
}

function updateSearchClearButton() {
    const input = document.getElementById('searchInput');
    const button = document.getElementById('clearSearchBtn');
    if (input && button) {
        button.hidden = !input.value.trim();
    }
}

function loadRecentSearches() {
    try {
        const raw = localStorage.getItem(RECENT_SEARCH_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter(value => typeof value === 'string' && value.trim())
            .map(value => value.trim())
            .slice(0, MAX_RECENT_SEARCHES);
    } catch (error) {
        return [];
    }
}

function saveRecentSearch(query) {
    const value = String(query || '').trim();
    if (!value) {
        return;
    }

    const searches = loadRecentSearches().filter(item => item.toLowerCase() !== value.toLowerCase());
    searches.unshift(value);

    try {
        localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)));
    } catch (error) {
        // Recent searches are a convenience; storage may be unavailable.
    }
}

function renderRecentSearches() {
    const container = document.getElementById('recentSearches');
    const input = document.getElementById('searchInput');
    if (!container || !input) {
        return;
    }

    const searches = loadRecentSearches();
    container.textContent = '';

    if (!searches.length || input.value.trim()) {
        container.hidden = true;
        return;
    }

    const label = document.createElement('span');
    label.className = 'recent-label';
    label.textContent = 'Recent';
    container.appendChild(label);

    searches.forEach(query => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recent-chip';
        button.textContent = query;
        button.addEventListener('click', () => {
            input.value = query;
            searchProduct({ query, announceResult: false });
        });
        container.appendChild(button);
    });

    container.hidden = false;
}

function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : String(value ?? 0);
}
