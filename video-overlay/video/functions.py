import os
import time
import traceback
import uuid

from moviepy.editor import ColorClip, CompositeVideoClip, VideoFileClip
from pytube import YouTube
from requests.utils import requote_uri
from .mail import send_mail


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


def send_video(url, color, opacity, email):
    rgb = [int(color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)]
    video_name = download_video(url)
    output_name = video_name.split(
        '.')[0] + ' ' + str(uuid.uuid4()) + '.' + video_name.split('.')[1]
    add_overlay(f"tmp/{video_name}",
                f"tmp/{output_name}", rgb, opacity)
    send_url = requote_uri(f"{os.getenv('BASE_URL')}/download/{output_name}")
    send_mail(from_email="punit@reduct.video", to_email=email,
              subject="Your Video is Ready", content=f"<a href='https://{send_url}'>Click Here</a> to download your video.")
