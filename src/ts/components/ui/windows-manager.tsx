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
    protected _mouseDockedPosition: number = 10;
    protected _windowSizeAfterDocked: number = 400;
    protected _isGhostDocked: boolean = false;
    protected _ghostDockedPosition: string = "";
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
            this._dockWindow(true);
            this._isCurrentWindowSelected = false;
        }, true);
        document.addEventListener("windowCreated", (event) => this.addWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClosed", (event) => this.removeWindow((event as CustomEvent).detail), true);
        document.addEventListener("windowClicked", (event) => {
            this.setInFront((event as CustomEvent).detail);

            // A revoir pas sur mais réfléchir si on le met ici
            this._dockedWindows = this._getDockedWindows();
        }, true);
        document.addEventListener("windowIsDragging", (event) => {
            this._isCurrentWindowSelected = true;
            this._undockCurrentWindow();
            this._checkPossibleDocked((event as CustomEvent).detail);
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
        const dockedPosition = window.dockedPosition;
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
        });
        this._resetAllDockedWindows(dockedPosition);
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

    protected _checkPossibleDocked(mouseEvent: MouseEvent) {
        // Cancel possible dock
        if (this._ghostWindow && mouseEvent.clientX >= this._mouseDockedPosition && mouseEvent.clientX <= window.innerWidth - this._mouseDockedPosition && mouseEvent.clientY >= this._mouseDockedPosition && mouseEvent.clientY <= window.innerHeight - this._mouseDockedPosition) {
            const ghostDockedPosition = this._ghostDockedPosition;
            this._removeGhostWindow();
            this._resetAllDockedWindows(ghostDockedPosition);
        } else {
            const position: string = mouseEvent.clientX < this._mouseDockedPosition ? "left" : mouseEvent.clientX > window.innerWidth - this._mouseDockedPosition ? "right" : mouseEvent.clientY < this._mouseDockedPosition ? "top" : mouseEvent.clientY > window.innerHeight - this._mouseDockedPosition ? "bottom" : "";
            if (position === "") {
                return;
            }
            const windowSize = DOM.getWindowSize();
            let ghostWindowTop: number = 0;
            let ghostWindowLeft: number = 0;
            let ghostWindowWidth: number = 0;
            let ghostWindowHeight: number = 0;
            switch (position) {
                case "left":
                case "right":
                    ghostWindowTop = this._dockedWindows.size >= 1 && mouseEvent.clientY > windowSize.height / 2 ? windowSize.height - windowSize.height / (this._dockedWindows.size + 1) : 0;
                    ghostWindowLeft = position === "left" ? 0 : windowSize.width - this._windowSizeAfterDocked;
                    ghostWindowWidth = this._windowSizeAfterDocked;
                    ghostWindowHeight = windowSize.height / (this._dockedWindows.size + 1);
                    break;
                case "top":
                case "bottom":
                    ghostWindowTop = position === "top" ? 0 : windowSize.height - this._windowSizeAfterDocked;
                    ghostWindowLeft = this._dockedWindows.size >= 1 && mouseEvent.clientX > windowSize.width / 2 ? windowSize.width - windowSize.width / (this._dockedWindows.size + 1) : 0;
                    ghostWindowWidth = windowSize.width / (this._dockedWindows.size + 1);
                    ghostWindowHeight = this._windowSizeAfterDocked;
                    break;
            }
            this._addGhostWindow(position, ghostWindowTop + "px", ghostWindowLeft + "px", ghostWindowWidth + "px", ghostWindowHeight + "px");

            // Appel des fonctions dock des différentes fenetres concernées dans dockedWindows -> a faire dans une autre fonction pour l'appeler aussi quand on suppr une fenetre dickée

            // En gros on va sortir ce truc et le addghostwin pour pas les répéter et c la pos qui changera en fonction de left, right ...
            // Revoir pareil reset docked window

            // Essayer de le mettre dans reset all docked pos

            this._resetAllDockedWindows(position);
            // => marche je pense si dans cette fonction ondemande si y a un dockedghostdockedpos

            // A finaliser en bas marche pas
            // this._dockedWindows.forEach((windowInfos, window) => {
            //     if (windowInfos) {
            //         const top = position === "left" || position === "right" ? (ghostWindowTop === 0 ? ghostWindowHeight * (windowInfos.index + 1) : ghostWindowHeight * windowInfos.index) : ghostWindowTop;
            //         const left = position === "top" || position === "bottom" ? (ghostWindowLeft === 0 ? ghostWindowWidth * (windowInfos.index + 1) : ghostWindowWidth * windowInfos.index) : ghostWindowLeft;
            //         window.toggleDocked(true, position, top, left, ghostWindowWidth, ghostWindowHeight);
            //     }
            // });
        }
    }

    protected _undockCurrentWindow() {
        if (this._currentWindow.isDocked) {
            const position = this._currentWindow.dockedPosition;
            // Undock currentWindow

            // Position  finale en fonction de pos de souris
            this._currentWindow.toggleDocked(false);
            // Reset docked windows at current window position
            this._resetAllDockedWindows(position);
        }
    }

    protected _resetAllDockedWindows(position: string) {
        if (position === "") {
            return;
        }

        // manque la variable d'emplacement lié au placement du dockedwindow => fait mais à améliorer + voir si pas moye, de mutualiser les position avec la fonction check...
        this._dockedWindows = this._getDockedWindows();
        const dockedWindowSize = this._isGhostDocked  ? this._dockedWindows.size + 1 : this._dockedWindows.size;
        const windowSize = DOM.getWindowSize();
        this._dockedWindows.forEach((windowInfos, window) => {
            if (windowInfos && window.dockedPosition === position) {

                // A améliorer pb probablement sur le top
                const indexTop = this._isGhostDocked && this._ghostWindow && DOM.parseStyleToNumber(this._ghostWindow.style.top) === 0 ? windowInfos.index + 1 : windowInfos.index;
                const indexLeft = this._isGhostDocked && this._ghostWindow && DOM.parseStyleToNumber(this._ghostWindow.style.left) === 0 ? windowInfos.index + 1 : windowInfos.index;

                const height = position === "left" || position === "right" ? windowSize.height / dockedWindowSize : this._windowSizeAfterDocked;
                const width = position === "top" || position === "bottom" ? windowSize.width / dockedWindowSize : this._windowSizeAfterDocked;
                const top = position === "left" || position === "right" ? height * indexTop : position === "bottom" ? windowSize.height - this._windowSizeAfterDocked : 0;
                const left = position === "top" || position === "bottom" ? width * indexLeft : position === "right" ? windowSize.width - this._windowSizeAfterDocked : 0;
                window.toggleDocked(true, position, top, left, width, height);
            }
        });
    }

    protected _getDockedWindows() {
        const dockedWindows: Map<Window, {top: number, left: number, width: number, height: number, index: number}> = new Map<Window, {top: number, left: number, width: number, height: number, index: number}>();
        let count = 0;
        this._windowsArr.forEach((win) => {
            if (win.isDocked) {
                dockedWindows.set(win, {top: win.top, left: win.left, width: win.width, height: win.height, index: count});
                count++;
            }
        });
        return dockedWindows;
    }

    protected _dockWindow(isDocked: boolean) {
        if (this._isCurrentWindowSelected && this._ghostDockedPosition !== "") {
            this._currentWindow.toggleDocked(isDocked, this._ghostDockedPosition, DOM.parseStyleToNumber(this._ghostWindow.style.top), DOM.parseStyleToNumber(this._ghostWindow.style.left), DOM.parseStyleToNumber(this._ghostWindow.style.width), DOM.parseStyleToNumber(this._ghostWindow.style.height));
            this._removeGhostWindow();
        }
    }

    protected _addGhostWindow(position: string, top: string, left: string, width: string, height: string) {
        if (this._isGhostDocked) {
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
        this._isGhostDocked = true;
        this._ghostDockedPosition = position;
    }

    protected _removeGhostWindow() {
        this._isGhostDocked = false;
        this._ghostDockedPosition = "";
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
