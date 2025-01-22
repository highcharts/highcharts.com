# Variable Reference

Highcharts DataGrid theming uses a set of CSS variables. By defining global variables, such as `--hcdg-font-size`, `--hcdg-background`, `--hcdg-padding` etc., you establish a baseline style for the entire datagrid. To customize specific sections, replace the global prefix (`--hcdg`) with a section-specific prefix, such as `--hcdg-header` or `--hcdg-row`. For example, the global variable `--hcdg-padding` becomes `--hcdg-row-padding` for rows. If no section-specific variable is defined, the datagrid defaults to the global value.

The part of the variable name following the prefix corresponds 1:1 to the associated CSS property, such as `padding`, `font-size` or `background`. This makes it intuitive to understand the expected values and their behavior.

## Fonts and Text

### Globals

Global font and text variables apply to all sections of the datagrid unless overridden.

| Variable           | Default Value   | Valid Values                                                                |
| ------------------ | --------------- | --------------------------------------------------------------------------- |
| --hcdg-font-family | System fonts \* | [font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) |
| --hcdg-font-size   | 1rem            | [font-size](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)     |
| --hcdg-font-weight | normal          | [font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight) |
| --hcdg-color       | #000000         | [color](https://developer.mozilla.org/en-US/docs/Web/CSS/color)             |
| --hcdg-text-align  | left            | [text-align](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align)   |

\* Default: apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif.

### Section Prefixes

Add these prefixes to refine fonts and text for specific sections. All sections inherit directly from the global variables.

| Section Prefix     | Fallback |
| ------------------ | -------- |
| --hcdg-header      | Globals  |
| --hcdg-description | Globals  |
| --hcdg-caption     | Globals  |

### Example

This example sets a base font family and size for the entire datagrid. Headers are bold, and the caption uses a larger font size.

```css
.theme-custom {
  --hcdg-font-family: Arial, sans-serif;
  --hcdg-font-size: 12px;
  --hcdg-header-font-weight: bold;
  --hcdg-caption-font-size: 20px;
}
```

## Borders

### Globals

Global border variables define the appearance of the outer table border and the borders between rows and columns.

