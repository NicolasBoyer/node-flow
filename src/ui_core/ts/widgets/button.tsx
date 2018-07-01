import { Component, DOM, JSX } from "wapitis";

interface IButtonOpts {
    title?: string;
    className?: string;
    label?: string;
    type?: string;
}

// style en --
@Component.register("ui-button")

export default class Button extends Component {
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
    protected _icon: SVGSVGElement;

    static get observedAttributes() {
        return ["type"];
    }

    constructor(options?: IButtonOpts) {
        super();
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
    }

    _style() {
        return  `
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
    }

    _render() {
        return (
            <span></span>
        );
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.type) {
            this._icon = DOM.addIcon(this.type, this._renderElements.parentNode as HTMLElement, this._renderElements);
        }
        this._renderElements.innerHTML = this.label !== "" ? this.label : this.title;
    }

    attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
        if (attrName === "type" && this._icon) {
            DOM.changeIcon(this._icon, newVal);
        }
    }
}
