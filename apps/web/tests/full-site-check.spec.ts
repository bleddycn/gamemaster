import { test, expect } from '@playwright/test';

test.describe('Full Site Navigation Check', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log(`Page error: ${error.message}`);
    });
  });

  test('should load home page', async ({ page }) => {
    console.log('Testing home page...');
    const response = await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/home-page-check.png', fullPage: true });
    
    // Check if page has content
    const html = await page.content();
    console.log('HTML length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    
    // Check for basic page structure
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content length:', bodyContent?.length || 0);
    
    // Check if there's any visible text
    const visibleText = await page.locator('body').allTextContents();
    console.log('Visible text items:', visibleText.length);
    
    expect(response?.status()).toBeLessThan(400);
  });

  test('should load clubs page', async ({ page }) => {
    console.log('Testing clubs page...');
    const response = await page.goto('http://localhost:3000/clubs', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/clubs-page-check.png', fullPage: true });
    
    // Check page content
    const html = await page.content();
    console.log('HTML length:', html.length);
    
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content:', bodyContent?.substring(0, 200) || 'No content');
  });

  test('should load sign-in page', async ({ page }) => {
    console.log('Testing sign-in page...');
    const response = await page.goto('http://localhost:3000/auth/sign-in', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/signin-page-check.png', fullPage: true });
    
    // Check page content
    const html = await page.content();
    console.log('HTML length:', html.length);
    
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content:', bodyContent?.substring(0, 200) || 'No content');
  });

  test('should load admin templates page', async ({ page }) => {
    console.log('Testing admin templates page...');
    const response = await page.goto('http://localhost:3000/admin/templates', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/admin-templates-check.png', fullPage: true });
    
    // Check page content
    const html = await page.content();
    console.log('HTML length:', html.length);
  });

  test('should load a specific club page', async ({ page }) => {
    console.log('Testing specific club page (Cavan GAA)...');
    const response = await page.goto('http://localhost:3000/clubs/cavan-gaa', { waitUntil: 'networkidle' });
    
    console.log('Response status:', response?.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/club-detail-check.png', fullPage: true });
    
    // Check page content
    const html = await page.content();
    console.log('HTML length:', html.length);
  });

  test('check if Next.js is running', async ({ page }) => {
    console.log('Checking if Next.js is responding...');
    
    try {
      // Try to access the Next.js build ID endpoint
      const response = await page.goto('http://localhost:3000/_next/static/chunks/webpack.js', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      console.log('Next.js webpack chunk status:', response?.status());
      
      if (response && response.status() === 200) {
        console.log('✓ Next.js is serving static assets');
      } else {
        console.log('✗ Next.js static assets not accessible');
      }
    } catch (error) {
      console.log('✗ Cannot reach Next.js server:', error.message);
    }
  });

  test('check API connectivity', async ({ page }) => {
    console.log('Checking if API is accessible...');
    
    const response = await page.goto('http://localhost:4000/healthz', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('API health check status:', response?.status());
    
    if (response && response.status() === 200) {
      const content = await page.textContent('body');
      console.log('API response:', content);
    }
  });
});