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
});
