# Motion

## Motion

M3E primarily applies the [Material Design 3 easing and duration](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration) system to provide consistent, emotionally tuned transitions across components. A subset—including buttons, loading indicators, and switches—have adopted the [Material Design 3 motion physics system](https://m3.material.io/styles/motion/overview/how-it-works), bringing spring-based dynamics and velocity-aware responsiveness to components where expressive motion is essential.

### Design tokens

The [Material Design 3 design tokens](https://m3.material.io/foundations/design-tokens/overview) are implemented as custom CSS properties. Design tokens are named, platform-agnostic variables that represent visual design decisions—such as color, typography, spacing, and elevation—in a reusable, consistent format.

Motion tokens are surfaced using the standardized prefix `--md-sys-motion-*` and are defaulted to spec-aligned values. M3E provides the [Theme](../components/theme.html) component which can be used to systematically control whether **standard** or **expressive** motion schemes are used through its `motion` attribute.

### Reduced motion

M3E honors reduced motion system settings by dynamically disabling or simplifying transitions for users who prefer minimal motion. Components respond to the `prefers-reduced-motion` media query, ensuring that expressive motion never compromises comfort or accessibility.

---
_Source: [`docs/styles/motion.html`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/docs/styles/motion.html) · `matraic/m3e` @ `c89173f`._
