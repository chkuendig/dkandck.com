#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=1280:720,crop=1280:640,unsharp=5:5:1.0:5:5:0.0,setsar=1,minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=48',setpts=N/(24*TB)" -an  -crf 17 background-video.mp4
#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=1280:720,crop=1280:640,unsharp=5:5:1.0:5:5:0.0,setsar=1,minterpolate='fps=48',setpts=N/(24*TB)" -an -crf 17 background-video.mp4
#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=856:480,crop=856:428,setsar=1,minterpolate='fps=48',setpts=N/(24*TB)" -an -crf 17 background-video-SD.mp4
./split_video.sh
rm videos.tmp
while read f; do
  echo "file 'scenes/$f'" >>  videos.tmp;
  #open "scenes/$f"
done < videos.txt

ffmpeg -v verbose -y -f concat -safe 0 -i videos.tmp -an -c copy output.mp4
rm videos.tmp