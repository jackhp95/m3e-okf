---
type: concept
title: Paginator
description: A control for moving through a large data set one page at a time.
resource: https://m3.material.io/foundations/layout/understanding-layout/overview
tags: [components, paginator, pagination, data, navigation]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/foundations/layout/understanding-layout/overview
    retrieved: 2026-07-11
    note: Managing large amounts of content in a layout.
---

A paginator lets the user move through a large data set one page at a time, rather than
loading everything at once. It suits tables and result sets where the total is large and users
navigate by page.

## Anatomy

Controls for previous and next (and often first/last or numbered pages), usually with the
current range and total, and sometimes a page-size selector.

## Usage

Use a paginator for large, tabular, or result-oriented data where page-by-page navigation is
natural and the user benefits from knowing the total. For continuous browsing of homogeneous
content, incremental loading in a [feed](/patterns/feed) may fit better than discrete pages.
Show the current position and total so the user is not lost.

## Accessibility

The current page and total are exposed to assistive technology; previous/next and page
controls have clear accessible names and disabled states at the boundaries; controls are
keyboard-operable. See [accessibility](/foundations/accessibility).

For the technology-specific API, see
[/implementations/m3e-web/components/paginator](/implementations/m3e-web/components/paginator).
