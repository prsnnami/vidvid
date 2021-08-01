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
from string import Template
import shutil

from moviepy.editor import ColorClip, CompositeVideoClip, VideoFileClip
from pytube import YouTube
from requests.utils import requote_uri
from .mail import send_mail
import urllib.request
from fontTools import ttLib

FONT_SPECIFIER_NAME_ID = 4
FONT_SPECIFIER_FAMILY_ID = 1


def shortName(font):
    """Get the short name from the font's names table"""
    name = ""
    for record in font["name"].names:
        if b"\x00" in record.string:
            name_str = record.string.decode("utf-16-be")
        else:
            name_str = record.string.decode("utf-8")
        if record.nameID == FONT_SPECIFIER_NAME_ID and not name:
            name = name_str
        if name:
            break
    return name


aspect_ratios = {
    "16:9": {"height": 1080, "width": 1920},
    "9:16": {"height": 1920, "width": 1080},
    "1:1": {"height": 1920, "width": 1920},
    "4:5": {"height": 1350, "width": 1080},
}


def rgb_to_bgr(rgb):
    rgb = rgb.split("#")[1]
    bgr = rgb[-2:] + rgb[2:4] + rgb[:2]
    return bgr


def get_timestamp(time):
    hour = time // 3600
    time %= 3600
    minutes = time // 60
    time %= 60
    seconds = floor(time)
    milliseconds = int(round(time % 1, 2) * 100)
    return f"{round(hour):02}:{round(minutes):02}:{round(seconds):02}.{milliseconds:02}"


def generate_subtitle(
    id,
    subtitle,
    height,
    width,
    font_family,
    font_size,
    margin_x,
    margin_bottom,
    primary_color,
    outline_width,
    outline_color,
    font_uppercase,
):

    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    f = open(f"{dir_path}/templates/subtitle.ass", "r")

    src = Template(f.read())
    result = src.substitute(
        {
            "video_height": height,
            "video_width": width,
            "font_family": font_family,
            "font_size": font_size,
            "margin_x": margin_x,
            "margin_bottom": margin_bottom,
            "primary_color": primary_color,
            "outline_width": outline_width,
            "outline_color": outline_color,
        }
    )
    print(result)

    srt = open(f"{dir_path}/tmp/{id}/subtitle.ass", "w")
    srt.write(result)
    for line in subtitle:
        srt.write(
            f"Dialogue: 0,{get_timestamp(line['start'])},{get_timestamp(line['end'])},Default,,0,0,0,,{line['text'] if not font_uppercase else line['text'].upper()}"
        )
        srt.write("\n")

    srt.close()


def download_video(url):
    try:
        youtubeVideo = YouTube(url)
        videoStream = youtubeVideo.streams.get_by_resolution("360p")
        if videoStream is None:
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
    rgb = [int(color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)]
    video_name = download_video(url)
    output_name = video_name.split(".")[0] + " " + str(uuid.uuid4()) + "." + video_name.split(".")[1]
    add_overlay(f"tmp/{video_name}", f"tmp/{output_name}", rgb, opacity)
    send_url = requote_uri(f"{os.getenv('BASE_URL')}/download?file={output_name}")
    send_mail(
        from_email="punit@reduct.video",
        to_email=email,
        subject="Your Video is Ready",
        content=f"<a href='{send_url}'>Click Here</a> to download your video.",
    )


def download_reduct_stream(id, url, manifest_path, quality):
    try:
        print("here")
        manifest = requests.get(url + "/" + manifest_path).json()

        video_hashes = [*map(lambda period: period["reps"][quality]["hash"], manifest["periods"])]
        audio_hashes = [*map(lambda period: period["reps"]["audio"]["hash"], manifest["periods"])]

        csv = ",".join([*video_hashes, *audio_hashes])

        print("getting chunks")
        subprocess.run(["python3", "video/scripts/fetch_chunks.py", "--url", url, "--hashes", csv, "--id", id])

        print("stitching video")
        dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

        output = open(f"tmp/{id}/videos.txt", "w")
        for hash in video_hashes:
            output.write(f"file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n")

        output.close()

        subprocess.run(
            ["ffmpeg", "-f", "concat", "-safe", "0", "-i", f"tmp/{id}/videos.txt", "-c", "copy", f"tmp/{id}/video.mp4"]
        )
        print("done stiching video")

        print("stitching audio")

        output = open(f"tmp/{id}/audios.txt", "w")
        for hash in audio_hashes:
            output.write(f"file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n")

        output.close()

        subprocess.run(
            ["ffmpeg", "-f", "concat", "-safe", "0", "-i", f"tmp/{id}/audios.txt", "-c", "copy", f"tmp/{id}/audio.mp4"]
        )
        print("done stiching audio")
        print("merging audio and video")

        subprocess.run(["ffmpeg", "-i", f"tmp/{id}/video.mp4", "-i", f"tmp/{id}/audio.mp4", f"tmp/{id}/output.mp4"])
        print("done stitching video")

    except Exception as e:
        print("error")
        print(e)
        raise e


