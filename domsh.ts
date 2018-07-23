import {IDomLogical} from 'lib/commons/registry';
import {DOM, INodeFilter} from "lib/commons/xml/dom";

/**
 * Utilitaire de manipulation du ShadowDOM.
 * Le mot "Flat" signifie que la balise <slot> est virtuellement éliminée de l'arbre dans les parcours.
 */
export namespace DOMSH {

	import IS_node = DOM.IS_node;

	/** Retrouve l'élément container de ce noeud (<slot> exclu). */
	export function findFlatParentElt(from: Node | null, root?: Element): Element;
	export function findFlatParentElt<T extends Element>(from: Node | null, root: Element, predicate: INodeFilter<T>): T;
	export function findFlatParentElt<T extends Element>(from: Node | null, root: Element = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getFlatParentElt(from) : null;
		while (n && n !== root) {
			if (predicate(n)) return n as T;
			n = getFlatParentElt(n);
		}
		return null;
	}

	export function findFlatParentEltOrSelf(from: Element | null, root?: Element): Element;
	export function findFlatParentEltOrSelf<T extends Element>(from: Element | null, root: Element, predicate: INodeFilter<T>): T;
	export function findFlatParentEltOrSelf<T extends Element>(from: Element | null, root: Element = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from;
		while (n && n !== root) {
			if (predicate(n)) return n as T;
			n = getFlatParentElt(n);
		}
		return null;
	}

