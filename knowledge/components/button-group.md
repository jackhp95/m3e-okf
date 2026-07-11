---
type: concept
title: Button group
description: A set of related buttons presented together as a connected unit.
resource: https://m3.material.io/components/button-groups/overview
tags: [components, button-group, actions, expressive, m3e]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/button-groups/overview
    retrieved: 2026-07-11
    note: Button group as an M3 Expressive component for related actions.
---

A button group presents a set of related buttons together as one connected unit, signaling
that the actions belong to the same context. It is among the components Material 3 Expressive
introduced for organizing related actions.

## Anatomy

Two or more adjacent [buttons](/components/button), visually joined so they read as a group
rather than as scattered independent controls.

## Usage

Use a button group for actions that are peers and belong together — related operations on the
same object. Keep the group small. Where the intent is choosing among options rather than
triggering peer actions, a [segmented button](/components/segmented-button) (which carries
selection state) is the better fit; a button group triggers actions rather than holding a
selection.

## Accessibility

The group is exposed as a set of related controls, each with its own accessible name, and is
keyboard-navigable. Grouping does not merge the buttons into one target. See
[accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/button-group](/implementations/m3e-web/components/button-group).
