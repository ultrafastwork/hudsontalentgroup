// wp-content\plugins\hudsontalentgroup\modules\CirclePackingDiagram\assets\js\hudson-amcharts.js

// @ts-check
/// <reference path="../../../../types.ts" />

/**
 * @typedef {Object} ChartNode
 * @property {string} name
 * @property {number} [value]
 * @property {string} [url]
 * @property {ChartNode[]} [children]
 * @property {any} [nodeSettings]
 * @property {any} [outerSettings]
 */

/**
 * Initialize Hudson amCharts circle packing diagram
 * @param {string} id - The container element ID
 */
window.hudsonAmchartsInit = function (id) {
	const container = document.getElementById(id);
	const dataEl = document.getElementById(id + "-data");
	if (!container || !dataEl) return;

	// Parse data safely
	/** @type {ChartNode} */
	let chartData;

	try {
		const textContent = dataEl.textContent || dataEl.innerText || "";

		if (!textContent.trim()) {
			console.error("Hudson amCharts: No data provided");
			return;
		}

		chartData = JSON.parse(textContent);
	} catch (e) {
		console.error("Hudson amCharts: Failed to parse data", e);
		return;
	}

	/**
	 * Helper to check if in iframe (Elementor preview)
	 */
	function inIframe() {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	}

	/**
	 * Navigation helper.
	 *
	 * @param {string} url
	 */
	function go(url) {
		if (inIframe()) {
			window.open(url, "_top");
		} else {
			window.location.assign(url);
		}
	}

	// Wait for amCharts libraries to be ready
	function libsLoaded() {
		return !!(
			window.am5 &&
			window.am5hierarchy &&
			window.am5themes_Animated &&
			window.am5themes_Responsive
		);
	}

	function start() {
		if (!libsLoaded()) return false;

		// ---------- Root ----------
		const root = am5.Root.new(id);

		root.setThemes([
			am5themes_Animated.new(root),
			am5themes_Responsive.new(root),
		]);

		root.dom.style.background = "transparent";

		// @ts-ignore - svgContainer exists at runtime but not in type definitions
		if (root.svgContainer) root.svgContainer.style.background = "transparent";

		root.container.set(
			"background",
			am5.Rectangle.new(root, { fillOpacity: 0, strokeOpacity: 0 }),
		);

		// ---------- Series ----------
		const series = root.container.children.push(
			am5hierarchy.ForceDirected.new(root, {
				singleBranchOnly: true, // one expanded parent at a time
				initialDepth: 0, // parents only on load
				downDepth: 1, // parent shows ONLY children; child toggles grandchildren
				topDepth: 1,
				valueField: "value",
				categoryField: "name",
				childDataField: "children",
				idField: "name",
				manyBodyStrength: -30,
				centerStrength: 0.8,
			}),
		);

		// keep clicks clean
		series.nodes.template.setAll({
			draggable: false,
			interactive: true,
			cursorOverStyle: "default",
		});

		// No tooltips - explicitly disable for all elements
		series.circles.template.setAll({
			tooltipText: undefined,
			interactive: true,
			cursorOverStyle: "default",
		});

		series.outerCircles.template.setAll({
			tooltipText: undefined,
			interactive: true,
			cursorOverStyle: "default",
		});

		series.nodes.template.set("tooltipText", undefined);

		series.labels.template.setAll({
			tooltipText: undefined,
			interactive: true,
			cursorOverStyle: "default",
		});

		series.links.template.set("tooltipText", undefined);

		// Hide wrapper (depth 0)
		series.nodes.template.adapters.add("visible", function (vis, target) {
			const di = target.dataItem;
			// @ts-ignore - depth exists at runtime
			return di ? di.get("depth") !== 0 : vis;
		});

		series.nodes.template.adapters.add("opacity", function (op, target) {
			const di = target.dataItem;
			// @ts-ignore - depth exists at runtime
			return di && di.get("depth") === 0 ? 0 : 1;
		});

		// --- Colors (same palette logic) ---
		/**
		 * @param {number} r
		 * @param {number} g
		 * @param {number} b
		 * @returns {[number, number, number]}
		 */
		function rgbToHsl(r, g, b) {
			r /= 255;
			g /= 255;
			b /= 255;
			const max = Math.max(r, g, b),
				min = Math.min(r, g, b);
			let h = 0,
				s,
				l = (max + min) / 2;
			if (max === min) {
				h = 0;
				s = 0;
			} else {
				const d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch (max) {
					case r:
						h = (g - b) / d + (g < b ? 6 : 0);
						break;
					case g:
						h = (b - r) / d + 2;
						break;
					case b:
						h = (r - g) / d + 4;
						break;
				}
				h /= 6;
			}
			return [h, s, l];
		}

		/**
		 * @param {number} h
		 * @param {number} s
		 * @param {number} l
		 * @returns {[number, number, number]}
		 */
		function hslToRgb(h, s, l) {
			/**
			 * @param {number} p
			 * @param {number} q
			 * @param {number} t
			 * @returns {number}
			 */
			const hue2rgb = function (p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};

			let r, g, b;

			if (s === 0) {
				r = g = b = l;
			} else {
				const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				const p = 2 * l - q;
				r = hue2rgb(p, q, h + 1 / 3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1 / 3);
			}

			return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
		}

		/**
		 * @param {string} hex
		 * @param {number} satFactor
		 * @param {number} lightLift
		 * @returns {string}
		 */
		function lightenDesaturate(hex, satFactor, lightLift) {
			const h = hex.replace("#", "");

			const f =
				h.length === 3
					? h
							.split("")
							.map((c) => c + c)
							.join("")
					: h;

			const v = parseInt(f, 16);

			const r = (v >> 16) & 255,
				g = (v >> 8) & 255,
				b = v & 255;

			let [H, S, L] = rgbToHsl(r, g, b);

			S = Math.max(0, Math.min(1, S * satFactor));

			if (S < 0.18) S = 0.18;

			L = Math.max(0, Math.min(1, Math.min(0.98, L + lightLift)));
			const [r2, g2, b2] = hslToRgb(H, S, L);

			/** @param {number} x */
			const toHex = (x) => x.toString(16).padStart(2, "0");

			return "#" + toHex(r2) + toHex(g2) + toHex(b2);
		}

		const basePalette = ["#7a8187", "#33a1af", "#b2252b", "#86a873", "#bb9f06"];

		/**
		 * @param {ChartNode} node
		 * @param {string} parentHex
		 * @param {number} depth
		 * @param {number} siblingIndex
		 */
		function decorateColors(node, parentHex, depth, siblingIndex) {
			let myHex = parentHex;
			if (depth === 1) myHex = basePalette[siblingIndex % basePalette.length];

			node.nodeSettings = node.nodeSettings || {};
			node.outerSettings = node.outerSettings || {};
			node.nodeSettings.fill = am5.color(myHex);

			if (node.children && node.children.length) {
				for (let i = 0; i < node.children.length; i++) {
					const child = node.children[i];
					const childHex = lightenDesaturate(myHex, 0.85, 0.15);

					child.nodeSettings = child.nodeSettings || {};
					child.outerSettings = child.outerSettings || {};
					child.nodeSettings.fill = am5.color(childHex);
					child.outerSettings.stroke = am5.color(childHex);
					child.outerSettings.fill = am5.color(childHex);
					child.outerSettings.fillOpacity = 0.12;

					if (child.children && child.children.length) {
						decorateColors(child, childHex, depth + 1, i);
					}
				}
			}
		}

		decorateColors(chartData, basePalette[0], 0, 0);
		series.circles.template.setAll({ templateField: "nodeSettings" });
		series.outerCircles.template.setAll({ templateField: "outerSettings" });

		// Labels & sizing
		function getBP() {
			const w = root.dom ? root.dom.clientWidth : window.innerWidth;
			if (w <= 600) return "mobile";
			if (w <= 1024) return "tablet";
			return "desktop";
		}

		const R = {
			mobile: {
				parent: 56,
				childScale: 0.85,
				grandScale: 0.78,
				unit: 5.2,
				min: 120,
				capChild: 0.82,
				capGrand: 0.74,
				labelFS: 12,
			},
			tablet: {
				parent: 62,
				childScale: 0.86,
				grandScale: 0.8,
				unit: 5.8,
				min: 130,
				capChild: 0.83,
				capGrand: 0.75,
				labelFS: 13,
			},
			desktop: {
				parent: 70,
				childScale: 0.88,
				grandScale: 0.82,
				unit: 6.2,
				min: 140,
				capChild: 0.84,
				capGrand: 0.76,
				labelFS: 14,
			},
		};

		/**
		 * @param {string} name
		 * @param {"mobile" | "tablet" | "desktop"} bp
		 * @returns {number}
		 */
		function textBaseRadius(name, bp) {
			const cfg = R[bp];
			const lines = String(name || "").split(/\n/);
			const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
			const lineCount = lines.length;
			return Math.max(cfg.min, longest * cfg.unit + (lineCount - 1) * 6);
		}

		/**
		 * @param {any} di - DataItem
		 * @returns {number}
		 */
		function computeRadius(di) {
			const bp = getBP();
			const cfg = R[bp];
			// @ts-ignore - depth exists at runtime
			const depth = di.get("depth");
			const dc = di.dataContext || {};
			if (depth === 0) return 0;
			const parentR = cfg.parent;
			if (depth === 1) return parentR;
			let r = textBaseRadius(dc.name, bp);
			if (depth === 2) {
				r *= cfg.childScale;
				r = Math.min(r, parentR * cfg.capChild);
			} else {
				r *= cfg.grandScale;
				r = Math.min(r, parentR * cfg.capGrand);
			}
			r = Math.max(r, Math.min(parentR * 0.6, cfg.min * 0.9));
			return r;
		}

		series.circles.template.adapters.add("radius", function (radius, target) {
			const di = target.dataItem;
			return di ? computeRadius(di) : radius;
		});

		series.outerCircles.template.adapters.add(
			"radius",
			function (radius, target) {
				const di = target.dataItem;
				return di ? computeRadius(di) : radius;
			},
		);

		series.labels.template.setAll({
			oversizedBehavior: "wrap",
			textAlign: "center",
			centerX: am5.percent(50),
			centerY: am5.percent(50),
			isMeasured: true,
		});

		series.labels.template.adapters.add("fontSize", function () {
			return R[getBP()].labelFS;
		});

		series.labels.template.adapters.add("maxWidth", function (max, target) {
			const di = target.dataItem;
			if (!di) return max;
			const r = computeRadius(di);
			return Math.max(110, Math.floor(r * 1.6));
		});

		// Data + appear
		series.data.setAll([chartData]);
		series.appear(1000, 100);

		// INIT: parents only; hide children & grandchildren (don't disable interactivity)
		// @ts-ignore - inited event exists at runtime
		series.events.on("inited", function () {
			const rootDI = series.dataItems[0];
			// @ts-ignore - children exists at runtime
			if (!rootDI || !rootDI.children) return;
			// @ts-ignore - children exists at runtime
			rootDI.children.each(function (/** @type {any} */ pdi) {
				pdi.set("expanded", false);
				// Ensure parent circles remain interactive in Brave
				const pNode = pdi.get("node");
				if (pNode) {
					pNode.set("interactive", true);
					pNode.set("focusable", true);
				}
				const pCircle = pdi.get("circle");
				if (pCircle) {
					pCircle.set("interactive", true);
					pCircle.set("focusable", true);
				}
				const pOuter = pdi.get("outerCircle");
				if (pOuter) {
					pOuter.set("interactive", true);
					pOuter.set("focusable", true);
				}

				if (pdi.children) {
					pdi.children.each(function (/** @type {any} */ cdi) {
						cdi.set("expanded", false);
						const cn = cdi.get("node");
						if (cn) {
							cn.set("visible", false);
							cn.set("opacity", 0);
						}
						const cl = cdi.get("link");
						if (cl) cl.set("visible", false);
						if (cdi.children) {
							cdi.children.each(function (/** @type {any} */ gdi) {
								gdi.set("expanded", false);
								const gn = gdi.get("node");
								if (gn) {
									gn.set("visible", false);
									gn.set("opacity", 0);
								}
								const gl = gdi.get("link");
								if (gl) gl.set("visible", false);
							});
						}
					});
				}
			});
		});

		// Show/collapse helpers
		/** @param {any} di */
		function hideSubtree(di) {
			di.set("expanded", false);
			if (di.children) {
				di.children.each(function (/** @type {any} */ childDI) {
					childDI.set("expanded", false);
					const n = childDI.get("node");
					if (n) {
						n.set("visible", false);
						n.set("opacity", 0);
					}
					const l = childDI.get("link");
					if (l) l.set("visible", false);
					if (childDI.children) {
						childDI.children.each(function (/** @type {any} */ gdi) {
							gdi.set("expanded", false);
							const gn = gdi.get("node");
							if (gn) {
								gn.set("visible", false);
								gn.set("opacity", 0);
							}
							const gl = gdi.get("link");
							if (gl) gl.set("visible", false);
						});
					}
				});
			}
		}

		/** @param {any} pdi */
		function showParentChildrenOnly(pdi) {
			pdi.set("expanded", true);
			if (pdi.children) {
				pdi.children.each(function (/** @type {any} */ cdi) {
					cdi.set("expanded", false); // keep grandchildren hidden
					const cn = cdi.get("node");

					if (cn) {
						cn.set("visible", true);
						cn.set("opacity", 1);

						// Ensure child nodes are interactive in Brave
						cn.set("interactive", true);
						cn.set("focusable", true);
					}

					const cCircle = cdi.get("circle");

					if (cCircle) {
						cCircle.set("interactive", true);
						cCircle.set("focusable", true);
					}

					const cOuter = cdi.get("outerCircle");

					if (cOuter) {
						cOuter.set("interactive", true);
						cOuter.set("focusable", true);
					}

					const cl = cdi.get("link");
					if (cl) cl.set("visible", true);

					if (cdi.children) {
						cdi.children.each(function (/** @type {any} */ gdi) {
							gdi.set("expanded", false);
							const gn = gdi.get("node");
							if (gn) {
								gn.set("visible", false);
								gn.set("opacity", 0);
							}
							const gl = gdi.get("link");
							if (gl) gl.set("visible", false);
						});
					}
				});
			}
		}

		// Leaf / clickable detection: any node that has a url
		/** @param {any} di */
		function isLeaf(di) {
			const dc = di?.dataContext || {};
			return !(dc.children && dc.children.length);
		}

		/** @param {any} di */
		function isClickable(di) {
			const dc = di?.dataContext || {};
			return isLeaf(di) && !!dc.url;
		}

		// Pointer cursor only on clickable leaves
		/** @param {any} di */
		function updateCursor(di) {
			// For Brave compatibility, also check if node has children (expandable)
			const dc = di?.dataContext || {};
			const hasChildren = dc.children && dc.children.length > 0;
			const shouldShowPointer = isClickable(di) || hasChildren;
			root.dom.style.cursor = shouldShowPointer ? "pointer" : "default";
		}

		/** @param {any} e */
		const onOver = (e) => {
			if (e && e.target && e.target.dataItem) {
				updateCursor(e.target.dataItem);
			}
		};

		const onOut = () => {
			root.dom.style.cursor = "default";
		};

		// Attach pointer events - circles first for priority in Brave
		series.circles.template.events.on("pointerover", onOver);
		series.outerCircles.template.events.on("pointerover", onOver);
		series.labels.template.events.on("pointerover", onOver);
		series.nodes.template.events.on("pointerover", onOver);
		series.circles.template.events.on("pointerout", onOut);
		series.outerCircles.template.events.on("pointerout", onOut);
		series.labels.template.events.on("pointerout", onOut);
		series.nodes.template.events.on("pointerout", onOut);

		// Click handling
		/** @param {any} di */
		function handleClick(di) {
			if (!di) return;
			const dc = di.dataContext || {};

			if (isClickable(di)) {
				go(dc.url); // ONLY grandchildren navigate
				return;
			}

			// @ts-ignore - depth exists at runtime
			const depth = di.get("depth");

			if (depth === 1) {
				// parent
				const rootDI = series.dataItems[0];
				// @ts-ignore - children exists at runtime
				if (!rootDI || !rootDI.children) return;
				// @ts-ignore - children exists at runtime
				rootDI.children.each((/** @type {any} */ pdi) =>
					pdi === di ? showParentChildrenOnly(pdi) : hideSubtree(pdi),
				);
				return;
			}

			if (depth === 2) {
				// child
				const expand = !di.get("expanded");
				di.set("expanded", expand);
				return;
			}
		}

		/** @param {any} e */
		const onClick = (e) => {
			// Stop propagation to prevent event conflicts in Brave browser
			if (e && e.originalEvent && e.originalEvent.stopPropagation) {
				e.originalEvent.stopPropagation();
			}
			handleClick(e.target && e.target.dataItem);
		};

		// Attach click handlers with higher priority for circles (primary click targets)
		series.circles.template.events.on("click", onClick);
		series.outerCircles.template.events.on("click", onClick);
		series.labels.template.events.on("click", onClick);
		series.nodes.template.events.on("click", onClick);

		// Safe resize
		// @ts-ignore - _renderer is private but needed for manual resize
		if (root._renderer && typeof root._renderer.resize === "function") {
			// @ts-ignore - _renderer is private but needed for manual resize
			window.addEventListener("resize", () => root._renderer.resize());
		}

		return true;
	}

	// Try to start, with retry logic for delayed script loading
	let attempts = 0;
	let max = 200;

	(function tick() {
		attempts++;
		if (start() === true) return;
		if (attempts < max) setTimeout(tick, 100);
	})();
};
