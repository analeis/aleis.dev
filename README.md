# aleis.dev

A static personal site built with Hugo. **Two complete visual modes** share the same content and navigation:

- **Meadow** (dark): Pixel font, animated canvas meadow with interactive flowers, smoky rose/purple palette. Home, writing, meadow, friends, about.
- **Dacian** (light): Google Sans + Google Sans Code, CSS Grid card layouts, professional blue palette. Projects, software, same content rendered as cards.

Switching modes swaps the entire visual identity — fonts, layout, colors, interactions, easter eggs — while keeping content and structure identical.

## Requirements

- [Hugo extended](https://gohugo.io/installation/) 0.168 or newer
- [bun](https://bun.sh) for TypeScript compilation and dev commands

## Commands

```bash
bun dev              # build the bundle, watch TS, and preview Hugo
bun run build        # compile TS (minified) and write site to ./public
bun check            # type-check, format-check, and build with warnings as errors
bun fmt              # format supported source files with Bun
bun new my-post-title # add content/writing/my-post-title.md
bun clean            # remove build output and compiled JS
```

The commands are bun scripts in `package.json`; run them by hand if you do not want to install bun.

## Layout

```
content/
  _index.md              homepage front matter
  writing/_index.md      writing list
  writing/*.md           posts
  404.md                 not found page
  about.md
  friends.md
  made.md
  meadow.md              palette page (both modes)
  projects.md            card grid (dacian) / list (meadow), deck: projects
  software.md            card grid (dacian) / list (meadow), deck: software
data/cards.json          tiles for projects and software
data/navigation.json     shared destinations rendered per mode
package.json             bun scripts (replaces justfile)
tsconfig.json            TypeScript config
layouts/
  _default/baseof.html   shared shell (head, header, footer, scripts)
  _default/list.html     writing list and tag filter
  _default/page.html     generic page
  _default/cards.html    card grid page
  _default/meadow.html   palette page
  writing/page.html      post layout
  index.html             homepage
  partials/              head, header, footer and mode shells
  dacian-header.html     Dacian title-card shell
  dacian-directory.html  Dacian card-based navigation
  mode-picker.html       shared Meadow/Dacian radio group
  robots.txt             robots file with sitemap link
static/
  assets/                images, favicons, badges, posters and the pixel font
  css/base.css           shared styles
  css/meadow.css         meadow mode styles
  css/dacian.css         dacian mode styles
  js/index.js            single bundle (mode-specific code guarded internally)
  _headers               Cloudflare Pages headers
assets/js/               TypeScript sources (not in public/)
tools/generate-art.py    rebuilds the badge, OG image and palette posters
```

## Changing things

The site name, description, greeting, email and GitHub link live in `hugo.toml`. Page copy is in `content/`, and the project and software tiles are in `data/cards.json`.

The wordmark is pixel art built in `assets/js/meadow.ts` from the `G` glyph map. Recompile with `bun run ts` after editing any `.ts` file.

## Deploying to Cloudflare Pages

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, open **Workers & Pages**, choose **Create**, then **Pages**, then **Connect to Git**.
3. Pick the repository and use these settings:
   - Framework preset: **Hugo**
   - Build command: `bun run build`
   - Build output directory: `public`
   - Environment variable: `HUGO_VERSION = 0.168.0`
4. Add your domain under **Custom domains**. HTTPS is automatic.

`static/_headers` is copied into the build, so Cloudflare applies the cache and security headers.

## Mode System

- Mode is stored in `localStorage` (`site-mode`) and URL (`?mode=meadow|dacian`)
- The page mode is the fallback; system preference is only used if no mode exists
- Meadow keeps text navigation and a footer mode picker; Dacian uses a title card,
  card-based directory, and a premium card-styled mode picker
- One bundle contains shared code and mode-specific modules with lifecycle guards

`bunfig.toml` contains Bun formatter preferences. Hugo templates and Markdown
with Go-template syntax are excluded through `.prettierignore`, which is the
ignore file Bun's formatter supports; formatter exclusions cannot currently be
declared inside `[fmt]` in `bunfig.toml`.

## Upstream Attribution

- **Meadow mode** originated from [glocean.dev](https://github.com/gloceandotdev/glocean.dev) (MIT)
- **Dacian mode** originated from [dacian.co](https://github.com/dacixn/dacian.co) (MIT)
- Full credits in [CREDITS.md](CREDITS.md)
