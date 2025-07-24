# 🎨 Style Guide - Sayeret Givati Management System

## Design Philosophy

This project follows a **clean, military-inspired design** with Hebrew RTL support, focusing on usability and accessibility for field operations.

---

## 🎯 Core Design Principles

### 1. **Simplicity First**

- Clean, uncluttered interfaces
- Essential information prioritized
- Minimal cognitive load for users in field conditions

### 2. **Accessibility & Usability**

- High contrast ratios for outdoor visibility
- Large touch targets for mobile use
- Clear visual hierarchy
- Screen reader compatible

### 3. **Military Professionalism**

- Serious, professional appearance
- Consistent with IDF visual standards
- Appropriate color schemes
- Official branding integration

---

## 🎨 Color Palette

### Primary Colors

```css
--purple-600: #9333ea    /* Primary action color */
--purple-700: #7c3aed    /* Primary hover state */
--purple-500: #a855f7    /* Accent elements */
```

### Functional Colors

```css
--green-600: #16a34a     /* Success/Available states */
--red-600: #dc2626       /* Error/Danger states */
--gray-600: #4b5563      /* Disabled/Inactive states */
--gray-200: #e5e7eb      /* Background for unavailable items */
```

### Semantic Usage

- **Purple**: Primary actions, links, active states
- **Green**: Available features, success messages
- **Red**: Errors, warnings, critical actions
- **Gray**: Disabled states, placeholder content

---

## 🏗️ Component Standards

### FeatureCard Component

```tsx
// ✅ CORRECT - Simple and clean
<div className={`
  relative p-8 rounded-2xl shadow-lg transition-all duration-300 h-48
  ${available 
    ? `${color} hover:shadow-xl hover:scale-105 cursor-pointer text-white` 
    : 'bg-gray-200 cursor-not-allowed text-gray-500'
  }
`}>
```

**Key Requirements:**

- Fixed height: `h-48` for consistency
- Smooth hover effects: `hover:shadow-xl hover:scale-105`
- Clear available/unavailable states
- No authentication buttons or complex logic

### Header Component

```tsx
// Standard header layout
<header className="bg-white shadow-sm border-b border-gray-200 mb-6">
  <div className="max-w-6xl mx-auto px-4 py-4">
    <div className="flex items-center gap-4">
      {/* Logo + Title + Navigation */}
    </div>
  </div>
</header>
```

### Button Styles

```css
/* Primary Button */
.btn-primary {
  @apply px-6 py-3 bg-purple-600 text-white rounded-md 
         hover:bg-purple-700 transition-colors font-medium
         focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
}

/* Secondary Button */
.btn-secondary {
  @apply px-4 py-2 text-purple-600 hover:text-purple-800 
         font-medium transition-colors;
}
```

---

## 📏 Spacing & Layout

### Container Widths

- **Main content**: `max-w-6xl mx-auto`
- **Form containers**: `max-w-2xl mx-auto`
- **Card grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Padding Standards

- **Page padding**: `px-4 sm:px-6 lg:px-8`
- **Component padding**: `p-6` or `p-8`
- **Button padding**: `px-4 py-2` (small), `px-6 py-3` (regular)

### Gaps & Margins

- **Grid gaps**: `gap-6`
- **Section margins**: `mb-12`
- **Component margins**: `mb-6`

---

## 🔤 Typography

### Font Hierarchy

```css
/* Main Headers */
h1: text-3xl md:text-4xl font-bold text-gray-900
h2: text-2xl font-semibold text-gray-900  
h3: text-xl font-bold

/* Body Text */
body: text-base text-gray-600
small: text-sm text-gray-500
```

### RTL (Right-to-Left) Support

- Always use `dir="rtl"` on main containers
- Text alignment: `text-right` for Hebrew content
- Icon positioning: Consider RTL layout in flexbox

---

## 🎭 Animation Standards

### Hover Effects

