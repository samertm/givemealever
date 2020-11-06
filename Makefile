.PHONY: build run

build:
	npm run build

run:
	cd dist
	python3 -m http.server
