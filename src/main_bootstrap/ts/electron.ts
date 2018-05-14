import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";

const ENV = process.env.NODE_ENV || "production";
const DEBUG = ENV === "development";
let win: any;

function createWindow() {
    win = new BrowserWindow({
        // darkTheme : true,
        // height: 600,
        // webPreferences: {
        //     devTools: DEBUG,
        // },
        // width: 800,
    });
    win.maximize();

    if (DEBUG) {
      win.loadURL("http://localhost:4444");
      // Open the DevTools.
      win.webContents.openDevTools();
    } else {
      // A améliorer chemin vers dist
      win.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
      }));
      win.webContents.openDevTools();
    }
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
