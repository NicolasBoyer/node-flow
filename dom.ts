import {IDomLogical, REG} from 'lib/commons/registry';
import {IEndPoint, IEndPointHolder} from "lib/commons/io/io";
import {IXAddr, XA} from "./xAddr";

export type INodeFilter<T extends Node = Node> = (n: any) => n is T;

/**
 * Manipulations Xml, Dom, xAddr...
 *
 */
export namespace DOM {

	export const IS_node = function (n: Node): n is Node {return true};
	export const IS_element = function (n: Node): n is Element {return n.nodeType === ENodeType.element};
	export const IS_text = function (n: Node): n is Text {return n.nodeType === ENodeType.text};
	export const IS_comment = function (n: Node): n is Comment {return n.nodeType === ENodeType.comment};
	export const IS_focusable = function (n: Node): n is HTMLElement {return (n as HTMLElement).tabIndex >= 0 && !(n as HTMLElement).hidden};

	export function findFirstChild(from: Node): Node;
	export function findFirstChild<T extends Node>(from: Node, predicate: INodeFilter<T>): T;
	export function findFirstChild<T extends Node>(from: Node, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? from.firstChild : null;
		while (n) {
			if (predicate(n)) return n;
			n = n.nextSibling;
		}
		return null;
	}

	export function findLastChild(from: Node): Node;
	export function findLastChild<T extends Node>(from: Node, predicate: INodeFilter<T>): T;
	export function findLastChild<T extends Node>(from: Node, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? from.lastChild : null;
		while (n) {
			if (predicate(n)) return n;
			n = n.previousSibling;
		}
		return null;
	}

	export function findNextSibling(from: Node): Node;
	export function findNextSibling<T extends Node>(from: Node, predicate: INodeFilter<T>): T;
	export function findNextSibling<T extends Node>(from: Node, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? from.nextSibling : null;
		while (n) {
			if (predicate(n)) return n;
			n = n.nextSibling;
		}
		return null;
	}

	export function findPreviousSibling(from: Node): Node;
	export function findPreviousSibling<T extends Node>(from: Node, predicate: INodeFilter<T>): T;
	export function findPreviousSibling<T extends Node>(from: Node, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? from.previousSibling : null;
		while (n) {
			if (predicate(n)) return n;
			n = n.previousSibling;
		}
		return null;
	}

