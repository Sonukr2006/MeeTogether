# Implementation Plan: Landing Page

## Overview

Implement a static marketing landing page for unauthenticated visitors at the root route `/`. The implementation follows this order: reusable primitives (GlassCard, LottieAnimation), section components (Hero, Bento, HowItWorks, Stats, Footer), the page orchestrator (LandingPage), the auth-gating route component (LandingOrHome), and finally router/layout integration. All components use React + Tailwind CSS with the existing dark theme.

## Tasks

- [x] 1. Create reusable primitive components
  - [x] 1.1 Create the GlassCard component
    - Create `client/src/components/Landing/GlassCard.jsx`
    - Implement a reusable card with glassmorphism styling: `backdrop-blur`, `bg-white/5` or `bg-white/10`, `border border-white/10`, rounded corners
    - Accept props: `title` (string), `children` (ReactNode), `className` (optional string)
    - Render the title as a heading inside the card when provided
    - _Requirements: 4.2_

  - [x] 1.2 Create the LottieAnimation wrapper component
    - Create `client/src/components/Landing/LottieAnimation.jsx`
    - Implement dynamic import of Lottie JSON files via the `animationPath` prop
    - Show the `fallback` prop content while loading or on error
    - Use `useState` for `animationData` and `hasError`, with a cleanup flag in the effect
    - Wrap the `lottie-react` `<Lottie>` component with `role="img"` and `aria-label` for accessibility
    - Accept props: `animationPath` (string), `fallback` (ReactNode), `className` (optional), `loop` (boolean, default true), `ariaLabel` (string)
    - _Requirements: 9.3, 10.3_

  - [ ]* 1.3 Write unit tests for GlassCard and LottieAnimation
    - Test GlassCard renders title and children
    - Test GlassCard applies custom className
    - Test LottieAnimation renders fallback when animation path fails to load
    - Test LottieAnimation applies aria-label
    - _Requirements: 4.2, 9.3, 10.3_

