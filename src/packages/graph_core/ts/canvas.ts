import { IPrefsConfig } from "interfaces";
import { DatasMgr, EStorageKey } from "store";
import * as SVG from "svg.js";

export default class Canvas {
    readonly graph: SVG.Nested;
    private prefs: IPrefsConfig = new DatasMgr().load(EStorageKey.prefs);
    private canvas: SVG.Doc;
    private background: SVG.Rect;
    private zoom: number;

    constructor(pId: string) {
        // Nécessité d'avoir un nf-canvas qui va remplacer le drawing ou voir comment étendre ...
        const canvasSize: number = this.prefs.canvasSize;
        this.zoom = canvasSize;
        this.canvas = SVG(pId).size(canvasSize, canvasSize);
        this.background = this.canvas.rect(canvasSize, canvasSize).fill(this.prefs.backgroundColor);
        this.graph = this.canvas.nested().size(canvasSize, canvasSize);
    }

    // setbackgroun + création graph et sa récupération + events
    // besoin d'un interface créé dans utils visible de partout
}

// customElements.define("nf-canvas", Canvas);
