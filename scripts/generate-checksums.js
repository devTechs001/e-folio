// scripts/generate-checksums.js
// This script generates checksums for built files to verify integrity
import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

function generateChecksums() {
  const distDir = 'dist';
  if (!existsSync(distDir)) {
    console.log('dist directory does not exist. Run build first.');
    return;
  }

  const files = readdirSync(distDir);
  const checksums = {};

  console.log('Generating checksums for distribution files...\n');

  files.forEach(file => {
    const filePath = join(distDir, file);
    if (statSync(filePath).isDirectory()) {
      // Process subdirectories recursively
      const subfiles = readdirSync(filePath);
      subfiles.forEach(subfile => {
        const subfilePath = join(filePath, subfile);
        if (statSync(subfilePath).isFile()) {
          const content = readFileSync(subfilePath);
          const hash = createHash('sha256').update(content).digest('hex');
          const relativePath = relative('dist', subfilePath);
          checksums[relativePath] = hash;
          console.log(`${relativePath}: ${hash.substring(0, 16)}...`);
        }
      });
    } else {
      const content = readFileSync(filePath);
      const hash = createHash('sha256').update(content).digest('hex');
      checksums[file] = hash;
      console.log(`${file}: ${hash.substring(0, 16)}...`);
    }
  });

  // Save checksums to file
  const checksumsPath = join(distDir, 'checksums.json');
  writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));

  console.log(`\nChecksums saved to ${checksumsPath}`);
  console.log(`Generated checksums for ${Object.keys(checksums).length} files`);
}

// Run if called directly (using import.meta.url to determine if module is main)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === 'scripts/generate-checksums.js') {
  generateChecksums();
}

export { generateChecksums };