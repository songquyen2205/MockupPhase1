const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///C:/Users/Song%20Quyen/Hammer/BA_NOTE/06_Prototypes/Phase_1_MVP/test_translate.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'test_translate.png' });
  await browser.close();
  console.log("Screenshot taken.");
})();
