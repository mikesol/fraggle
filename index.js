const FRAGGLE_NODE_TYPE = 999;
const FRAGGLE_NODE_NAME = "#fraggle";

class Fraggle {
	$id = null;
	$reified = null;
	$logicalParent = null;
	$childNodes = null;
	$previousSibling = null;
	$nextSibling = null;
	baseURI = null;
	// childNodes = null;
	// firstChild = null;
	isConnected = null;
	// lastChild = null;
	nextSibling = null;
	nodeName = null;
	nodeType = null;
	nodeValue = null;
	ownerDocument = null;
	parentElement = null;
	parentNode = null;
	previousSibling = null;
	textContent = null;
	constructor() {
		this.$id = Math.random();
		// reified is the node that is actually rendered
		// it is _not_ the parent
		// for example, if a fragment is part of a div, this will be
		// the div. it is used as a substitute for `$this` when performing
		// operations like appending
		this.$reified = null;
		// this is either a fraggle, a real node, or null, whereas `parentNode` is always a real node or null
		this.$logicalParent = null;
		// this is a list of real child nodes and fraggles interleaved. it is used to populate the childNodes list incrementally.
		// note that nested fraggles may have the same child nodes.
		// in the DOM, this would be illegal, but for fraggles,
		// we are keeping track of all the childNodes that it contains, which means
		// that if it contains another fraggle, it will contain these nodes.
		// this allows us to work with fraggles incrementally.
		this.$childNodes = [];
		// these properties are meant to work _exactly_ like the ones in the DOM API
		// for example, `firstChild` will _never_ be a Fraggle, even if the
		// first child is a fraggle. it will _always_ be a DOM node or `null`.
		this.baseURI = null;
		// this.childNodes = [];
		// this.firstChild = null;
		this.isConnected = false;
		// this.lastChild = null;
		// this.nextSibling = null;
		this.nodeName = FRAGGLE_NODE_NAME;
		this.nodeType = FRAGGLE_NODE_TYPE;
		this.ownerDocument = null;
		this.parentElement = null;
		this.parentNode = null;
		this.previousSibling = null;
		this.textContent = null;
	}

	$childNodeIterator() {
		const $this = this;
		return {
			*[Symbol.iterator]() {
				const stack = [[$this.$childNodes, 0]];
				while (stack.length > 0) {
					const cur = stack.pop();
					for (let i = cur[1]; i < cur[0].length; i++) {
						if (cur[0][i] instanceof Fraggle) {
							stack.push([cur[0], i + 1]);
							stack.push([cur[0][i].$childNodes, 0]);
							break;
						} else {
							yield cur[0][i];
						}
					}
				}
			},
		};
	}

	$childNodeReverseIterator() {
		const $this = this;
		return {
			*[Symbol.iterator]() {
				const stack = [[$this.$childNodes, $this.$childNodes.length - 1]];
				while (stack.length > 0) {
					const cur = stack.pop();
					for (let i = cur[1]; i >= 0; i--) {
						if (cur[0][i] instanceof Fraggle) {
							stack.push([cur[0], i - 1]);
							stack.push([
								cur[0][i].$childNodes,
								cur[0][i].$childNodes.length - 1,
							]);
							break;
						} else {
							yield cur[0][i];
						}
					}
				}
			},
		};
	}

	$firstChildNode() {
		for (const childNode of this.$childNodeIterator()) {
			return childNode;
		}
		return null;
	}

	$lastChildNode() {
		for (const childNode of this.$childNodeReverseIterator()) {
			return childNode;
		}
		return null;
	}

	get childNodes() {
		const out = [];
		for (const childNode of this.$childNodeIterator()) {
			out.push(childNode);
		}
		return out;
	}

	get firstChild() {
		return this.$firstChildNode();
	}

	get lastChild() {
		return this.$lastChildNode();
	}
}

