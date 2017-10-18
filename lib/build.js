// REQUIRE
const exec = require('child_process').exec;
const files = require('./files');
const path = require('path');
const browserify = require('browserify');
const tsify = require('tsify');
const exorcist   = require('exorcist');
const watchify = require('watchify');
const browserSync = require('browser-sync').create();
const electron = require('electron-connect').server.create();
// CONSTANTES
const inputDirectoryName = "src";
const outFileName = "bundle.js";
const outDirectoryName = "dist";
const electronStartFile = './'+ inputDirectoryName +'/ts/app/electron.ts';
// GLOBALS
var includeFiles = [];
var filesToCopy, outFilePath, bundler, outputDir;
// ARGS
var argv = require('yargs')
.option( "electron", { describe: "Utiliser electron", type: "boolean", default:false } )
.option( "prod", { describe: "Build pour la prod", type: "boolean", default:false } )
.argv;
var isElectron = argv.electron;
var isProd = argv.prod;

init = function() {
    if (isElectron) electron.start();
    else browserSync.init({server: "./dist"});
    const tsconfig = files.readFileSync('./tsconfig.json', 'utf8');
    JSON.parse(tsconfig).include.forEach((directory) => {
        var allFiles = files.getAllFiles(directory);
        includeFiles = includeFiles.concat(allFiles.tsFiles);
        filesToCopy = allFiles.cssFiles.concat(allFiles.htmlFiles, allFiles.imgFiles, allFiles.jsFiles);
    });
    files.remove(outDirectoryName);
    outputDir = files.createDir(outDirectoryName);
    outFilePath = outputDir + '/' + outFileName;
    files.createFile(outFilePath);
    transpile(!isProd, isProd).then(() => copyFiles().then(() => {
        if (isElectron) startElectron();
    }));
}

copyFiles = function() {
    return new Promise(function (resolve) {  
        if (filesToCopy.length) {
            filesToCopy.forEach((file) => {
                files.watchFile(file, () => copyFile(file).then(() => {
                    if (isElectron) electron.reload();
                    else browserSync.reload();
                }));
                copyFile(file).then(() => resolve());
            });
        } else resolve();
    });
}

copyFile = function(file) {
    return new Promise(function (resolve) {  
        files.copy(file, outputDir + '/' + file.substring(inputDirectoryName.length)).then(() => {
            console.log(file + ' a été copié dans ' + outputDir);
            resolve();
        });
    });
}

transpile = function(isDebug=false, isMinify=true) {
    return new Promise(function (resolve) {
        if (isElectron) {
            var electronBundler = browserify({
                entries: [electronStartFile],
                plugin: [tsify]
            });
            electronBundler.transform('uglifyify');
            electronBundler.external('electron')
            electronBundler.bundle().pipe(files.createWriteStream(outputDir + '/electron.js'));
        }

        bundler = browserify({
            entries: includeFiles,
            debug: isDebug,
            cache: {},
            packageCache: {},
            plugin: [tsify, watchify]
        });
        if (isMinify) bundler.transform('uglifyify');
        bundler.external('electron');
        bundler.ignore(electronStartFile);
        bundler.on('update', bundle);
        bundle().then(() => resolve());
    });    
}

bundle = function() {
    return new Promise(function (resolve) {
        bundler
        .bundle((err, src) => {
            includeFiles.forEach((file) => console.log(file + ' transpilé'))
            console.log("La transpilation s'est terminé avec succès.");
            resolve();
            if (isElectron) electron.reload();
            else browserSync.reload();
        })
        .on('error', (error) => {
            console.error(error.toString());
            browserSync.notify(err.message, 3000);
        })
        .pipe(exorcist(outFilePath + '.map'))
        .pipe(files.createWriteStream(outFilePath));
    });  
}

startElectron = function() {
    console.log("Electron démarré ...")
    runCommand('npm run electron', () => {
        console.log('Electron fermé')
    });
}

runCommand = function(cmd, callback, cwd, isOutput) {
    var folderExec = cwd || null;
    var command = exec(cmd, {cwd: folderExec}, callback);
    command.stdout.on('data', function (data) {
        if (isOutput) console.log(data);
    });
}

init();