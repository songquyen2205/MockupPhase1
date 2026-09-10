const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.goto('file:///C:/Users/Song%20Quyen/Hammer/BA_NOTE/06_Prototypes/Phase_1_MVP/index.html', { waitUntil: 'networkidle0' });
  
  // Set language to vi and reload
  await page.evaluate(() => { localStorage.setItem('appLang', 'vi'); });
  await page.reload({ waitUntil: 'networkidle0' });
  
  // Click on a job to open drawer
  try {
     await page.click('button[data-action="job-drawer"]');
     await new Promise(r => setTimeout(r, 1000));
     await page.screenshot({ path: 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/screenshot_vi_drawer.png' });
     console.log("Drawer opened and screenshot taken.");
  } catch (e) {
     console.error("Failed to click job drawer: ", e);
  }

  await browser.close();
})();
