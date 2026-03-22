const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let issuesFound = 0;

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.html')) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find <button> without (click), type="submit", or routerLink
    const buttonRegex = /<button\s+([^>]+)>/g;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const attrs = match[1];
      if (!attrs.includes('(click)') && !attrs.includes('type="submit"') && !attrs.includes('routerLink')) {
        console.log(`Potential broken button in ${filePath}: <button ${attrs}>`);
        issuesFound++;
      }
    }

    // Find <a> without href, routerLink, or (click)
    const aRegex = /<a\s+([^>]+)>/g;
    while ((match = aRegex.exec(content)) !== null) {
      const attrs = match[1];
      if (!attrs.includes('href') && !attrs.includes('routerLink') && !attrs.includes('(click)')) {
        console.log(`Potential broken link in ${filePath}: <a ${attrs}>`);
        issuesFound++;
      }
    }
  }
});

console.log(`Found ${issuesFound} potential issues.`);
