const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\Bus_Go_rebuild\\Ve_Xe_Nhanh_Ts\\packages\\shared-types\\src';
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.js.map') || file.endsWith('.d.ts') || file.endsWith('.d.ts.map')) {
    if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        return;
    }
    const fullPath = path.join(srcDir, file);
    try {
        fs.unlinkSync(fullPath);
        console.log('Successfully deleted ' + fullPath);
    } catch (err) {
        console.error('Error deleting ' + fullPath + ': ' + err.message);
    }
  }
});