// methods
const insertBefore = (nodePredicate) => ($this, newNode, referenceNode) => {
	// there are 12 cases to consider
	// node node node
	// frag node node
	// node frag node
	// node node frag
	// node frag frag
	// frag node frag
	// frag frag node
	// frag frag frag
	// node node null
	// node frag null
	// frag node null
	// frag frag null
	if (nodePredicate($this)) {
		if (nodePredicate(newNode)) {
			if (nodePredicate(referenceNode)) {
				// CASE 1
				// this is the DOM API, plain and simple!
				$this.insertBefore(newNode, referenceNode);
				newNode.$nextSibling = referenceNode;
				referenceNode.$previousSibling = newNode;
			} else if (referenceNode === null) {
				// CASE 9
				// this is also the DOM API, plain and simple!
				$this.appendChild(newNode);
				newNode.$previousSibling =
					newNode.previousSibling && newNode.previousSibling.$$fraggle
						? newNode.previousSibling.$$fraggle
						: newNode.previousSibling;
				if (newNode.previousSibling && newNode.previousSibling.$$fraggle) {
					newNode.previousSibling.$$fraggle.$nextSibling = newNode;
					newNode.previousSibling.$$fraggle.nextSibling = newNode;
				}
			} else {
				// CASE 4
				// we are inserting a DOM node into a DOM node and the reference is a fraggle
				// we use either the first child of the reference or, if it is empty, its right abutting
				// the actual reference will be the first child in the fraggle or, if none
				// exists, the nextSibling
				const effectiveReference =
					referenceNode.$firstChildNode() || referenceNode.nextSibling;
				// do the insertion
				$this.insertBefore(newNode, effectiveReference);
				// our newNode is now the $previousSibling of the reference node
				referenceNode.$previousSibling = newNode;
				newNode.$nextSibling = referenceNode;
				if (!newNode.$$isPreviousSiblingOf) {
					newNode.$$isPreviousSiblingOf = [];
				}
				let currentNode = referenceNode;
				// iterate over $nextSiblings, doing assignments of previousSibling
				while (true) {
					currentNode.previousSibling = newNode;
					newNode.$$isPreviousSiblingOf.push(currentNode);
					const firstChildNode = currentNode.$firstChildNode();
					if (!firstChildNode && currentNode.$nextSibling instanceof Fraggle) {
						currentNode = currentNode.$nextSibling;
					} else {
						break;
					}
				}
			}
		} else {
			if (nodePredicate(referenceNode)) {
				// CASE 3
				// we are inserting a fraggle node into a DOM node and the reference is a node
				// the old previous sibling will now be the previous sibling of the fraggle
				const oldPreviousSibling = referenceNode.previousSibling;
				const $oldPreviousSibling = referenceNode.$previousSibling;
				for (const newChildNode of newNode.$childNodeIterator()) {
					$this.insertBefore(newChildNode, referenceNode);
				}
				newNode.$logicalParent = $this;
				newNode.$reified = $this;
				newNode.parentNode = $this.parentNode;
				newNode.isConnected = true;
				newNode.parentElement = $this;
				newNode.nextSibling = referenceNode;
				newNode.$nextSibling = referenceNode;
				referenceNode.$previousSibling = newNode;
				if (!referenceNode.$$isNextSiblingOf) {
					referenceNode.$$isNextSiblingOf = [];
				}
				referenceNode.$$isNextSiblingOf.push(newNode);
				newNode.previousSibling = oldPreviousSibling;
				newNode.$previousSibling = $oldPreviousSibling;
				if (oldPreviousSibling && oldPreviousSibling.$$fraggle) {
					oldPreviousSibling.$$fragle.$nextSibling = newNode;
					let currentNode = oldPreviousSibling.$$fraggle;
					// iterate over $previousSibling, doing assignments of nextSibling
					// do this ONLY IF the newNode actually contains a child (called fc below)
					// otherwise, we don't need to do any updating
					const fc = newNode.$firstChildNode();
					while (true && fc) {
						currentNode.nextSibling = fc;
						fc.$$isNextSiblingOf.push(currentNode);
						const firstChildNode = currentNode.$firstChildNode();
						if (
							!firstChildNode &&
							currentNode.$previousSibling instanceof Fraggle
						) {
							currentNode = currentNode.$previousSibling;
						} else {
							break;
						}
					}
				}
			} else if (referenceNode === null) {
				// CASE 10
				// we are inserting a fraggle at the end of a node
				// similar to above, we need to move left to assign nextSiblings
				// as needed
				const oldLastChild = $this.lastChild;
				for (const newChildNode of newNode.$childNodeIterator()) {
					$this.appendChild(newChildNode);
				}
				newNode.$logicalParent = $this;
				newNode.$reified = $this;
				newNode.parentNode = $this.parentNode;
				newNode.isConnected = true;
				newNode.parentElement = $this;
				newNode.nextSibling = null;
				newNode.previousSibling = oldLastChild;
				newNode.$previousSibling =
					oldLastChild && oldLastChild.$$fraggle
						? oldLastChild.$$fraggle
						: oldLastChild;
				// todo: code dup of above
				// consolidate?
				if (oldLastChild && oldLastChild.$$fraggle) {
					oldLastChild.$$fragle.$nextSibling = newNode;
					let currentNode = oldLastChild.$$fraggle;
					// iterate over $previousSibling, doing assignments of nextSibling
					// do this ONLY IF the newNode actually contains a child (called fc below)
					// otherwise, we don't need to do any updating
					const fc = newNode.$firstChildNode();
					while (true && fc) {
						currentNode.nextSibling = fc;
						fc.$$isNextSiblingOf.push(currentNode);
						const firstChildNode = currentNode.$firstChildNode();
						if (
							!firstChildNode &&
							currentNode.$previousSibling instanceof Fraggle
						) {
							currentNode = currentNode.$previousSibling;
						} else {
							break;
						}
					}
				}
			} else {
				// CASE 5
				// we are inserting a fraggle into a DOM node and the reference is a fraggle
				const $previousPreviousSibling = referenceNode.$previousSibling;
				const effectiveReference =
					referenceNode.$firstChildNode() || referenceNode.nextSibling;
				let newNodeFirstChild = null;
				let newNodeLastChild = null;
				for (const newChildNode of newNode.$childNodeIterator()) {
					newNodeFirstChild = newNodeFirstChild || newChildNode;
					newNodeLastChild = newChildNode;
					$this.insertBefore(newChildNode, effectiveReference);
				}
				newNode.$logicalParent = $this;
				newNode.$reified = $this;
				newNode.parentNode = $this.parentNode;
				newNode.isConnected = true;
				newNode.parentElement = $this;
				newNode.$nextSibling = referenceNode;
				referenceNode.$previousSibling = newNode;
				if (newNodeLastChild) {
					// the reference node and all nodes to the right will need this as a previous sibling
					if (!newNodeLastChild.$$isPreviousSiblingOf) {
						newNodeLastChild.$$isPreviousSiblingOf = [];
					}
					let currentNode = referenceNode;
					// iterate over $nextSiblings, doing assignments of previousSibling
					while (true && currentNode) {
						currentNode.previousSibling = newNodeLastChild;
						newNode.$$isPreviousSiblingOf.push(currentNode);
						const firstChildNode = currentNode.$firstChildNode();
						if (
							!firstChildNode &&
							currentNode.$nextSibling instanceof Fraggle
						) {
							currentNode = currentNode.$nextSibling;
						} else {
							break;
						}
					}
				}
				if (newNodeFirstChild) {
					// the reference node and all nodes to the left will need this as a next sibling
					if (!newNodeFirstChild.$$isNextSiblingOf) {
						newNodeFirstChild.$$isNextSiblingOf = [];
					}
					let currentNode = $previousPreviousSibling;
					// iterate over $nextSiblings, doing assignments of previousSibling
					while (true && currentNode) {
						currentNode.nextSibling = newNodeFirstChild;
						newNode.$$isNextSiblingOf.push(currentNode);
						const firstChildNode = currentNode.$firstChildNode();
						if (
							!firstChildNode &&
							currentNode.$previousSibling instanceof Fraggle
						) {
							currentNode = currentNode.$previousSibling;
						} else {
							break;
						}
					}
				}
			}
		}
	} else {
		//
		//
		// $this is now a fraggle
		//
		//
		// helpers

		const $$doPreviousSiblingAssignment = ($$this, marker, node) => {
			let stopped = false;
			for (let i = marker; i < $$this.$childNodes.length; i++) {
				if (nodePredicate($$this.$childNodes[i])) {
					// we do not record previousSibling for an actual DOM node
					stopped = true;
					break;
				} else if ($$this.$childNodes[i].$firstChildNode()) {
					// if a fraggle has content, assign it the previousSibling but terminate early. we can do this because anything further to the right will have a different previousSibling.
					$$this.$childNodes[i].previousSibling = node;
					node.$$isPreviousSiblingOf.push($$this.$childNodes[i]);
					stopped = true;
					break;
				} else {
					// if a fraggle has no content, grab the node as previousSibling but allow the algorithm to continue. That way other fraggles to the right can also use this as the left abutting node.
					$$this.$childNodes[i].previousSibling = node;
					node.$$isPreviousSiblingOf.push($$this.$childNodes[i]);
				}
			}
			if (!stopped && $$this.$logicalParent instanceof Fraggle) {
				let i = 0;
				for (; i < $$this.$logicalParent.$childNodes.length; i++) {
					if ($$this.$logicalParent.$childNodes[i] === $$this) {
						break;
					}
				}
				$$doPreviousSiblingAssignment($$this.$logicalParent, i + 1, node);
			}
		};

		const doPreviousSiblingAssignment = ($$this, marker, node) => {
			if (node) {
				if (!node.$$isPreviousSiblingOf) {
					node.$$isPreviousSiblingOf = [];
				}
			}
			$$doPreviousSiblingAssignment($$this, marker, node);
		};

		const $$doNextSiblingAssignment = ($$this, marker, node) => {
			let stopped = false;
			for (let i = marker; i >= 0; i--) {
				if (nodePredicate($$this.$childNodes[i])) {
					// we do not record nextSibling for an actual DOM node
					stopped = true;
					break;
				} else if ($$this.$childNodes[i].$firstChildNode()) {
					// if a fraggle has content, assign it the nextSibling but terminate early. we can do this because anything further to the left will have a different nextSibling.
					$$this.$childNodes[i].nextSibling = node;
					node.$$isNextSiblingOf.push($$this.$childNodes[i]);
					stopped = true;
					break;
				} else {
					// if a fraggle has no content, grab the node as nextSibling but allow the algorithm to continue. That way other fraggles to the left can also use this as the right abutting node.
					$$this.$childNodes[i].nextSibling = node;
					node.$$isNextSiblingOf.push($$this.$childNodes[i]);
				}
			}
			if (!stopped && $$this.$logicalParent instanceof Fraggle) {
				let i = 0;
				for (; i < $$this.$logicalParent.$childNodes.length; i++) {
					if ($$this.$logicalParent.$childNodes[i] === $$this) {
						break;
					}
				}
				$$doNextSiblingAssignment($$this.$logicalParent, i - 1, node);
			}
		};
		const doNextSiblingAssignment = ($$this, marker, node) => {
			if (node) {
				if (!node.$$isNextSiblingOf) {
					node.$$isNextSiblingOf = [];
				}
			}
			$$doNextSiblingAssignment($$this, marker, node);
		};
		//
		//
		// needed for all fraggles
		//
		//
		// child node starting length
		let insertedAt;
		// we add the child to $childNodes
		// we set the `l` and `n` properties of the child
		// we set `r` later once we know how many children there are
		if (referenceNode == null) {
			insertedAt = $this.$childNodes.length;
			$this.$childNodes.push(newNode);
		} else {
			let inserted = false;
			// todo: is there any way to avoid this traversal
			for (let i = 0; i < $this.$childNodes.length; i++) {
				if ($this.$childNodes[i] === referenceNode) {
					insertedAt = i;
					$this.$childNodes.splice(i, 0, newNode);
					inserted = true;
					break;
				}
			}
			if (!inserted) {
				return;
			}
		}
		// algo
		if (nodePredicate(newNode)) {
			// important to set for removal.
			newNode.$$fraggle = $this;
			if (nodePredicate(referenceNode)) {
				// CASE 2
				// the parent is a fraggle, but the reference and the new node are both DOM nodes
				referenceNode.$previousSibling = newNode;
				newNode.$nextSibling = referenceNode;
				$this.$reified && $this.$reified.insertBefore(newNode, referenceNode);
				doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
				doNextSiblingAssignment($this, insertedAt - 1, newNode);
			} else if (referenceNode === null) {
				// CASE 11
				// we are inserting a node at the end of a fraggle
				if ($this.childNodes.length > 1) {
					$this.childNodes[$this.childNodes.length - 2].$nextSibling =
						$this.childNodes[$this.childNodes.length - 1];
					$this.childNodes[$this.childNodes.length - 1].$previousSibling =
						$this.childNodes[$this.childNodes.length - 2];
				}
				$this.$reified && $this.$reified.appendChild(newNode);
				// note that doPreviousSiblingAssignment will immediately kick
				// up a level as there is nothing to the left
				doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
				doNextSiblingAssignment($this, insertedAt - 1, newNode);
				// we do not need to call shiftRightByNStartingAt so comment it out
				// as we're at the end, there's no shift
				// shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);\
				// we don't need to call splice. instead, we can call push
			} else {
				// CASE 6
				// the parent is a fraggle, the new node is a DOM node, and the reference is a fraggle
				referenceNode.$previousSibling = newNode;
				newNode.$nextSibling = referenceNode;
				$this.$reified &&
					$this.$reified.insertBefore(
						newNode,
						referenceNode.$firstChildNode() || referenceNode.nextSibling
					);
				// we need to update the left abutting of all fraggles to the right
				doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
				doNextSiblingAssignment($this, insertedAt - 1, newNode);
			}
		} else {
			if (nodePredicate(referenceNode)) {
				// CASE 7
				// the parent is a fraggle, the new node is a fraggle, and the reference node is a DOM node
				const oldPreviousSibling = referenceNode.previousSibling;
				if ($this.$reified) {
					for (const newChildNode of newNode.$childNodeIterator()) {
						$this.$reified.insertBefore(newChildNode, referenceNode);
					}
				}
				referenceNode.$previousSibling = newNode;
				newNode.$nextSibling = referenceNode;
				newNode.$logicalParent = $this;
				newNode.$reified = $this.$reified;
				newNode.parentNode = $this.parentNode;
				newNode.isConnected = true;
				newNode.parentElement = $this.$reified;
				newNode.nextSibling = referenceNode;
				if (!referenceNode.$$isNextSiblingOf) {
					referenceNode.$$isNextSiblingOf = [];
				}
				referenceNode.$$isNextSiblingOf.push(newNode);
				newNode.previousSibling = oldPreviousSibling;
				if (!oldPreviousSibling.$$isPreviousSiblingOf) {
					oldPreviousSibling.$$isPreviousSiblingOf = [];
				}
				oldPreviousSibling.$$isPreviousSiblingOf.push(newNode);
				//
				const newNodeLeftBound =
					newNode.$firstChildNode() || newNode.nextSibling;
				const newNodeRightBound =
					newNode.$lastChildNode() || newNode.previousSibling;
				doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
				doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
			} else if (referenceNode === null) {
				// CASE 12
				// we are inserting a fraggle at the end of a fraggle
				if ($this.childNodes.length > 1) {
					$this.childNodes[$this.childNodes.length - 2].$nextSibling =
						$this.childNodes[$this.childNodes.length - 1];
					$this.childNodes[$this.childNodes.length - 1].$previousSibling =
						$this.childNodes[$this.childNodes.length - 2];
				}
				if ($this.$reified) {
					for (const newChildNode of newNode.$childNodeIterator()) {
						$this.$reified.appendChild(newChildNode, referenceNode);
					}
				}
				newNode.$logicalParent = $this;
				newNode.$reified = $this.$reified;
				newNode.parentNode = $this.$reified;
				newNode.isConnected = true;
				newNode.parentElement = $this.$reified;
				// the next sibling is the same as $this's next sibling
				// because we are dealing with real DOM elements
				newNode.nextSibling = $this.nextSibling;
				if ($this.nextSibling) {
					if (!$this.nextSibling.$$isNextSiblingOf) {
						$this.nextSibling.$$isNextSiblingOf = [];
					}
					$this.nextSibling.$$isNextSiblingOf.push(newNode);
				}
				// the previous sibling must be whatever is at the end of $this
				// we set this _before_ updating lastChild
				newNode.previousSibling = $this.lastChild;
				if ($this.lastChild) {
					if (!$this.lastChild.$$isPreviousSiblingOf) {
						$this.lastChild.$$isPreviousSiblingOf = [];
					}
					$this.lastChild.$$isPreviousSiblingOf.push(newNode);
				}
				//
				const newNodeLeftBound =
					newNode.$firstChildNode() || newNode.nextSibling;
				const newNodeRightBound =
					newNode.$lastChildNode() || newNode.previousSibling;
				doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
				doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
			} else {
				// CASE 8
				// fraggles all the way down!
				referenceNode.$previousSibling = newNode;
				newNode.$nextSibling = referenceNode;
				const oldPreviousSibling = referenceNode.previousSibling;
				const referenceAnchor = referenceNode.$firstChildNode();
				if ($this.$reified) {
					for (const newChildNode of newNode.$childNodeIterator()) {
						$this.$reified.insertBefore(newChildNode, referenceAnchor);
					}
				}
				newNode.$logicalParent = $this;
				newNode.$reified = $this.$reified;
				newNode.parentNode = $this.$reified;
				newNode.isConnected = true;
				newNode.parentElement = $this.$reified;
				newNode.nextSibling = referenceAnchor;
				if (referenceAnchor) {
					if (!referenceAnchor.$$isNextSiblingOf) {
						referenceAnchor.$$isNextSiblingOf = [];
					}
					referenceAnchor.$$isNextSiblingOf.push(newNode);
				}
				newNode.previousSibling = oldPreviousSibling;
				if (oldPreviousSibling) {
					if (!oldPreviousSibling.$$isPreviousSiblingOf) {
						oldPreviousSibling.$$isPreviousSiblingOf = [];
					}
					oldPreviousSibling.$$isPreviousSiblingOf.push(newNode);
				}
				//
				const newNodeLeftBound =
					newNode.$firstChildNode() || newNode.nextSibling;
				const newNodeRightBound =
					newNode.$lastChildNode() || newNode.previousSibling;
				doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
				doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
			}
		}
	}
};
const $remove = (nodePredicate) => ($this) => {
	//
};

