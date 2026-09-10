const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('file:///C:/Users/Song%20Quyen/Hammer/BA_NOTE/06_Prototypes/Phase_1_MVP/index.html', { waitUntil: 'networkidle0' });
  
  // switch to CMS section 4
  await page.evaluate(() => {
    switchPerspective('cms');
    switchCmsSection(4);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/scratch/screenshot_cms_data_sources.png' });

  // switch to Keyword Tab
  await page.evaluate(() => {
    switchSourceTab('keywords');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/scratch/screenshot_cms_data_sources_kw.png' });

  await browser.close();
  console.log("Screenshots taken.");
})();
