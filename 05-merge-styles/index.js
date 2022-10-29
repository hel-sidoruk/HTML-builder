const path= require('path');
const fs = require('fs');
const { readdir } = require('fs/promises');

const stylesFolderPath = path.join(__dirname, 'styles');
const destinationFolder = path.join(__dirname, 'project-dist');

function createBundle(filesArray) {
  const output = fs.createWriteStream(path.join(destinationFolder, 'bundle.css'));
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
mergeStyles();
