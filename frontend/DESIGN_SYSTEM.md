# NIRIKSHA Design System

## Brand Identity
**AI-Powered Inspection Intelligence Platform**

### Design Philosophy
- **Futuristic yet trustworthy**: AI-first with government/enterprise credibility
- **Premium SaaS aesthetic**: Inspired by Stripe, Linear, Vercel, Notion
- **Human-in-control**: AI augments, doesn't replace human judgment
- **Explainable AI**: Transparent reasoning and confidence scores

---

## Color Palette

### Primary Colors
```css
/* Deep Navy - Trust, Authority */
--navy-50: #f0f4ff
--navy-100: #e0e9ff
--navy-200: #c7d7fe
--navy-300: #a4b9fc
--navy-400: #8191ed
--navy-500: #5e6ad6
--navy-600: #4b52bf
--navy-700: #3d42a3
--navy-800: #33368a
--navy-900: #2a2c70
--navy-950: #1a1c3e

/* Electric Blue - AI, Intelligence */
--blue-50: #eff6ff
--blue-100: #dbeafe
--blue-200: #bfdbfe
--blue-300: #93c5fd
--blue-400: #60a5fa
--blue-500: #3b82f6
--blue-600: #2563eb
--blue-700: #1d4ed8
--blue-800: #1e40af
--blue-900: #1e3a8a
--blue-950: #172554

/* Indigo - Innovation, Premium */
--indigo-50: #eef2ff
--indigo-100: #e0e7ff
--indigo-200: #c7d2fe
--indigo-300: #a5b4fc
--indigo-400: #818cf8
--indigo-500: #6366f1
--indigo-600: #4f46e5
--indigo-700: #4338ca
--indigo-800: #3730a3
--indigo-900: #312e81
--indigo-950: #1e1b4b
```

### Accent Colors
```css
/* Cyan - AI, Technology */
--cyan-50: #ecfeff
--cyan-100: #cffafe
--cyan-200: #a5f3fc
--cyan-300: #67e8f9
--cyan-400: #22d3ee
--cyan-500: #06b6d4
--cyan-600: #0891b2
--cyan-700: #0e7490
--cyan-800: #155e75
--cyan-900: #164e63

/* Purple - Intelligence, Wisdom */
--purple-50: #faf5ff
--purple-100: #f3e8ff
--purple-200: #e9d5ff
--purple-300: #d8b4fe
--purple-400: #c084fc
--purple-500: #a855f7
--purple-600: #9333ea
--purple-700: #7e22ce
--purple-800: #6b21a8
--purple-900: #581c87

/* Emerald - Success, Compliance */
--emerald-50: #ecfdf5
--emerald-100: #d1fae5
--emerald-200: #a7f3d0
--emerald-300: #6ee7b7
--emerald-400: #34d399
--emerald-500: #10b981
--emerald-600: #059669
--emerald-700: #047857
--emerald-800: #065f46
--emerald-900: #064e3b
```

### Semantic Colors
```css
/* Risk Levels */
--risk-critical: #ef4444
--risk-high: #f97316
--risk-medium: #eab308
--risk-low: #22c55e

/* Status */
--status-success: #10b981
--status-warning: #f59e0b
--status-error: #ef4444
--status-info: #3b82f6
--status-neutral: #6b7280
```

### Neutral Colors
```css
/* Slate - Professional, Clean */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-300: #cbd5e1
--slate-400: #94a3b8
--slate-500: #64748b
--slate-600: #475569
--slate-700: #334155
--slate-800: #1e293b
--slate-900: #0f172a
--slate-950: #020617
```

---

## Typography

### Font Family
```css
/* Primary */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

/* Monospace for code/data */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

### Type Scale
```css
/* Display */
--text-display-1: 64px / 72px / -0.02em / 700
--text-display-2: 48px / 56px / -0.02em / 700
--text-display-3: 36px / 44px / -0.01em / 600

