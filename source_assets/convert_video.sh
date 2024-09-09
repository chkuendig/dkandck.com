#./split_video.sh
rm videos.tmp
while read f; do
  echo "file 'scenes/$f'" >>  videos.tmp;
  #open "scenes/$f"
done < videos.txt

ffmpeg -v verbose -y -f concat -safe 0 -i videos.tmp -an -c copy output.mp4
rm videos.tmp
mv output.mp4 ../goa.mp4