# def get_timestamp(time):
#     hour = time // 3600
#     time %= 3600
#     minutes = time // 60
#     time %= 60
#     seconds = floor(time)
#     milliseconds = int(round(time % 1, 2)*100)
#     return f'{round(hour):02}:{round(minutes):02}:{round(seconds):02},{milliseconds:02}'


# def create_srt(id, subtitle):
#     dir_path = os.path.dirname(os.path.dirname(
#         os.path.realpath(__file__)))
#     srt = open(f'{dir_path}/tmp/{id}/subtitle.srt', 'w')
#     count = 1
#     for line in subtitle:
#         srt.write(f'{count}')
#         srt.write('\n')
#         srt.write(
#             f"{get_timestamp(line['start'])} --> {get_timestamp(line['end'])}")
#         srt.write('\n')
#         srt.write(line['text'])
#         srt.write('\n')
#         srt.write('\n')
#         count += 1
#     srt.close()


def burn_subtitles(
    id,
    name,
    text_color,
    font_link,
    font_family,
    font_size,
    text_position,
    a_r,
    quality,
    subtitle,
    outline_width,
    outline_color,
    show_title,
    title_position,
    title,
    title_text_size,
    font_uppercase,
):
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    subtitle_path = f"{dir_path}/tmp/{id}/subtitle.ass"
    input_path = f"{dir_path}/tmp/{id}/output_resized.mp4"
    output_path = f"{dir_path}/tmp/{id}/{name}.mp4"
    fonts_dir = f"{dir_path}/media/fonts"

    probe = ffmpeg.probe(input_path)
    video_stream = next((stream for stream in probe["streams"] if stream["codec_type"] == "video"), None)
    height = int(video_stream["height"])
    width = int(video_stream["width"])

    preview_height = aspect_ratios[a_r]["height"]
    preview_width = aspect_ratios[a_r]["width"]

    scale = max(max(height / preview_height, 1), max(width / preview_width, 1))

    # c_font_size = scale * font_size * quality / preview_height
    c_font_size = font_size * 1.4 * width / preview_width
    c_outline_width = float(outline_width) * width / preview_width / 2

    c_margin_v = height * text_position / 100
    c_margin_x = width / 10
    print("----------------------------------------------")
    print(outline_width, c_outline_width)
    print("----------------------------------------------")

    if not os.path.isdir(fonts_dir):
        os.makedirs(fonts_dir)

    if not os.path.exists(f"{fonts_dir}/{font_family}.ttf"):
        urllib.request.urlretrieve(font_link, f"{fonts_dir}/{font_family}.ttf")

    font = ttLib.TTFont(f"{fonts_dir}/{font_family}.ttf")

    generate_subtitle(
        id,
        subtitle,
        height,
        width,
        font_family=shortName(font),
        font_size=c_font_size,
        margin_x=c_margin_x,
        margin_bottom=c_margin_v,
        primary_color=rgb_to_bgr(text_color),
        outline_width=c_outline_width,
        outline_color=rgb_to_bgr(outline_color),
        font_uppercase=font_uppercase,
    )

    # subprocess.run(['ffmpeg', '-i', input_path, '-vf',
    #                f"subtitles={subtitle_path}:fontsdir={fonts_dir}:force_style='Outline=2,OutlineColour=&H000000&,FontName={font_family},Fontsize={c_font_size},PrimaryColour=&H{bgr}&,OutlineColour=&H000000&,MarginV={c_margin_v},MarginL={c_margin_x},MarginR={c_margin_x}'", '-vcodec', 'h264', output_path])
    if show_title:
        subtitled_video_path = f"{dir_path}/tmp/{id}/output_subtitled.mp4"
        c_title_font_size = title_text_size * width / preview_width
        c_title_margin_y = height - height * title_position / 100

        subprocess.run(
            ["ffmpeg", "-i", input_path, "-vf", f"ass={subtitle_path}:fontsdir={fonts_dir}", subtitled_video_path]
        )
        subprocess.run(
            [
                "ffmpeg",
                "-i",
                subtitled_video_path,
                "-vf",
                f"drawtext=fontfile='{fonts_dir}/{font_family}.ttf':text='{title}':fontcolor={text_color}:fontsize={c_title_font_size}:x=(w-text_w)/2:y=({c_title_margin_y}-text_h/100*80)",
                output_path,
            ]
        )
    else:
        subprocess.run(["ffmpeg", "-i", input_path, "-vf", f"ass={subtitle_path}:fontsdir={fonts_dir}", output_path])


