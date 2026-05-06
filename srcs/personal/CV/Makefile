TEX := haowang_cv.tex
PDF := haowang_cv.pdf

.PHONY: all publish clean

all:
	pdflatex -interaction=nonstopmode -halt-on-error $(TEX)
	pdflatex -interaction=nonstopmode -halt-on-error $(TEX)

publish: all
	cp $(PDF) ../cv.pdf

clean:
	rm -f *.aux *.log *.out *.toc *.synctex.gz
