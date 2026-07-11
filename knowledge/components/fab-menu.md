---
type: concept
title: FAB menu
description: A floating action button that expands into a set of related primary actions.
resource: https://m3.material.io/components/floating-action-button/overview
tags: [components, fab-menu, fab, actions, expressive]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/floating-action-button/guidelines
    retrieved: 2026-07-11
    note: A FAB that expands into related actions.
---

A FAB menu is a [floating action button](/components/fab) that expands to reveal a small set
of related primary actions, then collapses again. It answers the case where a screen has a few
closely-related creation actions rather than a single one — without resorting to multiple
free-floating FABs.

## Anatomy

A primary FAB that, when activated, expands into a cluster of labeled action items; activating
one performs the action and collapses the menu.

## Usage

Use a FAB menu when several creation actions are peers and belong under one prominent entry
point. If the screen truly has a single dominant action, a plain FAB is clearer. Do not scatter
multiple standalone FABs across a screen — that flattens the primary-action hierarchy; see
[FAB for non-primary actions](/anti-patterns/fab-for-non-primary-actions).

## Accessibility

The trigger reports its expanded/collapsed state; expanding moves focus into the action set;
each action has an accessible name; escape or an outside interaction collapses the menu and
returns focus to the trigger. See [accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/fab-menu](/implementations/m3e-web/components/fab-menu).