```css
/* Card Hover */
.feature-card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.feature-card-hover:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

/* Button Press */
.btn-press:active {
  transform: scale(0.98);
}
```

### Entry Animations

```css
/* Fade in content */
.fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Staggered animations */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
```

---

## 🖼️ Image & Icon Standards

### Logo Usage

```tsx
<Image 
  src="/sayeret-givati-logo.png" 
  alt="לוגו סיירת גבעתי" 
  width={80} 
  height={80}
  priority  // Always add for above-fold logos
  className="h-16 w-auto"
/>
```

### Icon Sizes

- **Large icons**: `text-4xl` (cards)
- **Medium icons**: `w-6 h-6` (buttons)
- **Small icons**: `w-4 h-4` (inline)

---

## 📱 Responsive Design

### Breakpoint Strategy

```css
/* Mobile First Approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Grid Patterns

```tsx
// Feature cards
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Two-column layout
className="grid grid-cols-1 lg:grid-cols-2 gap-8"
```

---

## ⚠️ Anti-Patterns (DON'T DO)

### ❌ Avoid Complex Authentication UI in Cards

```tsx
// BAD - Don't add login buttons to every card
{!available && requiresAuth && (
  <button onClick={onAuthRequired}>התחבר לגישה</button>
)}
```

### ❌ Avoid Inconsistent Spacing

```tsx
// BAD - Random padding values
className="p-3 mb-5 mt-7"

// GOOD - Consistent spacing scale
className="p-6 mb-6 mt-6"
```

### ❌ Avoid Breaking RTL Layout

```tsx
// BAD - Fixed left/right positions
className="absolute right-4"

// GOOD - Use start/end for RTL support
className="absolute start-4"
```

---

## 🔧 Implementation Guidelines

### 1. **Component Creation**

- Start with the simplest version
- Add complexity only when necessary
- Follow established patterns
- Test on mobile devices

### 2. **Color Usage**

- Stick to the defined palette
- Use semantic colors consistently
- Test contrast ratios (WCAG AA)
- Consider colorblind accessibility

### 3. **Animation Implementation**

- Use CSS transitions over JavaScript
- Keep animations under 300ms
- Test performance on slower devices
- Provide reduced motion options

### 4. **Testing Requirements**

- Test RTL layout thoroughly
- Verify mobile responsiveness
- Check keyboard navigation
- Validate Hebrew text rendering

---

## 📋 Checklist for New Features

- [ ] Follows established color palette
- [ ] Uses consistent spacing scale
- [ ] Implements proper hover states
- [ ] Supports RTL layout
- [ ] Works on mobile devices
- [ ] Maintains visual hierarchy
- [ ] Includes focus states for accessibility
- [ ] Uses semantic HTML elements
- [ ] Follows naming conventions
- [ ] Tested with Hebrew content

### FeatureCard Structure & Proportions

- **Width:** `w-80` (`320px`) on desktop, `w-full` on mobile
- **Height:** `h-48` (`192px`)
- **Icon:** Top or left, size `text-4xl` (`~25%` of card height)
- **Title:** Large, bold, high-contrast (`text-xl font-bold`)
- **Subtitle/Description:** Smaller, muted (`text-base text-gray-500`)
- **Padding:** `p-8`
- **Shadow/Rounded:** `shadow-lg rounded-2xl`
- **Interactive:** `hover:scale-105 hover:shadow-xl transition`

**Example:**

```tsx
<div className="w-80 h-48 p-8 rounded-2xl shadow-lg bg-purple-600 text-white flex flex-col justify-between hover:scale-105 hover:shadow-xl transition cursor-pointer">
  <div className="flex items-center gap-4">
    <Icon className="text-4xl" />
    <div>
      <h3 className="text-xl font-bold">כותרת</h3>
      <p className="text-base text-gray-200">תיאור קצר</p>
    </div>
  </div>
</div>

---

*This style guide should be referenced for all new feature development to maintain consistency and quality across the Sayeret Givati Management System.*
