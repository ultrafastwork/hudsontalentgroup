// wp-content\plugins\hudsontalentgroup\types.ts

// Global type declarations for Hudson Talent Group plugin

declare global {
	// Declare amCharts global variables
	const am5: typeof import("@amcharts/amcharts5");
	const am5hierarchy: typeof import("@amcharts/amcharts5/hierarchy");
	const am5themes_Animated: typeof import("@amcharts/amcharts5/themes/Animated").default;
	const am5themes_Responsive: typeof import("@amcharts/amcharts5/themes/Responsive").default;

	interface Window {
		hudsonAmchartsInit?: (id: string) => void;
		am5?: typeof import("@amcharts/amcharts5");
		am5hierarchy?: typeof import("@amcharts/amcharts5/hierarchy");
		am5themes_Animated?: typeof import("@amcharts/amcharts5/themes/Animated").default;
		am5themes_Responsive?: typeof import("@amcharts/amcharts5/themes/Responsive").default;
	}
}

export {};
