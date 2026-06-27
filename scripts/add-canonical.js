import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const excludeDirs = ['node_modules', 'dist', 'public', '.git', 'admin', 'a2b'];

function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        getHtmlFiles(filePath, fileList);
      }
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles(rootDir);

for (const file of htmlFiles) {
  // skip the blog posts since they are handled by build-blog.js
  if (file.includes(path.join('blog', 'post')) && !file.endsWith(path.join('blog', 'post', 'index.html'))) {
    continue;
  }
  if (file.includes('template')) {
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  
  let relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  let canonicalUrl = 'https://a2b.services/';
  
  if (relPath !== 'index.html') {
    canonicalUrl += relPath.replace('/index.html', '/');
  }

  const insertString = `    <link rel="canonical" href="${canonicalUrl}" />\n`;
  
  if (content.includes('<link rel="canonical"')) {
    // replace existing canonical tag
    content = content.replace(/<link rel="canonical".*?>\n?/, insertString.trim() + '\n');
    console.log(`Updated canonical in: ${relPath} -> ${canonicalUrl}`);
  } else if (content.includes('<title>')) {
    content = content.replace(/(<title>.*?<\/title>\n)/, `$1${insertString}`);
    console.log(`Added canonical to: ${relPath} -> ${canonicalUrl}`);
  } else {
    content = content.replace(/(<head>\n)/, `$1${insertString}`);
    console.log(`Added canonical to: ${relPath} -> ${canonicalUrl}`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Added canonical to: ${relPath} -> ${canonicalUrl}`);
}
