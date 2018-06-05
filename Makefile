SERVER=lyra.benkurtovic.com
STAGE=/usr/share/nginx/benkurtovic

.PHONY: build serve deploy

build:
	jekyll build

serve:
	jekyll serve

deploy:
	rsync -chirvz --progress --delete-after _site/ $(SERVER):$(STAGE)
