import json
import os
import time
import traceback
import uuid
from django.http.response import HttpResponse, HttpResponseBadRequest
import requests
import subprocess
import ffmpeg
from math import floor

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
    send_url = requote_uri(
        f"{os.getenv('BASE_URL')}/download?file={output_name}")
    send_mail(from_email="punit@reduct.video", to_email=email,
              subject="Your Video is Ready", content=f"<a href='{send_url}'>Click Here</a> to download your video.")


def download_reduct_stream(id, url, manifest_path, quality):
    try:
        print('here')
        manifest = requests.get(url + '/' + manifest_path).json()

        video_hashes = [*map(lambda period: period['reps']
                             [quality]['hash'], manifest['periods'])]
        audio_hashes = [*map(lambda period: period['reps']
                             ['audio']['hash'], manifest['periods'])]

        csv = ','.join([*video_hashes, *audio_hashes])

        print('getting chunks')
        subprocess.run(['python3', 'video/scripts/fetch_chunks.py',
                       '--url', url, '--hashes', csv, '--id', id])

        print('stitching video')
        dir_path = os.path.dirname(os.path.dirname(
            os.path.realpath(__file__)))

        output = open(f'tmp/{id}/videos.txt', 'w')
        for hash in video_hashes:
            output.write(
                f'file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n')

        output.close()

        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0',
                       '-i', f'tmp/{id}/videos.txt', '-c', 'copy', f'tmp/{id}/video.mp4'])
        print('done stiching video')

        print('stitching audio')

        output = open(f'tmp/{id}/audios.txt', 'w')
        for hash in audio_hashes:
            output.write(
                f'file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n')

        output.close()

        subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0',
                       '-i', f'tmp/{id}/audios.txt', '-c', 'copy', f'tmp/{id}/audio.mp4'])
        print('done stiching audio')
        print('merging audio and video')

        subprocess.run(['ffmpeg', '-i', f'tmp/{id}/video.mp4', '-i',
                       f'tmp/{id}/audio.mp4', f'tmp/{id}/output.mp4'])
        print('done stitching video')

    except Exception as e:
        print('error')
        print(e)
        raise e


def get_timestamp(time):
    hour = time // 3600
    time %= 3600
    minutes = time // 60
    time %= 60
    seconds = floor(time)
    milliseconds = int(round(time % 1, 2)*100)
    return f'{round(hour):02}:{round(minutes):02}:{round(seconds):02},{milliseconds:02}'


def create_srt(id, subtitle):
    dir_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__)))
    srt = open(f'{dir_path}/tmp/{id}/subtitle.srt', 'w')
    count = 1
    for line in subtitle:
        srt.write(f'{count}')
        srt.write('\n')
        srt.write(
            f"{get_timestamp(line['start'])} --> {get_timestamp(line['end'])}")
        srt.write('\n')
        srt.write(line['line'])
        srt.write('\n')
        srt.write('\n')
        count += 1
    srt.close()


def burn_subtitles(id, name):
    dir_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__)))
    subprocess.run(['ffmpeg', '-i', f'{dir_path}/tmp/{id}/output_resized.mp4', '-vf',
                   f'subtitles={dir_path}/tmp/{id}/subtitle.srt', f'{dir_path}/tmp/{id}/{name}.mp4'])


def resize_video(id, a_r, color):
    dir_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__))) + f'/tmp/{id}'
    input_path = dir_path + '/output.mp4'
    output_path = dir_path + '/output_resized.mp4'
    if(a_r == '1:1'):
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, 'scale', 'iw', 'iw',
                               force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, 'pad', 'iw', 'iw',
                               '(ow-iw)/2', '(oh-ih)/2', color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if(a_r == '16:9'):
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, 'scale', 'ih*16/9', 'ih',
                               force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, 'pad', 'ih*16/9',
                               'ih', '(ow-iw)/2', '(oh-ih)/2', color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if(a_r == '9:16'):
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, 'scale', 'iw', 'iw*16/9',
                               force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, 'pad', 'iw',
                               'iw*16/9', '(ow-iw)/2', '(oh-ih)/2', color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if(a_r == '4:5'):
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, 'scale', 'iw', 'iw*5/4',
                               force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, 'pad', 'iw',
                               'iw*5/4', '(ow-iw)/2', '(oh-ih)/2', color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)


def generate_thumbnail(id, name):
    dir_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__))) + f'/tmp/{id}'

    output_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__))) + f'/media/thumbnails/{id}.png'
    input_path = dir_path + '/' + name + '.mp4'
    stream = ffmpeg.input(input_path, ss=4)
    stream = ffmpeg.output(stream, output_path, vframes=1)
    ffmpeg.run(stream)


def generate_reel(subtitle, url, manifest_url, name, a_r, color, quality):
    id = str(uuid.uuid4())

    print('--------------------------------------------')
    print(id)
    print('--------------------------------------------')

    os.makedirs('tmp/'+id)

    meta = {}
    meta['name'] = name
    with open('tmp/'+id + '/meta.json', 'w') as file:
        json.dump(meta, file)
    # meta = open('tmp/'+id + '/meta.json')
    # meta.write('Name: ')

    create_srt(id, subtitle)

    download_reduct_stream(
        id, url, manifest_path=manifest_url, quality=quality)
    resize_video(id, a_r, color)

    burn_subtitles(id, name=name)
    meta['output'] = f'{id}/{name}.mp4'
    with open('tmp/'+id + '/meta.json', 'w') as file:
        json.dump(meta, file)

    generate_thumbnail(id, name)

    meta['thumbnail'] = f'/media/thumbnails/{id}.png'
    with open('tmp/'+id + '/meta.json', 'w') as file:
        json.dump(meta, file)
