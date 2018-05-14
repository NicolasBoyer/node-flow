declare global {
    namespace JSX {
        // On considère tout élément JSX comme un HTMLElement
        // tslint:disable-next-line:interface-name
        interface Element extends HTMLElement {
            [key: string]: any;
        }
        interface IntrinsicElements {
            [key: string]: any;
        }
    }
}

interface IConstructor<T> {
    new(): T;
}

class JSXServices {
    /**
     * React-like createElement function so we can use JSX in our TypeScript/JavaScript code.
     */
    public createElement<T extends HTMLElement>(tag: IConstructor<T>, attributes?: { [name: string]: any }, ...children: any[]): T;
    public createElement<K extends keyof HTMLElementTagNameMap>(tag: K, attributes?: { [name: string]: any }, ...children: any[]): HTMLElementTagNameMap[K];
    public createElement(tag: string | IConstructor<HTMLElement>, attributes: { [name: string]: any }, ...children: any[]): Element {
        let element: HTMLElement;
        if (typeof tag === "string") {
            element = document.createElement(tag);
        } else {
            element = new tag();
        }
        // Add attributes
        for (const name in attributes) {
            if (name && attributes.hasOwnProperty(name)) {
                const attr = attributes[name];
                if (typeof attr === "function") {
                    (element as any)[name] = attr;
                } else if (attr !== null) {
                    element.setAttribute(name, attr);
                }
            }
        }
        // Append children
        for (const child of children) {
            JSX.appendChildren(element, child);
        }
        return element;
    }

    appendChildren(element: Element | DocumentFragment, children: any) {
        if (Array.isArray(children)) {
            children.forEach((ch) => JSX.appendChildren(element, ch));
        } else if (children instanceof Node) {
            element.appendChild(children);
        } else {
            element.appendChild(document.createTextNode(children));
        }
    }
}

export const JSX: JSXServices = new JSXServices();
