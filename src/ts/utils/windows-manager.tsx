import { DOM } from "dom";
import { NFJSX } from "jsx";
import { IOnPosition } from "window";
import Window from "window";

export default class WindowsManager {
    protected _currentWindow: Window;
    protected _windowsArr: Window[] = [];
    protected _windowsObj: {[key: string]: Window} = {};
    get windows(): {[key: string]: Window} {
        return this._windowsObj;
    }
    protected _ghostWindow: HTMLElement;
    protected _isGhostDocked: IOnPosition = {top: false, bottom: false, left: false, right: false};
    protected _isCurrentWindowSelected: boolean = false;
    protected _dockedWindows: Map<Window, { top: number; left: number; width: number; height: number; index: number; }>;

    initEvents() {
        document.addEventListener("mousemove", (event: MouseEvent) => {
            const currentWindow = (event.target as Window);
            if (this.windows[currentWindow.id]) {
                currentWindow.detectMousePosition(event);
            }
        }, true);
        document.addEventListener("mouseup", (event: MouseEvent) => {
            this._dockedWindow(true);
            this._isCurrentWindowSelected = false;
        }, true);
        document.addEventListener("windowCreated", (event) => this.addWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClosed", (event) => this.removeWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClicked", (event) => {
            this.setInFront((event as CustomEvent).detail);
            this._dockedWindows = this._getDockedWindows("left");
        }, true);
        document.addEventListener("windowIsDragging", (event) => {
            this._isCurrentWindowSelected = true;
            this._setIsPossibleDocked((event as CustomEvent).detail);
        }, true);
        // this._getWindowSize();
        // window.addEventListener("resize", () => this._getWindowSize(), true);
    }

    addWindow(window: Window) {
        const zIndexMax = this._windowsArr.length !== 0 ? this._getZIndexMax() : 9;
        window.style.zIndex = String(zIndexMax + 1);
        this._currentWindow = window;
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
                this._currentWindow = win;
            }
            if (winZIndex > oldZIndex) {
                win.style.zIndex = String(winZIndex - 1);
            }

