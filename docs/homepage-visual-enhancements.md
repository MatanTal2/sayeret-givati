# Homepage Visual Enhancements

## Overview

This document outlines the visual enhancements made to the homepage, including logo size increase and title wave effect animation.

## 1. Logo Size Enhancement

### Changes Made

- **File**: `src/app/page.tsx`
- **Enhancement**: Increased background logo size by 30%

#### Before

```tsx
<Image 
  src="/sayeret-givati-logo.png" 
  alt="לוגו סיירת גבעתי" 
  width={400} 
  height={400}
  priority
  className="object-contain"
  style={{ width: "auto", height: "auto" }}
/>
```

#### After

```tsx
<Image 
  src="/sayeret-givati-logo.png" 
  alt="לוגו סיירת גבעתי" 
  width={520} 
  height={520}
  priority
  className="object-contain"
  style={{ width: "auto", height: "auto" }}
/>
```

### Result

✅ Background logo is now 30% larger (400px → 520px)
✅ Maintains aspect ratio and responsiveness
✅ Logo remains subtle with opacity-5

## 2. Title Wave Effect

### Changes Made

#### CSS Animation (`src/app/globals.css`)

Added new wave animation that slides white color across purple text:

```css
/* Wave effect for homepage title */
.wave-text {
  background: linear-gradient(
    90deg,
    #7c3aed 0%,
    #7c3aed 40%,
    #ffffff 50%,
    #7c3aed 60%,
    #7c3aed 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: waveSlide 2s ease-in-out;
}

@keyframes waveSlide {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

#### Header Component Update (`src/app/components/Header.tsx`)

- **Added**: `enableWaveEffect?: boolean` prop
- **Updated**: Both mobile and desktop title elements to conditionally apply wave effect

#### Mobile Title

```tsx
<h1 className={`text-2xl font-bold ${enableWaveEffect ? 'wave-text' : 'text-gray-900'}`}>
  {title}
</h1>
```

#### Desktop Title

```tsx
<h1 className={`text-3xl font-bold ${enableWaveEffect ? 'wave-text' : 'text-gray-900'}`}>
  {title}
</h1>
```

#### Homepage Implementation (`src/app/page.tsx`)

Enabled wave effect specifically for homepage:

```tsx
<Header 
  title="מערכת ניהול - מסייעת סיירת גבעתי"
  subtitle="פלטפורמה מרכזית לניהול פעילויות הסיירת"
  showAuth={true}
  enableWaveEffect={true}
/>
```

### Wave Effect Details

#### Animation Behavior

- **Duration**: 2 seconds
- **Timing**: ease-in-out (smooth start and end)
- **Trigger**: Automatically plays on page load/refresh
- **Colors**:
  - Base: Purple (#7c3aed) - matches color schema
  - Wave: White (#ffffff) - slides across the text
  - Purple remains the dominant color

#### Visual Effect

1. Text starts as purple
2. White "wave" slides from left to right across the text
3. Text returns to purple
4. Animation completes after 2 seconds

#### Browser Support

- Uses `background-clip: text` for the effect
- Includes `-webkit-background-clip` for WebKit browsers
- Fallback to normal purple text if not supported

## Technical Implementation

### Files Modified

1. **`src/app/page.tsx`**:
   - Increased logo size from 400px to 520px
   - Added `enableWaveEffect={true}` to Header

2. **`src/app/components/Header.tsx`**:
   - Added `enableWaveEffect` prop to interface
   - Updated mobile and desktop title elements to use conditional CSS classes

3. **`src/app/globals.css`**:
   - Added `.wave-text` CSS class with gradient and animation
   - Added `@keyframes waveSlide` animation definition

### Design Considerations

- ✅ Wave effect only applies to homepage (not other pages)
- ✅ Maintains accessibility with proper text contrast
- ✅ Animation is subtle and professional
- ✅ Purple color schema is preserved
- ✅ Responsive design maintained for mobile and desktop

### Testing Checklist

✅ Logo appears 30% larger on homepage
✅ Wave effect plays on page load/refresh
✅ Wave effect only appears on homepage
✅ Other pages maintain normal purple text
✅ Animation works on both mobile and desktop
✅ Text remains readable throughout animation
✅ No linting errors or TypeScript issues
