---
type: concept
title: Button
description: A labeled control that performs an action, in emphasis variants from filled to text.
resource: https://m3.material.io/components/buttons/overview
tags: [components, button, action, emphasis]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/buttons/overview
    retrieved: 2026-07-11
    note: Button variants and emphasis.
  - url: https://m3.material.io/components/buttons/guidelines
    retrieved: 2026-07-11
    note: Button usage and hierarchy.
---

A button is a labeled control the user activates to perform an action. Buttons
come in an emphasis ladder — from a filled button for the most prominent action
down through tonal, elevated, and outlined to a low-emphasis text button — so a
screen can rank its actions visually.

## Anatomy

A button is a text label, optionally with a leading icon, inside a shaped
container. The container carries the color and elevation that set the button's
emphasis level.

## Usage

Reserve the highest-emphasis variant for the primary action in a context and
step down for secondary ones; more than one high-emphasis button in the same area
flattens the hierarchy. Labels are short and action-oriented — they say what
happens.

## Accessibility

The visible label is the button's accessible name, so it does not need a separate
one. A button stays focusable and is activated by keyboard as well as pointer,
and its target keeps the minimum interactive size even when the label is short.

For the technology-specific API (tags, attributes, slots, events), see the
implementation card at [/implementations/m3e-web/components/button](/implementations/m3e-web/components/button).