- [x] 2. Implement landing page sections
  - [x] 2.1 Create the HeroSection component
    - Create `client/src/components/Landing/HeroSection.jsx`
    - Render a full-viewport-height `<section>` with flexbox centering
    - Include an `<h1>` element with headline text (e.g., "Stop talking, start showing")
    - Include a sub-headline `<p>` explaining the platform value proposition
    - Include a CTA button using React Router `<Link to="/sign-in">` with text "Join Now"
    - Style CTA with vibrant indigo/purple (`bg-indigo-500 hover:bg-indigo-600`), min touch target 44x44px (`min-w-[44px] min-h-[44px]`)
    - Use dark theme backgrounds (`bg-[#020617]`) and ensure text contrast meets WCAG AA (4.5:1)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.5, 10.4_

  - [x] 2.2 Create the BentoSection component
    - Create `client/src/components/Landing/BentoSection.jsx`
    - Render a `<section>` containing exactly 3 GlassCard components (Student, Mentor, Recruiter)
    - Student card: title about task completion and Proof Resume, uses a LottieAnimation with a relevant animation file and static fallback
    - Mentor card: title about micro-mentorship, depicts mentor interaction, uses LottieAnimation
    - Recruiter card: tagline "Hire execution, not buzzwords", shows verified skills/Proof Score, uses LottieAnimation
    - Responsive grid: single column below 768px (`grid-cols-1`), multi-column at md+ (`md:grid-cols-3` or `md:grid-cols-2 lg:grid-cols-3`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.6_

  - [x] 2.3 Create the HowItWorksSection component
    - Create `client/src/components/Landing/HowItWorksSection.jsx`
    - Render a `<section>` with a heading and 3-4 sequential steps (e.g., Sign up → Join a project → Ship tasks → Build your Proof Resume)
    - Each step includes a numbered indicator or icon and a short descriptive label
    - Visually connect steps with lines, arrows, or a numbered sequence to show progression
    - Use Tailwind utilities for the connecting visuals (borders, pseudo-elements, or inline SVG)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.4 Create the StatsSection component
    - Create `client/src/components/Landing/StatsSection.jsx`
    - Render a `<section>` with at least 3 metric cards using GlassCard
    - Each metric displays a large numeric value (e.g., "500+", "120+", "1000+") and a descriptive label
    - Use glassmorphism styling consistent with BentoSection cards
    - Responsive: stack on mobile, row/grid on desktop
    - _Requirements: 6.1, 6.2, 6.3, 4.2_

  - [x] 2.5 Create the FooterSection component
    - Create `client/src/components/Landing/FooterSection.jsx`
    - Render a `<footer>` element with the MeeTogether logo and a brief tagline
    - Include navigation links grouped by category (Product, Company, Legal) using `<nav>` element
    - Include links to `/sign-in` and `/sign-up` using React Router `<Link>`
    - Maintain dark theme styling consistent with the page
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1_

  - [ ]* 2.6 Write unit tests for section components
    - Test HeroSection renders h1 element and CTA linking to /sign-in
    - Test BentoSection renders exactly 3 cards
    - Test HowItWorksSection renders all steps
    - Test StatsSection renders at least 3 metrics
    - Test FooterSection contains sign-in and sign-up links
    - Test FooterSection uses semantic footer and nav elements
    - _Requirements: 2.1, 2.6, 3.1, 5.1, 6.1, 7.3, 10.1_

- [x] 3. Checkpoint - Verify section components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Assemble the LandingPage and integrate routing
  - [x] 4.1 Create the LandingPage orchestrator component
    - Create `client/src/components/Landing/LandingPage.jsx`
    - Compose all sections in order: HeroSection, BentoSection, HowItWorksSection, StatsSection, FooterSection
    - Use semantic HTML structure: wrap hero in `<header>`, sections in `<main>`, footer as `<footer>`
    - Apply full-width layout (break out of App's constrained container) with dark background
    - Display the MeeTogether logo in the hero/header area
    - _Requirements: 4.1, 4.3, 4.4, 9.2, 10.1_

  - [x] 4.2 Create the LandingOrHome route component
    - Create `client/src/components/Landing/LandingOrHome.jsx`
    - Read `currentUser` and `initialized` from Redux auth state via `useSelector`
    - If `initialized === false`: render `null` (prevent content flash)
    - If `currentUser` exists and `emailVerified === false`: render `<Navigate to="/verify-email" replace />`
    - If `currentUser` exists and `emailVerified === true`: render the `<Home />` component
    - If `currentUser` is null: render the `<LandingPage />` component
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.3 Integrate LandingOrHome into the router configuration
    - In `client/src/main.jsx`, add lazy imports for `LandingOrHome`
    - Replace the current `/` path inside `RequireAuth` children with an `index: true` route at the top level of App's children using `LandingOrHome` wrapped in `withSuspense`
    - Keep all other RequireAuth routes intact (discussions, projects, etc.)
    - Ensure `GuestOnlyRoute` children (sign-in, sign-up) remain unchanged
    - _Requirements: 1.1, 1.2, 1.4, 9.1_

  - [x] 4.4 Modify App.jsx to conditionally hide Navbar for landing page
    - In `client/src/routes/App.jsx`, conditionally render the Navbar and `<main>` wrapper
    - When the current path is `/` and no authenticated user exists, hide the Navbar and remove max-width/padding constraints from the content area
    - Use Redux `useSelector` to read auth state for the conditional check
    - When authenticated or on other routes, keep the existing Navbar and constrained layout
    - _Requirements: 1.1, 4.1, 8.1_

  - [ ]* 4.5 Write unit tests for LandingOrHome auth gating
    - Test renders LandingPage when currentUser is null and initialized is true
    - Test renders Home when currentUser exists with emailVerified true
    - Test renders null/nothing when initialized is false
    - Test redirects to /verify-email when currentUser exists but emailVerified is false
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Responsive design and accessibility polish
  - [x] 5.1 Ensure responsive behavior across all breakpoints
    - Verify and adjust all section components for viewport widths 320px to 2560px
    - Ensure single-column layouts at < 768px with appropriate font sizes and spacing
    - Ensure multi-column layouts at ≥ 1024px for BentoSection and StatsSection
    - Confirm no horizontal scrollbar appears at any width (use `overflow-x-hidden` if needed on the page container)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.2 Ensure accessibility compliance
    - Verify all interactive elements (CTA button, footer links) are keyboard-focusable with visible focus indicators (`focus:ring-2 focus:ring-indigo-500`)
    - Add `alt` text or `aria-label` to all visual mockups, icons, and LottieAnimation instances
    - Confirm semantic HTML structure: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>` used appropriately
    - Verify heading hierarchy (single h1, appropriate h2/h3 for sections)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 5.3 Write integration tests for responsive and accessibility
    - Test bento cards stack vertically at < 768px viewport
    - Test all interactive elements have keyboard focus
    - Test semantic HTML elements are present (header, main, section, footer, nav)
    - Test CTA button has minimum 44x44px touch target
    - _Requirements: 8.2, 10.1, 10.2, 2.5_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- All components are static (no backend API calls needed)
- The existing `lottie-react` package is used for animations; ensure it's installed (`npm install lottie-react`)
- Lottie JSON animation files should be placed in `client/src/assets/animations/`
- The project already has several Lottie JSON files available that can be reused or replaced

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["2.2", "2.6"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3", "4.4"] },
    { "id": 6, "tasks": ["4.5", "5.1", "5.2"] },
    { "id": 7, "tasks": ["5.3"] }
  ]
}
```