	export function findLogicalFlatParent(from: Node, root?: Node): Node;
	export function findLogicalFlatParent<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findLogicalFlatParent<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n: Node = from ? ((from as IDomLogical).logicalParent || getFlatParentElt(from)) : null;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = ((n as IDomLogical).logicalParent || getFlatParentElt(n));
		}
		return null;
	}

	export function findLogicalFlatParentOrSelf(from: Node, root?: Node): Node;
	export function findLogicalFlatParentOrSelf<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findLogicalFlatParentOrSelf<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = ((n as IDomLogical).logicalParent || getFlatParentElt(n));
		}
		return null;
	}

	/** Retrouve l'élément container de ce noeud (<slot> inclus). */
	export function findParentElt(from: Node | null, root?: Element): Element;
	export function findParentElt<T extends Element>(from: Node | null, root: Element, predicate: INodeFilter<T>): T;
	export function findParentElt<T extends Element>(from: Node | null, root: Element = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getParentElt(from) : null;
		while (n && n !== root) {
			if (predicate(n)) return n as T;
			n = getParentElt(n);
		}
		return null;
	}


	export function findFlatPrevSibling(from: Node | null): Node;
	export function findFlatPrevSibling<T extends Node>(from: Node | null, predicate: INodeFilter<T>): T;
	export function findFlatPrevSibling<T extends Node>(from: Node | null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getFlatPrevSibling(from) : null;
		while (n) {
			if (predicate(n)) return n;
			n = getFlatPrevSibling(n);
		}
		return null;
	}

	export function findFlatNextSibling(from: Node | null): Node;
	export function findFlatNextSibling<T extends Node>(from: Node | null, predicate: INodeFilter<T>): T;
	export function findFlatNextSibling<T extends Node>(from: Node | null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getFlatNextSibling(from) : null;
		while (n) {
			if (predicate(n)) return n;
			n = getFlatNextSibling(n);
		}
		return null;
	}

	export function findFlatFirstChild(from: Node | null): Node;
	export function findFlatFirstChild<T extends Node>(from: Node | null, predicate: INodeFilter<T>): T;
	export function findFlatFirstChild<T extends Node>(from: Node | null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getFlatFirstChild(from) : null;
		while (n) {
			if (predicate(n)) return n;
			return findFlatNextSibling(n, predicate);
		}
		return null;
	}

	export function findFlatLastChild(from: Node | null): Node;
	export function findFlatLastChild<T extends Node>(from: Node | null, predicate: INodeFilter<T>): T;
	export function findFlatLastChild<T extends Node>(from: Node | null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? getFlatLastChild(from) : null;
		while (n) {
			if (predicate(n)) return n;
			return findFlatPrevSibling(n, predicate);
		}
		return null;
	}

	/** Retourne le noeud suivant, ie dans l'ordre naturel de l'arbre de noeuds.*/
	export function findFlatNext(from: Node, root?: Node): Node;
	export function findFlatNext<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findFlatNext<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = getFlatFirstChild(from);
		if (n) return predicate(n) ? n : findFlatNext(n, root, predicate);
		if (from === root) return null;
		while (!(n = getFlatNextSibling(from))) {
			from = getFlatParentElt(from);
			if (from === root) return null;
		}
		return predicate(n) ? n : findFlatNext(n, root, predicate);
	}

	/** Retrouve le host du shadowTree de ce noeud. */
	export function findHost(from: Node): Element {
		while (from.parentNode) from = from.parentNode;
		return (from as ShadowRoot).host;
	}

	/** Retrouve le 1er DocumentOrShadowRoot ancêtre d'un noeud. */
	export function findDocumentOrShadowRoot(from: Node): Document | ShadowRoot {
		while (from.parentNode) from = from.parentNode;
		return (from.nodeType === Node.DOCUMENT_NODE || (from instanceof ShadowRoot)) ? from as Document | ShadowRoot : null;
	}

	/** Retrouve l'activeElement en pénétrant tous les shadowDOM.*/
	export function findDeepActiveElement(from?: DocumentOrShadowRoot) {
		let a = (from || document).activeElement;
		while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
		return a;
	}

	/** Utiliser findFlatParentElt(from) si from peut être null. */
	export function getFlatParentElt(from: Node): Element {
		let slot = (from as Element | Text).assignedSlot;
		if (slot) from = slot; //on saute l'elt slot.
		return from.parentElement || (from.parentNode instanceof ShadowRoot ? from.parentNode.host : null);
	}

	/** Retourne le parent, incluant la balise <slot> dans la chaine. */
	export function getParentElt(from: Node): Element {
		return (from as Element | Text).assignedSlot || from.parentElement || (from.parentNode instanceof ShadowRoot ? from.parentNode.host : null);
	}


	/** Utiliser findFlatFirstChild(from) si from peut être null. */
	export function getFlatFirstChild(n: Node): Node {
		if (n instanceof HTMLSlotElement) {
			let nodes = n.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[0];
		} else if ((n as Element).shadowRoot) {
			let ch = (n as Element).shadowRoot.firstChild;
			if (ch instanceof HTMLSlotElement) {
				let nodes = ch.assignedNodes(OPT_assigneNodes_flatten);
				if (nodes.length > 0) return nodes[0];
			}
			if (ch) return ch;
		}
		let ch = n.firstChild;
		if (ch instanceof HTMLSlotElement) {
			let nodes = ch.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[0];
		}
		return ch;
	}

	/** Utiliser findFlatLastChild(from) si from peut être null. */
	export function getFlatLastChild(n: Node): Node {
		if (n instanceof HTMLSlotElement) {
			let nodes = n.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[nodes.length - 1];
		} else if ((n as Element).shadowRoot) {
			let ch = (n as Element).shadowRoot.lastChild;
			if (ch instanceof HTMLSlotElement) {
				let nodes = ch.assignedNodes(OPT_assigneNodes_flatten);
				if (nodes.length > 0) return nodes[nodes.length - 1];
			}
			if (ch) return ch;
		}
		let ch = n.lastChild;
		if (ch instanceof HTMLSlotElement) {
			let nodes = ch.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[nodes.length - 1];
		}
		return ch;
	}

	/** Utiliser findFlatPreviousSibling(from) si from peut être null. */
	export function getFlatPrevSibling(from: Node): Node {
		let prev = from.previousSibling;
		while (prev instanceof HTMLSlotElement) {
			let nodes = prev.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[nodes.length - 1];
			prev = from.previousSibling;
		}
		if (!prev) {
			let slot = (from as Element | Text).assignedSlot;
			if (slot) return getFlatPrevSibling(slot);
		}
		return prev;
	}

	/** Utiliser findFlatNextSibling(from) si from peut être null. */
	export function getFlatNextSibling(from: Node): Node {
		let prev = from.nextSibling;
		while (prev instanceof HTMLSlotElement) {
			let nodes = prev.assignedNodes(OPT_assigneNodes_flatten);
			if (nodes.length > 0) return nodes[0];
			prev = from.nextSibling;
		}
		if (!prev) {
			let slot = (from as Element | Text).assignedSlot;
			if (slot) return getFlatNextSibling(slot);
		}
		return prev;
	}

	/**
	 * Evalue si un noeud est un ancêtre d'un autre dans le flatDOM (ou si ils sont égaux).
	 * Attention : anc ne peut pas être un élément 'slot' car ils sont ignorés dans l'arbre flatDOM. Si besoin,
	 * envisager getShadowParentElt(from:Node):Element et isShadowAncestor(anc: Node, desc: Node | null):boolean
	 * qui n'éliminerait pas l'elt 'slot' du parcours.
	 *
	 */
	export function isFlatAncestor(anc: Node, desc: Node | null): boolean {
		while (desc) {
			if (desc === anc) return true;
			desc = getFlatParentElt(desc);
		}
		return false;
	}

	/** Evalue si un noeud est un ancêtre d'un autre dans le flatDOM en privilégiant la hiérarchie logique (cf IDomLogical).*/
	export function isLogicalFlatAncestor(anc: Node, desc: Node | null): boolean {
		while (desc) {
			if (desc === anc) return true;
			desc = (desc as IDomLogical).logicalParent || getFlatParentElt(desc);
		}
		return false;
	}


	/**
	 * Gère l'affichage conditionnel dans un contenu shadow en fonction de l'état d'assignation des slots
	 *
	 * Les conditions ont la forme d'éléments englobants <if-slotted slots="[slotName*]">.
	 * Tout les slots référencés dans l'attribut (séparés par des virgules) doivent être assignés pour que les enfants du slots soit affichés.
	 * Si l'attribut n'est pas renseignés l'ensemble des slots descendants doivent être assignés.
	 * Les éléments de conditions 'if-slotted' sont supprimés du contenu (les enfants remontent d'un niveau).
	 * Peut être utilisé avant ou après l'ajout du contenu dans le shadowRoot.
	 *
	 * Pour compatibilité avec la répartition des areas par slots, les attributs 'area-ids' et 'area-groups' sont supportés au même titre que 'slots'.
	 */
	export function conditionOnSlots(content: DocumentFragment | ShadowRoot): DocumentFragment | ShadowRoot {
		let conditionRoots = content.querySelectorAll('if-slotted');

		for (let conditionRoot of conditionRoots) {
			let slots: HTMLSlotElement[] | NodeListOf<HTMLSlotElement>;
			if (conditionRoot.hasAttribute('slots')) {
				let slotNames = conditionRoot.getAttribute('slots').split(',');
				slots = slotNames.map((slotName) => {
					let selector = slotName == '#default' ? `slot:not([name])` : `slot[name='${slotName}']`;
					return content.querySelector(selector) as HTMLSlotElement
				});
			} else if (conditionRoot.hasAttribute('area-ids')) {
				let slotNames = conditionRoot.getAttribute('area-ids').split(',');
				slots = slotNames.map((slotName) => {
					return content.querySelector(`slot[area-ids='${slotName}']`) as HTMLSlotElement
				});
			} else if (conditionRoot.hasAttribute('area-groups')) {
				let slotNames = conditionRoot.getAttribute('area-groups').split(',');
				slots = slotNames.map((slotName) => {
					return content.querySelector(`slot[area-groups='${slotName}']`) as HTMLSlotElement
				});
			} else {
				slots = conditionRoot.querySelectorAll('slot');
			}

			let conditionChilds: HTMLElement[] = [];
			while (conditionRoot.firstElementChild) {
				let child = conditionRoot.firstElementChild as HTMLElement;
				conditionChilds.push(child);
				conditionRoot.parentNode.insertBefore(child, conditionRoot);
			}

			let checkSlotted = function () {
				let assigned = (Array.prototype.every.call(slots, (slot: HTMLSlotElement) => slot && slot.assignedNodes().length != 0));
				for (let conditionChild of conditionChilds) {
					conditionChild.style.display = assigned ? '' : 'none';
				}
			};

			checkSlotted();

			conditionRoot.remove();

			for (let slot of slots) {
				if (slot) slot.addEventListener('slotchange', checkSlotted);
			}
		}

		return content;
	}

	/** Constante pour les créations des shadowTree. cf Element.attachShadow(init: ShadowRootInit): ShadowRoot */
	export const SHADOWDOM_INIT = Object.freeze({mode: 'open'}) as ShadowRootInit;

	const OPT_assigneNodes_flatten = {flatten: true};

}

