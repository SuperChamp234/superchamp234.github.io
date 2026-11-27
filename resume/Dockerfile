# TeX Live build environment for the site resume (native arm64 via Debian).
# Build:  docker build -t resume-tex .
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        latexmk \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-fonts-recommended \
        texlive-fonts-extra \
        texlive-lang-english \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workdir
