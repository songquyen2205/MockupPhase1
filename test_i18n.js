const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  // Go to page
  await page.goto('file:///C:/Users/Song%20Quyen/Hammer/BA_NOTE/06_Prototypes/Phase_1_MVP/index.html', { waitUntil: 'networkidle0' });
  
  // Set language to vi and reload
  await page.evaluate(() => {
    localStorage.setItem('appLang', 'vi');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  
  // Take screenshot
  await page.screenshot({ path: 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/screenshot_vi_cms.png' });

  // Switch to Dancer App mode to test mobile feed
  await page.evaluate(() => {
    document.getElementById('mode-dancer').click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/screenshot_vi_dancer.png' });

  await browser.close();
  console.log("Screenshots taken.");
})();
