# Resume build

The site resume is generated from `resume.tex`.

## Quick start

```sh
./compile.sh     # full build: HTML for the site + resume.pdf
./build.sh       # PDF only -> build/resume.pdf, copied to resume.pdf
./watch.sh       # live rebuild on every save -> build/resume.pdf
```

`compile.sh` is the one to run before `npm run build`: it regenerates
`_includes/resume_content.njk` with pandoc and rebuilds the PDF. The generated
HTML and PDF are gitignored, so they are never committed.

`build.sh` and `watch.sh` use a local `latexmk` if installed, otherwise they run
it inside the Docker image described by `Dockerfile` (Debian + TeX Live). The
image is built automatically on first use, so the first run downloads the TeX
packages.

- Build a different file: `./build.sh cover-letter`
- Use another image: `IMAGE=my-tex ./build.sh`
- Live preview: open `build/resume.pdf` in Preview.app, Skim, or the VS Code
  PDF pane while `./watch.sh` is running.

## Prefer a local (non-Docker) setup?

Install the missing TeX pieces once:

```sh
sudo tlmgr update --self
sudo tlmgr install latexmk titlesec enumitem fullpage marvosym fontawesome
```

After that `build.sh`, `watch.sh`, and `compile.sh` use the local toolchain and
skip Docker entirely.

## Requirements

- `pandoc` for the HTML conversion in `compile.sh`
- Docker (or a local TeX Live install with the packages above)
- `perl` (used to preprocess the LaTeX before pandoc)
