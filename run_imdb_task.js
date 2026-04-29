const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Step 1: Navigate
  console.log('Navigating to IMDB page...');
  await page.goto('https://www.imdb.com/title/tt14186672/', { waitUntil: 'domcontentloaded' });

  // Step 2: Wait for page title to be visible
  console.log('Waiting for hero title...');
  await page.waitForSelector('[data-testid="hero__pageTitle"]', { state: 'visible', timeout: 30000 });
  console.log('Title visible!');

  // Extra wait to let dynamic content settle
  await page.waitForTimeout(2000);

  // Step 3: Inject CSS
  console.log('Injecting CSS...');
  await page.addStyleTag({
    content: `
#playimdb-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 20px;
  background-color: #F5C518;
  color: #000000;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border: none;
  line-height: 1;
  letter-spacing: 0.3px;
}
`
  });

  // Step 4: Inject the button via JavaScript
  console.log('Injecting button...');
  const result = await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="hero__pageTitle"]');
    if (!h1) return { success: false, error: 'h1 not found' };

    const titleWrapper = h1.parentElement;
    const metaList = titleWrapper?.querySelector('ul');
    const anchor = metaList || h1;

    const btn = document.createElement('a');
    btn.id = 'playimdb-btn';
    btn.href = 'https://www.playimdb.com/title/tt14186672/';
    btn.target = '_blank';
    btn.innerHTML = '<span>&#9654;</span><span>Play on PlayIMDB</span>';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:10px 20px;background-color:#F5C518;color:#000;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:4px;cursor:pointer;border:none;line-height:1;letter-spacing:0.3px;';

    anchor.insertAdjacentElement('afterend', btn);
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Gather context info
    const btnRect = btn.getBoundingClientRect();
    const prevSibling = btn.previousElementSibling;
    const nextSibling = btn.nextElementSibling;

    return {
      success: true,
      anchorTag: anchor.tagName,
      anchorTestId: anchor.getAttribute('data-testid'),
      btnTop: btnRect.top,
      btnLeft: btnRect.left,
      btnWidth: btnRect.width,
      btnHeight: btnRect.height,
      prevSiblingTag: prevSibling ? prevSibling.tagName : null,
      prevSiblingTestId: prevSibling ? prevSibling.getAttribute('data-testid') : null,
      prevSiblingText: prevSibling ? prevSibling.innerText?.slice(0, 100) : null,
      nextSiblingTag: nextSibling ? nextSibling.tagName : null,
      nextSiblingTestId: nextSibling ? nextSibling.getAttribute('data-testid') : null,
      nextSiblingText: nextSibling ? nextSibling.innerText?.slice(0, 100) : null,
      h1Text: h1.innerText,
    };
  });

  console.log('Button injection result:', JSON.stringify(result, null, 2));

  // Wait for scroll to settle
  await page.waitForTimeout(1500);

  // Step 5: Take screenshot
  console.log('Taking screenshot...');
  const screenshotPath = path.join(__dirname, 'imdb_screenshot.png');
  await page.screenshot({
    path: screenshotPath,
    fullPage: false,
  });
  console.log('Screenshot saved to:', screenshotPath);

  // Also take a focused screenshot around the button
  const focusedPath = path.join(__dirname, 'imdb_button_focused.png');
  const btnElement = await page.$('#playimdb-btn');
  if (btnElement) {
    // Get button bounding box and expand area around it
    const box = await btnElement.boundingBox();
    console.log('Button bounding box:', box);

    await page.screenshot({
      path: focusedPath,
      clip: {
        x: Math.max(0, box.x - 40),
        y: Math.max(0, box.y - 200),
        width: Math.min(1280, box.width + 200),
        height: Math.min(900, box.height + 300),
      }
    });
    console.log('Focused screenshot saved to:', focusedPath);
  }

  await browser.close();
  console.log('Done.');
})();
