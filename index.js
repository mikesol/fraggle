export const FRAGGLE_NODE_TYPE = 999;
export const FRAGGLE_NODE_NAME = "#fraggle";

class Fraggle {
	$id = null;
	$reified = null;
	$leftAbutting = null;
	$rightAbutting = null;
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
		// the left-most DOM element on the _outside_ of the fraggle. when doing operations like `insertBefore`, we use this to get the actual DOM element we're inserting before.
		this.$leftAbutting = null;
		// the right-most DOM element on the _outside_ of the fraggle. when consulting `nextSibling`, we use this to get the actual next sibling in the DOM.
		this.$rightAbutting = null;
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
export const insertBefore =
	(nodePredicate) => ($this, newNode, referenceNode) => {
		// child node starting length
		let insertedAt;
		const childNodesStartingLength = $this.childNodes.length;
		// first, we add the child as a child node of the fraggle
		// that this updates the internal $childNodes
		// childNodes will be updated later
		if ($this instanceof Fraggle) {
			if (!referenceNode) {
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
		}
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
				const doLeftAbuttingAssignment = () => {
					for (let i = insertedAt + 1; i < $this.$childNodes.length; i++) {
						if (nodePredicate($this.$childNodes[i].n)) {
							// we do not record $leftAbutting for an actual DOM node
							break;
						} else if ($this.$childNodes[i].n.childNodes.length) {
							// if a fraggle has content, assign it the leftAbutting but terminate early. we can do this because anything further to the right will have a different $leftAbutting.
							$this.$childNodes[i].n.$leftAbutting = newNode;
							break;
						} else {
							// if a fraggle has no content, grab the newNode as $leftAbutting but allow the algorithm to continue. That way other fraggles to the right can also use this as the left abutting node.
							$this.$childNodes[i].n.$leftAbutting = newNode;
						}
					}
				};
				const doRightAbuttingAssignment = () => {
					for (let i = insertedAt - 1; i >= 0; i--) {
						if (nodePredicate($this.$childNodes[i].n)) {
							// we do not record $leftAbutting for an actual DOM node
							break;
						} else if ($this.$childNodes[i].n.childNodes.length) {
							// if a fraggle has content, assign it the leftAbutting but terminate early. we can do this because anything further to the right will have a different $leftAbutting.
							$this.$childNodes[i].n.$rightAbutting = newNode;
							break;
						} else {
							// if a fraggle has no content, grab the newNode as $leftAbutting but allow the algorithm to continue. That way other fraggles to the right can also use this as the left abutting node.
							$this.$childNodes[i].n.$rightAbutting = newNode;
						}
					}
				};
				if (nodePredicate(referenceNode)) {
					// CASE 1
					// this is the DOM API, plain and simple!
					$this.insertBefore(newNode, referenceNode);
					// we need to update the left abutting of all fraggles to the right
					doLeftAbuttingAssignment();
          if (insertedAt !== 0) {
            doRightAbuttingAssignment();
          }
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);
					$this.childNodes.splice($this.$childNodes[insertedAt].r, 0, newNode);
				} else if (referenceNode === null) {
					// CASE 9
					// this is also the DOM API, plain and simple!
					$this.insertBefore(newNode, referenceNode);
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					// we don't need to propagate left abutting as there is nothing to the left
					// no shift needed as we're at the end
					// we can just push
					$this.childNodes.push(newNode);
				} else {
					// CASE 4
					// we are inserting a DOM node into a DOM node and the reference is a fragment
					// we use either the first child of the reference or, if it is empty, its right abutting
					$this.insertBefore(
						newNode,
						referenceNode.childNodes.length
							? referenceNode.childNodes[0]
							: referenceNode.$rightAbutting
					);
					// we need to update the left abutting of all fraggles to the right
					doLeftAbuttingAssignment();
          if (insertedAt !== 0) {
						doRightAbuttingAssignment();
					}
					$this.$childNodes[insertedAt].r = $this.$childNodes[insertedAt].l + 1;
					shiftRightByNStartingAt($this.$childNodes, 1, insertedAt + 1);
					$this.childNodes.splice($this.$childNodes[insertedAt].r, 0, newNode);
					// the reference node's right
				}
			} else {
				if (nodePredicate(referenceNode)) {
					// CASE 3
					// we are inserting a fraggle node into a DOM node and the reference is a node
				} else if (referenceNode === null) {
					// CASE 10
					// we are inserting a fraggle at the end of a node
				} else {
					// CASE 5
					// we are inserting a fraggle into a DOM node and the reference is a fragment
				}
			}
		} else {
			if (nodePredicate(newNode)) {
				if (nodePredicate(referenceNode)) {
					// CASE 2
					// the parent is a fraggle, but the reference and the new node are both DOM nodes
				} else if (referenceNode === null) {
					// CASE 11
					// we are inserting a node at the end of a fraggle
				} else {
					// CASE 6
					// the parent is a fraggle, the new node is a DOM node, and the reference is a fraggle
				}
			} else {
				if (nodePredicate(referenceNode)) {
					// CASE 7
					// the parent is a fraggle, the new node is a fraggle, and the reference node is a DOM node
				} else if (referenceNode === null) {
					// CASE 12
					// we are inserting a fraggle at the end of a fraggle
				} else {
					// CASE 8
					// fraggles all the way down!
				}
			}
		}
	};

export const cloneNode = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		const out = new Fraggle();
		out.$childNodes = $this.$childNodes.map((n) => cloneNode(n));
		return out;
	} else if (nodePredicate($this)) {
		return $this.cloneNode();
	}
};

export const contains = (nodePredicate) => ($this, aChild) => {
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
export const getRootNode = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		if (this.$reified) {
			return this.$reified.getRootNode();
		}
		return null;
	} else if (nodePredicate($this)) {
		return $this.getRootNode();
	}
};
export const hasChildNodes = (nodePredicate) => ($this) => {
	if ($this instanceof Fraggle) {
		if (this.$reified) {
			return this.$reified.hasChildNodes();
		}
		return null;
	} else if (nodePredicate($this)) {
		return $this.hasChildNodes();
	}
};
export const appendChild = (nodePredicate) => ($this, aChild) => {
  insertBefore(nodePredicate)($this, aChild, null);
}
export const normalize = () => {};
export const removeChild = () => {};
export const replaceChild = () => {};
