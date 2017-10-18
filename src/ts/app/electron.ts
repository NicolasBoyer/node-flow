import { app, BrowserWindow } from "electron";

const DEBUG: boolean = true;
let win: any;

function createWindow() {
    win = new BrowserWindow({
        darkTheme : true,
        // height: 600,
        webPreferences: {
            devTools: DEBUG,
        },
        // width: 800,
    });
    win.loadURL(process.cwd() + "//dist/index.html");
    win.webContents.executeJavaScript(`require('electron-connect').client.create();`);
    win.on("closed", () => win = null);
}

app.on("ready", () => createWindow());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
