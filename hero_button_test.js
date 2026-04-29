const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Step 1: Navigate
  console.log('Navigating to IMDB page...');
  await page.goto('https://www.imdb.com/title/tt14186672/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Step 2: Wait for hero title
  console.log('Waiting for hero title...');
  await page.waitForSelector('[data-testid="hero__pageTitle"]', { timeout: 15000 });
  await page.waitForTimeout(2000); // extra settle time

  // Step 3: Inject button
  console.log('Injecting button...');
  await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="hero__pageTitle"]');
    const titleWrapper = h1.parentElement;
    const metaList = titleWrapper?.querySelector('ul');
    const anchor = metaList || h1;

    const wrapper = document.createElement('div');
    wrapper.id = 'playimdb-wrapper';
    wrapper.style.cssText = 'margin-top: 12px;';

    const btn = document.createElement('a');
    btn.id = 'playimdb-btn';
    btn.href = 'https://www.playimdb.com/title/tt14186672/';
    btn.target = '_blank';
    btn.innerHTML = '&#9654; Play on PlayIMDB';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background-color:#F5C518;color:#000;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:4px;cursor:pointer;border:none;line-height:1;letter-spacing:0.3px;';

    wrapper.appendChild(btn);
    anchor.insertAdjacentElement('afterend', wrapper);
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Wait a moment for scroll
  await page.waitForTimeout(1500);

  // Step 4: Screenshot focused on hero section
  console.log('Taking screenshot...');
  const heroEl = await page.$('[data-testid="hero__pageTitle"]');
  let screenshotPath = path.join(__dirname, 'hero_button_result.png');

  // Try to get the hero section parent for a wider crop
  await page.evaluate(() => {
    const wrapper = document.getElementById('playimdb-wrapper');
    if (wrapper) wrapper.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Take a clipped screenshot around the hero area
  const heroBox = await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="hero__pageTitle"]');
    const btn = document.getElementById('playimdb-wrapper');
    if (!h1 || !btn) return null;

    const h1Rect = h1.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const top = Math.max(0, h1Rect.top - 60);
    const bottom = btnRect.bottom + 60;
    return {
      x: 0,
      y: top,
      width: 1280,
      height: bottom - top
    };
  });

  if (heroBox && heroBox.height > 0) {
    await page.screenshot({ path: screenshotPath, clip: heroBox });
  } else {
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }

  // Step 5: Inspect DOM for analysis
  const analysis = await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="hero__pageTitle"]');
    const metaList = h1?.parentElement?.querySelector('ul');
    const wrapper = document.getElementById('playimdb-wrapper');
    const btn = document.getElementById('playimdb-btn');

    if (!wrapper || !btn) return { error: 'Button not found' };

    const wrapperRect = wrapper.getBoundingClientRect();
    const h1Rect = h1?.getBoundingClientRect();
    const metaRect = metaList?.getBoundingClientRect();

    // Check what element the wrapper was inserted after
    const prevSibling = wrapper.previousElementSibling;
    const prevSiblingTag = prevSibling ? prevSibling.tagName : 'none';
    const prevSiblingTestId = prevSibling ? prevSibling.getAttribute('data-testid') : 'none';

    // Check display of wrapper (block vs inline)
    const wrapperDisplay = window.getComputedStyle(wrapper).display;
    const btnDisplay = window.getComputedStyle(btn).display;

    return {
      wrapperInsertedAfter: `${prevSiblingTag} [data-testid="${prevSiblingTestId}"]`,
      wrapperDisplay,
      btnDisplay,
      wrapperTop: Math.round(wrapperRect.top),
      wrapperLeft: Math.round(wrapperRect.left),
      wrapperWidth: Math.round(wrapperRect.width),
      wrapperHeight: Math.round(wrapperRect.height),
      h1Bottom: h1Rect ? Math.round(h1Rect.bottom) : null,
      metaBottom: metaRect ? Math.round(metaRect.bottom) : null,
      gapFromMeta: metaRect ? Math.round(wrapperRect.top - metaRect.bottom) : null,
      gapFromH1: h1Rect ? Math.round(wrapperRect.top - h1Rect.bottom) : null,
      wrapperMarginTop: wrapper.style.marginTop,
      btnText: btn.textContent,
      btnBg: window.getComputedStyle(btn).backgroundColor,
    };
  });

  console.log('\n=== VISUAL ANALYSIS ===');
  console.log(JSON.stringify(analysis, null, 2));
  console.log(`\nScreenshot saved to: ${screenshotPath}`);

  await browser.close();
})();
