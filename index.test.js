/**
 * @jest-environment jsdom
 */

const { Fraggle, insertBefore, appendChild } = require("./");

describe("my test suite", () => {
	afterEach(() => {
		document.getElementsByTagName("html")[0].innerHTML = "";
	});

	test("expects nodes from a fraggle to be next to each other when the fraggle is added", () => {
		const fraggle = new Fraggle();
		const div0 = document.createElement("div");
		const div1 = document.createElement("div");
		$appendChild = appendChild((n) => n instanceof Node);
		$appendChild(fraggle, div0);
		$appendChild(fraggle, div1);
		$appendChild(document.body, fraggle);
		expect(document.body.childNodes[0]).toBe(div0);
		expect(document.body.childNodes[1]).toBe(div1);
	});

	test("expects nodes from a fraggle to be next to each other when the fraggle is added", () => {
		const fraggle = new Fraggle();
		const div0 = document.createElement("div");
		const div1 = document.createElement("div");
		const div2 = document.createElement("div");
		$appendChild = appendChild((n) => n instanceof Node);
		$insertBefore = insertBefore((n) => n instanceof Node);
		$appendChild(fraggle, div0);
		$appendChild(fraggle, div1);
		$insertBefore(fraggle, div2, div1);
		$appendChild(document.body, fraggle);
		expect(document.body.childNodes[0]).toBe(div0);
		expect(document.body.childNodes[1]).toBe(div2);
		expect(document.body.childNodes[2]).toBe(div1);
	});

	test("order of adding fraggle to the dom should not matter", () => {
		const fraggle = new Fraggle();
		const div0 = document.createElement("div");
		const div1 = document.createElement("div");
		const div2 = document.createElement("div");
		$appendChild = appendChild((n) => n instanceof Node);
		$insertBefore = insertBefore((n) => n instanceof Node);
		$appendChild(fraggle, div0);
		$appendChild(document.body, fraggle);
		$appendChild(fraggle, div1);
		$insertBefore(fraggle, div2, div1);
		expect(document.body.childNodes[0]).toBe(div0);
		expect(document.body.childNodes[1]).toBe(div2);
		expect(document.body.childNodes[2]).toBe(div1);
	});

	test("nested fraggles", () => {
		const fraggle = new Fraggle();
		const innerFraggle = new Fraggle();
		const div0 = document.createElement("div");
		const div1 = document.createElement("div");
		const div2 = document.createElement("div");
		const div3 = document.createElement("div");
		$appendChild = appendChild((n) => n instanceof Node);
		$insertBefore = insertBefore((n) => n instanceof Node);
		$appendChild(fraggle, div0);
		$appendChild(document.body, fraggle);
		$appendChild(innerFraggle, div2);
		$appendChild(innerFraggle, div3);
		$appendChild(fraggle, div1);
		$insertBefore(fraggle, innerFraggle, div1);
		expect(document.body.childNodes[0]).toBe(div0);
		expect(document.body.childNodes[1]).toBe(div2);
		expect(document.body.childNodes[2]).toBe(div3);
		expect(document.body.childNodes[3]).toBe(div1);
	});

	test("stress test", () => {
		$appendChild = appendChild((n) => n instanceof Node);
		$insertBefore = insertBefore((n) => n instanceof Node);
		const makeDeeplyNestedFraggle = (d) => {
			const fraggle0 = new Fraggle();
			const fraggle1 = new Fraggle();
			const fraggle2 = new Fraggle();
			const fraggle3 = new Fraggle();
			$appendChild(fraggle0, fraggle1);
			$appendChild(fraggle3, d);
			$appendChild(fraggle1, fraggle2);
			$appendChild(fraggle2, fraggle3);
			return fraggle0;
		};
		const fraggle = new Fraggle();
		const div0 = document.createElement("div");
		const div1 = document.createElement("div");
		const div2 = document.createElement("div");
		const div3 = document.createElement("div");
		const frag0 = makeDeeplyNestedFraggle(div0);
		const frag1 = makeDeeplyNestedFraggle(div1);
		const frag2 = makeDeeplyNestedFraggle(div2);
		const frag3 = makeDeeplyNestedFraggle(div3);
		$appendChild(fraggle, frag0);
		$appendChild(document.body, fraggle);
		$appendChild(fraggle, frag2);
		$insertBefore(fraggle, frag1, frag2);
		$appendChild(fraggle, frag3);
		expect(document.body.childNodes[0]).toBe(div0);
		expect(document.body.childNodes[1]).toBe(div1);
		expect(document.body.childNodes[2]).toBe(div2);
		expect(document.body.childNodes[3]).toBe(div3);
		const fragKids = fraggle.childNodes;
		expect(fragKids[0]).toBe(div0);
		expect(fragKids[1]).toBe(div1);
		expect(fragKids[2]).toBe(div2);
		expect(fragKids[3]).toBe(div3);
	});
});
