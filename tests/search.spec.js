const { test, expect } = require('@playwright/test');
const { uploadReport, uploadReportAndWait, search } = require('./helpers');

test.describe('product search', () => {
    test('finds a product by exact code', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, '1661B5016GBS');

        await expect(page.locator('#searchMessage')).toContainText('Product 1661B5016GBS');
        await expect(page.locator('#searchMessage')).toContainText('Sale: 12 cases (144 bottles)');
        await expect(page.locator('#searchMessage')).toContainText('Closing stock: 8');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(1);
        await expect(page.locator('#productTableBody tr.search-match mark')).toContainText('1661B5016GBS');
    });

    test('matches partial descriptions and lists every match', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, 'KF');

        await expect(page.locator('#searchMessage')).toContainText('3 products match "KF"');
        await expect(page.locator('#searchResults .search-result')).toHaveCount(3);
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(3);
    });

    test('matches partial product codes', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, '1661B50');

        await expect(page.locator('#searchResults .search-result')).toHaveCount(3);
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(3);
    });

    test('selecting a search result narrows to that product', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, 'KF');
        await page.locator('#searchResults .search-result', { hasText: '1661B5029GBS' }).click();

        await expect(page.locator('#searchInput')).toHaveValue('1661B5029GBS');
        await expect(page.locator('#searchMessage')).toContainText('Product 1661B5029GBS');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(1);
    });

    test('clears the search and offers recent searches', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, 'KFL');
        await expect(page.locator('#clearSearchBtn')).toBeVisible();

        await page.click('#clearSearchBtn');
        await expect(page.locator('#searchInput')).toHaveValue('');
        await expect(page.locator('#searchMessage')).toBeHidden();
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(0);
        await expect(page.locator('#recentSearches')).toBeVisible();
        await expect(page.locator('#recentSearches .recent-chip')).toHaveText('KFL');

        await page.locator('#recentSearches .recent-chip').click();
        await expect(page.locator('#searchInput')).toHaveValue('KFL');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(1);
    });

    test('slash focuses search and Escape clears it', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await page.locator('body').click({ position: { x: 5, y: 5 } });
        await page.keyboard.press('/');
        await expect(page.locator('#searchInput')).toBeFocused();

        await page.keyboard.type('KFL');
        await page.keyboard.press('Enter');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(1);

        await page.keyboard.press('Escape');
        await expect(page.locator('#searchInput')).toHaveValue('');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(0);
    });

    test('search persists across tabs and a new upload', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await search(page, '1661B5016GBS');
        await page.click('#tabCheersToday');
        await expect(page.locator('#searchInput')).toHaveValue('1661B5016GBS');
        await expect(page.locator('#searchMessage')).toContainText('Closing stock: 8');

        await uploadReportAndWait(page);
        await expect(page.locator('#searchInput')).toHaveValue('1661B5016GBS');
        await expect(page.locator('#searchMessage')).toContainText('Product 1661B5016GBS');
        await expect(page.locator('#productTableBody tr.search-match')).toHaveCount(1);
        await expect(page.locator('#tabCheersToday')).toHaveAttribute('aria-selected', 'true');
    });
});