	export function findParent(from: Node, root?: Node): Node;
	export function findParent<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findParent<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? from.parentNode : null;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = n.parentNode;
		}
		return null;
	}

	export function findParentOrSelf(from: Node, root?: Node): Node;
	export function findParentOrSelf<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findParentOrSelf<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = n.parentNode;
		}
		return null;
	}

	export function findLogicalParent(from: Node, root?: Node): Node;
	export function findLogicalParent<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findLogicalParent<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from ? ((from as IDomLogical).logicalParent || from.parentNode) : null;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = ((n as IDomLogical).logicalParent || n.parentNode);
		}
		return null;
	}

	export function findLogicalParentOrSelf(from: Node, root?: Node): Node;
	export function findLogicalParentOrSelf<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findLogicalParentOrSelf<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from;
		while (n && n !== root) {
			if (predicate(n)) return n;
			n = ((n as IDomLogical).logicalParent || n.parentNode);
		}
		return null;
	}

	/** Retourne le noeud suivant, ie dans l'ordre naturel de l'arbre de noeuds.*/
	export function findNext(from: Node, root?: Node): Node;
	export function findNext<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findNext<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let n = from.firstChild;
		if (n) return predicate(n) ? n : findNext(n, root, predicate);
		if (from === root) return null;
		while (!(n = from.nextSibling)) {
			from = from.parentNode;
			if (from === root) return null;
		}
		return predicate(n) ? n : findNext(n, root, predicate);
	}

	/**
	 * Retourne le noeud précédent, ie dans l'ordre naturel inverse de l'arbre de noeuds.
	 */
	export function findPrevious(from: Node, root?: Node): Node;
	export function findPrevious<T extends Node>(from: Node, root: Node, predicate: INodeFilter<T>): T;
	export function findPrevious<T extends Node>(from: Node, root: Node = null, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		if (from === root) return null;
		let prev = from.previousSibling;
		if (prev) {
			let ch = prev.lastChild;
			while (ch) {
				prev = ch;
				ch = ch.lastChild;
			}
			return predicate(prev) ? prev : findPrevious(prev, root, predicate);
		}
		prev = from.parentNode;
		return prev === root ? null : predicate(prev) ? prev : findPrevious(prev, root, predicate);
	}

	/**
	 * Retourne le 1er noeud à l'intérieur de root en remontant l'ordre naturel des noeuds.
	 */
	export function findPreviousIn(root: Node): Node;
	export function findPreviousIn<T extends Node>(root: Node, predicate: INodeFilter<T>): T;
	export function findPreviousIn<T extends Node>(root: Node, predicate: INodeFilter<T> = IS_node as INodeFilter<T>): T {
		let prev = root.lastChild;
		if (!prev) return null;
		let ch = prev.lastChild;
		while (ch) {
			prev = ch;
			ch = ch.lastChild;
		}
		return predicate(prev) ? prev : findPrevious(prev, root, predicate);
	}

	/**
	 * Offset du noeud dans son contexte parent.
	 */
	export function computeOffset(node: Node, defaultOffset?: number): number;
	export function computeOffset(node: Node, defaultOffset?: number, predicate?: INodeFilter<any>): number;
	export function computeOffset(node: Node, defaultOffset: number = 0, predicate?: INodeFilter<any>): number {
		if (!node) return defaultOffset;
		let offset = 0;
		node = node.previousSibling;
		while (node) {
			if (!predicate || predicate(node)) offset++;
			node = node.previousSibling;
		}
		return offset;
	}

	/**
	 * Profondeur du noeud (document = 0, si null -1).
	 */
	export function computeDepth(node: Node): number {
		let depth = -1;
		while (node) {
			depth++;
			node = node.parentNode;
		}
		return depth;
	}

	/** Evalue si un noeud est un ancêtre d'un autre.*/
	export function isAncestor(anc: Node, desc: Node): boolean {
		while (desc) {
			if (desc === anc) return true;
			desc = desc.parentNode;
		}
		return false;
	}

	/** Evalue si un noeud est un ancêtre d'un autre en privilégiant la hiérarchie logique (cf IDomLogical).*/
	export function isLogicalAncestor(anc: Node, desc: Node): boolean {
		while (desc) {
			if (desc === anc) return true;
			desc = ((desc as IDomLogical).logicalParent || desc.parentNode);
		}
		return false;
	}

	/**
	 *
	 */
	export function serializer(): XMLSerializer {
		//if (typeof xmldom === 'object') return new xmldom.XMLSerializer();
		return new XMLSerializer();
	}

	export function ser(node: Node, addXmlDecl?: boolean): string {
		let xml = this.serializer().serializeToString(node);
		return addXmlDecl ? "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + xml : xml;
	}

	/** Sérialisation avec mise en évidence des noeuds textes encadrés par des [].*/
	export function debug(node: Node): string {
		try {
			node = node.cloneNode(true);
			let it = (node.ownerDocument || <Document>node).createNodeIterator(node, NodeFilter.SHOW_TEXT, null, false);
			let n;
			while (n = it.nextNode() as Text) n.data = "[" + n.data + "]";
			return this.serializer().serializeToString(node);
		} catch (e) {
			return node ? node.toString() : "null";
		}
	}

	export function newDomDoc(docType?: DocumentType): Document {
		//if (typeof xmldom === 'object') return new xmldom.DOMImplementation().createDocument(null, null, docType);
		return document.implementation.createDocument(null, null, docType);
	}

	/**
	 *
	 */
	export function parseDom(xmlStr: string, base?: IEndPoint, contentType?: "text/xml" | "application/xml" | "text/html" | "image/svg+xml" | string): Document & IEndPointHolder {
		if (!base) return new DOMParser().parseFromString(xmlStr, contentType || "text/xml");
		let doc = new DOMParser().parseFromString(xmlStr, contentType || "text/xml") as Document & IEndPointHolder;
		doc.baseEndPoint = base;
		return doc;
	}

	/**
	 *
	 * @param datas Correspond au contenu "..." dans la balise <!DOCTYPE ...>
	 */
	export function newDomDocType(datas: string): DocumentType {
		if (!datas) return null;
		//TODO parse datas pour extraire PUBLICID et SYSTEMID
		//if (typeof xmldom === 'object') return new xmldom.DOMImplementation().createDocumentType(datas, "", "");
		return document.implementation.createDocumentType(datas, "", "");
	}

	export function newRange(start: Node, startOffset: number, end: Node, endOffset: number): Range {
		let r = new Range();
		r.setStart(start, startOffset);
		r.setEnd(end, endOffset);
		return r;
	}

	/**
	 *
	 * @param xa Point de début de suppression
	 * @param length Longueur de la suppression
	 * @param root
	 *
	 * @throws Error if deletion failed.
	 */
	export function deleteSequenceInDom(xa: IXAddr, length: number, root: Node) {
		let ctn = XA.findDomContainer(xa, root);
		if (DOM.ASSERT) if (!ctn) throw Error(`Container not found for xa ${xa} in doc :\n ${DOM.debug(root)}`);
		let idx = XA.last(xa);
		if (typeof idx === 'string') {
			//Suppression d'un attribut
			(ctn as Element).removeAttribute(idx);
			return;
		}
		if (ctn instanceof Attr) {
			//suppression DANS un attribut
			ctn.value = ctn.value.substring(0, idx) + ctn.value.substring(idx + length);
			return;
		}
		if (ctn instanceof CharacterData) {
			ctn.deleteData(idx, length);
			return;
		}
		let node = ctn.childNodes[idx] as Node;
		if (DOM.ASSERT) if (!node) throw Error(`Leaf node not found for xa ${xa} in doc :\n ${DOM.debug(root)}`);
		let previous = node.previousSibling;
		for (let i = 0; i < length; i++) {
			if (DOM.ASSERT) if (!node) throw Error(`Delete length ${length} out of bounds from xa ${xa} in doc :\n ${DOM.debug(root)}`);
			let next = node.nextSibling;
			node.parentNode.removeChild(node);
			node = next;
		}
		//if (previous && previous.nodeType === Node.TEXT_NODE && previous.nextSibling && previous.nextSibling.nodeType === Node.TEXT_NODE) {
		//	//On fusionne les deux noeuds texte accolés
		//	previous.appendData(previous.nextSibling.data);
		//	previous.nextSibling.remove();
		//}
	}

	/**
	 * Insert une chaine de caractère dans une autre.
	 */
	export function insertInText(text: string, offset: number, insert: string): string {
		if (offset === 0) {
			return insert + text;
		} else if (offset === text.length) {
			return text + insert;
		} else {
			if (DOM.ASSERT) if (offset < 0 || offset > text.length) throw Error(`Insert offset ${offset} out of bounds for text '${text}'`);
			return text.substring(0, offset) + insert + text.substring(offset);
		}
	}

	export function deleteInText(text: string, offset: number, count: number): string {
		if (count === 0) return text;
		if (offset === 0) {
			return text.substring(count);
		} else if (offset === text.length) {
			return text.substring(0, offset);
		} else {
			if (DOM.ASSERT) if (offset < 0 || count < 0 || offset + count > text.length) throw Error(`Delete text (offset=${offset}, count=${count}) out of bounds for text '${text}'`);
			return text.substring(0, offset) + text.substring(offset + count);
		}
	}

	/**
	 *
	 * @param charData
	 * @param offset
	 * @return Le noeud suivant ajouté.
	 */
	export function splitDomCharacterData(charData: CharacterData, offset: number): CharacterData {
		let newNode = <CharacterData>charData.parentNode.insertBefore(charData.cloneNode(false), charData.nextSibling);
		charData.deleteData(offset, charData.data.length);
		newNode.deleteData(0, offset);
		return newNode;
	}

	/**
	 * Nettoie un Dom des noeuds whitespaces (avec respect standard xml:space), comments et/ou  PIs.
	 * Attention: la suppr de comments ou PI peut créer des noeuds textes consécutifs.
	 */
	export function cleanupDom<T extends Node>(node: T, cleanupWhitespaces: boolean, cleanupComments: boolean, cleanupPI: boolean): T {
		let filter = (cleanupWhitespaces ? NodeFilter.SHOW_TEXT : 0) | (cleanupComments ? NodeFilter.SHOW_COMMENT : 0) | (cleanupPI ? NodeFilter.SHOW_PROCESSING_INSTRUCTION : 0);
		let tw = (node.ownerDocument || node as any).createNodeIterator(node, filter);
		let previous = tw.nextNode();
		let next;
		while (previous) {
			next = tw.nextNode();
			if (previous.nodeType !== Node.TEXT_NODE) {
				previous.parentNode.removeChild(previous);
			} else if (WHITESPACES.test(previous.nodeValue)) {
				let p = previous.parentElement;
				let space;
				while (p) {
					if ((space = p.getAttribute("xml:space"))) break;
					p = p.parentElement;
				}
				if (space !== "preserve") previous.parentNode.removeChild(previous);
			}
			previous = next;
		}
		return node;
	}

	/** Remonte les déclarations de NS à la racine. Ne faut rien en cas de conflit de préfixe. */
	export function pullupNs(root: Element): Element {
		let nsMap = {
			XML_NS: 'xml',
			XMLNS_NS: 'xmlns'
		} as any;
		let prefixMap = {
			'xml': XML_NS,
			'xmlns': XMLNS_NS
		} as any;
		for (let i = 0; i < root.attributes.length; i++) {
			let att = root.attributes.item(i);
			if (att.localName === 'xmlns') {
				nsMap[att.value] = '';
				prefixMap[''] = att.value;
			} else if (att.prefix === 'xmlns') {
				nsMap[att.value] = att.localName;
				prefixMap[att.localName] = att.value;
			} else if (att.prefix) {
				checkNode(att);
			}
		}
		checkNode(root);

		//let prefixsToRename: Array<{ att: Attr, prefix: string }>;

		function checkDeclNs(att: Attr, prefix: string): boolean {
			let currNs = prefixMap[prefix];
			if (currNs === att.value) {
				//ns déjà déclaré, on le purge
				att.ownerElement.removeAttributeNode(att);
				return true;
			}
			let currPrefix = nsMap[att.value];
			if (currNs == null && currPrefix == null) {
				//prefix et ns inconnus, on ajoute ce prefix
				nsMap[att.value] = prefix;
				prefixMap[prefix] = att.value;
				//déplacement de att sur root.
				att.ownerElement.removeAttributeNode(att);
				root.setAttributeNodeNS(att);
				return true;
			}
			// if (currPrefix != null) {
			// 	//ce ns existe avec un autre prefix, on le remplace par notre 1er prefix
			// 	renamePrefix(att.ownerElement, prefix, currPrefix);
			// 	att.ownerElement.removeAttributeNode(att);
			// 	return true;
			// }
			// //ce prefixe existe mais est associéà un autre Ns
			// if (!prefixsToRename) prefixsToRename = [];
			// prefixsToRename.push({att, prefix});
			return false;
		}

		function checkNode(node: Attr | Element) {
			if (node.namespaceURI === null) return;
			let currNs = prefixMap[node.prefix];
			if (currNs === node.namespaceURI) return;
			let currPrefix = nsMap[node.namespaceURI];
			if (currNs == null && currPrefix == null) {
				//prefix et ns inconnus, on ajoute ce prefix
				nsMap[node.namespaceURI] = node.prefix;
				prefixMap[node.prefix] = node.namespaceURI;
				root.setAttributeNS("http://www.w3.org/2000/xmlns/", node.prefix ? 'xmlns:' + node.prefix : 'xmlns', node.namespaceURI);
			}
		}

		root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
			acceptNode: function (elt: Element) {
				for (let i = 0; i < elt.attributes.length; i++) {
					let att = elt.attributes.item(i);
					if (att.localName === 'xmlns') {
						if (checkDeclNs(att, '')) i--;
					} else if (att.prefix === 'xmlns') {
						if (checkDeclNs(att, att.localName)) i--;
					} else if (att.prefix) {
						checkNode(att);
					}
				}
				checkNode(elt);
				return NodeFilter.FILTER_SKIP;
			}
		}).nextNode();
		// if (prefixsToRename) {
		// 	console.log("TODO prefixsToRename:::");
		// }
		return root;
	}

	export function indentDom(root: Node): Node {
		if (INDENT_WS.length === 0) {
			for (let i = 0; i <= 25; i++) INDENT_WS[i] = "\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t".substring(0, i + 1);
		}
		root.normalize();
		let eltRoot = root;
		let deep = 0;
		switch (root.nodeType) {
		case 9 : //Document
			eltRoot = (root as Document).documentElement;
			if (!eltRoot) return root;
			break;
		case 11 : //Fragment
			deep = -1;
		}
		let currNode = eltRoot;

		function isText(node: Node) {
			let type = node.nodeType;
			if (DOM.IS_text(node) && !WHITESPACES.test(node.data)) return true;
			if (type == 4) return true;
			if (type == 8) {
				//Commentaire : on n'indente pas si un noeud frère est un texte.
				let n = node.previousSibling;
				while (n) {
					let t = n.nodeType;
					if (DOM.IS_text(n) && !WHITESPACES.test(n.data)) return true;
					if (t == 4) return true;
					if (t != 8) break; // pas de texte dans les previous, on va checker les noeuds suivants
					n = n.previousSibling;
				}
				n = node.nextSibling;
				while (n) {
					let t = n.nodeType;
					if (DOM.IS_text(n) && !WHITESPACES.test(n.data)) return true;
					if (t == 4) return true;
					if (t != 8) return false;
					n = n.nextSibling;
				}
			}
			return false;
		}

		function indent() {
			if (currNode.nodeType == 3) {
				//On est sur un noeud text de white-spaces
				currNode.nodeValue = INDENT_WS[Math.min(deep, 25)];
				if (currNode.nextSibling) currNode = currNode.nextSibling;
			} else {
				//On insère un texte
				currNode.parentNode.insertBefore(currNode.ownerDocument.createTextNode(INDENT_WS[Math.min(deep, 25)]), currNode);
			}
		}

		let prevIsText = false;
		let preserveSpace = [false];
		while (currNode) {
			//On traite le fils
			while (currNode.hasChildNodes()) {
				deep++;
				preserveSpace[deep] = (deep > 1 && preserveSpace[deep - 1]) ? !((currNode as Element).getAttribute("xml:space") === "default") : currNode.nodeType === 1 && (currNode as Element).getAttribute("xml:space") === "preserve";
				//log.debug("vPreserveSpace:::::"+vPreserveSpace);
				currNode = currNode.firstChild;
				prevIsText = isText(currNode);
				if (!prevIsText && !preserveSpace[deep]) {
					//Ce n'est pas du texte, on indent
					indent();
				}
			}
			//On prépare le suivant
			while (currNode.nextSibling == null) {
				deep--;
				//On ajoute le texte pour la fin de balise
				if (deep >= 0 && !prevIsText && !isText(currNode) && !preserveSpace[deep + 1]) {
					if (currNode.nodeType == 3) {
						currNode.nodeValue = INDENT_WS[Math.min(deep, 25)];
					} else {
						currNode.parentNode.insertBefore(currNode.ownerDocument.createTextNode(INDENT_WS[Math.min(deep, 25)]), null);
					}
				}
				if (currNode == eltRoot || currNode.parentNode == eltRoot) return root;
				currNode = currNode.parentNode;
				prevIsText = currNode.previousSibling != null && isText(currNode.previousSibling);
			}
			currNode = currNode.nextSibling;
			if (!isText(currNode)) {
				//Ce n'est pas du texte, on indent
				if (!prevIsText) {
					if (!preserveSpace[deep]) indent();
				} else {
					prevIsText = false;
				}
			} else {
				prevIsText = true;
			}
		}
		return root;
	}

	export function domReady(doc = document): Promise<void> {
		return new Promise<void>((resolve) => {
			if (doc.readyState != 'loading') resolve();
			else doc.addEventListener('DOMContentLoaded', () => resolve());
		});
	}

	export function setAttr(node: Element, name: string, value: string): boolean {
		if (node.getAttribute(name) !== value) {
			if (value == null) {
				node.removeAttribute(name);
			} else {
				node.setAttribute(name, value);
			}
			return true;
		}
		return false;
	}

	export function setAttrBool(node: Element, name: string, present?: boolean): boolean {
		if (node.hasAttribute(name)) {
			if (!present) {
				node.removeAttribute(name);
				return true;
			}
		} else {
			if (present) {
				node.setAttribute(name, '');
				return true;
			}
		}
		return false;
	}

	export function setHidden(node: Element, value: boolean): boolean {
		if (node.hasAttribute('hidden')) {
			if (!value) {
				node.removeAttribute('hidden');
				return true;
			}
		} else {
			if (value) {
				node.setAttribute('hidden', '');
				return true;
			}
		}
		return false;
	}

	export function toggleAttr(node: Element, name: string) {
		if (node.hasAttribute(name)) node.removeAttribute(name);
		else node.setAttribute(name, '');
	}

	export function extractAttr(node: Element, name: string): string {
		let val = node.getAttribute(name);
		if (val != null) node.removeAttribute(name);
		return val;
	}

	export function setStyle(node: HTMLElement, name: string, value: string): boolean {
		if (node.style.getPropertyValue(name) !== value) {
			node.style.setProperty(name, value);
			return true;
		}
		return false;
	}

	export function setTextContent(node: Node, value: string) {
		if (!value) {
			node.textContent = null;
		} else {
			let ch = node.firstChild;
			if (ch && !ch.nextSibling && ch.nodeType === ENodeType.text && ch.nodeValue === value) return;
			node.textContent = value;
		}
	}

	export function addClass(node: Element, cls: string): boolean {
		if (!node.classList.contains(cls)) {
			node.classList.add(cls);
			return true;
		}
		return false;
	}

	export function removeClass(node: Element, cls: string): boolean {
		if (node.classList.contains(cls)) {
			node.classList.remove(cls);
			return true;
		}
		return false;
	}

	/** Normalise un token. cf https://www.w3.org/TR/xmlschema-2/#token */
	export function txtNormToken(str: string): string {
		if (!str) return str;
		//trim + collapse spaces.
		return str.replace(/^[ \n\r\t]+|[ \n\r\t]+$/g, '').replace(COLLAPSE_WS, ' ');
	}

	export function txtEndsWithSp(str: string): boolean {return /[ \n\r\t]$/.test(str)}

	export function txtStartsWithSp(str: string): boolean {return /^[ \n\r\t]/.test(str)}

	export function txtStartSpLen(str: string): number {
		let r = /^[ \n\r\t]+/.exec(str);
		return r ? r[0].length : 0;
	}

	export function txtEndSpLen(str: string): number {
		let r = /[ \n\r\t]+$/.exec(str);
		return r ? r[0].length : 0;
	}

	/** https://www.w3.org/TR/xml11/#NT-S   (#x20 | #x9 | #xD | #xA)+ */
	export const WHITESPACES = /^[ \t\r\n]*$/;

	export const COLLAPSE_WS = /[ ][ \n\r\t]+|[\n\r\t][ \n\r\t]*/g;

	export const XHTML_NS = 'http://www.w3.org/1999/xhtml';
	export const XML_NS = 'http://www.w3.org/XML/1998/namespace';
	export const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';
	export const SCCORE_NS = 'http://www.utc.fr/ics/scenari/v3/core';
	export let ASSERT = false;

	const INDENT_WS: string[] = [];
}

