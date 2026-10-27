const path = require('path');
const { expect } = require('@playwright/test');

const FIXTURES = path.join(__dirname, 'fixtures');

async function uploadFixture(page, filename) {
    await page.setInputFiles('#fileInput', path.join(FIXTURES, filename));
}

async function uploadReport(page) {
    await uploadFixture(page, 'report.html');
    await expect(page.locator('#reportBar')).toBeVisible();
    await expect(page.locator('[data-summary-value="ub-today"]')).toHaveText('28');
}

async function uploadReportAndWait(page) {
    const response = page.waitForResponse(request => (
        request.url().includes('/api/parse') && request.request().method() === 'POST'
    ));
    await uploadFixture(page, 'report.html');
    await response;
    await expect(page.locator('[data-summary-value="ub-today"]')).toHaveText('28');
}

async function search(page, query) {
    await page.fill('#searchInput', query);
    await page.press('#searchInput', 'Enter');
}

module.exports = {
    FIXTURES,
    uploadFixture,
    uploadReport,
    uploadReportAndWait,
    search
};