| Variable                | Default Value | Valid Values                                                                    |
| ----------------------- | ------------- | ------------------------------------------------------------------------------- |
| --hcdg-border-width     | 0             | [border-width](https://developer.mozilla.org/en-US/docs/Web/CSS/border-width)   |
| --hcdg-border-style     | solid         | [border-style](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style)   |
| --hcdg-border-color     | #000000       | [border-color](https://developer.mozilla.org/en-US/docs/Web/CSS/border-color)   |
| --hcdg-border-radius \* | 0             | [border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) |

\* `--hcdg-border-radius` applies only to the outer table border, not individual cells.

### Section Prefixes

Use these prefixes to refine borders by section. If no section-specific variables are defined, global values are used (except for `--hcdg-border-radius`).

| Section Prefix       | Fallback      |
| -------------------- | ------------- |
| --hcdg-row           | Global        |
| --hcdg-column        | Global        |
| --hcdg-header-row    | --hcdg-row    |
| --hcdg-header-column | --hcdg-column |

### Example

This example starts with a 3px global border. Rows and columns have narrower borders, and header column borders use a different style and color.

```css
.theme-custom {
  --hcdg-border-width: 3px;
  --hcdg-border-color: #000000;
  --hcdg-row-border-width: 1px;
  --hcdg-column-border-width: 2px;
  --hcdg-header-column-border-color: #eeeeee;
  --hcdg-header-column-border-style: dashed;
}
```

## Padding

### Globals

Global padding is applied to all table cells, caption and description. Use `--hcdg-horizontal-padding` and `--hcdg-vertical-padding` for finer control. If these aren’t defined, `--hcdg-padding` applies to all sides.

| Variable                  | Default Value | Valid Values                                                                       |
| ------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| --hcdg-padding            | 0             | [padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) (single value) |
| --hcdg-horizontal-padding | 0             | [padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) (single value) |
| --hcdg-vertical-padding   | 0             | [padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) (single value) |

### Section Prefixes

Add these prefixes to customize padding for specific sections.

| Section Prefix     | Fallback |
| ------------------ | -------- |
| --hcdg-header      | Globals  |
| --hcdg-caption     | Globals  |
| --hcdg-description | Globals  |

### Example

This example sets global padding to 8px, reduces vertical padding for headers, and removes horizontal padding for captions.

```css
.theme-custom {
  --hcdg-padding: 8px;
  --hcdg-header-vertical-padding: 4px;
  --hcdg-caption-horizontal-padding: 0;
}
```

## Background Colors

### Globals

The global background color applies to the entire `<table>` element. Default transparency allows the color to "shine through" unless section-specific variables are defined.

| Variable                | Default Value | Valid Values                                                                          |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------- |
| --hcdg-background-color | transparent   | [background-color](https://developer.mozilla.org/en-US/docs/Web/CSS/background-color) |

### Section Prefixes

Use prefixes to define specific background colors for rows, columns, and hover states.

| Section Prefix               | Fallback          |
| ---------------------------- | ----------------- |
| --hcdg-row                   | None              |
| --hcdg-row-hovered           | --hcdg-row        |
| --hcdg-row-even              | None              |
| --hcdg-row-even-hovered      | --hcdg-row-even   |
| --hcdg-header-row            | --hcdg-row        |
| --hcdg-column-hovered        | --hcdg-row        |
| --hcdg-header-column-hovered | --hcdg-header-row |

### Example

This example starts with a global table background color. It adds a darker background for headers, alternating row colors, and hover states for rows and columns.

```css
.theme-custom {
  --hcdg-background-color: #aaaaaa;
  --hcdg-header-row-background-color: #888888;
  --hcdg-row-even-background-color: #aeaeae;
  --hcdg-row-hovered-background-color: #999999;
  --hcdg-column-hovered-background-color: #999999;
}
```

## Synced Background Colors

When using Highcharts DataGrid as a component in Highcharts Dashboards, [synchronization highlights rows and columns](https://www.highcharts.com/docs/dashboards/synchronize-components). These variables allow you to override default hover styles for synced states.

### Section Prefixes

| Section Prefix              | Fallback                     |
| --------------------------- | ---------------------------- |
| --hcdg-row-synced           | --hcdg-row-hovered           |
| --hcdg-row-even-synced      | --hcdg-row-even-hovered      |
| --hcdg-column-synced        | --hcdg-column-hovered        |
| --hcdg-header-column-synced | --hcdg-header-column-hovered |

## Putting It All Together

Define a few global variables for a consistent base style. Use section-specific prefixes to refine headers, captions, rows, and columns.

```css
.theme-custom {
  /* Global values */
  --hcdg-font-family: Arial, sans-serif;
  --hcdg-font-size: 12px;
  --hcdg-border-width: 3px;
  --hcdg-border-color: #000000;
  --hcdg-padding: 8px;
  --hcdg-background-color: #aaaaaa;

  /* Section-specific refinements */
  --hcdg-caption-font-size: 20px;
  --hcdg-caption-horizontal-padding: 0;

  --hcdg-header-font-weight: bold;
  --hcdg-header-vertical-padding: 4px;
  --hcdg-header-column-border-color: #eeeeee;
  --hcdg-header-column-border-style: dashed;
  --hcdg-header-row-background-color: #888888;

  --hcdg-row-border-width: 1px;
  --hcdg-row-even-background-color: #aeaeae;
  --hcdg-row-hovered-background-color: #999999;

  --hcdg-column-border-width: 2px;
  --hcdg-column-hovered-background-color: #999999;
}
```

## Summary

1. Define global variables for fonts, borders, padding, and backgrounds.
2. Use section-specific prefixes to refine specific areas.
3. The DataGrid falls back to global values when no section-specific variable is defined.

This system ensures flexible, maintainable, and consistent theming.
