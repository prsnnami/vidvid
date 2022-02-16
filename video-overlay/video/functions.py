import glob
import json
import os
import shutil
import subprocess
import traceback
import urllib.request
import uuid
from math import floor
from string import Template
from django.core.files import storage

import ffmpeg
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage, default_storage
from fontTools import ttLib
from moviepy.editor import ColorClip, CompositeVideoClip, VideoFileClip
from pytube import YouTube
from requests.utils import requote_uri

# from .mail import send_mail
from PIL import Image

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
    "1:1": {"height": 1080, "width": 1080},
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


# def send_video(url, color, opacity, email):
#     rgb = [int(color.lstrip("#")[i: i + 2], 16) for i in (0, 2, 4)]
#     video_name = download_video(url)
#     output_name = (
#         video_name.split(".")[0]
#         + " "
#         + str(uuid.uuid4())
#         + "."
#         + video_name.split(".")[1]
#     )
#     add_overlay(f"tmp/{video_name}", f"tmp/{output_name}", rgb, opacity)
#     send_url = requote_uri(
#         f"{os.getenv('BASE_URL')}/download?file={output_name}")
#     send_mail(
#         from_email="punit@reduct.video",
#         to_email=email,
#         subject="Your Video is Ready",
#         content=f"<a href='{send_url}'>Click Here</a> to download your video.",
#     )


def download_stream(project_id, url, manifest_object) -> None:
    manifest_id = manifest_object["manifest_id"]
    chunks = manifest_object["chunks"]
    video_paths = []
    current_user_dir_path = os.path.dirname(
        os.path.dirname(os.path.realpath(__file__)))

    current_outpoint = 0
    for index, chunk in enumerate(chunks):
        resource_url = f"{url}/burn?manifest={manifest_id}&idx={index}"
        print("Sending req : ", resource_url)
        multimedia = requests.get(resource_url)
        os.makedirs(f"tmp/{project_id}/", exist_ok=True)

        with open(f"tmp/{project_id}/{manifest_id}_{index}.mp4", "wb") as file:
            file.write(multimedia.content)
            current_outpoint += chunk["duration"]
            video_paths.append(
                f"file {current_user_dir_path}/tmp/{project_id}/{manifest_id}_{index}.mp4"
            )
        # \noutpoint {current_outpoint:.2f}
        # \nduration {chunk['duration']:.2f}
        #  \noutpoint {chunk['duration']}
        print("DONE!!!")

    with open(f"tmp/{project_id}/videos.txt", "a") as file:
        file.write("\n".join(video_paths))

    subprocess.run(
        [
            "ffmpeg",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            f"tmp/{project_id}/videos.txt",
            "-c",
            "copy",
            f"tmp/{project_id}/output.mp4",
        ]
    )

    # for filename in glob.glob(f"tmp/{project_id}/{manifest_id}*"):
    #     os.remove(f"{filename}")


def download_reduct_stream(id, url, manifest_path, quality):
    # Deprecated ...
    try:
        print("here")
        manifest = requests.get(url + "/" + manifest_path).json()

        video_hashes = [
            *map(lambda period: period["reps"][quality]["hash"], manifest["periods"])
        ]
        audio_hashes = [
            *map(lambda period: period["reps"]["audio"]["hash"], manifest["periods"])
        ]

        csv = ",".join([*video_hashes, *audio_hashes])

        print("getting chunks")
        subprocess.run(
            [
                "python3",
                "video/scripts/fetch_chunks.py",
                "--url",
                url,
                "--hashes",
                csv,
                "--id",
                id,
            ]
        )

        print("stitching video")
        dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

        output = open(f"tmp/{id}/videos.txt", "w")
        for hash in video_hashes:
            output.write(
                f"file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n")

        output.close()

        subprocess.run(
            [
                "ffmpeg",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                f"tmp/{id}/videos.txt",
                "-c",
                "copy",
                f"tmp/{id}/video.mp4",
            ]
        )
        print("done stiching video")

        print("stitching audio")

        output = open(f"tmp/{id}/audios.txt", "w")
        for hash in audio_hashes:
            output.write(
                f"file {dir_path}/tmp/{id}/chunks/{hash}/{hash}.mp4\n")

        output.close()

        subprocess.run(
            [
                "ffmpeg",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                f"tmp/{id}/audios.txt",
                "-c",
                "copy",
                f"tmp/{id}/audio.mp4",
            ]
        )
        print("done stiching audio")
        print("merging audio and video")

        subprocess.run(
            [
                "ffmpeg",
                "-i",
                f"tmp/{id}/video.mp4",
                "-i",
                f"tmp/{id}/audio.mp4",
                f"tmp/{id}/output.mp4",
            ]
        )
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
    video_stream = next(
        (stream for stream in probe["streams"]
         if stream["codec_type"] == "video"), None
    )
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
            [
                "ffmpeg",
                "-i",
                input_path,
                "-vf",
                f"ass={subtitle_path}:fontsdir={fonts_dir}",
                subtitled_video_path,
            ]
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
        subprocess.run(
            [
                "ffmpeg",
                "-i",
                input_path,
                "-vf",
                f"ass={subtitle_path}:fontsdir={fonts_dir}",
                output_path,
            ]
        )


