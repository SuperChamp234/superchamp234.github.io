#!/usr/bin/env bash
# Build the resume PDF locally.
# Usage:
#   ./build.sh              # build resume.tex -> build/resume.pdf, copy to resume.pdf
#   ./build.sh other        # build a different top-level .tex (extension optional)
#
# Uses a local latexmk if you have one; otherwise runs latexmk inside the
# Docker image defined by ./Dockerfile, so you never have to install TeX
# packages by hand.

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

LATEXMK_ARGS=(-pdf -interaction=nonstopmode -halt-on-error -file-line-error
              "-outdir=$OUTDIR" "$SRC")

if command -v latexmk >/dev/null 2>&1; then
    echo "==> Building with local latexmk"
    mkdir -p "$OUTDIR"
    latexmk "${LATEXMK_ARGS[@]}"
else
    echo "==> Building with Docker ($IMAGE)"
    if [[ ! -f "$DOCKERFILE" ]]; then
        echo "error: $DOCKERFILE not found" >&2
        exit 1
    fi
    # Rebuild the image only if it doesn't exist yet (pass IMAGE=... to override).
    docker image inspect "$IMAGE" >/dev/null 2>&1 || \
        docker build -t "$IMAGE" -f "$DOCKERFILE" .
    mkdir -p "$OUTDIR"
    docker run --rm --user "$(id -u):$(id -g)" \
        -v "$PWD":/workdir \
        -w /workdir \
        -e HOME=/tmp \
        "$IMAGE" \
        latexmk "${LATEXMK_ARGS[@]}"
fi

PDF="$OUTDIR/$FILE.pdf"
if [[ ! -f "$PDF" ]]; then
    echo "error: $PDF was not produced; check $OUTDIR/$FILE.log" >&2
    exit 1
fi

cp "$PDF" "$FILE.pdf"
echo "==> OK: $FILE.pdf"