            // A voir si besoin d'une fonction undock all avec un param win or array of win
            for (const key in win.isDocked) {
                if (win.isDocked.hasOwnProperty(key)) {
                    if (win.isDocked[key]) {
                        // IMPORTANT
                        // APPEL DE LA FONCTION A CREER qui permettra de undock une ou des window

                        // console.log(this._dockedWindows.get(win))
                        break;
                    }
                }
            }
        });
    }

    setInFront(window: Window) {
        if (this._currentWindow === window) {
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
        this._currentWindow.style.zIndex = String(zIndexMax - 1);
        window.style.zIndex = String(zIndexMax);
        this._currentWindow = window;
    }

    protected _setIsPossibleDocked(mouseEvent: MouseEvent) {
        const mouseDockedPosition: number = 10;
        // const windowSizeAfterDocked: number = 400;
        // Si cette variable n'est pas vide
        if (this._currentWindow.isDocked["left"]) {
            // Essayer de ne pas passer par le left quand undock juste false
            this._currentWindow.toggleDocked("left", false);
            // Sans doute trouver un moyen de rendre automatique avec le nombre qui sont docké
            this._dockedWindows = this._getDockedWindows("left");

            const windowSize = DOM.getWindowSize();
            this._dockedWindows.forEach((windowInfos, window) => {
                if (windowInfos) {
                    const height = windowSize.height / this._dockedWindows.size;
                    window.toggleDocked("left", true, height * windowInfos.index, 0, 400, height);
                }
            });
        }
        if (mouseEvent.clientX < mouseDockedPosition) {
            const windowSize = DOM.getWindowSize();
            // ici les calculs sont fait
            // si souris au dessus de moitié de hauteur top 0 sinon top ... si une seule fenetre docked +
            windowSize.top = this._dockedWindows.size >= 1 && mouseEvent.clientY > windowSize.height / 2 ? windowSize.height - windowSize.height / (this._dockedWindows.size + 1) : 0;
            windowSize.height = windowSize.height / (this._dockedWindows.size + 1);
            this._addGhostWindow("left", windowSize.top + "px", "0px", "400px", windowSize.height + "px");

            // Appel des fonctions dock des différentes fenetres concernées dans dockedWindows -> a faire dans une autre fonction
            this._dockedWindows.forEach((windowInfos, window) => {
                if (windowInfos) {
                    // obligatoire de passer par le toggledock pour mettre à jour le bbox
                    const height = windowSize.height;
                    window.toggleDocked("left", true, windowSize.top === 0 ? windowSize.height * (windowInfos.index + 1) : 0 + windowSize.height * windowInfos.index, 0, 400, windowSize.height);
                }
            });

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
            this._removeGhostWindow();

            this._dockedWindows.forEach((windowInfos, window) => {
                if (windowInfos) {
                    // Faire en sorte que le left ne soit pas onligatoire sur la fonction
                    window.toggleDocked("left", true, windowInfos.top, windowInfos.left, windowInfos.width, windowInfos.height);
                }
            });
        }
    }

    protected _getDockedWindows(position: string) {
        const dockedWindows: Map<Window, {top: number, left: number, width: number, height: number, index: number}> = new Map<Window, {top: number, left: number, width: number, height: number, index: number}>();
        let count = 0;
        this._windowsArr.forEach((win) => {
            if (win.isDocked[position]) {
                dockedWindows.set(win, {top: win.top, left: win.left, width: win.width, height: win.height, index: count});
                count++;
            }
        });
        return dockedWindows;
    }

    protected _dockedWindow(isDocked: boolean) {
        let ghostDockedPosition = "";
        for (const i in this._isGhostDocked) {
            if (this._isGhostDocked[i]) {
                ghostDockedPosition = i;
                break;
            }
        }
        if (this._isCurrentWindowSelected && ghostDockedPosition !== "") {
            this._currentWindow.toggleDocked(ghostDockedPosition, isDocked, DOM.parseStyleToNumber(this._ghostWindow.style.top), DOM.parseStyleToNumber(this._ghostWindow.style.left), DOM.parseStyleToNumber(this._ghostWindow.style.width), DOM.parseStyleToNumber(this._ghostWindow.style.height));
            this._removeGhostWindow();
        }
    }

    protected _addGhostWindow(position: string, top: string, left: string, width: string, height: string) {
        if (this._isGhostDocked[position]) {
            return;
        }
        this._ghostWindow = document.body.appendChild(<div class="ghostWindow"></div>);
        this._ghostWindow.style.position = this._currentWindow.style.position;
        this._ghostWindow.style.top = this._currentWindow.style.top;
        this._ghostWindow.style.left = this._currentWindow.style.left;
        this._ghostWindow.style.height = this._currentWindow.style.height;
        this._ghostWindow.style.width = this._currentWindow.style.width;
        this._ghostWindow.style.zIndex = String(Number(this._currentWindow.style.zIndex) - 1);
        setTimeout(() => {
            this._ghostWindow.style.top = top;
            this._ghostWindow.style.left = left;
            this._ghostWindow.style.width = width;
            this._ghostWindow.style.height = height;
        }, 50);
        this._isGhostDocked[position] = true;
    }

    protected _removeGhostWindow() {
        this._isGhostDocked = {top: false, bottom: false, left: false, right: false};
        this._ghostWindow.style.opacity  = "0";
        setTimeout(() => {
            if (this._ghostWindow) {
                document.body.removeChild(this._ghostWindow);
                delete this._ghostWindow;
            }
        }, 250);
    }

    protected _getZIndexMax() {
        return Number(Math.max.apply(Math, this._windowsArr.map((win) => win.style.zIndex)));
    }
}
