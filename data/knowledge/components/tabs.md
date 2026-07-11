---
type: concept
title: Tabs
description: A row of peer views the user switches between, showing one panel at a time.
resource: https://m3.material.io/components/tabs/overview
tags: [components, tabs, navigation, sections, accessibility]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/tabs/overview
    retrieved: 2026-07-11
    note: Primary and secondary tabs.
  - url: https://m3.material.io/components/tabs/guidelines
    retrieved: 2026-07-11
    note: When to use tabs.
---

Tabs organize peer views at the same level of hierarchy, letting the user switch between
them while only one panel shows at a time. Material distinguishes primary tabs (top-level
sections) from secondary tabs (subsections within a section).

## Anatomy

A horizontal row of tab labels (with optional icons), one marked active, above the panel
whose content changes as the active tab changes. Tabs may scroll horizontally when there are
many.

## Usage

Use tabs for a small set of parallel sections the user moves between within one screen. Keep
labels short. Tabs are for peer content, not for a sequence of steps — a
[stepper](/components/stepper) fits an ordered flow — and not for top-level app destinations,
which belong to [navigation](/patterns/navigation).

## Accessibility

The tabs are exposed as a tab set with the selected tab announced; the active state is
signaled beyond color. Arrow keys move between tabs and the active tab controls which panel
is shown to assistive technology. See
[color-only state signaling](/anti-patterns/color-only-state-signaling).

For the technology-specific API, see
[/implementations/m3e-web/components/tabs](/implementations/m3e-web/components/tabs).
