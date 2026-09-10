const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');
const strings = new Set();
const regex = /'([^'\\]+)'|"([^"\\]+)"/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const str = match[1] || match[2];
  if (str && str.length > 3 && str.includes(' ') && !str.includes('<') && !str.match(/^[a-z\-]+$/)) {
     strings.add(str.trim());
  }
}
fs.writeFileSync('strings.txt', Array.from(strings).join('\n'));
