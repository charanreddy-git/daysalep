let currentResult = null;

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    uploadArea.addEventListener('dragover', event => {
        event.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', event => {
        event.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    });

    document.getElementById('searchInput').addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            searchProduct();
        }
    });

    document.getElementById('ubBtn').addEventListener('click', () => showMode('ub'));
    document.getElementById('cheersBtn').addEventListener('click', () => showMode('cheers'));

    document.getElementById('todayBtn').addEventListener('click', () => showSection('today'));
    document.getElementById('balanceBtn').addEventListener('click', () => showSection('balance'));

    document.getElementById('cheersTodayBtn').addEventListener('click', () => showCheersSection('today'));
    document.getElementById('cheersBalanceBtn').addEventListener('click', () => showCheersSection('balance'));

    document.querySelector('.search-button').addEventListener('click', searchProduct);

    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', event => {
            const resultsBox = event.currentTarget.closest('.results-box');
            const contentElement = resultsBox.querySelector('.results-content');
            const successMap = {
                'todayContent': 'todaySuccess',
                'balanceContent': 'balanceSuccess',
                'cheersTodayContent': 'cheersTodaySuccess',
                'cheersBalanceContent': 'cheersBalanceSuccess'
            };
            const successId = successMap[contentElement.id];
            if (successId) {
                copyToClipboard(contentElement.textContent, successId);
            }
        });
    });
});