/**
 * Constantes correspondant à l'api Node Node.xxxx_NODE.
 */
export const enum ENodeType {
	element = 1,
	attribute = 2,
	text = 3,
	pi = 7,
	comment = 8,
	document = 9,
	documentFragment = 11
}

/**
 * Constante autorisant dans une API de passer un type inconnu.
 * Usage classqiue : nodeType: ENodeType|EUnknownNodeType
 */
export const enum EUnknownNodeType {
	unknown = 0
}

/**
 * Implémentation d'une résolution JSX pour créer un DOM
 */
/**
 * Interface nécessaire quand noImplicitAny = true
 *
 * TODO Toutes ces définitions ne permettent pas de typer correctement le retour d'une instructions JSX.
 * TODO Suivre https://github.com/Microsoft/TypeScript/issues/14729
 */
/*
declare global {
	namespace JSX {
		// On considère tout élément JSX comme un HTMLElement
		interface Element extends HTMLElement {
			//[ key: string]: any
		}

		// Sert à vérifier les propriétés (attributs dans notre cas) d'un élément intrinsic
		// JSX s'attend à avoir les noms des propriétés et non les noms des attributs,
		// d'où l'ajout de certains attributs dans JSXElementTagNameMap, et JSXElement
		interface IntrinsicElements extends Intrinsic {
		}
	}
}

type Intrinsic = {
	[P in keyof JSXElementTagNameMap]?: Partial<JSXElement<JSXElementTagNameMap[P]>>
};

// Ajoute l'attribut class dans les attributs autorisé sur tout les éléments
// TODO problème sur les attributs complexe (style: CSSStyleDeclaration)
type JSXElement<T> = T & { [ "class" ]: string; };

interface JSXElementTagNameMap extends ElementTagNameMap {
	// Propriété htmlFor / attribut for
	"label": HTMLLabelElement & { [ "for" ]: string };

	// Pour les CustomElement
	[ key: string]: Element;
}
*/

