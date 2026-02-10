Review the component or page specified in $ARGUMENTS and enhance its UI/UX quality.

## Enhancement Checklist

### 1. Visual Polish
- Consistent spacing using Tailwind's spacing scale (4, 6, 8, 12, 16)
- Proper typography hierarchy (text-sm, text-base, text-lg, text-xl, text-2xl)
- Color consistency using the project's design tokens
- Proper shadows, borders, and rounded corners
- Smooth transitions and hover states (transition-all duration-200)

### 2. Responsive Design
- Mobile-first: design for 375px width first
- Tablet: md: breakpoint (768px)
- Desktop: lg: breakpoint (1024px)
- Test that nothing breaks or overlaps at each breakpoint
- Stack columns on mobile, side-by-side on desktop

### 3. Loading States
Every component that fetches data MUST have:
- Skeleton loader (not just a spinner) matching the content shape
- Smooth transition from skeleton → content
- Use shadcn/ui Skeleton component

### 4. Error States
- Friendly error messages (not raw error strings)
- Retry button where appropriate
- Fallback UI that doesn't break layout

### 5. Empty States
- Helpful illustration or icon
- Clear message about what goes here
- Call-to-action to populate (e.g., "Earn your first reward!")

### 6. Accessibility
- All interactive elements focusable via keyboard
- ARIA labels on icon-only buttons
- Sufficient color contrast (4.5:1 minimum)
- Screen reader friendly content order

### 7. Animations (subtle)
- Page transitions with framer-motion or CSS
- Card hover effects
- Number counting animations for points/stats
- Progress bar animations for tier progress

### 8. Micro-interactions
- Button press feedback
- Toast notifications for actions
- Confetti or celebration for milestone achievements
- Pull-to-refresh on mobile

## After Enhancement
1. Run `npm run typecheck` and `npm run build` to verify
2. Check responsive design at 375px, 768px, and 1024px
3. Test keyboard navigation
4. Update TASK.md with changes made
