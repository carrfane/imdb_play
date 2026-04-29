const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to IMDB page...');
  await page.goto('https://www.imdb.com/title/tt14186672/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Wait a bit for any lazy-loaded content
  await page.waitForTimeout(3000);

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'imdb_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  // Run DOM inspection
  const domInfo = await page.evaluate(() => {
    const results = {};

    // Find hero title block
    const heroBlock = document.querySelector('[data-testid="hero-title-block"]');
    results.heroTitleBlock = heroBlock ? heroBlock.outerHTML.substring(0, 2000) : 'NOT FOUND';
    results.heroTitleBlockClass = heroBlock ? heroBlock.className : 'NOT FOUND';
    results.heroTitleBlockTag = heroBlock ? heroBlock.tagName : 'NOT FOUND';

    // Find hero section
    const hero = document.querySelector('[data-testid="hero-section"]');
    results.heroSection = hero ? hero.outerHTML.substring(0, 500) : 'NOT FOUND';

    // Find h1
    const h1 = document.querySelector('h1');
    results.h1 = h1 ? h1.outerHTML : 'NOT FOUND';
    results.h1Parent = h1 && h1.parentElement ? h1.parentElement.outerHTML.substring(0, 800) : 'NOT FOUND';
    results.h1ParentTestId = h1 && h1.parentElement ? h1.parentElement.getAttribute('data-testid') : 'NOT FOUND';
    results.h1ParentClass = h1 && h1.parentElement ? h1.parentElement.className : 'NOT FOUND';

    // Find watch/hero buttons and links
    const watchBtns = document.querySelectorAll('[data-testid*="watch"], [data-testid*="hero"] button, [data-testid*="hero"] a');
    results.watchHeroElements = [];
    watchBtns.forEach(el => {
      results.watchHeroElements.push({
        testId: el.getAttribute('data-testid'),
        tag: el.tagName,
        class: el.className.substring(0, 150),
        text: el.innerText?.substring(0, 100),
        href: el.href || null,
        outerHTML: el.outerHTML.substring(0, 300)
      });
    });

    // Also scan all data-testid attributes in the hero area
    const allTestIds = document.querySelectorAll('[data-testid]');
    results.allTestIds = [];
    allTestIds.forEach(el => {
      const tid = el.getAttribute('data-testid');
      if (tid && (tid.includes('hero') || tid.includes('watch') || tid.includes('title') || tid.includes('button'))) {
        results.allTestIds.push({
          testId: tid,
          tag: el.tagName,
          class: el.className.substring(0, 100)
        });
      }
    });

    // Find the section right below h1 - look for rating, year, metadata row
    const metaSection = document.querySelector('[data-testid="hero-rating-bar"]') ||
                        document.querySelector('[data-testid="hero-title-block__metadata"]') ||
                        document.querySelector('[data-testid="hero-title-block__title"]');
    results.metaSection = metaSection ? {
      testId: metaSection.getAttribute('data-testid'),
      outerHTML: metaSection.outerHTML.substring(0, 500)
    } : 'NOT FOUND';

    // Attempt to find buttons/CTAs in the hero area
    const heroEl = document.querySelector('[data-testid="hero-section"]') ||
                   document.querySelector('[data-testid="hero-title-block"]');
    if (heroEl) {
      const buttons = heroEl.querySelectorAll('button, a[role="button"]');
      results.heroButtons = [];
      buttons.forEach(btn => {
        results.heroButtons.push({
          tag: btn.tagName,
          testId: btn.getAttribute('data-testid'),
          text: btn.innerText?.substring(0, 80),
          class: btn.className.substring(0, 150),
          outerHTML: btn.outerHTML.substring(0, 300)
        });
      });
    }

    return results;
  });

  console.log('\n=== DOM INSPECTION RESULTS ===\n');
  console.log('--- hero-title-block ---');
  console.log('Tag:', domInfo.heroTitleBlockTag);
  console.log('Classes:', domInfo.heroTitleBlockClass);
  console.log('HTML (first 2000 chars):');
  console.log(domInfo.heroTitleBlock);

  console.log('\n--- hero-section ---');
  console.log(domInfo.heroSection);

  console.log('\n--- h1 ---');
  console.log(domInfo.h1);
  console.log('\n--- h1 parent ---');
  console.log('data-testid:', domInfo.h1ParentTestId);
  console.log('class:', domInfo.h1ParentClass);
  console.log('HTML:', domInfo.h1Parent);

  console.log('\n--- watch/hero elements ---');
  domInfo.watchHeroElements.forEach((el, i) => {
    console.log(`[${i}] testId="${el.testId}" tag=${el.tag} text="${el.text}"`);
    console.log(`    class: ${el.class}`);
    console.log(`    html: ${el.outerHTML}`);
  });

  console.log('\n--- all relevant data-testid values ---');
  domInfo.allTestIds.forEach(el => {
    console.log(`  ${el.testId} | ${el.tag} | ${el.class}`);
  });

  console.log('\n--- meta section ---');
  console.log(JSON.stringify(domInfo.metaSection, null, 2));

  console.log('\n--- hero buttons ---');
  if (domInfo.heroButtons) {
    domInfo.heroButtons.forEach((btn, i) => {
      console.log(`[${i}] tag=${btn.tag} testId="${btn.testId}" text="${btn.text}"`);
      console.log(`    class: ${btn.class}`);
      console.log(`    html: ${btn.outerHTML}`);
    });
  }

  await browser.close();
  console.log('\nDone.');
})();