/// ** impl commencée et laissée en suspend...*/
// class TreaWalkerSh {
// 	currentNode: Node;
//
// 	constructor(public root: Node, public whatToShow: number, public filter?: (n: Node) => 1/*NodeFilter.FILTER_ACCEPT*/ | 2/*NodeFilter.FILTER_REJECT*/ |3/*NodeFilter.FILTER_SKIP*/) {
// 		this.currentNode = root;
// 	}
//
// 	firstChild():boolean {
// 		let n = this.xFirstChild(this.currentNode);
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	parentNode():boolean {
// 		let n = this.xParentNode(this.currentNode);
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	nextNode():boolean {
// 		let n = this.xFirstChild(this.currentNode) || this.xNextSibling(this.currentNode);
// 		if (!n) {
// 			let parent = this.currentNode;
// 			while (!n) {
// 				parent = this.xParentNode(parent);
// 				if (!parent) return false;
// 				n = this.xNextSibling(parent);
// 			}
// 		}
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	lastChild():boolean {
// 		let n = this.xLastChild(this.currentNode);
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	nextSibling():boolean {
// 		let n = this.xNextSibling(this.currentNode);
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	previousSibling():boolean {
// 		let n = this.xPreviousSibling(this.currentNode);
// 		if(n) {
// 			this.currentNode = n;
// 			return true;
// 		}
// 		return false;
// 	}
//
// 	previousNode():boolean {
// 		let n = this.xPreviousSibling(this.currentNode);
// 		if(n) {
// 			this.currentNode = this.xDeepestLastChild(n);
// 			return true;
// 		}
// 		for (let p = this.currentNode.parentNode; p && p !== this.root; p = p.parentNode) {
// 			let n = this.xPreviousSibling(p);
// 			if(n) {
// 				this.currentNode = this.xDeepestLastChild(n);
// 				return true;
// 			}
// 		}
// 		return false;
// 	}
//
// 	protected xFirstChild(n:Node):Node {
// 		let ch = n.firstChild;
// 		while (ch) {
// 			switch (this.xFilter(ch)) {
// 			case NodeFilter.FILTER_ACCEPT:
// 				return ch;
// 			case NodeFilter.FILTER_SKIP:
// 				let res = this.xFirstChild(ch);
// 				if (res) return res;
// 				ch = ch.nextSibling;
// 				break;
// 			case NodeFilter.FILTER_REJECT:
// 				ch = ch.nextSibling;
// 				break;
// 			default:
// 				throw Error("NodeFilter return unknown");
// 			}
// 		}
// 		return null;
// 	}
//
// 	protected xLastChild(n:Node):Node {
// 		let ch = n.lastChild;
// 		while (ch) {
// 			switch (this.xFilter(ch)) {
// 			case NodeFilter.FILTER_ACCEPT:
// 				return ch;
// 			case NodeFilter.FILTER_SKIP:
// 				let res = this.xLastChild(ch);
// 				if (res) return res;
// 				ch = ch.nextSibling;
// 				break;
// 			case NodeFilter.FILTER_REJECT:
// 				ch = ch.nextSibling;
// 				break;
// 			default:
// 				throw Error("NodeFilter return unknown");
// 			}
// 		}
// 		return null;
// 	}
//
// 	protected xDeepestLastChild(n:Node):Node {
// 		let ch;
// 		while (ch = this.xLastChild(n)) n = ch;
// 		return n;
// 	}
//
// 	protected xNextSibling(n:Node):Node {
// 		if (n === this.root) return null;
// 		let curr = n.nextSibling;
// 		while (curr) {
// 			switch (this.xFilter(curr)) {
// 			case NodeFilter.FILTER_ACCEPT:
// 				return curr;
// 			case NodeFilter.FILTER_SKIP:
// 				let ch = this.xFirstChild(curr);
// 				if (ch) return ch;
// 				curr = curr.nextSibling;
// 				break;
// 			case NodeFilter.FILTER_REJECT:
// 				curr = curr.nextSibling;
// 				break;
// 			default:
// 				throw Error("NodeFilter return unknown");
// 			}
// 		}
// 		if (n.parentNode !== this.root && this.xFilter(n.parentNode) != NodeFilter.FILTER_ACCEPT) {
// 			let res = this.xNextSibling(n.parentNode);
// 			if (res) return res;
// 		}
// 		return null;
// 	}
//
// 	protected xParentNode(n:Node):Node {
// 		if (n === this.root) return null;
// 		let curr = n.parentNode;
// 		while (curr) {
// 			switch (this.xFilter(curr)) {
// 			case NodeFilter.FILTER_ACCEPT:
// 				return curr;
// 			case NodeFilter.FILTER_SKIP:
// 			case NodeFilter.FILTER_REJECT:
// 				curr = curr.parentNode;
// 				break;
// 			default:
// 				throw Error("NodeFilter return unknown");
// 			}
// 		}
// 		return null;
// 	}
//
// 	protected xPreviousSibling(n:Node):Node {
// 		if (n === this.root) return null;
// 		for (let curr = n.previousSibling; curr; curr = curr.previousSibling) {
// 			switch (this.xFilter(curr)) {
// 			case NodeFilter.FILTER_ACCEPT:
// 				return curr;
// 			case NodeFilter.FILTER_SKIP:
// 				let res = this.xLastChild(curr);
// 				if (res) return res;
// 				break;
// 			case NodeFilter.FILTER_REJECT:
// 				break;
// 			default:
// 				throw Error("NodeFilter return unknown");
// 			}
// 		}
// 		return null;
// 	}
//
// 	protected xFilter(n:Node):number {
// 		switch (n.nodeType) {
// 		case Node.ELEMENT_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_ELEMENT) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.TEXT_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_TEXT) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.COMMENT_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_COMMENT) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.PROCESSING_INSTRUCTION_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_PROCESSING_INSTRUCTION) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.DOCUMENT_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_DOCUMENT) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.DOCUMENT_TYPE_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_DOCUMENT_TYPE) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		case Node.DOCUMENT_FRAGMENT_NODE:
// 			if ((this.whatToShow & NodeFilter.SHOW_DOCUMENT_FRAGMENT) === 0) return NodeFilter.FILTER_SKIP;
// 			break;
// 		}
// 		return this.filter ? this.filter(n) : NodeFilter.FILTER_ACCEPT;
// 	}
// }
