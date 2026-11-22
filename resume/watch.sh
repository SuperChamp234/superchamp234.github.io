#!/usr/bin/env bash
# Live-rebuild loop: watches all .tex files and rebuilds on every save.
# Usage: ./watch.sh [name]     (defaults to "resume", same as build.sh)
#
# Stop with Ctrl-C. The PDF in build/ is regenerated on each save, so open
# build/resume.pdf in a viewer that auto-reloads (Preview, Skim, VS Code) for
# an Overleaf-style live preview.

set -euo pipefail

cd "$(dirname "$0")"

IMAGE="${IMAGE:-resume-tex}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"

FILE="${1:-resume}"
FILE="${FILE%.tex}"
SRC="${FILE}.tex"
OUTDIR="build"

if [[ ! -f "$SRC" ]]; then
    echo "error: $SRC not found" >&2
    exit 1
fi

mkdir -p "$OUTDIR"

if command -v latexmk >/dev/null 2>&1; then
    echo "==> Watching with local latexmk (Ctrl-C to stop)"
    latexmk -pdf -pvc -interaction=nonstopmode "-outdir=$OUTDIR" "$SRC"
else
    echo "==> Watching with Docker ($IMAGE); Ctrl-C to stop"
    echo "==> Open $PWD/$OUTDIR/$FILE.pdf in your PDF viewer to see live changes"
    if [[ ! -f "$DOCKERFILE" ]]; then
        echo "error: $DOCKERFILE not found" >&2
        exit 1
    fi
    docker image inspect "$IMAGE" >/dev/null 2>&1 || \
        docker build -t "$IMAGE" -f "$DOCKERFILE" .
    docker run --rm --user "$(id -u):$(id -g)" \
        -v "$PWD":/workdir \
        -w /workdir \
        -e HOME=/tmp \
        "$IMAGE" \
        latexmk -pdf -pvc -interaction=nonstopmode "-outdir=$OUTDIR" "$SRC"
fi
