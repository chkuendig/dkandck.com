ffmpeg -y -i "Aashyana Lakhanpal Corporate Film-wSra5gGyjIM.mp4"   \
 -vf scale=-1:720 -c:v libx264 -x264opts min-keyint=1:scenecut=90 \
  -crf 28   -an    -f segment -segment_format mp4 -segment_time 1 -segment_format_options movflags=faststart  -reset_timestamps 1  scenes/corporate-film%05d.mp4
ffmpeg -y -i "Aashyana Lakhanpal Video-O6bbVu0ue2M.mp4"  \
 -vf scale=-1:720 -c:v libx264 -x264opts min-keyint=1:scenecut=90 \
  -crf 28   -an    -f segment -segment_format mp4 -segment_time 1 -segment_format_options movflags=faststart  -reset_timestamps 1  scenes/video%05d.mp4
ffmpeg -i scenes/corporate-film00045.mp4 -t 6 -c copy scenes/corporate-film00045-cut.mp4


#ffmpeg -y -f concat -safe 0 -i scenes/segments -c copy background.mp4
#cp background.mp4 project/imgs/output2.mp4 