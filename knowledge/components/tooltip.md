---
type: concept
title: Tooltip
description: A small transient label that identifies or explains an element on hover or focus.
resource: https://m3.material.io/components/tooltips/overview
tags: [components, tooltip, hover, focus, accessibility]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/tooltips/overview
    retrieved: 2026-07-11
    note: Plain and rich tooltip types.
  - url: https://m3.material.io/components/tooltips/guidelines
    retrieved: 2026-07-11
    note: When to use a tooltip and how it appears.
---

A tooltip is a small, transient label that appears on hover or focus to identify or briefly
explain an element — most often an icon-only control. It supplements a control; it does not
replace an accessible name.

## Anatomy

A short text bubble anchored to its target. A plain tooltip is a single line; a richer
variant can carry a small block of text and, sometimes, an action.

## Usage

Use a tooltip to name or clarify a control whose purpose might not be obvious, especially
[icon buttons](/components/icon-button). Keep it short. Do not hide essential information
only in a tooltip, since it is not persistently visible and can be hard to reach on touch.

## Accessibility

A tooltip appears on **both** hover and keyboard focus, not hover alone, and stays visible
long enough to read. It supplements — never substitutes for — the control's accessible
name; an icon button still needs its own name even with a tooltip. See
[accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/tooltip](/implementations/m3e-web/components/tooltip).
