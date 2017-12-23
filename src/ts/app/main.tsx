import Button from "button";
import Canvas from "canvas";
import { DatasMgr, EStorageKey } from "datas";
import { INodeConfig, IPrefsConfig } from "dom";
import { NFJSX } from "jsx";
import Library from "library";
import Window from "window";
import WindowsManager from "windows-manager";

const prefs: IPrefsConfig = {canvasSize: 5000, backgroundColor: "#666", zoomIntensity: 0.3, zoomLevel: 1};
new DatasMgr().save(EStorageKey.prefs, prefs);

// A rendre paramétrable
const scenariLib = new Library("scenari");
// if (scenariLib)
scenariLib.set("compo", {width: 120, height: 90, color: "#f06"});
scenariLib.set("data", {width: 120, height: 90, color: "rgb(128, 56, 89)"});

const windowsManager = new WindowsManager();
windowsManager.initEvents();

// Pas sur de l'utilité

// console.log(scenariLib.nodesConfig);

// !!!! Rendu à créer un framewok pour créer des window pour faire la config des nodes ...
// !!!!
// tslint:disable-next-line:max-line-length
// const win = document.body.appendChild(new Window({title: "Configurer les nodes", width: 600, height: 800, draggable: true, minWidth: 400, className: "blop"}));

// win.hide();
// document.body.appendChild(win);
const win2 = document.body.appendChild(<nf-window width="800" draggable="true" resizable="true" title="Other"><div>blirp</div></nf-window>);
const win = document.body.appendChild(<nf-window width="600" draggable="true" resizable="true" center="true" title="Configurer les nodes"><div>blirp</div></nf-window>);
// eventsManager.addWindow(win)
// eventsManager.addWindow(win2)
// win.draggable = true;
// Sans doute revoir la mise en place des attributs
// document.body.appendChild(<button style="position:absolute;bottom:0;" onclick={(ev: MouseEvent) => {win.resizable = true; win.visible = true; win.center = true;const test = document.body.appendChild(<nf-window width="600" center="true" draggable="true" title="Configurer les po"><div>blirp</div></nf-window>) as Window; console.log(test.id);eventsManager.addWindow(test) }}>blop</button>);

const settings = document.body.appendChild(<nf-button title="Paramètres" type="maximize" class="maximize" style="position:absolute;top:0;font-size: xx-large;left: 1em;height: 1em;width: 1em;cursor: pointer;"></nf-button>);

settings.onclick = (ev: MouseEvent) => {
    document.body.appendChild(<nf-window width="800" center="true" draggable="true" resizable="true" title="Autre"><div>blirp</div></nf-window>);
};

// document.onmousemove = (event: MouseEvent) => {
//     //console.log(event)
// };
// win.content.appendChild(<div>blirp</div>);

// win.content = <div>blirp</div>;
// win.resizable = true;
// win.title = "blop"
// win.hide()
// win.setAttribute("visible", "false");

// Peut-etre commencer par mettre en place le configurateur prefs etnodes conf
// passer la librairie au canvas puis à node sans doute ou alors accessible de partout ...
const canvas = new Canvas("drawing");