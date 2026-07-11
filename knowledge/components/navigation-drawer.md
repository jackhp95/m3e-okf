---
type: concept
title: Navigation drawer
description: A side panel of destinations, permanent on wide screens or modal on demand, for larger destination sets.
resource: https://m3.material.io/components/navigation-drawer/overview
tags: [components, navigation-drawer, navigation, expanded, destinations]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/navigation-drawer/overview
    retrieved: 2026-07-11
    note: Standard and modal drawers.
  - url: https://m3.material.io/components/navigation-drawer/guidelines
    retrieved: 2026-07-11
    note: When a drawer fits.
---

A navigation drawer is a side panel listing top-level destinations with labels. It suits
**expanded** width, or any width where there are more destinations than a bar or rail holds
comfortably. It can be **standard** (permanently visible on wide screens) or **modal**
(sliding in over a scrim on demand).

## Anatomy

A vertical panel of labeled destinations, optionally grouped with dividers and headings, the
current destination marked active. A modal drawer includes a scrim and a dismiss affordance.

## Usage

Use a drawer when the destination set is larger than a [navigation bar](/components/navigation-bar)
or [rail](/components/navigation-rail) should carry, or on expanded layouts where a persistent
panel fits. On smaller screens, prefer a modal drawer so it does not permanently consume a
column. See [navigation](/patterns/navigation).

## Accessibility

The drawer is exposed as navigation with the current destination announced and signaled beyond
color. A modal drawer traps focus while open, closes on escape, and returns focus to its
trigger. See [accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/drawer-container](/implementations/m3e-web/components/drawer-container).
