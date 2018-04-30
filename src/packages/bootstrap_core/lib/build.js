// REQUIRE
const exec = require('child_process').exec;
const files = require('./files');
const path = require('path');
const browserify = require('browserify');
const tsify = require('tsify');
const pathmodify = require('pathmodify');
const exorcist   = require('exorcist');
const watchify = require('watchify');
const browserSync = require('browser-sync').create();
const electronServer = require('electron-connect').server;
// CONSTANTES
const inputDirectoryName = "src";
const outFileName = "bundle.js";
const outDirectoryName = "dist";
const electronStartFile = '../main_core/ts/electron.ts';
// GLOBALS
var includeFiles = [];
var filesToCopy, outFilePath, bundler, outputDir, electron;
var pathModify = {mods: []};
// ARGS
var argv = require('yargs')
.option( "electron", { describe: "Utiliser electron", type: "boolean", default:false } )
.option( "prod", { describe: "Build pour la prod", type: "boolean", default:false } )
.argv;
var isElectron = argv.electron;
var isProd = argv.prod;

init = function() {   
    const tsconfig =  JSON.parse(files.readFileSync('./tsconfig.json', 'utf8'));
    // Gestion des fichiers à copier
    tsconfig.include.forEach((directory) => {
        var allFiles = files.getAllFiles(directory, [files.getCurrentDirectoryBase(), "tsconfig.json"]);
        includeFiles = includeFiles.concat(allFiles.tsFiles);
        // Création du path modify pour mettre les urls relatives des modules
        allFiles.importFiles.forEach((files) => pathModify.mods.push(pathmodify.mod.id(files.name, process.cwd() + '/' + files.path)));
        filesToCopy = allFiles.cssFiles.concat(allFiles.htmlFiles, allFiles.imgFiles, allFiles.jsFiles);
    });


    // A améliorer ou à virer
    // var test = files.getAllFiles("node_modules", []);
    // test.importFiles.forEach((files) => pathModify.mods.push(pathmodify.mod.id(files.name, process.cwd() + '/' + files.path)));
    // e:/Devs/WebApps/node-flow/src/packages/bootstrap_core/node_modules/svg.js/svg.js
    pathModify.mods.push(pathmodify.mod.id("svg.js", process.cwd() + '/' + "node_modules/svg.js"))

    // Pas utile à suppr
    // pathModify.mods.push(pathmodify.mod.id("electron", process.cwd() + '/' + "node_modules/electron"))

    ///


    files.remove(outDirectoryName);
    outputDir = files.createDir(outDirectoryName);
    outFilePath = outputDir + '/' + outFileName;
    files.createFile(outFilePath);

    files.copy("./lib/files.js", outputDir + '\\' + files.js);


    // A réparer car le reload fonctionne pas
    if (isElectron) electron = electronServer.create();


    transpile(!isProd, isProd).then(() => copyFiles().then(() => {
        if (isElectron) {
            electron.start();

            // A voir car ne se met pas à jour -> A retester
            // startElectron();
        } else if (!isProd) browserSync.init({server: "./" + outDirectoryName});
        else process.exit();
    }));
}

copyFiles = function() {
    return new Promise(function (resolve) {  
        if (filesToCopy.length) {
            filesToCopy.forEach((file, index) => {
                files.watchFile(file, () => copyFile(file).then(() => {
                    if (isElectron) electron.reload();
                    else if (!isProd)  browserSync.reload();
                }));
                copyFile(file).then(() => {
                    if (filesToCopy.length -1 === index) resolve()
                });
            });
        } else resolve();
    });
}

copyFile = function(file) {
    return new Promise(function (resolve) {
        files.copy(file, outputDir + '\\' + file.substring(6)).then(() => {
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
            electronBundler.plugin('tinyify');
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
        bundler.plugin(pathmodify, pathModify)
        if (isMinify) bundler.plugin('tinyify');
        bundler.external('electron');
        bundler.ignore(electronStartFile);
        bundler.on('update', bundle);
        bundle().then(() => resolve());
    });    
}

bundle = function() {
    return new Promise(function (resolve) {
        bundler
        .bundle((err) => {
            if (err) return;
            includeFiles.forEach((file) => console.log(file + ' transpilé'))
            console.log("La transpilation s'est terminé avec succès.");
            resolve();
            if (isElectron) electron.reload();
            else if (!isProd)  browserSync.reload();
        })
        .on('error', (error) => {
            if (error) throw new Error("La transpilation s'est arrêté - " + error.toString());
        })
        .pipe(exorcist(outFilePath + '.map'))
        .pipe(files.createWriteStream(outFilePath));
    });  
}

// A suppr aussi sans doute
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