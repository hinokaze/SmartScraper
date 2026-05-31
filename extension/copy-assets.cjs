const fs = require('fs');
const path = require('path');

const srcAssetsDir = path.join(__dirname, 'assets');
const distDir = path.join(__dirname, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const manifestSrc = path.join(__dirname, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
const srcLocalesDir = path.join(__dirname, '_locales');
const distLocalesDir = path.join(distDir, '_locales');

if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}

const filesToCopy = ['background.js', 'content.js', 'icon.svg'];

filesToCopy.forEach((file) => {
  const srcPath = path.join(srcAssetsDir, file);
  const destPath = path.join(distAssetsDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Skipped missing file: ${file}`);
  }
});

const distJsFiles = fs.readdirSync(distAssetsDir).filter((file) => file.endsWith('.js'));
distJsFiles.forEach((file) => {
  console.log(`Prepared ${file}`);
});

if (fs.existsSync(manifestSrc)) {
  const manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf8'));

  if (manifest.background?.service_worker) {
    manifest.background.service_worker = manifest.background.service_worker.replace(/^dist\//, '');
  }

  if (Array.isArray(manifest.content_scripts)) {
    manifest.content_scripts = manifest.content_scripts.map((script) => ({
      ...script,
      js: Array.isArray(script.js)
        ? script.js.map((file) => file.replace(/^dist\//, ''))
        : script.js
    }));
  }

  if (manifest.side_panel?.default_path) {
    manifest.side_panel.default_path = manifest.side_panel.default_path.replace(/^dist\//, '');
  }

  if (Array.isArray(manifest.web_accessible_resources)) {
    manifest.web_accessible_resources = manifest.web_accessible_resources.map((resource) => ({
      ...resource,
      resources: Array.isArray(resource.resources)
        ? resource.resources.map((file) => file.replace(/^dist\//, ''))
        : resource.resources
    }));
  }

  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Prepared dist manifest.json');
} else {
  console.warn('Skipped missing manifest.json');
}

if (fs.existsSync(srcLocalesDir)) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${path.relative(__dirname, destPath)}`);
      }
    }
  };

  copyDir(srcLocalesDir, distLocalesDir);
  console.log('Prepared _locales directory');
} else {
  console.warn('Skipped missing _locales directory');
}

console.log('\nPost-build copy complete.');