def resize_video(id, a_r, color):
    dir_path = (
        os.path.dirname(os.path.dirname(
            os.path.realpath(__file__))) + f"/tmp/{id}"
    )
    input_path = dir_path + "/output.mp4"
    output_path = dir_path + "/output_resized.mp4"
    if a_r == "1:1":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(
            stream, "scale", "iw", "iw", force_original_aspect_ratio="decrease"
        )
        stream = ffmpeg.filter(
            stream, "pad", "iw", "iw", "(ow-iw)/2", "(oh-ih)/2", color
        )
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "16:9":
        stream = ffmpeg.input(input_path)
        audio = stream.audio
        stream = ffmpeg.filter(
            stream,
            "scale",
            "ceil(ih*16/9)",
            "ih",
            force_original_aspect_ratio="decrease",
        )
        stream = ffmpeg.filter(
            stream, "pad", "ceil(ih*16/9)", "ih", "(ow-iw)/2", "(oh-ih)/2", color
        )
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "9:16":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(
            stream, "scale", "iw", "iw*16/9", force_original_aspect_ratio="decrease"
        )
        stream = ffmpeg.filter(
            stream, "pad", "iw", "iw*16/9", "(ow-iw)/2", "(oh-ih)/2", color
        )
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)
    if a_r == "4:5":
        stream = ffmpeg.input(input_path)
        audio = stream.audio

        stream = ffmpeg.filter(
            stream, "scale", "iw", "iw*5/4", force_original_aspect_ratio="decrease"
        )
        stream = ffmpeg.filter(
            stream, "pad", "iw", "iw*5/4", "(ow-iw)/2", "(oh-ih)/2", color
        )
        stream = ffmpeg.output(audio, stream, output_path)
        ffmpeg.run(stream)


def generate_thumbnail(id, name):
    dir_path = (
        os.path.dirname(os.path.dirname(
            os.path.realpath(__file__))) + f"/tmp/{id}"
    )

    output_path = (
        os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
        + f"/media/thumbnails/{id}.png"
    )
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

    os.makedirs("tmp/" + id, exist_ok=True)

    meta = {}
    meta["name"] = name
    # with open("tmp/" + id + "/meta.json", "w") as file:
    #     json.dump(meta, file)

    try:
        # meta = open('tmp/'+id + '/meta.json')
        # meta.write('Name: ')

        # create_srt(id, subtitle)

        download_stream(project_id=id, url=url, manifest_object=manifest_url)

        # resize_video(id, a_r, color)
        # burn_subtitles(
        #     id,
        #     name=name,
        #     text_color=text_color,
        #     font_link=font,
        #     font_family=font_family,
        #     font_size=font_size,
        #     text_position=text_position,
        #     a_r=a_r,
        #     quality=quality,
        #     subtitle=subtitle,
        #     outline_width=outline_width,
        #     outline_color=outline_color,
        #     show_title=show_title,
        #     title_position=title_position,
        #     title=title,
        #     title_text_size=title_text_size,
        #     font_uppercase=font_uppercase,
        # )
        # meta["output"] = f"{id}/{name}.mp4"
        # generate_thumbnail(id, name)
        meta["thumbnail"] = f"/media/thumbnails/{id}.png"
    except Exception as e:
        print(e)
        meta["error"] = True

    with open("tmp/" + id + "/meta.json", "w") as file:
        json.dump(meta, file, indent=2)


