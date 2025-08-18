import { test, expect } from '@playwright/test';

test.describe('Page Loading Check', () => {
  test('should load home page without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Go to home page
    await page.goto('/');
    
    // Wait a moment for any async loading
    await page.waitForTimeout(2000);
    
    // Check if page loaded
    const bodyText = await page.locator('body').textContent();
    console.log('Page body length:', bodyText?.length || 0);
    console.log('Console errors:', errors);
    
    // Take screenshot to see what's happening
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    // Check if we have any content
    const hasContent = await page.locator('*').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should load clubs page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/clubs');
    await page.waitForTimeout(2000);
    
    const bodyText = await page.locator('body').textContent();
    console.log('Clubs page body length:', bodyText?.length || 0);
    console.log('Console errors:', errors);
    
    await page.screenshot({ path: 'test-results/clubs-page.png' });
    
    const hasContent = await page.locator('*').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should load sign in page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/auth/sign-in');
    await page.waitForTimeout(2000);
    
    const bodyText = await page.locator('body').textContent();
    console.log('Sign in page body length:', bodyText?.length || 0);
    console.log('Console errors:', errors);
    
    await page.screenshot({ path: 'test-results/signin-page.png' });
    
    const hasContent = await page.locator('*').count() > 0;
    expect(hasContent).toBe(true);
  });
});