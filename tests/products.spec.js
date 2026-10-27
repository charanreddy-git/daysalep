const { test, expect } = require('@playwright/test');
const { uploadReport, search } = require('./helpers');

test.describe('product table', () => {
    test('renders every product and sorts by column', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        const rows = page.locator('#productTableBody tr');
        await expect(rows).toHaveCount(6);
        await expect(rows.first()).toContainText('1607B5019GBS');

        await page.click('.sort-button[data-sort="code"]');
        await expect(rows.first()).toContainText('3143B5124GBS');
        await expect(page.locator('th:has(.sort-button[data-sort="code"])')).toHaveAttribute('aria-sort', 'descending');

        await page.click('.sort-button[data-sort="closingStock"]');
        await expect(rows.first()).toContainText('1661B5029GBS');
        await expect(page.locator('th:has(.sort-button[data-sort="closingStock"])')).toHaveAttribute('aria-sort', 'ascending');
    });

    test('filters the table and clears the filter', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await page.fill('#productFilter', 'KFL');
        await expect(page.locator('#productTableBody tr')).toHaveCount(1);
        await expect(page.locator('#productsSummary')).toContainText('1 shown');
        await expect(page.locator('#clearProductFilter')).toBeVisible();

        await page.click('#clearProductFilter');
        await expect(page.locator('#productTableBody tr')).toHaveCount(6);
        await expect(page.locator('#productFilter')).toHaveValue('');
        await expect(page.locator('#productsSummary')).not.toContainText('shown');
    });

    test('shows an empty state when no product matches the filter', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await page.fill('#productFilter', 'ZZZ');
        await expect(page.locator('#productTableEmpty')).toBeVisible();
        await expect(page.locator('#productTableEmpty')).toHaveText('No products match this filter.');
        await expect(page.locator('#productTableBody tr')).toHaveCount(0);
    });

    test('highlights matching text in the table', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, '500ML');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(5);
        await expect(page.locator('#productTableBody tr.search-match mark').first()).toHaveText('500ML');
    });
});
