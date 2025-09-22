import { test, expect } from '@playwright/test';

test.describe('Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Mawred/);
    
    // Check for main navigation or key elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    
    // Check for navigation landmarks
    const navigation = page.locator('nav').first();
    if (await navigation.count() > 0) {
      await expect(navigation).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});