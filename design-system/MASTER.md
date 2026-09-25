# LeadFlow AI — Master Design System

**Version:** 1.0.0  
**Theme:** Light Beige SaaS · Warm Neutral · Minimal Enterprise · Content-First Operational Dashboard

---

## 1. Design Philosophy & Aesthetic Direction

LeadFlow AI is an enterprise B2B sales automation and CRM control center. The design language avoids clinical sterile whites and aggressive dark neon themes. Instead, it utilizes a warm, calming, premium **Light Beige & Warm Neutral** visual identity inspired by editorial clarity (Linear precision, Stripe typography polish, Notion content hierarchy).

### Core Aesthetic Pillars

1. **Warm Light Beige Identity**: Warm alabaster/ivory background (`#F9F8F5`), crisp ivory surfaces (`#FFFFFF` & `#F5F2EB`), and warm sand borders (`#E6E1D6`).
2. **High-Contrast Legibility**: Deep warm charcoal primary typography (`#1C1B18`) and muted graphite secondary (`#5C5850`) exceeding WCAG AAA standards.
3. **Restrained Warm Accents**: Refined deep amber/bronze (`#8D5B28`) and warm cognac (`#A76E36`) for primary interactive states.
4. **Accessible Semantic Accents**:
   - Success: Forest Sage (`#246E47`) on soft matcha tint (`#EEF7F2`)
   - Warning: Amber Ochre (`#B45309`) on soft wheat tint (`#FEF3C7`)
   - Danger: Rich Terracotta (`#B91C1C`) on soft blush tint (`#FEE2E2`)
   - Info: Slate Marine (`#2563EB`) on soft mist tint (`#EFF6FF`)
5. **Purposeful Density**: Compact, information-rich tables, clear hierarchy, subtle 1px hairline borders, and gentle 150–200ms transitions.

---

## 2. Color Palette & Design Tokens

### CSS Variables Mapping (`globals.css`)

```css
:root {
  /* Surface & Background */
  --bg-app: #F9F8F5;          /* Warm Beige / Canvas */
  --bg-surface: #FFFFFF;      /* Clean White Card / Row Surface */
  --bg-surface-subtle: #F3EFE7; /* Recessed Panel / Table Header */
  --bg-surface-elevated: #FFFFFF; /* Modals / Flyouts */

  /* Borders & Dividers */
  --border-subtle: #ECE7DE;   /* Internal separators */
  --border-strong: #D9D2C4;   /* Card boundaries / Input borders */
  --border-focus: #8D5B28;    /* Keyboard focus ring / Active state */

  /* Typography */
  --text-primary: #1C1B18;    /* High contrast primary text */
  --text-secondary: #5C5850;  /* Supporting labels / Descriptions */
  --text-muted: #8C867B;      /* Timestamps / Placeholders */
  --text-inverse: #FFFFFF;    /* Text on dark buttons */

  /* Brand / Primary Actions */
  --primary: #8D5B28;         /* Warm Cognac / Bronze */
  --primary-hover: #75491C;   /* Deep Bronze */
  --primary-light: #F6EDE3;   /* Light Bronze Wash */
  --primary-text: #FFFFFF;

  /* Status Colors */
  --success: #246E47;
  --success-bg: #EEF7F2;
  --success-border: #C6E7D2;

  --warning: #B45309;
  --warning-bg: #FFFBEB;
  --warning-border: #FDE68A;

  --danger: #B91C1C;
  --danger-bg: #FEF2F2;
  --danger-border: #FECACA;

  --info: #1D4ED8;
  --info-bg: #EFF6FF;
  --info-border: #BFDBFE;

  /* Shadows */
  --shadow-subtle: 0 1px 2px 0 rgba(28, 27, 24, 0.04);
  --shadow-card: 0 1px 3px 0 rgba(28, 27, 24, 0.05), 0 1px 2px -1px rgba(28, 27, 24, 0.05);
  --shadow-elevated: 0 4px 6px -1px rgba(28, 27, 24, 0.07), 0 2px 4px -2px rgba(28, 27, 24, 0.05);
  --shadow-modal: 0 10px 15px -3px rgba(28, 27, 24, 0.08), 0 4px 6px -4px rgba(28, 27, 24, 0.04);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

---

## 3. Typography Hierarchy

| Style | Font | Size / Line Height | Weight | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| **Display** | Plus Jakarta Sans / Inter | 36px / 44px | 700 Bold | -0.02em | Hero headers, Landing page primary |
| **Heading 1** | Plus Jakarta Sans / Inter | 24px / 32px | 600 SemiBold | -0.015em | Top-level page headers (Dashboard, Leads) |
| **Heading 2** | Plus Jakarta Sans / Inter | 18px / 26px | 600 SemiBold | -0.01em | Card headers, Section dividers, Drawer titles |
| **Heading 3** | Plus Jakarta Sans / Inter | 15px / 22px | 600 SemiBold | -0.005em | Subsections, Modal headlines |
| **Body Default** | Inter / System | 14px / 20px | 400 Regular | 0 | Primary body, Table cells, Form inputs |
| **Body Medium** | Inter / System | 14px / 20px | 500 Medium | 0 | Table header labels, Form labels, Navigation items |
| **Small / Caption** | Inter / System | 12px / 16px | 400 Regular | +0.01em | Timestamps, Secondary metadata, Helper text |
| **Badge / Micro** | Inter / System | 11px / 14px | 600 SemiBold | +0.02em | Status chips, Priority tags, Lead score |

---

## 4. Component Standards

### Buttons

- **Primary**: Solid warm bronze (`#8D5B28`), white text, subtle shadow, 8px radius. Hover: `#75491C`.
- **Secondary / Outline**: Warm sand border (`#D9D2C4`), white surface, dark charcoal text. Hover: `#F3EFE7`.
- **Ghost**: Transparent background, warm charcoal text. Hover: `#ECE7DE`.
- **Destructive**: Deep terracotta red (`#B91C1C`), white text or red outline with `#FEF2F2` hover.
- **Sizes**:
  - Small: `h-8 px-2.5 text-xs`
  - Medium: `h-9 px-3.5 text-sm`
  - Large: `h-11 px-5 text-base`

