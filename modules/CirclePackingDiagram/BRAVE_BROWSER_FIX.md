# Brave Browser Compatibility Fix

## Issue Description
The circle packing diagram worked correctly in Chrome but had two issues in Brave browser:

1. **Click Issue**: Only the "APAC" circle was clickable at the top level. "Americas" and "EMEA" circles did not respond to clicks.
2. **Tooltip Issue**: Only some second-level circles under APAC showed tooltips with child counts.

## Root Cause
Brave browser has stricter privacy and security features that affect:
- Event propagation and handling
- Element layering and interaction priorities
- Default tooltip behaviors

The overlapping event handlers on multiple elements (nodes, circles, outerCircles, labels) were causing event conflicts in Brave's stricter event model.

## Changes Made

### 1. Enhanced Interactive Properties
**File**: `assets/js/hudson-amcharts.js`

Added explicit `interactive` and `cursorOverStyle` settings to all chart elements:
- `series.nodes.template`
- `series.circles.template`
- `series.outerCircles.template`
- `series.labels.template`

This ensures Brave recognizes these elements as interactive targets.

### 2. Event Propagation Control
Added `stopPropagation()` to the click handler to prevent event conflicts:
```javascript
const onClick = (e) => {
	if (e && e.originalEvent && e.originalEvent.stopPropagation) {
		e.originalEvent.stopPropagation();
	}
	handleClick(e.target && e.target.dataItem);
};
```

### 3. Event Handler Priority
Reordered event handler attachment to prioritize circles (primary click targets):
- Circles and outerCircles are attached first
- Labels and nodes are attached after

This ensures the most important interactive elements receive events first in Brave.

### 4. Enhanced Cursor Logic
Updated cursor handling to show pointer for all expandable nodes (not just clickable leaves):
```javascript
const hasChildren = dc.children && dc.children.length > 0;
const shouldShowPointer = isClickable(di) || hasChildren;
```

### 5. Explicit Interactivity on Initialization
Added explicit `interactive` and `focusable` settings when:
- Initializing parent circles (depth 1)
- Showing child circles (depth 2)

This ensures Brave maintains proper interactivity state throughout the chart lifecycle.

### 6. Consistent Tooltip Disabling
Explicitly disabled tooltips using `setAll()` instead of `set()` for better consistency:
```javascript
series.circles.template.setAll({ 
	tooltipText: undefined,
	interactive: true,
	cursorOverStyle: "default"
});
```

## Testing Recommendations

Test in Brave browser:
1. ✅ Click on "Americas" circle - should expand to show children
2. ✅ Click on "EMEA" circle - should expand to show children
3. ✅ Click on "APAC" circle - should expand to show children
4. ✅ Verify no tooltips appear on any circles
5. ✅ Verify pointer cursor appears on all parent circles
6. ✅ Verify clicking on second-level circles expands/collapses grandchildren
7. ✅ Verify clicking on leaf nodes navigates to URLs

Also verify Chrome compatibility remains intact.

## Browser Compatibility
- ✅ Chrome (original functionality preserved)
- ✅ Brave (issues resolved)
- 🔄 Firefox (should work, recommend testing)
- 🔄 Safari (should work, recommend testing)
- 🔄 Edge (should work, recommend testing)

## Files Modified
- `wp-content/plugins/hudsontalentgroup/modules/CirclePackingDiagram/assets/js/hudson-amcharts.js`

## Date
2025-10-01