def delete_reel(id):
    dir_path = (
        os.path.dirname(os.path.dirname(
            os.path.realpath(__file__))) + f"/tmp/{id}"
    )
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        print("Error: %s - %s." % (e.filename, e.strerror))


def generate_reel_v2(id, body, files):
    id = str(uuid.uuid4())
    print("id")
    path = f"{settings.BASE_DIR}/tmp/{id}"
    os.makedirs(path, exist_ok=True)

    name = body['name']

    meta = {}
    meta["name"] = name
    with open(f"{path}/meta.json", "w") as file:
        json.dump(meta, file)

    try:
        if files:
            meta["status"] = "fetching files"
            with open(f"{path}/meta.json", "w") as file:
                json.dump(meta, file)
            get_files(files, path=path)

        video_height = body["canvas"]['height']
        video_width = body["canvas"]['width']

        meta["status"] = "Generating video"
        with open(f"{path}/meta.json", "w") as file:
            json.dump(meta, file)

        create_background_image(
            color=body["canvas"]["bgColor"], height=video_height, width=video_width, path=path
        )

        filtered_layers = [value for key, value in body.items() if key not in [
            'name', 'src', 'canvas']]
        sorted_layers = sorted(filtered_layers,
                               key=lambda x: x.get('index'))

        for idx, layer in enumerate(sorted_layers):
            print(layer)
            input = f"{path}/background_image.jpg" if idx == 0 else f"{path}/{idx}.mp4"
            output = f"{path}/{name}.mp4" if idx + 1 == len(
                sorted_layers) else f"{path}/{idx + 1}.mp4"
            layer_type = layer.get('type')
            if layer_type == 'image' or layer_type == 'video':
                iw = layer.get("height")
                ih = layer.get("width")
                top = layer.get("top")
                left = layer.get("left")
                input2 = layer.get(
                    "name") if layer_type == 'image' else 'input.mp4'
                input2 = f'{path}/{layer.get("name")}' if layer.get(
                    'url') is None else f'{settings.BASE_DIR}/{layer.get("url")}'
                if layer_type == 'video':
                    input2 = f'{path}/input.mp4'

                commands = ['ffmpeg', '-i', input, '-i', input2, '-filter_complex',
                            f'[1:v]scale={ih}:{iw} [o],[0:v][o]overlay={left}:{top}', '-c:a', 'copy', output]
                subprocess.run(commands)
            elif layer_type == 'title':
                add_title(layer, input, output)
            elif layer_type == 'subtitle':
                add_subtitles(layer, input, output, path,
                              video_height, video_width)

        meta["status"] = "Generating thumbnail"
        with open(f"{path}/meta.json", "w") as file:
            json.dump(meta, file)

        thumbnail_path = f"{settings.BASE_DIR}/media/thumbnails/{id}.png"
        capture_thumbnail(path, name, thumbnail_path)

        meta["status"] = "Finished."
        meta["thumbnail"] = f"/media/thumbnails/{id}.png"
        with open(f"{path}/meta.json", "w") as file:
            json.dump(meta, file)

    except Exception as e:
        print(e)
        meta["status"] = "Error"
        meta["error"] = True
        meta["error_message"] = str(e)
        with open(f"{path}/meta.json", "w") as file:
            json.dump(meta, file)


def capture_thumbnail(path, name, thumbnail_path):
    stream = ffmpeg.input(f"{path}/{name}.mp4", ss=4)
    stream = ffmpeg.output(stream, thumbnail_path, vframes=1)
    ffmpeg.run(stream)


