import traceback
from pytube import YouTube
from moviepy.editor import VideoFileClip, ColorClip, CompositeVideoClip

def download_video(url):
    try:
        youtubeVideo = YouTube(url)
        videoStream = youtubeVideo.streams.get_by_resolution('360p')
        if (videoStream is None):
            videoStream = youtubeVideo.streams.get_lowest_resolution()
        videoFileName = videoStream.default_filename
        videoStream.download("tmp/")
        return videoFileName
    except Exception as e:
        print(traceback.format_exc())



def add_overlay(file_path, output_path, rgb, opacity):
    clip = VideoFileClip(file_path)

    print(clip.w)

    color_clip = ColorClip(size=(clip.w, 50), color=rgb)
    color_clip = color_clip.set_pos("bottom")
    color_clip = color_clip.set_duration(clip.duration)
    color_clip = color_clip.set_opacity(float(opacity))

    video = CompositeVideoClip([clip, color_clip])

    video.write_videofile(output_path)
    


