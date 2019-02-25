#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=1280:720,crop=1280:640,unsharp=5:5:1.0:5:5:0.0,setsar=1,minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=48',setpts=N/(24*TB)" -an  -crf 17 background-video.mp4
#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=1280:720,crop=1280:640,unsharp=5:5:1.0:5:5:0.0,setsar=1,minterpolate='fps=48',setpts=N/(24*TB)" -an -crf 17 background-video.mp4
#ffmpeg -i VASUNDHARA\ SAROVAR\ PREMIERE-qdzGCzRskdw.mkv -r 24 -vf "scale=856:480,crop=856:428,setsar=1,minterpolate='fps=48',setpts=N/(24*TB)" -an -crf 17 background-video-SD.mp4
ffmpeg -y -i "Aashyana Lakhanpal Corporate Film-wSra5gGyjIM.mp4"   \
  -c:v libx264 -x264opts min-keyint=1:scenecut=90 \
  -crf 17   -an    -f segment -segment_format mp4 -segment_time 1 -segment_format_options movflags=faststart  -reset_timestamps 1  scenes/corporate-film%05d.mp4
ffmpeg -y -i "Aashyana Lakhanpal Video-O6bbVu0ue2M.mp4"  \
  -c:v libx264 -x264opts min-keyint=1:scenecut=90 \
  -crf 17   -an    -f segment -segment_format mp4 -segment_time 1 -segment_format_options movflags=faststart  -reset_timestamps 1  scenes/video%05d.mp4
#ffmpeg -y -f concat -safe 0 -i scenes/segments -c copy background.mp4
#cp background.mp4 project/imgs/output2.mp4 