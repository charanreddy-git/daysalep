const { test, expect } = require('@playwright/test');
const { uploadReport } = require('./helpers');

test.use({ viewport: { width: 390, height: 844 } });

test.describe('mobile layout', () => {
    test('does not overflow and uses two summary columns', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            gridColumns: getComputedStyle(document.querySelector('.summary-tabs')).gridTemplateColumns.split(' ').length,
            searchPosition: getComputedStyle(document.getElementById('searchSection')).position,
            tableOverflow: getComputedStyle(document.getElementById('productTableWrap')).overflowX
        }));

        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
        expect(metrics.gridColumns).toBe(2);
        expect(metrics.searchPosition).toBe('static');
        expect(['auto', 'scroll']).toContain(metrics.tableOverflow);
        await expect(page.locator('#productTableBody tr')).toHaveCount(6);
    });
});
