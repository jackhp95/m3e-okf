---
type: concept
title: Dialog
description: A modal surface that interrupts for a decision or focused task, blocking the page behind it.
resource: https://m3.material.io/components/dialogs/overview
tags: [components, dialog, modal, surface]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/dialogs/overview
    retrieved: 2026-07-11
    note: Dialog anatomy and types.
  - url: https://m3.material.io/components/dialogs/guidelines
    retrieved: 2026-07-11
    note: When to use a dialog.
---

A dialog is a modal surface that appears over the page to ask for a decision or
host a short focused task. It blocks interaction with the content behind it until
the user acts, so it is reserved for moments that genuinely need to interrupt.

## Anatomy

A dialog is a raised container over a scrim, typically with a headline, body
content, and a row of actions. The scrim dims and blocks the page behind it.

## Usage

Use a dialog for a decision or a task the user must handle before continuing, and
keep it brief — a confirmation, a short form, a choice. Longer or less urgent
flows belong in a full view or a non-modal surface rather than a dialog.

## Accessibility

Opening a dialog moves focus into it and traps focus there while it is open;
closing returns focus to the control that launched it. The dialog is announced
with an accessible name, and dismissal (via a close action or the escape key)
stays available.

For the technology-specific API, see
[/implementations/m3e-web/components/dialog](/implementations/m3e-web/components/dialog).
