import * as SVG from "svg.js";

export class Canvas {
    private canvas: SVG.Doc;

    constructor(pId: string, canvasSize: number, backGroundColor: string) {
        this.canvas = SVG(pId).size(canvasSize, canvasSize);
        this.canvas.rect(canvasSize, canvasSize).fill(backGroundColor);
    }

    // setbackgroun + création graph et sa récupération + events
    // besoin d'un interface créé dans utils visible de partout
}
