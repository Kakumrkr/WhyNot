# Riverside playground design system

[D-073](../08-decisions.md) defines the visual and accessibility choices. The web app's `src/styles.css` holds the tokens.

| Token | Use |
| --- | --- |
| `--paper`, `--surface`, `--tint` | Warm page, white controls and cards, pale teal request summary |
| `--ink`, `--quiet` | Main and supporting text, both meeting 4.5:1 on their surfaces |
| `--accent`, `--accent-ink` | Primary action fill, selected controls and links |
| `--line`, `--control-line` | Decorative separators and visible control boundaries |
| `--focus` | Three-pixel focus outline with offset |
| `--alert` | Invalid-link text |
| `--heading-font`, `--body-font` | Local serif display headings and system sans-serif text |

Keep a clear heading hierarchy. Use native inputs with visible labels and group related controls with a fieldset and legend. Give controls at least 44 CSS pixels of touch height. Use words alongside color for status and expose updates to assistive technology. On link reset, return focus to the scenario picker. Keep the skip link visible when focused.

Use the two-column shell at wider widths and stack in reading order on narrow screens. Preserve the clinic timezone and an explicit frozen-clock label. Load fonts and styles locally.
