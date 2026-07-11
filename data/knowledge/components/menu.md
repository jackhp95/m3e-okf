---
type: concept
title: Menu
description: A temporary overlay of choices or actions anchored to the control that opened it.
resource: https://m3.material.io/components/menus/overview
tags: [components, menu, overlay, actions, accessibility]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/menus/overview
    retrieved: 2026-07-11
    note: Menu anatomy and behavior.
  - url: https://m3.material.io/components/menus/guidelines
    retrieved: 2026-07-11
    note: When to use a menu.
---

A menu is a temporary overlay listing a set of choices or actions, anchored to the control
that opened it. It appears on demand, over the content, and dismisses after a choice or on
outside interaction.

## Anatomy

An overlay list of items anchored to a trigger; items can carry leading icons, trailing
hints, dividers, and submenus. It floats above the surface and closes when a choice is made
or focus leaves.

## Usage

Use a menu to offer a set of actions or options without permanently spending screen space,
such as an overflow menu of secondary actions. For choosing a single value that reflects
into a field, a [select](/components/select) is the menu-based form control. Do not hide the
primary action of a screen inside a menu.

## Accessibility

Opening the menu moves focus into it; arrow keys move between items, escape closes it, and
focus returns to the trigger on close. The trigger exposes its expanded/collapsed state, and
each item has an accessible name. See [accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/menu](/implementations/m3e-web/components/menu).
