const fs = require('fs');
const path = require('path');

/**
 * Script dọn dẹp các tệp tin build (.js, .map, .d.ts) vô tình tạo ra trong thư mục src.
 * Đảm bảo tương thích Windows, Linux và macOS.
 */

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Xóa thư mục dist nếu tồn tại
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('Đã xóa thư mục dist.');
}

// Duyệt và xóa tệp tin rác trong src
if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  let count = 0;

  files.forEach((file) => {
    const filePath = path.join(srcDir, file);
    const ext = path.extname(file).toLowerCase();

    // Chỉ xóa .js, .map, và .d.ts (không phải .ts gốc)
    if (
      ext === '.js' ||
      file.endsWith('.js.map') ||
      file.endsWith('.d.ts') ||
      file.endsWith('.d.ts.map')
    ) {
      // Tuyệt đối không xóa tệp .ts nguồn
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) return;

      try {
        fs.unlinkSync(filePath);
        console.log(`Đã xóa: ${file}`);
        count++;
      } catch (err) {
        console.error(`Không thể xóa ${file}: ${err.message}`);
      }
    }
  });

  console.log(`Hoàn tất dọn dẹp thư mục src. Tổng cộng: ${count} tệp.`);
} else {
  console.error('Không tìm thấy thư mục src.');
}