def add_title(layer, input, output):
    fonts_dir = f"{settings.MEDIA_ROOT}/fonts"

    font_link = layer.get('fontLink')
    font_family = layer.get('fontFamily')

    if not os.path.isdir(fonts_dir):
        os.makedirs(fonts_dir)

    if not os.path.exists(f"{fonts_dir}/{font_link}.ttf"):
        urllib.request.urlretrieve(font_link, f"{fonts_dir}/{font_family}.ttf")

    font = ttLib.TTFont(f"{fonts_dir}/{font_family}.ttf")

    subprocess.run(
        [
            "ffmpeg",
            "-i",
            input,
            "-vf",
            f"drawtext=fontfile='{fonts_dir}/{font_family}.ttf':text='{layer.get('name')}':fontcolor={layer.get('color')}:fontsize={layer.get('fontSize')}:x={layer.get('left')}:y={layer.get('top')}",
            output,
        ]
    )


def make_subtitle(
    subtitle_path,
    layer,
    video_height,
    video_width
):

    with open(f"{settings.BASE_DIR}/templates/subtitle.ass", "r") as f:
        src = Template(f.read())

    result = src.substitute(
        {
            "video_height": video_height,
            "video_width": video_width,
            "font_family": layer.get('fontFamily'),
            "font_size": layer.get('fontSize') / 0.7528125,
            "margin_l": layer.get('left'),
            "margin_r": video_width - layer.get('left') - layer.get('width'),
            "margin_bottom": video_height - layer.get('top') - layer.get('height'),
            "primary_color": rgb_to_bgr(layer.get('color')),
            "outline_width": layer.get('outlineWidth'),
            "outline_color": rgb_to_bgr(layer.get('outlineColor')),
        }
    )

    with open(subtitle_path, 'w') as srt:
        srt.write(result)
        for line in layer.get('subtitles'):
            srt.write(
                f"Dialogue: 0,{get_timestamp(line['start'])},{get_timestamp(line['end'])},Default,,0,0,0,,{line['text'] if not layer.get('uppercase') else line['text'].upper()}"
            )
            srt.write("\n")


def add_subtitles(
    layer,
    input,
    output,
    path,
    video_height,
    video_width
):

    subtitle_path = f"{path}/subtitle.ass"
    fonts_dir = f"{settings.MEDIA_ROOT}/fonts"

    font_link = layer.get('fontLink')
    font_family = layer.get('fontFamily')

    if not os.path.isdir(fonts_dir):
        os.makedirs(fonts_dir)

    if not os.path.exists(f"{fonts_dir}/{font_link}.ttf"):
        urllib.request.urlretrieve(font_link, f"{fonts_dir}/{font_family}.ttf")

    font = ttLib.TTFont(f"{fonts_dir}/{font_family}.ttf")

    make_subtitle(subtitle_path=subtitle_path, layer=layer,
                  video_height=video_height, video_width=video_width)

    subprocess.run(
        [
            "ffmpeg",
            "-i",
            input,
            "-vf",
            f"ass={subtitle_path}:fontsdir={fonts_dir}",
            output,
        ]
    )


def add_video_script(path, video_layer):

    iw = video_layer.get("height")
    ih = video_layer.get("width")
    top = video_layer.get("top")
    left = video_layer.get("left")

    snippet = f"-i {path}/input.mp4  -filter_complex '[1:v]scale={ih}:{iw} [o],[0:v][o]overlay={left}:{top}'"

    return snippet


def add_image_script(path, image_layer):
    image_name = image_layer.get("name")

    iw = image_layer.get("height")
    ih = image_layer.get("width")
    top = image_layer.get("top")
    left = image_layer.get("left")

    snippet = f"-i {path}/{image_name}  -filter_complex '[1:v]scale={ih}:{iw} [o],[0:v][o]overlay={left}:{top}'"

    return snippet


def get_files(files, path):
    try:
        for filename in files:
            FileSystemStorage(location="tmp").save(
                f"{path}/{filename}", ContentFile(files[filename].read())
            )
    except Exception as e:
        print(e)


def create_background_image(height, width, path, color):
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-f",
                "lavfi",
                "-i",
                f"color=c={color or '000000'}:s={width}x{height}:d=1",
                "-ss",
                "00:00:00",
                "-vframes",
                "1",
                f"{path}/background_image.jpg",
            ]
        )
    except Exception as e:
        print(e)