declare global {
	namespace JSX {
		// On considère tout élément JSX comme un HTMLElement
		interface Element extends HTMLElement {
			[key: string]: any
		}

		interface ElementAttributesProperty {
			_JsxProps: any
		}

		interface IntrinsicElements {
			[key: string]: any
		}
	}
}

export namespace JSX {
	export let currentDoc: Document;

	/** API React. */
	export function createElement(tag: string | Constructor<HTMLElement>, attributes: { [name: string]: any }, ...children: any[]): any {
		let elt: HTMLElement;
		if (typeof tag === 'string') elt = (currentDoc || document).createElement(tag);
		else elt = new tag();
		for (let name in attributes) {
			let attr = attributes[name];
			if (name === 'î') (elt as any /* IEltInitable */).initialize(attr);
			else if (typeof attr === 'function') (elt as any)[name] = attr;
			else if (attr != null) elt.setAttribute(name, attr);
		}
		//if ("initialize" in elt) (elt as any /* IEltInitable */).initialize();
		if (tag === 'template') for (let child of children) JSX.appendChildren((elt as HTMLTemplateElement).content, child);
		else for (let child of children) JSX.appendChildren(elt, child);
		return elt;
	}

	/** API React. */
	export function appendChildren(elt: Element | DocumentFragment, children: any) {
		if (Array.isArray(children)) children.forEach(ch => JSX.appendChildren(elt, ch));
		else if (children instanceof Node) elt.appendChild(children);
		else elt.appendChild((currentDoc || document).createTextNode(children));
	}

}

