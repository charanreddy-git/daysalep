const { test, expect } = require('@playwright/test');
const { uploadReport } = require('./helpers');

test.describe('report navigation', () => {
    test('switches tabs by click and keyboard', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        await page.click('#tabUbBalance');
        await expect(page.locator('#balanceSection')).toBeVisible();
        await expect(page.locator('#todaySection')).toBeHidden();
        await expect(page.locator('#tabUbBalance')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#tabUbToday')).toHaveAttribute('tabindex', '-1');

        await page.focus('#tabUbBalance');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('#tabCheersToday')).toBeFocused();
        await expect(page.locator('#cheersTodaySection')).toBeVisible();

        await page.keyboard.press('End');
        await expect(page.locator('#tabCheersBalance')).toBeFocused();
        await expect(page.locator('#cheersBalanceSection')).toBeVisible();

        await page.keyboard.press('Home');
        await expect(page.locator('#tabUbToday')).toBeFocused();
        await expect(page.locator('#todaySection')).toBeVisible();
    });

    test('copies the active report text', async ({ page }) => {
        await page.goto('/');
        await uploadReport(page);

        const copyButton = page.locator('[data-copy-target="todayContent"]');
        await copyButton.click();

        await expect(copyButton.locator('.copy-label')).toHaveText('Copied');
        await expect(copyButton).toHaveClass(/copied/);

        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard).toContain('INDDay/Cum');
        expect(clipboard).toContain('UBDay');
    });
});
