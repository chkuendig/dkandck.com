#http://www.imagemagick.org/Usage/thumbnails/#cut
mogrify -define jpeg:size=2000x2000  -thumbnail 1000x1000^ -gravity center -extent 1000x1000 -auto-orient   -path ../pictures  photos/*

#copy timestamps
for filename in photos/*; do
 newfile="../pictures/"$(basename "$filename")
 touch -r "${filename}" "${newfile}"
done
