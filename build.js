// Builds the zip to be uploaded on AWS lambda
// node > 10

const { resolve } = require('path');
const glob = require('glob');
const minify = require("babel-minify");
const fsExtra = require('fs-extra');
const zipFolder = require('zip-folder');

const REQUIRED_NODE_MODULES = ['node-fetch']; // node_modules needs to be added in the zip

const BUILD_PATH = resolve('./build');

// clean build
let isExists = fsExtra.ensureDirSync(BUILD_PATH);
if (!isExists) {
  fsExtra.emptyDirSync(BUILD_PATH);
  console.log('Cleaned build:', BUILD_PATH);
}

// minifying all functions
let files= glob.sync(resolve('./functions/**/*.js'));

files.forEach(file => {
  let basePath = resolve('./');
  let path = file.replace(basePath, '');
  let buildPath = `${BUILD_PATH}${path}`;
  try {
    let content = fsExtra.readFileSync(file, 'utf8');
    let { code } = minify(content);
    fsExtra.outputFileSync(buildPath, code);
    console.log(`Minified file: ${file}`);
  } catch(e) {
    console.log(`Failed minimizing: ${file}`);
    console.log(e);
  }
})


// copy node_modules
fsExtra.mkdirSync(`${BUILD_PATH}/node_modules`);

REQUIRED_NODE_MODULES.forEach(module => {
  let modulePath = resolve(`./node_modules/${module}`);
  let destPath = `${BUILD_PATH}/node_modules/${module}`;
  fsExtra.copySync(modulePath, destPath, { overwrite: true });
  console.log(`Copied node_module: ${module}`);
});

// make zip
let zipPath = `./build.zip`;
zipFolder(BUILD_PATH, zipPath, (err) => {
  if (err) {
    console.log('Zip conversion failed');
  } else {
    console.log('..............................');
    console.log(`Uploadable zip is ready for lambda: ${zipPath} 🎉`);
  }
});



