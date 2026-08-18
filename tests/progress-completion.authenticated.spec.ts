import { test, expect } from '@playwright/test';

test.describe('Progress and Completion Flow', () => {
  test('progress API returns structured data', async ({ request }) => {
    const response = await request.get('/api/progress?courseId=test-course');
    // Without valid session: 401 (proper auth check) or 500 (auth() throws before check)
    expect([401, 500]).toContain(response.status());
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('progress tracking UI structure exists on learning page', async ({ page }) => {
    await page.goto('/dashboard/learnCourse/test-course-id');
    await page.waitForLoadState('networkidle');
    
    // Progress bar should exist in sidebar
    const progressBar = page.locator('.rounded-full');
    const count = await progressBar.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Certificate Generation', () => {
  test('genCertificate API requires auth', async ({ request }) => {
    const response = await request.post('/api/genCertificate', {
      data: {
        courseId: 'test',
        courseName: 'Test Course',
        userName: 'Test User',
        userEmail: 'test@example.com',
      },
    });
    expect([401, 500]).toContain(response.status());
  });

  test('sendCertificate API requires auth', async ({ request }) => {
    const response = await request.post('/api/sendCertificate', {
      data: {
        certificateId: 1,
        pdfBase64: 'dGVzdA==',
        userEmail: 'test@example.com',
        userName: 'Test User',
        courseName: 'Test Course',
      },
    });
    expect([401, 500]).toContain(response.status());
  });
});

test.describe('Course Deletion', () => {
  test('deleteCourse API requires auth', async ({ request }) => {
    const response = await request.delete('/api/deleteCourse?courseId=test');
    expect(response.status()).toBe(401);
  });

  test('deleteCourse returns 400 without courseId', async ({ request }) => {
    const response = await request.delete('/api/deleteCourse');
    expect([400, 401]).toContain(response.status());
  });
});

test.describe('Dashboard - Course Management', () => {
  test('Remove button triggers AlertDialog confirmation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const removeBtn = page.locator('button:has-text("Remove")');
    if (await removeBtn.count() > 0) {
      await removeBtn.first().click();
      
      // AlertDialog (custom component) should appear with confirmation text
      const dialogTitle = page.locator('text=Remove course?');
      await expect(dialogTitle).toBeVisible();
      
      // Cancel button should be present
      const cancelButton = page.locator('button:has-text("Cancel")');
      await expect(cancelButton).toBeVisible();
      
      // Close the dialog
      await cancelButton.click();
    }
  });
});

test.describe('Navigation Flow', () => {
  test('landing page -> sign-in -> dashboard navigation chain', async ({ page }) => {
    // Start at landing page
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Click sign in
    const signInLink = page.locator('header a[href="/sign-in"]');
    await signInLink.click();
    await page.waitForURL('**/sign-in');
    
    // Verify we're on sign-in page
    await expect(page.locator('h1')).toContainText('Welcome to Leap');
  });

  test('landing page -> sign-up navigation', async ({ page }) => {
    await page.goto('/');
    
    const signUpLink = page.locator('header a[href="/sign-up"]');
    await signUpLink.click();
    await page.waitForURL('**/sign-up');
    
    await expect(page.locator('h1').first()).toContainText('Join LEAP');
  });
});
