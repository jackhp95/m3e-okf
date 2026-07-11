---
type: concept
title: Tree
description: A hierarchical list whose nodes expand and collapse to reveal nested children.
resource: https://m3.material.io/components/lists/overview
tags: [components, tree, hierarchy, navigation, disclosure]
timestamp: 2026-07-11T00:00:00Z
diataxis: reference
sources:
  - url: https://m3.material.io/components/lists/overview
    retrieved: 2026-07-11
    note: List structures extended to nested hierarchy.
---

A tree presents hierarchical data as a nested list whose nodes expand and collapse to reveal or
hide their children — a file system, an outline, a category hierarchy. It lets a user explore
depth while keeping the overall structure scannable.

## Anatomy

Rows arranged by depth, each parent node carrying an expand/collapse affordance and, when open,
showing its children indented beneath it. Nodes may carry icons, labels, and actions.

## Usage

Use a tree when the data is genuinely hierarchical and users need to navigate levels while
keeping context. Keep indentation and expansion state clear. For flat data, a plain
[list](/components/list) is simpler; for moving up a known path, a
[breadcrumb](/components/breadcrumb) complements a tree.

## Accessibility

The structure is exposed as a tree, with each node's level, expanded/collapsed state, and
child count available to assistive technology; keyboard navigation moves between and within
levels and expands/collapses nodes; state is signaled beyond color. See
[color-only state signaling](/anti-patterns/color-only-state-signaling).

For the technology-specific API, see
[/implementations/m3e-web/components/tree](/implementations/m3e-web/components/tree).
