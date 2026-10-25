# Local commands for the aleis Hugo site.
# `just --list` shows the recipes with their descriptions.

# List recipes
default:
    @just --list

# Preview at http://localhost:1313
dev:
    hugo server --disableFastRender --navigateToChanged

# Build the site into ./public
build:
    hugo --minify --gc

# Build with warnings treated as errors
check:
    hugo --minify --gc --panicOnWarning

# Add a post: just new my-post-title
new title:
    hugo new content/writing/{{title}}.md

# Remove build output
clean:
    rm -rf public resources .hugo_build.lock
