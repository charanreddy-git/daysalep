document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadAnotherButton = document.getElementById('uploadAnotherBtn');
    const searchInput = document.getElementById('searchInput');

    const openFilePicker = () => fileInput.click();

    uploadArea.addEventListener('click', openFilePicker);
    uploadArea.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
        }
    });

    uploadAnotherButton.addEventListener('click', openFilePicker);

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (file) {
            handleFile(file);
        }
    });

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
        const files = event.dataTransfer && event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });

    document.addEventListener('paste', event => {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return;
        }
        const files = event.clipboardData && event.clipboardData.files;
        if (files && files.length > 0) {
            event.preventDefault();
            handleFile(files[0]);
        }
    });

    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchProduct();
        } else if (event.key === 'Escape' && searchInput.value) {
            event.preventDefault();
            clearSearch();
        }
    });

    searchInput.addEventListener('input', handleSearchInput);
    document.getElementById('clearSearchBtn').addEventListener('click', () => clearSearch());

    const productFilter = document.getElementById('productFilter');
    productFilter.addEventListener('input', () => setProductFilter(productFilter.value));
    productFilter.addEventListener('keydown', event => {
        if (event.key === 'Escape' && productFilter.value) {
            event.preventDefault();
            clearProductFilter();
        }
    });
    document.getElementById('clearProductFilter').addEventListener('click', () => {
        clearProductFilter();
        productFilter.focus();
    });

    document.addEventListener('keydown', event => {
        if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        const target = event.target;
        const isTyping = target && (
            target.tagName === 'INPUT'
            || target.tagName === 'TEXTAREA'
            || target.tagName === 'SELECT'
            || target.isContentEditable
        );

        if (isTyping || document.getElementById('workspace').hidden) {
            return;
        }

        event.preventDefault();
        searchInput.focus();
        searchInput.select();
    });

    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectView(tab.dataset.view));
        tab.addEventListener('keydown', event => {
            let nextIndex = null;

            if (event.key === 'ArrowRight') {
                nextIndex = (index + 1) % tabs.length;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = tabs.length - 1;
            }

            if (nextIndex === null) {
                return;
            }

            event.preventDefault();
            const nextTab = tabs[nextIndex];
            selectView(nextTab.dataset.view);
            nextTab.focus();
        });
    });

    document.querySelector('.search-button').addEventListener('click', () => searchProduct());

    document.querySelectorAll('.sort-button').forEach(button => {
        button.addEventListener('click', () => sortProductTable(button.dataset.sort));
    });

    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => copyReport(button));
    });

    updateSearchClearButton();
    renderRecentSearches();
    initUi();
});
