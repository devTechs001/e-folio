const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateChecksums() {
  const distDir = 'dist';
  
  if (!fs.existsSync(distDir)) {
    console.log('Dist directory does not exist. Build project first.');
    return;
  }

  const files = fs.readdirSync(distDir);
  const checksums = {};

  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
      const filePath = path.join(distDir, file);
      const content = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      checksums[file] = hash;
      console.log(`${file}: ${hash}`);
    }
  });

  // Write checksums to file
  const checksumsFilePath = path.join(distDir, 'checksums.json');
  fs.writeFileSync(checksumsFilePath, JSON.stringify(checksums, null, 2));
  console.log(`\nChecksums saved to ${checksumsFilePath}`);
}

generateChecksums();