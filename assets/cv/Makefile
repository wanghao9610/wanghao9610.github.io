TEX := hao-wang-cv.tex
PDF := hao-wang-cv.pdf

.PHONY: all publish clean

all:
	pdflatex -interaction=nonstopmode -halt-on-error $(TEX)
	pdflatex -interaction=nonstopmode -halt-on-error $(TEX)

publish: all

clean:
	rm -f *.aux *.log *.out *.toc *.synctex.gz