/* Headings */
--text-h1: 32px / 40px / -0.01em / 600
--text-h2: 24px / 32px / -0.01em / 600
--text-h3: 20px / 28px / -0.01em / 600
--text-h4: 18px / 24px / 0em / 600

/* Body */
--text-lg: 18px / 28px / 0em / 400
--text-base: 16px / 24px / 0em / 400
--text-sm: 14px / 20px / 0em / 400
--text-xs: 12px / 16px / 0em / 400

/* Labels */
--label-lg: 14px / 20px / 0em / 500
--label-base: 12px / 16px / 0em / 500
--label-sm: 11px / 16px / 0em / 500
```

---

## Spacing System

### Scale
```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

---

## Border Radius

```css
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 20px
--radius-3xl: 24px
--radius-full: 9999px
```

---

## Shadows

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)

/* Colored shadows for AI elements */
--shadow-blue: 0 10px 40px -10px rgba(59, 130, 246, 0.5)
--shadow-purple: 0 10px 40px -10px rgba(139, 92, 246, 0.5)
--shadow-cyan: 0 10px 40px -10px rgba(6, 182, 212, 0.5)
```

---

## Gradients

```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)
--gradient-subtle: linear-gradient(135deg, #f0f4ff 0%, #eef2ff 100%)

/* AI Gradients */
--gradient-ai: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)
--gradient-ai-subtle: linear-gradient(135deg, #ecfeff 0%, #eef2ff 50%, #faf5ff 100%)

/* Dark Mode Gradients */
--gradient-dark: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)
--gradient-dark-card: linear-gradient(135deg, #334155 0%, #1e293b 100%)
```

---

## Animation System

### Durations
```css
--duration-instant: 150ms
--duration-fast: 200ms
--duration-normal: 300ms
--duration-slow: 500ms
--duration-slower: 700ms
```

### Easing
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## Component Specifications

### Cards
- Border radius: 16px (lg) or 20px (xl)
- Padding: 24px
- Background: White (light), Slate-800 (dark)
- Border: 1px solid Slate-200 (light), Slate-700 (dark)
- Shadow: md (default), lg on hover

### Buttons
- Border radius: 8px (md) or 12px (lg)
- Padding: 12px 24px
- Font weight: 500
- Transition: all 200ms ease-out

### Inputs
- Border radius: 8px
- Padding: 12px 16px
- Border: 1px solid Slate-300
- Focus ring: 2px solid Navy-500

### Badges
- Border radius: 9999px
- Padding: 4px 12px
- Font size: 12px
- Font weight: 500

### Tables
- Border radius: 12px
- Header background: Slate-50 (light), Slate-800 (dark)
- Row hover: Slate-100 (light), Slate-700 (dark)
- Border: 1px solid Slate-200

---

## Dark Mode

### Background
- Primary: Slate-950 (#020617)
- Secondary: Slate-900 (#0f172a)
- Card: Slate-800 (#1e293b)
- Elevated: Slate-700 (#334155)

### Text
- Primary: Slate-50 (#f8fafc)
- Secondary: Slate-300 (#cbd5e1)
- Muted: Slate-400 (#94a3b8)

### Borders
- Default: Slate-700 (#334155)
- Subtle: Slate-800 (#1e293b)

---

## Accessibility

### Contrast Ratios
- WCAG AA: 4.5:1 (normal text), 3:1 (large text)
- WCAG AAA: 7:1 (normal text), 4.5:1 (large text)

### Focus States
- Outline: 2px solid Navy-500
- Offset: 2px
- Radius: 4px

### Touch Targets
- Minimum: 44px × 44px
- Preferred: 48px × 48px

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

---

## AI-Specific Design Elements

### Confidence Indicators
- High (90-100%): Emerald-500
- Medium (70-89%): Blue-500
- Low (50-69%): Yellow-500
- Very Low (<50%): Red-500

### Agent Cards
- Gradient borders
- Subtle glow effects
- Animated connections
- Status indicators

### Explainable AI
- Step-by-step visualization
- Confidence scores
- Reasoning chains
- Human approval gates
