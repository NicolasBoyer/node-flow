import Button from "button";
import { DOM } from "dom";
import { NFJSX } from "jsx";

interface IWindowOpts {
    [key: string]: any;
    title?: string;
    left?: number;
    top?: number;
    width?: number;
    minWidth?: number;
    height?: number;
    minHeight?: number;
    className?: string;
    draggable?: boolean;
    resizable?: boolean;
    visible?: boolean;
    margins?: number;
    center?: boolean;
}

export interface IOnPosition {
    [key: string]: any;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
}

export default class Window extends HTMLElement {
    // is docked left right top bottom
    // style
    [key: string]: any;

    isDocked: boolean = false;
    dockedPosition: string = "";

    // A revoir peut etre avec les slots
    protected _content: HTMLElement;
    get content(): HTMLElement {
        return this._content;
    }
    set content(content: HTMLElement) {
        this._content.appendChild(content);
    }
    get left(): number {
        return Number(this.getAttribute("left"));
    }
    set left(left: number) {
        this.center = false;
        DOM.setAttribute(this, "left", String(left));
    }
    get top(): number {
        return Number(this.getAttribute("top"));
    }
    set top(top: number) {
        this.center = false;
        DOM.setAttribute(this, "top", String(top));
    }
    get width(): number {
        return Number(this.getAttribute("width"));
    }
    set width(width: number) {
        this.center = false;
        DOM.setAttribute(this, "width", String(width));
    }
    get height(): number {
        return Number(this.getAttribute("height"));
    }
    set height(height: number) {
        this.center = false;
        DOM.setAttribute(this, "height", String(height));
    }
    get minWidth(): number {
        return Number(this.getAttribute("min-width"));
    }
    set minWidth(minWidth: number) {
        DOM.setAttribute(this, "min-width", String(minWidth));
    }
    get minHeight(): number {
        return Number(this.getAttribute("min-height"));
    }
    set minHeight(minHeight: number) {
        DOM.setAttribute(this, "min-height", String(minHeight));
    }
    get resizable(): boolean {
        const isResizable: any = this.getAttribute("resizable");
        return isResizable != null ? JSON.parse(isResizable) : isResizable;
    }
    set resizable(isResizable: boolean) {
        DOM.setAttribute(this, "resizable", isResizable);
    }
    get visible(): boolean {
        return !this.classList.contains("invisible");
    }
    set visible(isVisible: boolean) {
        DOM.setAttribute(this, "visible", isVisible);
        if (isVisible) {
            this.classList.remove("invisible");
        } else {
            this.classList.add("invisible");
        }
    }
    get draggable(): boolean {
        const isDraggable: any = this.getAttribute("draggable");
        return isDraggable != null ? JSON.parse(isDraggable) : isDraggable;
    }
    set draggable(isDraggable: boolean) {
        DOM.setAttribute(this, "draggable", isDraggable);
    }
    get center(): boolean {
        const isCentered: any = this.getAttribute("center");
        return JSON.parse(isCentered);
    }
    set center(isCentered: boolean) {
        DOM.setAttribute(this, "center", isCentered);
        if (isCentered) {
            this.style.top = "50%";
            this.style.left = "50%";
            const left = this.offsetLeft;
            const top = this.offsetTop;
            DOM.setAttribute(this, "left", String(left - this.width / 2));
            DOM.setAttribute(this, "top", String(top - this.height / 2));
        }
    }
    protected get margins(): number {
        return Number(this.getAttribute("margins"));
    }
    protected set margins(margins: number) {
        DOM.setAttribute(this, "margins", String(margins));
    }
    protected _isOnEdge: IOnPosition = {top: false, bottom: false, left: false, right: false};
    protected _defaultAttributes: Array<{name: string, value: any, executeAtLast?: boolean}> = [
        {name: "width", value: 800},
        {name: "height", value: 600},
        {name: "min-width", value: 200},
        {name: "min-height", value: 200},
        {name: "top", value: 0},
        {name: "left", value: 0},
        {name: "visible", value: true},
        {name: "margins", value: 10},
        {name: "center", value: false, executeAtLast: true},
    ];
    protected _isMaximizedButton: boolean = true;
    protected _isMinimizedButton: boolean = true;
    protected _isClosedButton: boolean = true;
    protected _isDockingEnabled: boolean = true;
    protected _isDragging: boolean;
    protected _isResizing: boolean;
    protected _isMaximized: boolean;
    protected _isMinimized: boolean;
    protected _startMouseX: number;
    protected _startMouseY: number;
    protected _titleElement: HTMLElement;
    protected _bbox: HTMLElement;
    protected _container: HTMLElement;
    // A supprimer
    // protected _ghost: HTMLElement;
    protected _options: IWindowOpts;
    protected _sizeInfos: IWindowOpts;
    protected _maximizeButton: JSX.Element;
    protected _minimizeButton: JSX.Element;
    protected _style: any;
    protected _icon: SVGSVGElement;
    // private _isGhostDocked: IOnPosition = {top: false, bottom: false, left: false, right: false};

