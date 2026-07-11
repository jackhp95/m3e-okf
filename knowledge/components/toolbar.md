---
type: concept
title: Toolbar
description: A grouped set of actions relevant to the current content, often floating near it.
resource: https://m3.material.io/components/toolbars/overview
tags: [components, toolbar, actions, expressive, m3e]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/toolbars/overview
    retrieved: 2026-07-11
    note: Toolbar as an M3 Expressive component grouping contextual actions.
---

A toolbar groups a set of actions relevant to the current content into one compact surface,
often floating near the content it acts on. It is one of the components Material 3 Expressive
brings forward for surfacing contextual actions.

## Anatomy

A container holding a row of action controls — typically [icon buttons](/components/icon-button),
sometimes with a labeled button among them — grouped as a unit and positioned near the content
they affect.

## Usage

Use a toolbar to collect the handful of actions that apply to the current context — editing
controls over a canvas, actions for a selection. Keep it to the most relevant actions and send
the rest to an overflow [menu](/components/menu). Distinguish a floating contextual toolbar from
a persistent [app bar](/components/app-bar), which orients the whole screen rather than acting
on specific content.

## Accessibility

The toolbar is exposed as a group of controls; each action has an accessible name; the group
is keyboard-navigable and its position does not obscure the content it acts on. See
[accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/toolbar](/implementations/m3e-web/components/toolbar).
