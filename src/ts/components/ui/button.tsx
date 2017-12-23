import { DOM } from "dom";
import { NFJSX } from "jsx";

interface IButtonOpts {
    title?: string;
    className?: string;
    label?: string;
    type?: string;
}

// voir si possile de passer en htmlButtonel + style en --
export default class Button extends HTMLElement {
    get label(): string {
        return this.getAttribute("label") || "";
    }
    set label(label: string) {
        DOM.setAttribute(this, "label", String(label));
    }
    // A repasser en protected
    get type(): string {
        return this.getAttribute("type") || "";
    }
    set type(type: string) {
        DOM.setAttribute(this, "type", String(type));
    }
    protected _labelElement: HTMLElement;
    protected _style: any;
    protected _icon: SVGSVGElement;

    static get observedAttributes() {
        return ["type"];
    }

    constructor(options?: IButtonOpts) {
        super();
        const shadow = this.attachShadow({mode: "open"});
        if (options) {
            if (options.title) {
                this.title = options.title;
            }
            if (options.label) {
                this.label = options.label;
            }
            if (options.type) {
                this.type = options.type;
            }
        }
        this._style = shadow.appendChild(<style></style>);
        this._labelElement = shadow.appendChild(<span></span>);
    }

    connectedCallback() {
        this._style.innerHTML =
        `
            .icon {
                width: 0.6em;
                height: 1em;
                stroke-width: 0;
                stroke: currentColor;
                fill: currentColor;
                overflow: hidden;
                padding-top: 0.25em;
            }
            span {
                display: none;
            }
        `;
        if (this.type) {
            this._icon = DOM.addIcon(this.type, this._labelElement.parentNode as HTMLElement, this._labelElement);
        }
        this._labelElement.innerHTML = this.label !== "" ? this.label : this.title;
    }

    attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
        if (attrName === "type" && this._icon) {
            DOM.changeIcon(this._icon, newVal);
        }
    }
}

customElements.define("nf-button", Button);
