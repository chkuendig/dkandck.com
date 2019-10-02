aws s3 sync . s3://www.dkandck.com --delete --exclude ".*"  --exclude "*.DS_Store"  --exclude "*.sh" --exclude "originals/*"  --exclude "tiles/Landsat*"  --exclude "node_modules/" --exclude "package*.json" 
exit
#fix mime-type of elevation tiles
aws s3 cp \
      --exclude "*" \
      --include "*.bil" \
      --content-type="application/octet-stream"  \
      --metadata-directive="REPLACE" \
      --recursive \
       s3://www.dkandck.com/tiles/DTED0 \
       s3://www.dkandck.com/tiles/DTED0
