const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('i18n.js')) {
    html = html.replace('</body>', '<script defer src="i18n.js"></script></body>');
    fs.writeFileSync('index.html', html);
    console.log("Injected i18n.js");
} else {
    console.log("Already injected");
}
