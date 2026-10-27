const { test, expect } = require('@playwright/test');
const { uploadFixture, uploadReport } = require('./helpers');

test.describe('upload', () => {
    test('shows the upload area and versioned assets on first load', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('#uploadSection')).toBeVisible();
        await expect(page.locator('#workspace')).toBeHidden();
        await expect(page.locator('#reportBar')).toBeHidden();
        await expect(page.locator('#uploadHint')).toContainText('4.5 MB');
        await expect(page.locator('link[href^="styles.css"]')).toHaveAttribute('href', 'styles.css?v=4');
        await expect(page.locator('script[src^="ui.js"]')).toHaveAttribute('src', 'ui.js?v=4');
    });

    test('uploads a report and shows summaries, tabs, and products', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await expect(page.locator('#uploadSection')).toBeHidden();
        await expect(page.locator('#reportFile')).toHaveText('report.html');
        await expect(page.locator('#reportMeta')).toContainText('25/10/2026');
        await expect(page.locator('#reportMeta')).toContainText('6 rows');

        await expect(page.locator('[data-summary-value="ub-today"]')).toHaveText('28');
        await expect(page.locator('[data-summary-value="ub-balance"]')).toHaveText('26');
        await expect(page.locator('[data-summary-value="cheers-today"]')).toHaveText('2');
        await expect(page.locator('[data-summary-value="cheers-balance"]')).toHaveText('3');

        await expect(page.locator('#todaySection')).toBeVisible();
        await expect(page.locator('#productTableBody tr')).toHaveCount(6);
        await expect(page.locator('#productsSummary')).toContainText('6 products');
    });

    test('rejects unsupported file types', async ({ page }) => {
        await page.goto('/');

        await page.setInputFiles('#fileInput', {
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not a report')
        });

        await expect(page.locator('#uploadMessage')).toContainText('Please select an HTML, HTM, or PDF file.');
        await expect(page.locator('#workspace')).toBeHidden();
    });

    test('rejects files over the 4.5 MB limit before uploading', async ({ page }) => {
        await page.goto('/');

        let parseRequests = 0;
        page.on('request', request => {
            if (request.url().includes('/api/parse')) {
                parseRequests += 1;
            }
        });

        await page.setInputFiles('#fileInput', {
            name: 'oversized.html',
            mimeType: 'text/html',
            buffer: Buffer.alloc(4.5 * 1024 * 1024 + 1024, 'a')
        });

        await expect(page.locator('#uploadMessage')).toContainText('maximum upload size is 4.5 MB');
        expect(parseRequests).toBe(0);
    });

    test('a failed upload keeps the last good report', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await uploadFixture(page, 'no-table.html');
        await expect(page.locator('#uploadMessage')).toContainText('Table with "Slno" header not found');

        await expect(page.locator('#reportBar')).toBeVisible();
        await expect(page.locator('#reportFile')).toHaveText('report.html');
        await expect(page.locator('[data-summary-value="ub-today"]')).toHaveText('28');
        await expect(page.locator('#productTableBody tr')).toHaveCount(6);
    });

    test('a zero-row upload keeps the last good report', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await uploadFixture(page, 'empty-table.html');
        await expect(page.locator('#uploadMessage')).toContainText('No product rows were found');

        await expect(page.locator('#reportBar')).toBeVisible();
        await expect(page.locator('[data-summary-value="ub-today"]')).toHaveText('28');
        await expect(page.locator('#productTableBody tr')).toHaveCount(6);
    });
});
