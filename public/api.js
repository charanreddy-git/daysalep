function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().match(/\.(html|htm|pdf)$/)) {
        showMessage('uploadMessage', 'Please select a .htm, .html, or .pdf file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showLoading(true);

    fetch('/api/parse', {
        method: 'POST',
        body: formData
    })
        .then(async response => {
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || `Upload failed with status ${response.status}`);
            }
            return payload.result;
        })
        .then(result => {
            currentResult = result;
            renderResult(result);
            enableSections();
            showMessage(
                'uploadMessage',
                `Processed ${result.sourceType.toUpperCase()} file [ Date: ${result.conversion.extractedDate} ]`,
                'success'
            );
        })
        .catch(error => {
            currentResult = null;
            clearResult();
            showMessage('uploadMessage', `Upload failed: ${error.message}`, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function searchProduct() {
    const productCode = document.getElementById('searchInput').value.trim().toUpperCase();
    if (!productCode) {
        showMessage('searchMessage', 'Please enter a product code.', 'error');
        return;
    }

    if (!currentResult || !Array.isArray(currentResult.rows)) {
        showMessage('searchMessage', 'Upload a file before searching.', 'error');
        return;
    }

    const row = currentResult.rows.find(item => String(item['Product Code'] || '').toUpperCase() === productCode);
    if (!row) {
        showMessage('searchMessage', `Product ${productCode} not found.`, 'error');
        return;
    }

    showMessage('searchMessage', `Product: ${productCode} | Sale Case: ${row['Sale Case'] || 0}`, 'success');
}
