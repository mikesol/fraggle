const FRAGGLE_NODE_TYPE = 999;
const FRAGGLE_NODE_NAME = "#fraggle";

class Fraggle {
	$id = null;
	$reified = null;
	$logicalParent = null;
	$childNodes = null;
	baseURI = null;
	childNodes = null;
	firstChild = null;
	isConnected = null;
	lastChild = null;
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
		this.childNodes = [];
		this.firstChild = null;
		this.isConnected = false;
		this.lastChild = null;
		this.nextSibling = null;
		this.nodeName = FRAGGLE_NODE_NAME;
		this.nodeType = FRAGGLE_NODE_TYPE;
		this.ownerDocument = null;
		this.parentElement = null;
		this.parentNode = null;
		this.previousSibling = null;
		this.textContent = null;
	}
}

const shiftRightByNStartingAt = (arr, n, start) => {
	for (let i = start; i < arr.length; i++) {
		arr[i].l += n;
		arr[i].r += n;
	}
};

// methods
const insertBefore =
	(nodePredicate) => ($this, newNode, referenceNode) => {
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
				} else if (referenceNode === null) {
					// CASE 9
					// this is also the DOM API, plain and simple!
					$this.appendChild(newNode);
				} else {
					// CASE 4
					// we are inserting a DOM node into a DOM node and the reference is a fragment
					// we use either the first child of the reference or, if it is empty, its right abutting
					$this.insertBefore(
						newNode,
						referenceNode.childNodes.length
							? referenceNode.childNodes[0]
							: referenceNode.nextSibling
					);
					let currentNode = referenceNode;
					while (true) {
						currentNode.previousSibling = newNode;
						if (
							currentNode.childNodes.length === 0 &&
							currentNode.nextSibling instanceof Fraggle
						) {
							currentNode = currentNode.nextSibling;
						} else {
							break;
						}
					}
					referenceNode.previousSibling = newNode;
				}
			} else {
				if (nodePredicate(referenceNode)) {
					// CASE 3
					// we are inserting a fraggle node into a DOM node and the reference is a node
					const oldPreviousSibling = referenceNode.previousSibling;
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.insertBefore(newNode.childNodes[i], referenceNode);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this;
					newNode.parentNode = $this.parentNode;
					newNode.isConnected = true;
					newNode.parentElement = $this;
					newNode.nextSibling = referenceNode;
					newNode.previousSibling = oldPreviousSibling;
				} else if (referenceNode === null) {
					// CASE 10
					// we are inserting a fraggle at the end of a node
					const oldLastChild = $this.lastChild;
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.appendChild(newNode.childNodes[i]);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this;
					newNode.parentNode = $this.parentNode;
					newNode.isConnected = true;
					newNode.parentElement = $this;
					newNode.nextSibling = null;
					newNode.previousSibling = oldLastChild;
				} else {
					// CASE 5
					// we are inserting a fraggle into a DOM node and the reference is a fragment
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.insertBefore(
							newNode.childNodes[i],
							referenceNode.childNodes.length
								? referenceNode.childNodes[0]
								: referenceNode.nextSibling
						);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this;
					newNode.parentNode = $this.parentNode;
					newNode.isConnected = true;
					newNode.parentElement = $this;
					let currentNode = referenceNode;
					const newNodeBound = newNode.childNodes.length
						? newNode.childNodes[newNode.childNodes.length - 1]
						: newNode.previousSibling;
					while (true) {
						currentNode.previousSibling = newNodeBound;
						if (
							currentNode.childNodes.length === 0 &&
							currentNode.nextSibling instanceof Fraggle
						) {
							currentNode = currentNode.nextSibling;
						} else {
							break;
						}
					}
					currentNode = newNode;
					const referenceNodeBound = referenceNodeBound.childNodes.length
						? newNode.childNodes[0]
						: newNode.nextSibling;
					while (true) {
						currentNode.nextSibling = referenceNodeBound;
						if (
							currentNode.childNodes.length === 0 &&
							currentNode.previousSibling instanceof Fraggle
						) {
							currentNode = currentNode.previousSibling;
						} else {
							break;
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
			const doPreviousSiblingAssignment = ($$this, marker, node) => {
				let stopped = false;
				for (let i = marker; i < $$this.$childNodes.length; i++) {
					if (nodePredicate($$this.$childNodes[i].n)) {
						// we do not record previousSibling for an actual DOM node
						stopped = true;
						break;
					} else if ($$this.$childNodes[i].n.childNodes.length) {
						// if a fraggle has content, assign it the previousSibling but terminate early. we can do this because anything further to the right will have a different previousSibling.
						$$this.$childNodes[i].n.previousSibling = node;
						stopped = true;
						break;
					} else {
						// if a fraggle has no content, grab the node as previousSibling but allow the algorithm to continue. That way other fraggles to the right can also use this as the left abutting node.
						$$this.$childNodes[i].n.previousSibling = node;
					}
				}
				if (!stopped && $$this.$logicalParent instanceof Fraggle) {
					let i = 0;
					for (; i < $$this.$logicalParent.$childNodes.length; i++) {
						if ($$this.$logicalParent.$childNodes[i].n === $$this) {
							break;
						}
					}
					doPreviousSiblingAssignment($$this.$logicalParent, i + 1, node);
				}
			};
			const doNextSiblingAssignment = ($$this, marker, node) => {
				let stopped = false;
				for (let i = marker; i >= 0; i--) {
					if (nodePredicate($$this.$childNodes[i].n)) {
						// we do not record nextSibling for an actual DOM node
						stopped = true;
						break;
					} else if ($$this.$childNodes[i].n.childNodes.length) {
						// if a fraggle has content, assign it the nextSibling but terminate early. we can do this because anything further to the left will have a different nextSibling.
						$$this.$childNodes[i].n.nextSibling = node;
						stopped = true;
						break;
					} else {
						// if a fraggle has no content, grab the node as nextSibling but allow the algorithm to continue. That way other fraggles to the left can also use this as the right abutting node.
						$$this.$childNodes[i].n.nextSibling = node;
					}
				}
				if (!stopped && $$this.$logicalParent instanceof Fraggle) {
					let i = 0;
					for (; i < $$this.$logicalParent.$childNodes.length; i++) {
						if ($$this.$logicalParent.$childNodes[i].n === $$this) {
							break;
						}
					}
					doNextSiblingAssignment($$this.$logicalParent, i - 1, node);
				}
			};
			//
			//
			// needed for all fraggles
			//
			//
			// child node starting length
			let insertedAt;
			const childNodesStartingLength = $this.childNodes.length;
			// we add the child to $childNodes
			// we set the `l` and `n` properties of the child
			// we set `r` later once we know how many children there are
			if (referenceNode == null) {
				$this.$childNodes.push({ l: childNodesStartingLength, n: newNode });
				insertedAt = childNodesStartingLength;
			} else {
				let inserted = false;
				// todo: is there any way to avoid this traversal
				for (let i = 0; i < $this.$childNodes.length; i++) {
					if ($this.$childNodes[i].n === referenceNode) {
						insertedAt = i;
						$this.$childNodes.splice(i, 0, {
							l: $this.$childNodes[i - 1] ? $this.$childNodes[i - 1].r : 0,
							n: newNode,
						});
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
				if (nodePredicate(referenceNode)) {
					// CASE 2
					// the parent is a fraggle, but the reference and the new node are both DOM nodes
					$this.$reified && $this.$reified.insertBefore(newNode, referenceNode);
					doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
					doNextSiblingAssignment($this, insertedAt - 1, newNode);
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);
					$this.childNodes.splice($this.$childNodes[insertedAt].r - 1, 0, newNode);
					if ($this.childNodes[0] === newNode) {
						$this.firstChild = newNode;
					}
					if ($this.childNodes[$this.childNodes.length - 1] === newNode) {
						$this.lastChild = newNode;
					}
				} else if (referenceNode === null) {
					// CASE 11
					// we are inserting a node at the end of a fraggle
					$this.$reified && $this.$reified.appendChild(newNode);
					// note that doPreviousSiblingAssignment will immediately kick
					// up a level as there is nothing to the left
					doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
					doNextSiblingAssignment($this, insertedAt - 1, newNode);
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					// we do not need to call shiftRightByNStartingAt so comment it out
					// as we're at the end, there's no shift
					// shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);\
					// we don't need to call splice. instead, we can call push
					$this.childNodes.push(newNode);
					if ($this.childNodes[0] === newNode) {
						$this.firstChild = newNode;
					}
					if ($this.childNodes[$this.childNodes.length - 1] === newNode) {
						$this.lastChild = newNode;
					}
				} else {
					// CASE 6
					// the parent is a fraggle, the new node is a DOM node, and the reference is a fraggle
					$this.$reified && $this.$reified.insertBefore(
						newNode,
						referenceNode.childNodes.length
							? referenceNode.childNodes[0]
							: referenceNode.nextSibling
					);
					// we need to update the left abutting of all fraggles to the right
					doPreviousSiblingAssignment($this, insertedAt + 1, newNode);
					doNextSiblingAssignment($this, insertedAt - 1, newNode);
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);
					$this.childNodes.splice($this.$childNodes[insertedAt].r - 1, 0, newNode);
					if ($this.childNodes[0] === newNode) {
						$this.firstChild = newNode;
					}
					if ($this.childNodes[$this.childNodes.length - 1] === newNode) {
						$this.lastChild = newNode;
					}
				}
			} else {
				if (nodePredicate(referenceNode)) {
					// CASE 7
					// the parent is a fraggle, the new node is a fraggle, and the reference node is a DOM node
					const oldPreviousSibling = referenceNode.previousSibling;
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.insertBefore(newNode.childNodes[i], referenceNode);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this.$reified;
					newNode.parentNode = $this.parentNode;
					newNode.isConnected = true;
					newNode.parentElement = $this.$reified;
					newNode.nextSibling = referenceNode;
					newNode.previousSibling = oldPreviousSibling;
					//
					const newNodeLeftBound = newNode.childNodes.length
						? newNode.childNodes[0]
						: newNode.nextSibling;
					const newNodeRightBound = newNode.childNodes.length
						? newNode.childNodes[newNode.childNodes.length - 1]
						: newNode.previousSibling;
					doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
					doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
					$this.$childNodes[insertedAt].r =
						$this.$childNodes[insertedAt].l + newNode.childNodes.length;
					shiftRightByNStartingAt(
						$this.$childNodes,
						newNode.childNodes.length,
						insertedAt + 1
					);
					$this.childNodes.splice($this.$childNodes[insertedAt].r - 1, 0, newNode);
					if ($this.childNodes[0] === newNode && newNode.childNodes.length) {
						$this.firstChild = newNode.childNodes[0];
					}
					if (
						$this.childNodes[$this.childNodes.length - 1] === newNode &&
						newNode.childNodes.length
					) {
						$this.lastChild = newNode.childNodes[newNode.childNodes.length - 1];
					}
				} else if (referenceNode === null) {
					// CASE 12
					// we are inserting a fraggle at the end of a fraggle
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.appendChild(newNode.childNodes[i]);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this.$reified;
					newNode.parentNode = $this.$reified;
					newNode.isConnected = true;
					newNode.parentElement = $this.$reified;
          // the next sibling is the same as $this's next sibling
          // because we are dealing with real DOM elements
					newNode.nextSibling = $this.nextSibling;
          // the previous sibling must be whatever is at the end of $this
          // we set this _before_ updating lastChild
					newNode.previousSibling = $this.lastChild;
					//
					const newNodeLeftBound = newNode.childNodes.length
						? newNode.childNodes[0]
						: newNode.nextSibling;
					const newNodeRightBound = newNode.childNodes.length
						? newNode.childNodes[newNode.childNodes.length - 1]
						: newNode.previousSibling;
					doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
					doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);
					$this.childNodes.splice($this.$childNodes[insertedAt].r - 1, 0, newNode);
					if ($this.childNodes[0] === newNode && newNode.childNodes.length) {
						$this.firstChild = newNode.childNodes[0];
					}
					if (
						$this.childNodes[$this.childNodes.length - 1] === newNode &&
						newNode.childNodes.length
					) {
						$this.lastChild = newNode.childNodes[newNode.childNodes.length - 1];
					}
				} else {
					// CASE 8
					// fraggles all the way down!
          const oldPreviousSibling = referenceNode.previousSibling;
          const referenceAnchor = referenceNode.childNodes.length
						? referenceNode.childNodes[0]
						: referenceNode.nextSibling;
					for (let i = 0; i < newNode.childNodes.length; i++) {
						$this.insertBefore(
							newNode.childNodes[i],
							referenceAnchor
						);
					}
					newNode.$logicalParent = $this;
					newNode.$reified = $this.$reified;
					newNode.parentNode = $this.$reified;
					newNode.isConnected = true;
					newNode.parentElement = $this.$reified;
					newNode.nextSibling = referenceAnchor;
					newNode.previousSibling = oldPreviousSibling;
					//
					const newNodeLeftBound = newNode.childNodes.length
						? newNode.childNodes[0]
						: newNode.nextSibling;
					const newNodeRightBound = newNode.childNodes.length
						? newNode.childNodes[newNode.childNodes.length - 1]
						: newNode.previousSibling;
					doPreviousSiblingAssignment($this, insertedAt + 1, newNodeRightBound);
					doNextSiblingAssignment($this, insertedAt - 1, newNodeLeftBound);
					$this.$childNodes[insertedAt].r =
						$this.$childNodes[insertedAt].l + newNode.childNodes.length;
					shiftRightByNStartingAt(
						$this.$childNodes,
						newNode.childNodes.length,
						insertedAt + 1
					);
					$this.childNodes.splice($this.$childNodes[insertedAt].r - 1, 0, newNode);
					if ($this.childNodes[0] === newNode && newNode.childNodes.length) {
						$this.firstChild = newNode.childNodes[0];
					}
					if (
						$this.childNodes[$this.childNodes.length - 1] === newNode &&
						newNode.childNodes.length
					) {
						$this.lastChild = newNode.childNodes[newNode.childNodes.length - 1];
					}
				}
			}
		}
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
const normalize = () => {};
const removeChild = () => {};
const replaceChild = () => {};

module.exports = {
	appendChild,
	cloneNode,
	contains,
	getRootNode,
	hasChildNodes,
	insertBefore,
	normalize,
	removeChild,
	replaceChild,
	Fraggle,
	FRAGGLE_NODE_TYPE,
	FRAGGLE_NODE_NAME,
};