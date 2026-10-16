function renderResult(result) {
    document.getElementById('todayContent').textContent = result.sales?.report_text || 'No sales report available';
    document.getElementById('balanceContent').textContent = result.stock?.report_text || 'No opening balance report available';
    document.getElementById('cheersTodayContent').textContent = result.cheers_sales?.report_text || 'No CHEERS sales report available';
    document.getElementById('cheersBalanceContent').textContent = result.cheers_stock?.report_text || 'No CHEERS opening balance report available';
}

function clearResult() {
    document.getElementById('todayContent').textContent = 'No data available';
    document.getElementById('balanceContent').textContent = 'No data available';
    document.getElementById('cheersTodayContent').textContent = 'No data available';
    document.getElementById('cheersBalanceContent').textContent = 'No data available';
}

function showSection(section) {
    document.getElementById('todayBtn').classList.toggle('active', section === 'today');
    document.getElementById('balanceBtn').classList.toggle('active', section === 'balance');
    document.getElementById('todaySection').style.display = section === 'today' ? 'block' : 'none';
    document.getElementById('balanceSection').style.display = section === 'balance' ? 'block' : 'none';
}

function showCheersSection(section) {
    document.getElementById('cheersTodayBtn').classList.toggle('active', section === 'today');
    document.getElementById('cheersBalanceBtn').classList.toggle('active', section === 'balance');
    document.getElementById('cheersTodaySection').style.display = section === 'today' ? 'block' : 'none';
    document.getElementById('cheersBalanceSection').style.display = section === 'balance' ? 'block' : 'none';
}

function showMode(mode) {
    const isUB = mode === 'ub';
    document.getElementById('ubBtn').classList.toggle('active', isUB);
    document.getElementById('cheersBtn').classList.toggle('active', !isUB);

    document.getElementById('ubToggleSection').style.display = isUB ? 'block' : 'none';
    document.getElementById('todaySection').style.display = isUB ? 'block' : 'none';
    document.getElementById('balanceSection').style.display = 'none';

    document.getElementById('cheersToggleSection').style.display = isUB ? 'none' : 'block';
    document.getElementById('cheersTodaySection').style.display = isUB ? 'none' : 'block';
    document.getElementById('cheersBalanceSection').style.display = 'none';

    if (isUB) {
        document.getElementById('todayBtn').classList.add('active');
        document.getElementById('balanceBtn').classList.remove('active');
    } else {
        document.getElementById('cheersTodayBtn').classList.add('active');
        document.getElementById('cheersBalanceBtn').classList.remove('active');
    }
}

function copyToClipboard(content, successId) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content)
            .then(() => showCopySuccess(successId))
            .catch(() => fallbackCopy(content, successId));
        return;
    }

    fallbackCopy(content, successId);
}

function fallbackCopy(text, successId) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showCopySuccess(successId);
    } catch (error) {
        console.error('Copy failed:', error);
    }

    document.body.removeChild(textArea);
}

function showCopySuccess(successId) {
    const element = document.getElementById(successId);
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2000);
}

function enableSections() {
    document.getElementById('modeSection').classList.remove('disabled');
    document.getElementById('searchSection').classList.remove('disabled');
    document.getElementById('ubToggleSection').classList.remove('disabled');
    document.getElementById('todaySection').classList.remove('disabled');
    document.getElementById('balanceSection').classList.remove('disabled');
    document.getElementById('cheersToggleSection').classList.remove('disabled');
    document.getElementById('cheersTodaySection').classList.remove('disabled');
    document.getElementById('cheersBalanceSection').classList.remove('disabled');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}