    constructor(options?: IWindowOpts) {
        super();
        const shadow = this.attachShadow({mode: "open"});
        // gestion touch
        if (options) {
            this._options = options;
            if (options.title) {
                this.title = options.title;
            }
        }
        this._style = shadow.appendChild(<style></style>);
        this._bbox = shadow.appendChild(<div class="bbox"></div>);
        this._container = shadow.appendChild(<div class="container"></div>);
    }

    connectedCallback() {
        // Called every time the element is inserted into the DOM.
        // Useful for running setup code, such as fetching resources or rendering.
        // Generally, you should try to delay work until this time.
        this._style.innerHTML =
        `
            :host {
                position: absolute;
            }
            .container {
                width: 100%;
                height: 100%;
                position: absolute;
            }
            .title {
                cursor: default;
                user-select: none;
                /* border-bottom: 1px solid #d9d9d9; */
                color: var(--font-color, #282828);
                font-size: var(--font-size, 0.75em);
                // padding: var(--title-padding, 0.3em);
                text-align: var(--title-align, center);
                min-height: var(--min-height, 1.2em);
                display: flex;
                align-items: center;
            }
            .title > span::before {
                content: "|";
                padding-right: 0.5em;
            }
            .title > span {
                flex: 1 0 auto;
                text-align: left;
                padding-left: 0.6em;
            }
            .title nf-button {
                flex: 0 1 auto;
                align-self: auto;
                min-width: 48px;
                min-height: 37px;
            }
            .bbox {
                position: absolute;
            }
            nf-button {
                background: none;
                color: #282828;
                border: none;
                font-size: x-large;
                padding: 0;
            }
            nf-button span {
                display: none;
            }
            nf-button:hover {
                background: #d0d0d0;
            }
            nf-button.close:hover {
                background: #ef2a2a;
                color: #fff;
            }
            .icon {
                width: 0.6em;
                height: 1em;
                stroke-width: 0;
                stroke: currentColor;
                fill: currentColor;
                overflow: hidden;
            }
            // .icon-minimize {
            //     padding-top: 0;
            //     margin-top: -0.1em;
            // }
            // .icon-maximize {
            //     padding-top: 0.3em;
            // }
            // .icon-close {
            //     padding-top: 0.2em;
            // }
            .icon-folder_close {
                font-size: x-large;
                padding-left: 0.4em;
                color: #ffdb74;
                stroke-width: 3px;
                stroke: #f5c332;
            }
            .noTitle > span {
                display: none;
            }
        `;
        this.id = DOM.generateId();
        this._setOpts();
        this._titleElement = this._container.appendChild(<div class="title"><span>{this.title}</span></div>);
        this._content = this._container.appendChild(<div class="content"><slot></slot></div>);
        if (this._isMaximizedButton) {
            this._minimizeButton = <nf-button title="Réduire" type="minimize" class="minimize" onclick={() => this.minimize()}></nf-button>;
            this._titleElement.appendChild(this._minimizeButton);
        }
        if (this._isMinimizedButton) {
            this._maximizeButton = <nf-button title="Agrandir" type="maximize" class="maximize" onclick={() => this.maximize()}></nf-button>;
            this._titleElement.appendChild(this._maximizeButton);
        }
        if (this._isClosedButton) {
            const closeButton = <nf-button title="Fermer" type="close" class="close" onclick={() => {
                this.classList.add("animate");
                this.classList.add("fadeout");
                setTimeout(() => this.destroy(), 200);
            }}></nf-button>;
            this._titleElement.appendChild(closeButton);
        }
        this._icon = DOM.addIcon("folder_close", this._titleElement, this._titleElement.firstChild);
        this._bbox.style.top = - this.margins + "px";
        this._bbox.style.left = - this.margins + "px";
        this._setBboxSize();
        this._setEvents();
        DOM.dispatchEvent("windowCreated", this);
    }

