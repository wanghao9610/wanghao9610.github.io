This is the source code of Hao Wang's public academic website. The layout was originally adapted from [Jon Barron's website](https://jonbarron.info/) and later redesigned with a blue editorial look (warm neutral backgrounds, blue accents, serif headings, light/dark theme). Feel free to clone this code for your own personal use.

## Structure

- `index.html`: homepage content and metadata (news, publications, open-source projects, experience, education, services, awards).
- `assets/css/styles.css`: stylesheet; design tokens live at the top (`:root` for light, `[data-theme="dark"]` for dark).
- `assets/js/main.js`: theme toggle, copy-to-clipboard toast, live GitHub stars/forks (with static fallbacks in the HTML), section navigation, lazy visitor map.
- `assets/images/profile/`: personal profile image.
- `assets/images/publications/`: publication preview images.
- `assets/icons/`: favicon and touch icons.
- `assets/cv/`: CV PDFs and LaTeX sources (`make` for the English CV, `make -f Makefile.zh` for the Chinese one; both build with `latexmk -xelatex` and share the website's palette and fonts).

## Editing tips

- Repo cards under **Open Source** carry `data-repo="<name>"` / `data-repo-forks="<name>"` spans; the numbers are refreshed from the GitHub API on load and cached for 6 hours, so the hard-coded values only serve as fallbacks.
- To preview locally, run `python3 -m http.server` in the repo root and open `http://localhost:8000/`.
