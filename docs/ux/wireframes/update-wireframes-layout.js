const fs = require('fs');
const path = require('path');

const dir = __dirname;

function getPageAndLayout(fileName) {
  const base = path.basename(fileName, '.html');
  const match = base.match(/^\d+-(.+)$/);
  const page = match ? match[1] : base;
  const layout = base.includes('admin-') ? 'admin' : 'public';
  return { page, layout };
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('<body')) {
    return;
  }

  const fileName = path.basename(filePath);
  const { page, layout } = getPageAndLayout(fileName);

  // 1) Body tag: add data-layout/data-page ако ги няма
  content = content.replace(/<body([^>]*)>/, (match, attrs) => {
    if (attrs.includes('data-layout')) {
      return match; // вече е мигриран
    }
    return `<body${attrs} data-layout="${layout}" data-page="${page}">`;
  });

  // 2) Header: заменяме локалния header с placeholder, ако още не е
  if (!content.includes('id="site-header"')) {
    content = content.replace(
      /<!-- Header -->[\s\S]*?<\/header>/,
      '    <!-- Header -->\n    <header id="site-header"></header>'
    );
  }

  // 3) Footer: заменяме локалния footer с placeholder, ако още не е
  if (!content.includes('id="site-footer"')) {
    content = content.replace(
      /<!-- Footer -->[\s\S]*?<\/footer>/,
      '    <!-- Footer -->\n    <footer id="site-footer"></footer>'
    );
  }

  // 4) Уверяваме се, че layout.js е включен преди </body>
  if (!content.includes('layout.js')) {
    content = content.replace(
      /<\/body>\s*<\/html>/,
      '    <script src="layout.js"></script>\n</body>\n</html>'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', fileName);
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const fullPath = path.join(dir, file);
  updateFile(fullPath);
}
