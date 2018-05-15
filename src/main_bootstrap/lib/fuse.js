// ENV
// a remplir aussi via le wag.json mais vois comment faire
process.env.FUSEBOX_TEMP_FOLDER = "../../.wag";

// REQUIRE
const { FuseBox, QuantumPlugin, CSSPlugin, WebIndexPlugin, CopyPlugin, EnvPlugin } = require("fuse-box");
const { src, task, exec, context } = require("fuse-box/sparky");
const files = require("./files");
const execute = require('child_process').exec;
const builder = require("electron-builder")

// lien comme pour app.tsx dans wag.json posé en rapport au project src -> à améliorer IMPORTANT !
const electronStartFile = 'main_bootstrap/ts/electron.ts';

// ARGS
const argv = require('yargs')
.option( "electron", { describe: "Utiliser electron", type: "boolean", default:false } )
.argv;

// GLOBALS
const isElectron = argv.electron;

// PATH IMPORT ALIAS
let importFiles = {};
const tsconfig =  JSON.parse(files.readFileSync("./tsconfig.json", "utf8"));
console.log(tsconfig)
tsconfig.include.forEach((directory) => {
    let allFiles = files.getAllFiles(directory, [files.getCurrentDirectoryBase(), "tsconfig.json"]);
    allFiles.tsCommonFiles.forEach((file) => {
        let fileName = file.substring(file.lastIndexOf("\\")+1);
        fileName = fileName.substring(0, fileName.lastIndexOf("."));
        importFiles[fileName] = file.replace("..\\", "~/").split("\\").join("/").substring(0, file.lastIndexOf(".")-1);
    });
});

// WAG CONFIG
// A utiliser sur node_modules
// const wagconfig = JSON.parse(files.readFileSync(files.getCurrentDirectoryBase() + "/wag.json", "utf8"));
const wagconfig = JSON.parse(files.readFileSync("./wag.json", "utf8"));

context(class {
    getConfig() {
        return FuseBox.init({
            homeDir: wagconfig.srcPath,
            output: wagconfig.distPath + "/$name.js",
            tsConfig : "../tsconfig.json",
            target : this.isElectronTask ? "server" : "browser",
            // a virer quand !this.isElectronTask ?
            sourceMaps: !this.isProduction,
            alias: importFiles,
            hash: this.isProduction && !isElectron,
            cache: !this.isProduction,
            plugins: [
                EnvPlugin({
                    NODE_ENV: this.isProduction ? "production" : "development"
                }),
                !this.isElectronTask && WebIndexPlugin({
                    path: ".",
                    template: wagconfig.wwwPath + "/index.html",
                    appendBundles: true
                }),
                !this.isElectronTask && CSSPlugin({
                    group: "bundle.css"
                }),
                !this.isElectronTask && CopyPlugin({ files: ["**/*.svg"] }),
                this.isProduction && QuantumPlugin({
                    bakeApiIntoBundle: this.isElectronTask ? "electron" : "bundle",
                    target : this.isElectronTask ? "server" : "browser",
                    uglify : true,
                    treeshake : true,
                    removeExportsInterop: false
                })
            ]
        });
    }

    createBundle(fuse, bundleName = "bundle", startFile = wagconfig.startFile) {
        const app = fuse.bundle(bundleName);
        if (!this.isProduction && !this.isElectronTask) {
            app.watch();
            app.hmr({reload : true});
        }
        app.instructions("> " + startFile);
        return app;
    }
});

// tache electron, service worker, generate www + create ts file ? + autre script si néecessaire ... jsx à prendre en compte + fin reorg + wapit / wag / speedui / node-flow / wag-flow

task("clear:cache", () => src("../../../.wag/").clean("../../../.wag/").exec());

task("clear:dist", () => src(wagconfig.distPath + "/").clean(wagconfig.distPath + "/").exec());

task("clean", ["clear:cache", "clear:dist"]);

task("default", ["clean"], async context => {
    const fuse = context.getConfig();
    fuse.dev();
    context.createBundle(fuse);
    await fuse.run();
});

task("prod", ["clean"], async context => {
    context.isProduction = true;
    const fuse = context.getConfig();
    context.createBundle(fuse);
    await fuse.run();
});

task("electron", [process.env.NODE_ENV === "production" ? "prod" : "default"], async context => {
    context.isElectronTask = true;
    const fuse = context.getConfig();
    context.createBundle(fuse, "electron", "[" + electronStartFile + "]");
    if (process.env.NODE_ENV === "production" ) {
        // lancer un build
        await fuse.run();
    } else {
        await fuse.run().then(() => {
            // launch electron the app
            runCommand("electron ../../dist/electron.js");
        });
    }
});

runCommand = function(cmd, callback, cwd, isOutput) {
    var folderExec = cwd || null;
    var command = execute(cmd, {cwd: folderExec}, callback);
    command.stdout.on('data', function (data) {
        if (isOutput) console.log(data);
    });
}