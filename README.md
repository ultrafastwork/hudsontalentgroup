# Hudson Talent Group Tools

Internal WordPress plugin for Hudson Talent Group.

## Features
- **AMCharts Graph Shortcode**: embed force-directed circle graphs.
- Future tools/features can be added here as needed.

## Usage

```
[hudson_amcharts_graph height="800"]
{ "value": 0, "children": [ ... your data JSON ... ] }
[/hudson_amcharts_graph]
```

- `height`: chart height in px.
- Paste your JSON data between shortcode tags.

## Notes
- Fixes resize issue by using ResizeObserver and IntersectionObserver.
- Works in Brave by allowing local fallback (replace CDN URLs if needed).
- Matches the original AMCharts visual style with responsive sizing.
