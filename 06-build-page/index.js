const path= require('path');
const fs = require('fs');
const { readdir, mkdir, unlink, copyFile, rmdir } = require('fs/promises');

const stylesFolderPath = path.join(__dirname, 'styles');
const destinationFolder = path.join(__dirname, 'project-dist');

async function createBuild() {
  await mkdir(destinationFolder, { recursive: true });
  await clearDirectory(destinationFolder);
  copyAssets();
  getHtml();
  mergeStyles();
}

function createBundle(filesArray) {
  const output = fs.createWriteStream(path.join(destinationFolder, 'style.css'));
  for (const file of filesArray) {
    const input = fs.createReadStream(path.join(stylesFolderPath, file));
    input.pipe(output);
  }
}

async function mergeStyles() {
  try {
    const files = await readdir(stylesFolderPath, { withFileTypes: true });
    const cssFiles = [];
    for (const file of files) {
      file.isFile() && path.extname(file.name) === '.css' && cssFiles.push(file.name);
    }
    createBundle(cssFiles);
  } catch (err) {
    console.error('Произошла ошибка: ', err);
  }
}

function getHtml() {
  let htmlVariable = '';
  const input = fs.createReadStream(path.join(__dirname, 'template.html'));
  input.on('data', data => htmlVariable += data);
  input.on('end', () => buildHtmlFile(htmlVariable));
}

async function buildHtmlFile(template) {
  const templateTags = template.match(/{{.+}}/g);
  let components = await readdir(path.join(__dirname, 'components'));
  for (const tag of templateTags) {
    const tagFile = `${tag.replace(/{|}/g, '')}.html`;
    if (components.includes(tagFile)) {
      let html = '';
      const readStream = fs.createReadStream(path.join(__dirname, 'components', tagFile));
      readStream.on('data', data => html += data);
      readStream.on('end', () => {
        template = template.replace(tag, html);
        templateTags.indexOf(tag) === templateTags.length - 1 && writeHtmlFile(template);
      });
    }
  }
}

function writeHtmlFile(html) {
  const writeStream = fs.createWriteStream(path.join(destinationFolder, 'index.html'));
  writeStream.write(html);
}

async function clearDirectory(folder) {
  const existingFiles = await readdir(folder, { withFileTypes: true });
  for (const file of existingFiles) {
    if (file.isFile()) {
      await unlink(path.join(folder, file.name));
      if (existingFiles.indexOf(file) === existingFiles.length - 1 && folder !== destinationFolder) {
        await rmdir(folder);
      }
    } else {
      await clearDirectory(path.join(folder, file.name));
      await readdir(folder).then(async files => !files.length && await rmdir(folder));
    }
  }
}

async function copyAssets(folderName = 'assets', dest = destinationFolder, current = __dirname) {
  const newFolderPath = path.join(dest, folderName);
  const currentPath = path.join(current, folderName);
  try {
    await mkdir(newFolderPath, { recursive: true });
    const filesToCopy = await readdir(currentPath, { withFileTypes: true });
    for (const file of filesToCopy) {
      if (file.isFile()) {
        await copyFile(path.join(currentPath, file.name), path.join(newFolderPath, file.name));
      } else {
        copyAssets(file.name, newFolderPath, currentPath);
      }
    }
  } catch (err) {
    console.error('Произошла ошибка: ', err);
  }
}

createBuild();
