const fs = require('fs');
const path = require('path');

function replaceInvertInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInvertInDir(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('filter:invert(1) !important')) {
                content = content.split('filter:invert(1) !important').join('content:url(\'/assets/logos/newlogoblack.png\') !important; filter:none !important');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed invert in', fullPath);
            }
        }
    }
}

replaceInvertInDir('d:\\\\my company\\\\a2b website\\\\a2b.3.0');
