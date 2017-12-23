import { DOM } from "dom";
import { NFJSX } from "jsx";
import { IOnPosition } from "window";
import Window from "window";

export default class WindowsManager {
    protected _selectedWindow: Window;
    protected _windowsArr: Window[] = [];
    protected _windowsObj: {[key: string]: Window} = {};
    protected _ghostWindow: HTMLElement;
    protected _isGhostDocked: IOnPosition = {top: false, bottom: false, left: false, right: false};
    get windows(): {[key: string]: Window} {
        return this._windowsObj;
    }

    initEvents() {
        document.addEventListener("mousemove", (event: MouseEvent) => {
            const currentWindow = (event.target as Window);
            if (this.windows[currentWindow.id]) {
                currentWindow.detectMousePosition(event);
            }
        }, true);
        document.addEventListener("windowCreated", (event) => this.addWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClosed", (event) => this.removeWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClicked", (event) => this.setInFront((event as CustomEvent).detail), true);
        document.addEventListener("windowIsDragging", (event) => this._setIsPossibleDocked((event as CustomEvent).detail), true);
        // this._getWindowSize();
        // window.addEventListener("resize", () => this._getWindowSize(), true);
    }

    addWindow(window: Window) {
        const zIndexMax = this._windowsArr.length !== 0 ? this._getZIndexMax() : 9;
        window.style.zIndex = String(zIndexMax + 1);
        this._selectedWindow = window;
        this._windowsObj[window.id] = window;
        this._windowsArr.push(window);
    }

    removeWindow(window: Window) {
        delete this._windowsObj[window.id];
        const oldZIndex = Number(window.style.zIndex);
        this._windowsArr.splice(this._windowsArr.indexOf(window), 1);
        const zIndexMax = this._getZIndexMax();
        this._windowsArr.forEach((win) => {
            const winZIndex = Number(win.style.zIndex);
            if (winZIndex === zIndexMax) {
                this._selectedWindow = win;
            }
            if (winZIndex > oldZIndex) {
                win.style.zIndex = String(winZIndex - 1);
            }
        });
    }

    setInFront(window: Window) {
        if (this._selectedWindow === window) {
            return;
        }
        const zIndexMax = this._getZIndexMax();
        const oldZIndex = Number(window.style.zIndex);
        this._windowsArr.forEach((win) => {
            const winZIndex = Number(win.style.zIndex);
            if (winZIndex > oldZIndex && winZIndex !== zIndexMax) {
                win.style.zIndex = String(winZIndex - 1);
            }
        });
        this._selectedWindow.style.zIndex = String(zIndexMax - 1);
        window.style.zIndex = String(zIndexMax);
        this._selectedWindow = window;
    }

    protected _setIsPossibleDocked(mouseEvent: MouseEvent) {
        const mouseDockedPosition: number = 10;
        // const windowSizeAfterDocked: number = 400;
        if (mouseEvent.clientX < mouseDockedPosition) {

            // ICI IMPORTANT
            // Transformer en fonction si possible et à appeler dans ghost docked -> A réfléchir
            const windowSize = DOM.getWindowSize();
            const dockedWindows: Window[] = [];
            this._windowsArr.forEach((win) => {
                if (win.isDocked["left"]) {
                    dockedWindows.push(win);
                }
            });
            // ici les calculs sont fait
            // si souris au dessus de moitié de hauteur top 0 sinon top ... si une seule fenetre docked +
            windowSize.top = dockedWindows.length + 1 >= 2 && mouseEvent.clientY > windowSize.height / 2 ? windowSize.height / dockedWindows.length : 0;
            windowSize.height = windowSize.height / (dockedWindows.length + 1);
            // ajouter top left ... et traiterle docking
            // Veut on docker si on est déjà docker
            // Peut etre passer la fonction de retour de taille dans ghostdocked
            this._ghostDocked("left", windowSize.top + "px", "0px", "400px", windowSize.height + "px");
            // console.log("left", windowSize.top + "px", "0px", windowSizeAfterDocked + "px", windowSize.height + "px", "0")
        }
        if (mouseEvent.clientX > window.innerWidth - mouseDockedPosition) {
            // this._ghostDocked("right", maxPositions.top + "px", document.body.offsetWidth - windowSizeAfterDocked + "px", windowSizeAfterDocked + "px", "100%", "0");
        }
        if (mouseEvent.clientY < mouseDockedPosition) {
            // this._ghostDocked("top", "0px", maxPositions.left + "px", "100%", windowSizeAfterDocked + "px", "0");
        }
        if (mouseEvent.clientY > window.innerHeight - mouseDockedPosition) {
            // this._ghostDocked("bottom", "100%", maxPositions.left + "px", "100%", windowSizeAfterDocked + "px", - windowSizeAfterDocked + "px");
        }
        if (this._ghostWindow && mouseEvent.clientX >= mouseDockedPosition && mouseEvent.clientX <= window.innerWidth - mouseDockedPosition && mouseEvent.clientY >= mouseDockedPosition && mouseEvent.clientY <= window.innerHeight - mouseDockedPosition) {
            this._isGhostDocked = {top: false, bottom: false, left: false, right: false};
            this._ghostWindow.style.opacity  = "0";
            setTimeout(() => {
                if (this._ghostWindow) {
                    document.body.removeChild(this._ghostWindow);
                    delete this._ghostWindow;
                }
            }, 250);
        }
    }

    // getWindowSize retourne la taille de la fenetre au load et au resize en fonctiond u placement des autres fenetre
    protected _ghostDocked(position: string, top: string, left: string, width: string, height: string) {
        if (this._isGhostDocked[position]) {
            return;
        }
        this._ghostWindow = document.body.appendChild(<div class="ghostWindow"></div>);
        this._ghostWindow.style.position = this._selectedWindow.style.position;
        this._ghostWindow.style.top = this._selectedWindow.style.top;
        this._ghostWindow.style.left = this._selectedWindow.style.left;
        this._ghostWindow.style.height = this._selectedWindow.style.height;
        this._ghostWindow.style.width = this._selectedWindow.style.width;
        this._ghostWindow.style.zIndex = String(Number(this._selectedWindow.style.zIndex) - 1);
        setTimeout(() => {
            this._ghostWindow.style.top = top;
            this._ghostWindow.style.left = left;
            this._ghostWindow.style.width = width;
            this._ghostWindow.style.height = height;
        }, 50);
        this._isGhostDocked[position] = true;
    }

    protected _getZIndexMax() {
        return Number(Math.max.apply(Math, this._windowsArr.map((win) => win.style.zIndex)));
    }
}
