const directoryBase = process.cwd();
// ENV
process.env.FUSEBOX_TEMP_FOLDER = directoryBase + "/.wapiti";

// REQUIRE
const { FuseBox, QuantumPlugin, CSSPlugin, WebIndexPlugin, CopyPlugin, EnvPlugin } = require("fuse-box");
const { src, task, exec, context } = require("fuse-box/sparky");
const files = require("./files");
const execute = require('child_process').exec;
const builder = require("electron-builder")

// ARGS
const argv = require('yargs')
.option( "electron", { describe: "Utiliser electron", type: "boolean", default:false } )
.argv;

// GLOBALS
const isElectron = process.argv[2] === "electron";
const tsconfigFile = directoryBase + "/tsconfig.json";

// PATH IMPORT ALIAS
let importFiles = {};
const tsconfig =  JSON.parse(files.readFileSync(tsconfigFile, "utf8"));
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
const wapitiConfig = JSON.parse(files.readFileSync(directoryBase + "/wapiti.json", "utf8"));

// PACKAGE JSON
const packageJson = JSON.parse(files.readFileSync(directoryBase + "/package.json", "utf8"));

context(class {
    getConfig() {
        return FuseBox.init({
            homeDir: directoryBase  + "/" + wapitiConfig.srcPath,
            output: directoryBase  + "/" + wapitiConfig.distPath + "/$name.js",
            tsConfig : tsconfigFile,
            target : this.isElectronTask ? "server" : "browser",
            sourceMaps: !this.isProduction && !this.isElectronTask,
            alias: importFiles,
            hash: this.isProduction && !isElectron,
            cache: !this.isProduction,
            plugins: [
                EnvPlugin({
                    NODE_ENV: this.isProduction ? "production" : "development"
                }),
                !this.isElectronTask && WebIndexPlugin({
                    path: ".",
                    template: directoryBase  + "/" + wapitiConfig.wwwPath + "/index.html",
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

    createBundle(fuse, bundleName = "bundle", startFile = wapitiConfig.startFile) {
        const app = fuse.bundle(bundleName);
        if (!this.isProduction && !this.isElectronTask) {
            app.watch();
            app.hmr({reload : true});
        }
        app.instructions("> " + startFile);
        return app;
    }
});

task("clear:cache", () => src(directoryBase + "/.wapiti/").clean(directoryBase + "/.wapiti/").exec());

task("clear:dist", () => src(directoryBase  + "/" + wapitiConfig.distPath + "/").clean(directoryBase + "/" + wapitiConfig.distPath + "/").exec());

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
    context.createBundle(fuse, "electron", "[" + wapitiConfig.electronStartFile + "]");
    if (process.env.NODE_ENV === "production" ) {        
        await fuse.run().then(() => {
            // launch electron build
            files.copy(directoryBase + "/" + wapitiConfig.distPath, "dist");
            builder.build({
                config: {
                    "copyright": packageJson.author,
                    "productName": packageJson.name,
                    "files": [
                        "dist"
                    ],
                    "dmg": {
                        "contents": [
                            {
                                "x": 130,
                                "y": 220
                            },
                            {
                                "x": 410,
                                "y": 220,
                                "type": "link",
                                "path": "/Applications"
                            }
                        ]
                    },
                    "win": {
                        "target": [
                            "nsis"
                        ]
                    },
                    "linux": {
                        "target": [
                            "deb",
                            "AppImage"
                        ]
                    }
                }
            })
            .then((result) => {
                let spacer = result[1].includes("\\") ? "\\" : "/";
                let fileName = result[1].substring(result[1].lastIndexOf(spacer)+1);
                files.copy(result[1], directoryBase + "/" + wapitiConfig.distPath + "/" + packageJson.name + "_" + packageJson.version + "_" + formatDateToYYYYMMDDHHMM(new Date()) + "_setup" + fileName.substring(fileName.lastIndexOf("."))).then(() => files.removeDir("dist"));
            })
            .catch((error) => console.log(error));
        });
    } else {
        await fuse.run().then(() => {
            // launch electron dev
            runCommand("electron " + directoryBase + "/" + wapitiConfig.distPath + "/electron.js");
        });
    }
});

runCommand = (cmd, callback, cwd, isOutput) => {
    const folderExec = cwd || null;
    execute(cmd, {cwd: folderExec}, (error, stdout, stderr) => {
		console.log(stdout);
		console.log(stderr);
	});
}

formatDateToYYYYMMDDHHMM = (date) => {
    function pad2(n) {  // always returns a string
        return (n < 10 ? '0' : '') + n;
    }
    // return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds());
    return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes());
}