def resize_video(id, a_r, color):
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + f"/tmp/{id}"
    input_path = dir_path + "/output.mp4"
    output_path = dir_path + "/output_resized.mp4"
    if a_r == "1:1":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, "scale", "iw", "iw", force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, "pad", "iw", "iw", "(ow-iw)/2", "(oh-ih)/2", color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "16:9":
        stream = ffmpeg.input(input_path)
        audio = stream.audio
        stream = ffmpeg.filter(stream, "scale", "ceil(ih*16/9)", "ih", force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, "pad", "ceil(ih*16/9)", "ih", "(ow-iw)/2", "(oh-ih)/2", color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "9:16":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, "scale", "iw", "iw*16/9", force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, "pad", "iw", "iw*16/9", "(ow-iw)/2", "(oh-ih)/2", color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "4:5":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(stream, "scale", "iw", "iw*5/4", force_original_aspect_ratio="decrease")
        stream = ffmpeg.filter(stream, "pad", "iw", "iw*5/4", "(ow-iw)/2", "(oh-ih)/2", color)
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)


def generate_thumbnail(id, name):
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + f"/tmp/{id}"

    output_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + f"/media/thumbnails/{id}.png"
    input_path = dir_path + "/" + name + ".mp4"
    stream = ffmpeg.input(input_path, ss=4)
    stream = ffmpeg.output(stream, output_path, vframes=1)
    ffmpeg.run(stream)


def generate_reel(
    subtitle,
    url,
    manifest_url,
    name,
    a_r,
    color,
    quality,
    text_color,
    font,
    font_family,
    font_size,
    text_position,
    outline_width,
    outline_color,
    show_title,
    title_position,
    title,
    title_text_size,
    font_uppercase,
):
    id = str(uuid.uuid4())

    print("--------------------------------------------")
    print(id)
    print("--------------------------------------------")

    os.makedirs("tmp/" + id)

    meta = {}
    meta["name"] = name
    with open("tmp/" + id + "/meta.json", "w") as file:
        json.dump(meta, file)
    # meta = open('tmp/'+id + '/meta.json')
    # meta.write('Name: ')

    # create_srt(id, subtitle)

    download_reduct_stream(id, url, manifest_path=manifest_url, quality=quality)
    resize_video(id, a_r, color)
    burn_subtitles(
        id,
        name=name,
        text_color=text_color,
        font_link=font,
        font_family=font_family,
        font_size=font_size,
        text_position=text_position,
        a_r=a_r,
        quality=quality,
        subtitle=subtitle,
        outline_width=outline_width,
        outline_color=outline_color,
        show_title=show_title,
        title_position=title_position,
        title=title,
        title_text_size=title_text_size,
        font_uppercase=font_uppercase,
    )
    meta["output"] = f"{id}/{name}.mp4"
    with open("tmp/" + id + "/meta.json", "w") as file:
        json.dump(meta, file)

    generate_thumbnail(id, name)

    meta["thumbnail"] = f"/media/thumbnails/{id}.png"
    with open("tmp/" + id + "/meta.json", "w") as file:
        json.dump(meta, file)

def delete_reel(id):
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + f"/tmp/{id}"
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        print ("Error: %s - %s." % (e.filename, e.strerror))