    disconnectedCallback() {
        // Called every time the element is removed from the DOM.
        // Useful for running clean up code (removing event listeners, etc.).
        this.removeEventListener("mousedown", this._windowClicked, true);
        this._titleElement.removeEventListener("mousedown", this._titleClicked, true);
        this._titleElement.removeEventListener("dblclick", () => {
            //
        }, true);
        window.removeEventListener("resize", () => {
            //
        }, true);
        document.removeEventListener("mouseup", () => {
            //
        }, true);
    }

    attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
        // An attribute was added, removed, updated, or replaced.
        // Also called for initial values when an element is created by the parser, or upgraded.
        // Note: only attributes listed in the observedAttributes property will receive this callback.
    }

    destroy() {
        if (this) {
            document.body.removeChild(this);
            DOM.dispatchEvent("windowClosed", this);
        }
    }

    // Reste dock + autres com
    maximize(options: {removeAnimateClass?: boolean, isDragging?: boolean, mouseX?: number} = {removeAnimateClass: true}) {
        this._isMaximized = !this._isMaximized;
        this._maximizeButton.type = this._isMaximized ? "restore" : "maximize";
        if (this._isMaximized) {
            if (this._isMinimized) {
                this.minimize(false);
            }
            this._sizeInfos = {top: this.top, left: this.left, width: this.width, height: this.height};
            this.classList.add("animate");
            this.top = 0;
            this.left = 0;
            this.style.width = "100%";
            this.style.height = "100%";
            setTimeout(() => {
                this.width = this.offsetWidth;
                this.height = this.offsetHeight;
                this._setBboxSize();
            }, 150);
        } else {
            if (options.isDragging) {
                this.top = 0;
                // Si la souris est dans le premier tiers de la largeur de la fenetre
                if (options.mouseX && options.mouseX <= this.width / 3) {
                    this.left = 0;
                }
                // Si la souris est dans le troisième tiers de la largeur de la fenetre
                if (options.mouseX && options.mouseX >= (this.width / 3) * 2) {
                    this.left = this.width - (this._sizeInfos.width || 0);
                }
                // Si la souris est dans le deuxième tiers de la largeur de la fenetre
                if (options.mouseX && options.mouseX < (this.width / 3) * 2 && options.mouseX > this.width / 3) {
                    this.left = options.mouseX - ((this._sizeInfos.width || 0) * (options.mouseX * 100 / this.width) / 100);
                }
                this.classList.remove("animate");
            } else {
                this.top = this._sizeInfos.top || 0;
                this.left = this._sizeInfos.left || 0;
            }
            this.width = this._sizeInfos.width || 0;
            this.height = this._sizeInfos.height || 0;
            setTimeout(() => {
                if (options.removeAnimateClass) {
                    this.classList.remove("animate");
                }
                this._setBboxSize();
            }, 150);
        }
        DOM.dispatchEvent("windowMaximised", this);
    }

    minimize(removeAnimateClass: boolean = true) {
        this._isMinimized = !this._isMinimized;
        this._minimizeButton.type = this._isMinimized ? "restore" : "minimize";
        if (this._isMinimized) {
            if (this._isMaximized) {
                this.maximize({removeAnimateClass: false});
            }
            this._sizeInfos = {top: this.top, left: this.left, width: this.width, height: this.height, minWidth: this.minWidth, minHeight: this.minHeight, draggable: this.draggable, resizable: this.resizable};
            this.classList.add("animate");
            this.width = 168;
            this.height = 38;
            this.minWidth = 0;
            this.minHeight = 0;
            this.left = 5;
            this.style.removeProperty("top");
            this.style.bottom = "0";
            this._titleElement.classList.add("noTitle");
            this.resizable = false;
            this.draggable = false;
            setTimeout(() => {
                this.top = this.offsetTop;
                this._setBboxSize();
            }, 150);
        } else {
            this.top = this._sizeInfos.top || 0;
            this.left = this._sizeInfos.left || 0;
            this.width = this._sizeInfos.width || 0;
            this.height = this._sizeInfos.height || 0;
            this.minWidth = this._sizeInfos.minWidth || 0;
            this.minHeight = this._sizeInfos.minHeight || 0;
            this.resizable = this._sizeInfos.resizable || false;
            this.draggable = this._sizeInfos.draggable || false;
            this._titleElement.classList.remove("noTitle");
            setTimeout(() => {
                if (removeAnimateClass) {
                    this.classList.remove("animate");
                }
                this._setBboxSize();
            }, 150);
        }
        DOM.dispatchEvent("windowMinimised", this);
    }

    detectMousePosition = (event: MouseEvent) => {
        if (!this.resizable || event.target !== this || this._isDragging || this._isResizing) {
            return;
        }
        const x = event.clientX - this.left;
        const y = event.clientY - this.top;
        this._isOnEdge.top = y < 0;
        this._isOnEdge.left = x < 0;
        this._isOnEdge.right = x >= this.width;
        this._isOnEdge.bottom = y >= this.height;
        this._changeCursor();
    }

    toggleDocked(isDocked: boolean, position: string = "", top: number = 0, left: number = 0, width: number = 0, height: number = 0) {
        if (!this.isDocked) {
            this._sizeInfos = {width: this.width, height: this.height, minWidth: this.minWidth, minHeight: this.minHeight};
        }
        this.isDocked = isDocked;
        this.dockedPosition = position;
        if (this.isDocked) {
            this.width = width;
            this.height = height;
            this.minWidth = 0;
            this.minHeight = 0;
            this.left = left;
            this.top = top;
            this.classList.add("docked_" + position);
        } else {
            if (!this._isDragging) {
                this.top = 0;
                this.left = 0;
            }
            this.width = this._sizeInfos.width || 0;
            this.height = this._sizeInfos.height || 0;
            this.minWidth = this._sizeInfos.minWidth || 0;
            this.minHeight = this._sizeInfos.minHeight || 0;
            DOM.removeClassByPrefix(this, "docked_");
        }
        this._setBboxSize();
    }

    // Opts
    protected _setOpts() {
        const options = Object();
        const executeAtLast: Array<{name: string, value: string}> = [];
        // Attributes
        if (this.attributes) {
            const attributes = Array.prototype.slice.call(this.attributes);
            attributes.forEach((element: any) => {
                options[element.name] = element.value;
            });
        }
        // Options
        if (this._options) {
            Object.keys(this._options).forEach((element: any) => {
                // camelCase to dash
                const name = element.replace( /([a-z])([A-Z])/g, "$1-$2" ).toLowerCase();
                if (!options[name]) {
                    options[name] = this._options[element];
                }
            });
        }
        // Attributs par défaut
        for (const defaultAttr of this._defaultAttributes) {
            if (defaultAttr.executeAtLast) {
                executeAtLast.push({name: defaultAttr.name, value: defaultAttr.value});
            }
            if (!options[defaultAttr.name] && !defaultAttr.executeAtLast) {
                options[defaultAttr.name] = defaultAttr.value;
            }
        }
        // Mise en place des attributs et options
        for (const name in options) {
            if (options.hasOwnProperty(name)) {
                // dash to camelCase
                // tslint:disable-next-line:only-arrow-functions
                this[name.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); })] = options[name];
            }
        }
        // Attributs à intialiser en dernier (center)
        executeAtLast.forEach((attr) => this[attr.name] = options[attr.name] || attr.value);
    }

    // Events
    protected _setEvents() {
        this.addEventListener("contextmenu", (event: PointerEvent) => event.preventDefault(), true);
        this.addEventListener("mousedown", this._windowClicked, true);
        this._titleElement.addEventListener("mousedown", this._titleClicked, true);
        this._titleElement.addEventListener("dblclick", (event: MouseEvent) => this.maximize(), true);
        window.addEventListener("resize", () => {
            if (this.center) {
                this.center = true;
            }
        }, true);
        document.addEventListener("mouseup", (event: MouseEvent) => {
            this._mouseUp(event);
            document.removeEventListener("mousemove", this._drag, true);
            document.removeEventListener("mousemove", this._resize, true);
        }, true);
    }

    protected _windowClicked = (event: MouseEvent) => {
        if (event.which === 1) {
            DOM.dispatchEvent("windowClicked", this);
            this._startResize(event);
            document.addEventListener("mousemove", this._resize, true);
        }
        event.preventDefault();
    }

    protected _titleClicked = (event: MouseEvent) => {
        if (event.which === 1) {
            DOM.dispatchEvent("titleClicked", this);
            this._startDrag(event);
            document.addEventListener("mousemove", this._drag, true);
        }
        event.preventDefault();
    }

    protected _mouseUp = (event: MouseEvent) => {
        this._isDragging = false;
        this._isResizing = false;
    }

    // Resizing
    protected _startResize(event: MouseEvent) {
        if (!this.resizable || (!this._isOnEdge.top && !this._isOnEdge.bottom
            && !this._isOnEdge.left && !this._isOnEdge.right)) {
            return;
        }
        this._isResizing = true;
    }

    protected _resize = (event: MouseEvent) => {
        if (!this._isResizing) {
            return;
        }
        const delataMouseX = event.clientX - this.left;
        const delataMouseY = event.clientY - this.top;
        if (this._isOnEdge.right) {
            this.width = Math.max(this.minWidth, delataMouseX);
        }
        if (this._isOnEdge.bottom) {
            this.height = Math.max(this.minHeight, delataMouseY);
        }
        if (this._isOnEdge.left && (this.width > this.minWidth || delataMouseX < 0)) {
            this.width = this.width - delataMouseX;
            this.left = event.clientX;
        }
        if (this._isOnEdge.top && (this.height > this.minHeight || delataMouseY < 0)) {
            this.height = this.height - delataMouseY;
            this.top = event.clientY;
        }
        this._setBboxSize();
    }

    // Dragging
    protected _startDrag(event: MouseEvent) {
        if (!this.draggable) {
            return;
        }
        this._isDragging = true;
        this._startMouseX = event.clientX;
        this._startMouseY = event.clientY;
    }

    protected _drag = (event: MouseEvent) => {
        if (!this._isDragging) {
            return;
        }
        const deltaMouseX = this._startMouseX - event.clientX;
        const delataMouseY = this._startMouseY - event.clientY;
        // On drag seulemeny s'il y a un mouvement
        if (deltaMouseX === 0 || delataMouseY === 0) {
            return;
        }
        if (this._isMaximized) {
            this.maximize({isDragging: true, mouseX: event.x});
        }
        this._startMouseX = event.clientX;
        this._startMouseY = event.clientY;
        this.left = this.offsetLeft - deltaMouseX;
        this.top = this.offsetTop - delataMouseY;
        DOM.dispatchEvent("windowIsDragging", event);
    }

    // Rajouter une méthode docked() public qui pourra etre appelé après création ou même en attribut a voir

    // test is docked pos passe par la fonction
    // + bug à régler quand annule dock et passe sur un autre test
    // + empecher de cliquer derrière avec option tant que pas fermer
    // tslint:disable-next-line:member-ordering
    // setIsPossibleDocked = (event: MouseEvent, maxPositions: {top: number, left: number, bottom: number, right: number} = {top: 0, left: 0, bottom: 0, right: 0}) => {
    //     if (!this._isDragging || !this._isDockingEnabled) {
    //         return;
    //     }
    //     const mouseDockedPosition: number = 10;
    //     const windowSizeAfterDocked: number = 400;
    //     if (event.clientX < maxPositions.left + mouseDockedPosition) {
    //         // ajouter top left ... et traiterle docking
    //         // Veut on docker si on est déjà docker
    //         this._ghostDocked("left", maxPositions.top + "px", "0px", windowSizeAfterDocked + "px", "100%", "0");
    //     }
    //     if (event.clientX > window.innerWidth - maxPositions.right - mouseDockedPosition) {
    //         this._ghostDocked("right", maxPositions.top + "px", document.body.offsetWidth - windowSizeAfterDocked + "px", windowSizeAfterDocked + "px", "100%", "0");
    //     }
    //     if (event.clientY < mouseDockedPosition) {
    //         this._ghostDocked("top", "0px", maxPositions.left + "px", "100%", windowSizeAfterDocked + "px", "0");
    //     }
    //     if (event.clientY > window.innerHeight - mouseDockedPosition) {
    //         this._ghostDocked("bottom", "100%", maxPositions.left + "px", "100%", windowSizeAfterDocked + "px", - windowSizeAfterDocked + "px");
    //     }
    //     if (this._ghost && event.clientX >= mouseDockedPosition && event.clientX <= window.innerWidth - mouseDockedPosition && event.clientY >= mouseDockedPosition && event.clientY <= window.innerHeight - mouseDockedPosition) {
    //         // A suppr
    //         this._isGhostDocked = {top: false, bottom: false, left: false, right: false};
    //         this._ghost.style.opacity  = "0";
    //         setTimeout(() => {
    //             // Ghostdocked à supprimer
    //             if (this._ghost) {
    //                 document.body.removeChild(this._ghost);
    //                 delete this._ghost;
    //             }
    //         }, 250);
    //     }
    // }

    // Dock
    // Regarder en haut pour simplifier et peut etre a transformer en dockedGhost et créer un docked sur le mouseup
    // protected _ghostDocked(position: string, top: string, left: string, width: string, height: string, marginTop: string) {
    //     if (this._isGhostDocked[position]) {
    //         return;
    //     }
    //     this._ghost = document.body.appendChild(<div class="ghostWindow"></div>);
    //     this._ghost.style.position = this.style.position;
    //     this._ghost.style.top = this.style.top;
    //     this._ghost.style.left = this.style.left;
    //     this._ghost.style.height = this.style.height;
    //     this._ghost.style.width = this.style.width;
    //     this._ghost.style.zIndex = String(Number(this.style.zIndex) - 1);
    //     setTimeout(() => {
    //         this._ghost.style.top = top;
    //         this._ghost.style.left = left;
    //         this._ghost.style.width = width;
    //         // this._ghost.style.bottom = "0px";
    //         this._ghost.style.height = height;
    //         this._ghost.style.marginTop = marginTop;
    //     }, 50);
    //     this._isGhostDocked[position] = true;
    // }

    // Utils
    protected _changeCursor() {
        if (this._isOnEdge.right && this._isOnEdge.bottom || this._isOnEdge.left && this._isOnEdge.top) {
            this.style.cursor = "nwse-resize";
        } else if (this._isOnEdge.right && this._isOnEdge.top || this._isOnEdge.bottom && this._isOnEdge.left ) {
            this.style.cursor = "nesw-resize";
        } else if (this._isOnEdge.right  || this._isOnEdge.left ) {
            this.style.cursor = "ew-resize";
        } else if (this._isOnEdge.bottom || this._isOnEdge.top) {
            this.style.cursor = "ns-resize";
        } else {
            this.style.cursor = "default";
        }
    }

    protected _setBboxSize() {
        this._bbox.style.width = this.width + this.margins * 2 + "px";
        this._bbox.style.height = this.height + this.margins * 2 + "px";
    }

    // voir si besoin de dériver cette classe probablement pour créer le fenetre de conf

    // Reste docking
    // poser un local storage UI pour se rappeler des fenetre ouverte etc et pouvoir les réouvrir
    // shadow dom et touch - besoin d'un util pour normaliser les events et gérer le touch
}

customElements.define("nf-window", Window);
