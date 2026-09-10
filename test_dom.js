const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
    try {
        console.log("Initial load complete.");
        const mobileView = dom.window.document.getElementById('view-mobile');
        const cmsView = dom.window.document.getElementById('view-cms');
        
        console.log('Mobile view classes:', mobileView.className);
        console.log('CMS view classes:', cmsView.className);
        
        console.log("Calling switchPerspective('cms')...");
        dom.window.switchPerspective('cms');
        
        console.log('Mobile view classes:', mobileView.className);
        console.log('CMS view classes:', cmsView.className);
        
        console.log("Calling switchCmsSection(2)...");
        dom.window.switchCmsSection(2);
        
        const sec1 = dom.window.document.getElementById('cms-section-1');
        const sec2 = dom.window.document.getElementById('cms-section-2');
        console.log('Sec 1 classes:', sec1.className);
        console.log('Sec 2 classes:', sec2.className);
        
    } catch(e) {
        console.error("Error executing DOM test:", e);
    }
}, 500);
