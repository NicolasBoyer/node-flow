import { DOM } from "dom";
import { JSX } from "jsx";
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
    protected _dockedWindows: Map<Window, {top: number, left: number, width: number, height: number, index: number}>;
    protected _ghostWindowTop: number = 0;
    protected _ghostWindowLeft: number = 0;
    protected _mouseDockedPosition: number = 10;
    protected _windowSizeAfterDocked: number = 400;
    protected _isGhostDocked: boolean = false;
    protected _ghostDockedPosition: string = "";
    protected _isCurrentWindowSelected: boolean = false;

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
        document.addEventListener("windowClicked", (event) => this.setInFront((event as CustomEvent).detail), true);
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
            this._resetAllDockedWindows(ghostDockedPosition, this._dockedWindows);
        } else {
            const position: string = mouseEvent.clientX < this._mouseDockedPosition ? "left" : mouseEvent.clientX > window.innerWidth - this._mouseDockedPosition ? "right" : mouseEvent.clientY < this._mouseDockedPosition ? "top" : mouseEvent.clientY > window.innerHeight - this._mouseDockedPosition ? "bottom" : "";
            if (position === "") {
                return;
            }
            this._addGhostWindow(position, mouseEvent);
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

    protected _resetAllDockedWindows(position: string, dockedWindows: Map<Window, {top: number, left: number, width: number, height: number, index: number}> | null = null) {
        if (position === "") {
            return;
        }
        // prendre en compte les windocked en top ou bottom et inverse
        const topDockedWindowHeight = this._getDockedWindows("top").size > 0 ? this._getDockedWindows("top").values().next().value.height : 0;
        const bottomDockedWindowHeight = this._getDockedWindows("bottom").size > 0 ? this._getDockedWindows("bottom").values().next().value.height : 0;
        // const leftDockedWindowHeight = (position === "top" || position === "bottom") && this._getDockedWindows("left").size > 0 ? this._getDockedWindows("left").values().next().value.height : 0;
        // const rightDockedWindowHeight = (position === "top" || position === "bottom") && this._getDockedWindows("right").size > 0 ? this._getDockedWindows("right").values().next().value.height : 0;
        this._dockedWindows = dockedWindows || this._getDockedWindows(position);
        const dockedWindowSize = this._isGhostDocked ? this._dockedWindows.size + 1 : this._dockedWindows.size;
        const windowSize = DOM.getWindowSize();
        this._dockedWindows.forEach((windowInfos, window) => {
            const indexTop = this._isGhostDocked && this._ghostWindowTop === topDockedWindowHeight ? windowInfos.index + 1 : windowInfos.index;
            const indexLeft = this._isGhostDocked && this._ghostWindowLeft === 0 ? windowInfos.index + 1 : windowInfos.index;
            const height = position === "left" || position === "right" ? (windowSize.height - topDockedWindowHeight - bottomDockedWindowHeight) / dockedWindowSize : this._windowSizeAfterDocked;
            const width = position === "top" || position === "bottom" ? windowSize.width / dockedWindowSize : this._windowSizeAfterDocked;
            const top = position === "left" || position === "right" ? height * indexTop + topDockedWindowHeight : position === "bottom" ? windowSize.height - this._windowSizeAfterDocked : 0;
            const left = position === "top" || position === "bottom" ? width * indexLeft : position === "right" ? windowSize.width - this._windowSizeAfterDocked : 0;
            window.toggleDocked(true, position, top, left, width, height);
        });
        // A faire pour right
        const dockedLeftWindows = this._getDockedWindows("left");
        dockedLeftWindows.forEach((windowInfos, window) => {
            if (position === "top" || position === "bottom") {
                console.log(topDockedWindowHeight);
                // Pos en top marche pas encore
                const top = position === "top" && this._isGhostDocked ? this._windowSizeAfterDocked * (windowInfos.index + 1) : topDockedWindowHeight * windowInfos.index;
                const height = position === "bottom" ? windowInfos.height - this._windowSizeAfterDocked : (windowSize.height - topDockedWindowHeight) / dockedLeftWindows.size;
                window.toggleDocked(true, "left", top, windowInfos.left, windowInfos.width, height);
            }
        });
    }

    protected _getDockedWindows(position: string) {
        const dockedWindows: Map<Window, {top: number, left: number, width: number, height: number, index: number}> = new Map<Window, {top: number, left: number, width: number, height: number, index: number}>();
        let count = 0;
        this._windowsArr.forEach((win) => {
            if (win.isDocked && win.dockedPosition === position) {
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

    protected _addGhostWindow(position: string, mouseEvent: MouseEvent | null = null) {
        if (this._isGhostDocked) {
            return;
        }
        this._dockedWindows = this._getDockedWindows(position);
        const windowSize = DOM.getWindowSize();
        let ghostWindowWidth: number = 0;
        let ghostWindowHeight: number = 0;
        switch (position) {
            case "left":
            case "right":
                const topDockedWindowHeight = this._getDockedWindows("top").size > 0 ? this._getDockedWindows("top").values().next().value.height : 0;
                const bottomDockedWindowHeight = this._getDockedWindows("bottom").size > 0 ? this._getDockedWindows("bottom").values().next().value.height : 0;

                this._ghostWindowTop = this._dockedWindows.size >= 1 && mouseEvent && mouseEvent.clientY > (windowSize.height + topDockedWindowHeight - bottomDockedWindowHeight) / 2 ? windowSize.height - (windowSize.height - topDockedWindowHeight + bottomDockedWindowHeight) / (this._dockedWindows.size + 1) : topDockedWindowHeight;
                this._ghostWindowLeft = position === "left" ? 0 : windowSize.width - this._windowSizeAfterDocked;
                ghostWindowWidth = this._windowSizeAfterDocked;
                ghostWindowHeight = (windowSize.height - topDockedWindowHeight - bottomDockedWindowHeight) / (this._dockedWindows.size + 1);
                break;
            case "top":
            case "bottom":
                this._ghostWindowTop = position === "top" ? 0 : windowSize.height - this._windowSizeAfterDocked;
                this._ghostWindowLeft = this._dockedWindows.size >= 1 && mouseEvent && mouseEvent.clientX > windowSize.width / 2 ? windowSize.width - windowSize.width / (this._dockedWindows.size + 1) : 0;
                ghostWindowWidth = windowSize.width / (this._dockedWindows.size + 1);
                ghostWindowHeight = this._windowSizeAfterDocked;
                break;
        }
        this._ghostWindow = document.body.appendChild(<div class="ghostWindow"></div>);
        this._ghostWindow.style.position = this._currentWindow.style.position;
        this._ghostWindow.style.top = this._currentWindow.style.top;
        this._ghostWindow.style.left = this._currentWindow.style.left;
        this._ghostWindow.style.height = this._currentWindow.style.height;
        this._ghostWindow.style.width = this._currentWindow.style.width;
        this._ghostWindow.style.zIndex = String(Number(this._currentWindow.style.zIndex) - 1);
        setTimeout(() => {
            this._ghostWindow.style.top = String(this._ghostWindowTop) + "px";
            this._ghostWindow.style.left = String(this._ghostWindowLeft) + "px";
            this._ghostWindow.style.width = String(ghostWindowWidth) + "px";
            this._ghostWindow.style.height = String(ghostWindowHeight) + "px";
        }, 50);
        this._isGhostDocked = true;
        this._ghostDockedPosition = position;
        this._resetAllDockedWindows(position, this._dockedWindows);
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
