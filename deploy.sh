#! /bin/bash
SERVER=lyra.benkurtovic.com
STAGE=/usr/share/nginx/benkurtovic
rsync -chirvz --progress --delete-after _site/ $SERVER:$STAGE
