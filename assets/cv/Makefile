TEX := hao-wang-cv.tex
PDF := hao-wang-cv.pdf

.PHONY: all publish clean

all:
	latexmk -xelatex -interaction=nonstopmode -halt-on-error $(TEX)

publish: all

clean:
	latexmk -c -xelatex $(TEX)
	rm -f *.synctex.gz
