---
type: concept
title: Progress indicator
description: A linear or circular indicator showing that a process is underway, determinate or indeterminate.
resource: https://m3.material.io/components/progress-indicators/overview
tags: [components, progress, loading, determinate, indeterminate]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/progress-indicators/overview
    retrieved: 2026-07-11
    note: Linear and circular progress indicators.
  - url: https://m3.material.io/components/progress-indicators/guidelines
    retrieved: 2026-07-11
    note: Determinate vs indeterminate usage.
---

A progress indicator shows that a process is running. It comes in **linear** (a bar) and
**circular** forms, and in **determinate** (a known fraction complete) and **indeterminate**
(unknown duration) modes.

## Anatomy

A track and an active portion that fills toward completion (determinate) or animates
continuously (indeterminate), in either a bar or a ring.

## Usage

Use a determinate indicator when progress is measurable, so the user can gauge how long is
left; use indeterminate when it is not. Place the indicator where the affected content is,
and remove it as soon as the process finishes. For brief waits an inline loading indicator
may fit better than a full progress bar.

## Accessibility

The indicator's state is exposed to assistive technology — for a determinate indicator, its
current value; for indeterminate, that a process is busy. Progress is not conveyed by
animation alone. See [accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/progress-indicator](/implementations/m3e-web/components/progress-indicator).
