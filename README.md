# aleis.dev

A static personal site built with Hugo. Two looks share the same header,
footer and stylesheet:

- **Meadow**: dark rose, pixel font, animated flowers. Home, writing, meadow,
  friends and about.
- **Cards**: light blue grid. Projects and software, carried over from an old
  Go/htmx portfolio.

The site is plain HTML, CSS and a little JavaScript. Hugo builds it, and
nothing runs on a server.

## Requirements

- [Hugo extended](https://gohugo.io/installation/) 0.168 or newer
- [just](https://github.com/casey/just) if you want the short commands below

## Commands

```bash
just dev                 # preview at http://localhost:1313
just build               # write the site to ./public
just check               # build with warnings treated as errors
just new my-post-title   # add content/writing/my-post-title.md
just clean               # remove build output
```

The justfile is five shell commands. Run them by hand if you do not want to
install just.

## Layout

```
content/
  _index.md              homepage front matter
  writing/_index.md      writing list
  writing/*.md           posts
  404.md                 not found page
  about.md
  made.md
  friends.md
  meadow.md              palette page
  projects.md            card grid, deck: projects
  software.md            card grid, deck: software
data/cards.json          tiles for projects and software
justfile                 local commands
layouts/
  _default/baseof.html   shared shell (head, header, footer, scripts)
  _default/list.html     writing list and tag filter
  _default/page.html     generic page
  _default/cards.html    card grid page
  _default/meadow.html   palette page
  writing/page.html      post layout
  index.html             homepage
  partials/              head, header, footer
  robots.txt             robots file with sitemap link
static/
  assets/                images, favicons, badges, posters and the pixel font
  css/style.css          both zones
  js/site.js             theme toggle, transitions, tag filter, badge copy
  js/meadow.js           canvas flowers and wordmark (meadow zone only)
  _headers               Cloudflare Pages headers
tools/generate-art.py    rebuilds the badge, OG image and palette posters
```

## Changing things

The site name, description, greeting, email and GitHub link live in
`hugo.toml`. Page copy is in `content/`, and the project and software tiles are
in `data/cards.json`.

The wordmark is pixel art built in `static/js/meadow.js` from the `G` glyph map.
Change `text('_aleis', 2)` if the site gets a new name.

The badge, Open Graph image and palette posters are generated. Edit `SITE` and
the `GLYPHS` map in `tools/generate-art.py`, then run:

```bash
python3 -m pip install --user Pillow fonttools brotli
python3 tools/generate-art.py
```

## Deploying to Cloudflare Pages

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, open **Workers & Pages**, choose **Create**,
   then **Pages**, then **Connect to Git**.
3. Pick the repository and use these settings:
   - Framework preset: **Hugo**
   - Build command: `hugo --minify --gc`
   - Build output directory: `public`
   - Environment variable: `HUGO_VERSION = 0.168.0`
4. Add your domain under **Custom domains**. HTTPS is automatic.

`static/_headers` is copied into the build, so Cloudflare applies the cache and
security headers.

## Notes on the merge

- The two original repositories are now one Hugo project with one header and
  footer.
- Hugo replaces `publish.el`. The two `.org` posts were replaced by one sample
  Markdown post.
- The Last.fm and server-stats widgets are gone. They needed a running server.
- Images live in `static/assets/`. The unused 924 KB `surf.png`, the Google
  Fonts import and htmx were removed.
- The `glocean` and `dacian` names are now `aleis`.

Upstream attribution is in [CREDITS.md](CREDITS.md).
