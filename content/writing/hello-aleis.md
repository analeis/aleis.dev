---
title: Hello, aleis
date: 2026-10-25
tags: ["meta", "hugo"]
summary: A first post to check that the new build works.
---

This is the first post on the new site. It is here so the list page, tag filter
and feed have something to work with.

## Why static?

The old setup needed a Go server for two live widgets and Emacs to publish
posts. Now Hugo builds plain HTML, CSS and JavaScript, and a CDN serves the
files.

- Posts are Markdown.
- The header and footer live in one place.
- Hosting is a folder of files.

## Type test

You can use **bold**, _italic_, `inline code` and [links](https://gohugo.io/).
Code blocks look like this:

```bash
hugo new content writing/another-post.md
hugo server --disableFastRender
hugo --minify
```
