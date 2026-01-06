// diagnostic.js - Run this to find where your audio files are
const fs = require('fs');
const path = require('path');

console.log('\n📁 ===== AUDIO FILES DIAGNOSTIC =====\n');

// Check multiple possible locations
const locations = [
  path.join(__dirname, 'uploads', 'audio'),
  path.join(__dirname, 'src', 'uploads', 'audio'),
  path.join(__dirname, '..', 'uploads', 'audio'),
];

locations.forEach((location, index) => {
  console.log(`\n📍 Location ${index + 1}: ${location}`);
  console.log('Exists:', fs.existsSync(location));
  
  if (fs.existsSync(location)) {
    const files = fs.readdirSync(location);
    console.log('Files found:', files.length);
    
    if (files.length > 0) {
      console.log('\n📄 Files:');
      files.forEach(file => {
        const filePath = path.join(location, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.size} bytes)`);
      });
    }
  }
});

console.log('\n✅ Run this from your backend root directory');
console.log('Command: node diagnostic.js\n');