const cloneNode = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		const out = new Fraggle();
		out.$childNodes = $this.$childNodes.map((n) => cloneNode(n));
		return out;
	} else if (nodePredicate($this)) {
		return $this.cloneNode();
	}
};

const contains = (nodePredicate) => ($this, aChild) => {
	if (nodePredicate(aChild) && nodePredicate($this)) {
		return $this.contains(aChild);
	} else if (nodePredicate(aChild) && $this instanceof Fraggle) {
		return $this.$reified && $this.$reified.contains(aChild);
	} else if (aChild instanceof Fraggle && $this instanceof Fraggle) {
		const firstChild = aChild.childNodes[0] || null;
		return contains($this, firstChild);
	} else if (aChild instanceof Fraggle && nodePredicate($this)) {
		const firstChild = aChild.childNodes[0] || null;
		return $this.contains(firstChild);
	} else {
		throw new Error("Invalid arguments");
	}
};
const getRootNode = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		if (this.$reified) {
			return this.$reified.getRootNode();
		}
		return null;
	} else if (nodePredicate($this)) {
		return $this.getRootNode();
	}
};
const hasChildNodes = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		if (this.$reified) {
			return this.$reified.hasChildNodes();
		}
		return null;
	} else if (nodePredicate($this)) {
		return $this.hasChildNodes();
	}
};
const appendChild = (nodePredicate) => ($this, aChild) => {
	insertBefore(nodePredicate)($this, aChild, null);
};

const removeChild = (nodePredicate) => ($this, aChild) => {
	for (let i = 0; i < $this.$childNodes.length; i++) {
		if ($this.$childNodes[i] === aChild) {
			return $remove(nodePredicate)(aChild)[0];
		}
	}
	throw new Error("Child not found");
};
const remove = (nodePredicate) => ($this) => {
	$remove(nodePredicate)($this);
};
const replaceChild = (nodePredicate) => ($this, newChild, oldChild) => {
	const [_, reference] = $removeChild(nodePredicate)($this, oldChild);
	insertBefore(nodePredicate)($this, newChild, reference);
};

module.exports = {
	appendChild,
	cloneNode,
	contains,
	getRootNode,
	hasChildNodes,
	insertBefore,
	removeChild,
	remove,
	replaceChild,
	Fraggle,
	FRAGGLE_NODE_TYPE,
	FRAGGLE_NODE_NAME,
};