### Form Inputs

- 1px hairline border in `#D9D2C4`.
- Background `#FFFFFF` (or `#FAF8F5` when subtle).
- Focus ring: `outline: 2px solid #8D5B28` with 2px offset.
- Floating error labels in `#B91C1C` with descriptive error messages.

### Data Tables

- Header: `#F3EFE7` background, uppercase tracking, 12px font weight 600 in `#5C5850`.
- Rows: `#FFFFFF` default, hover state `#F9F8F5`.
- Dense padding: `py-3 px-4`.
- Clear sorting indicators, checkbox selection, and responsive horizontal overflow wrapping.

### Badges & Status Chips

- **Lead Status**:
  - `NEW`: Sky Blue (`#0284C7` on `#F0F9FF`)
  - `QUALIFYING`: Amber Indigo (`#6366F1` on `#EEF2FF`)
  - `QUALIFIED`: Forest Green (`#15803D` on `#F0FDF4`)
  - `CONTACTED`: Teal (`#0F766E` on `#F0FDFA`)
  - `MEETING_BOOKED`: Purple (`#7E22CE` on `#FAF5FF`)
  - `PROPOSAL`: Warm Bronze (`#8D5B28` on `#FDF4EC`)
  - `WON`: Emerald (`#047857` on `#ECFDF5`)
  - `LOST`: Rose Gray (`#64748B` on `#F8FAFC`)
- **Priority**:
  - `HIGH`: Fire Red chip (`#DC2626` on `#FEF2F2`)
  - `MEDIUM`: Ochre Amber chip (`#D97706` on `#FFFBEB`)
  - `LOW`: Muted Slate chip (`#4B5563` on `#F3F4F6`)
- **Automation Status**:
  - `SUCCESS`: Green dot + badge (`#246E47`)
  - `PENDING`: Gray pulse dot
  - `RUNNING`: Blue spinner dot
  - `PARTIAL`: Yellow triangle
  - `FAILED`: Red alert dot
  - `RETRYING`: Orange cycling icon

---

## 5. Animation & Interaction Tokens

- **Micro-transitions**: `transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Drawer / Modal enter**: `cubic-bezier(0.16, 1, 0.3, 1)` slide / fade in 200ms
- **No excessive bouncing or distracting parallax**. Professional enterprise restraint.

---

## 6. Accessibility & Keyboard Navigation (WCAG AA+)

- Contrast ratio between `#1C1B18` and `#F9F8F5` is **13.8:1** (Far above the 4.5:1 requirement).
- Visible focus rings on all interactive elements (`:focus-visible`).
- Standard ARIA attributes on modals (`role="dialog"`), drawers, and screen-reader accessible stat counters.
- Skeletons displayed during fetch states; empty states provided with actionable Next Steps.
