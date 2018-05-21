// ENV
// a remplir aussi via le wapiti.json mais vois comment faire
process.env.FUSEBOX_TEMP_FOLDER = "../../.wapiti";

// REQUIRE
const { FuseBox, QuantumPlugin, CSSPlugin, WebIndexPlugin, CopyPlugin, EnvPlugin } = require("fuse-box");
const { src, task, exec, context } = require("fuse-box/sparky");
const files = require("./files");
const execute = require('child_process').exec;
const builder = require("electron-builder")

// lien comme pour app.tsx dans wapiti.json posé en rapport au project src -> à améliorer IMPORTANT !
const electronStartFile = 'main_bootstrap/ts/electron.ts';

// ARGS
const argv = require('yargs')
.option( "electron", { describe: "Utiliser electron", type: "boolean", default:false } )
.argv;

// GLOBALS
const isElectron = argv.electron;
const directoryBase = process.cwd();

// PATH IMPORT ALIAS
let importFiles = {};
const tsconfig =  JSON.parse(files.readFileSync("./tsconfig.json", "utf8"));
tsconfig.include.forEach((directory) => {
    let allFiles = files.getAllFiles(directory, [files.getCurrentDirectoryBase(), "tsconfig.json"]);
    allFiles.tsCommonFiles.forEach((file) => {
        let spacer = file.includes("\\") ? "\\" : "/";
        let fileName = file.substring(file.lastIndexOf(spacer)+1);
        fileName = fileName.substring(0, fileName.lastIndexOf("."));
        importFiles[fileName] = file.replace(".." + spacer, "~/").split(spacer).join("/").substring(0, file.lastIndexOf(".")-1);
    });
});

// WAPITI CONFIG
const wapiticonfig = JSON.parse(files.readFileSync(directoryBase + "/wapiti.json", "utf8"));

// PACKAGE JSON
const packageJson = JSON.parse(files.readFileSync(directoryBase + "/package.json", "utf8"));

context(class {
    getConfig() {
        return FuseBox.init({
            homeDir: directoryBase  + "/" + wapiticonfig.srcPath,
            output: directoryBase  + "/" + wapiticonfig.distPath + "/$name.js",
            tsConfig : "../tsconfig.json",
            target : this.isElectronTask ? "server" : "browser",
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
                    template: directoryBase  + "/" + wapiticonfig.wwwPath + "/index.html",
                    appendBundles: true
                }),
                !this.isElectronTask && CSSPlugin({
                    group: "bundle.css"
                }),
                !this.isElectronTask && CopyPlugin({ files: ["**/*.svg"] }),
                this.isProduction && QuantumPlugin({
                    bakeApiIntoBundle: this.isElectronTask ? "electron" : "bundle",
                    target : this.isElectronTask ? "electron" : "browser",
                    uglify : true,
                    treeshake : true,
                    removeExportsInterop: false
                })
            ]
        });
    }

    createBundle(fuse, bundleName = "bundle", startFile = wapiticonfig.startFile) {
        const app = fuse.bundle(bundleName);
        if (!this.isProduction && !this.isElectronTask) {
            app.watch();
            app.hmr({reload : true});
        }
        app.instructions("> " + startFile);
        return app;
    }
});

// tache electron, service worker, generate www + create ts file ? + autre script si néecessaire ... jsx à prendre en compte + fin reorg + wapit / wapiti / speedui / node-flow / wag

task("clear:cache", () => src("../../../.wapiti/").clean("../../../.wapiti/").exec());

task("clear:dist", () => src(directoryBase  + "/" + wapiticonfig.distPath + "/").clean(directoryBase + "/" + wapiticonfig.distPath + "/").exec());

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
        await fuse.run().then(() => {
            // launch electron build
            files.copy(directoryBase + "/" + wapiticonfig.distPath, "dist");
            // A améliorer en donnant le choix de la sortie (win linux mac)
            builder.build({
                config: {
                    "copyright": packageJson.author,
                    "productName": packageJson.name,
                    "files": [
                        "dist"
                    ]
                }
            })
            .then((result) => {
                let spacer = result[1].includes("\\") ? "\\" : "/";
                let fileName = result[1].substring(result[1].lastIndexOf(spacer)+1);
                // App à renommer avec name_version_date_setup
                // A faire pour dmg linux etc
                files.copy(result[1], directoryBase + "/" + wapiticonfig.distPath + "/" + packageJson.name + "_" + packageJson.version + "_setup.exe").then(() => files.removeDir("dist"));
            })
            .catch((error) => console.log(error));
        });
    } else {
        await fuse.run().then(() => {
            // launch electron dev
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