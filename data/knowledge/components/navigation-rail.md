---
type: concept
title: Navigation rail
description: A vertical strip of top-level destinations along the leading edge, for medium-width screens.
resource: https://m3.material.io/components/navigation-rail/overview
tags: [components, navigation-rail, navigation, medium, destinations]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/navigation-rail/overview
    retrieved: 2026-07-11
    note: Navigation rail anatomy.
  - url: https://m3.material.io/components/navigation-rail/guidelines
    retrieved: 2026-07-11
    note: Medium-width usage.
---

A navigation rail is a compact vertical strip of top-level destinations along the leading
edge of the screen, suited to **medium** width (small tablets, foldables). It keeps primary
destinations reachable without consuming a full column.

## Anatomy

A narrow vertical column of destinations, each an icon with a short label, the current one
marked active. It may also anchor a leading action such as a [FAB](/components/fab).

## Usage

Use a navigation rail as the medium-width form of top-level navigation, presenting the same
destinations a [navigation bar](/components/navigation-bar) shows at compact width and a
drawer shows when expanded. See [navigation](/patterns/navigation). Keep destinations and
order consistent across the size-class transitions.

## Accessibility

The rail is exposed as navigation, the current destination is announced and signaled beyond
color, and destinations are keyboard-reachable with accessible names. See
[accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/nav-rail](/implementations/m3e-web/components/nav-rail).
