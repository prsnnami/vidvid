import os
import subprocess
import requests
import urllib.request
import ffmpeg
from string import Template
from math import floor

aspect_ratios = {
    "16:9": {"height": 1080, "width": 1920},
    "9:16": {"height": 1920, "width": 1080},
    "1:1": {"height": 1920, "width": 1920},
    "4:5": {"height": 1350, "width": 1080},
}


def get_timestamp(time):
    hour = time // 3600
    time %= 3600
    minutes = time // 60
    time %= 60
    seconds = floor(time)
    milliseconds = int(round(time % 1, 2) * 100)
    return f"{round(hour):02}:{round(minutes):02}:{round(seconds):02}.{milliseconds:02}"


def generate_subtitle(id, subtitle, height, width, font_size, margin_x, margin_bottom, primary_color):

    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    f = open(f"{dir_path}/templates/subtitle.ass", "r")

    src = Template(f.read())
    result = src.substitute(
        {
            "video_height": height,
            "video_width": width,
            "font_size": font_size,
            "margin_x": margin_x,
            "margin_bottom": margin_bottom,
            "primary_color": primary_color,
        }
    )
    print(result)

    srt = open(f"{dir_path}/tmp/{id}/subtitle.ass", "w")
    srt.write(result)
    for line in subtitle:
        srt.write(
            f"Dialogue: 0,{get_timestamp(line['start'])},{get_timestamp(line['end'])},Default,,0,0,0,,{line['text']}"
        )
        srt.write("\n")

    srt.close()


def burn_subtitles(
    id, name, text_color, font_link, font_family, font_size, text_position, a_r, input_path, quality, subtitle
):
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    subtitle_path = f"{dir_path}/tmp/{id}/subtitle.ass"
    output_path = f"{dir_path}/tmp/{id}/{name}.mp4"
    output_path_2 = f"{dir_path}/tmp/{id}/{name}_1.mp4"
    fonts_dir = f"{dir_path}/media/fonts"

    rgb = text_color.split("#")[1]
    bgr = rgb[-2:] + rgb[2:4] + rgb[:2]
    probe = ffmpeg.probe(input_path)
    video_stream = next(
        (stream for stream in probe["streams"] if stream["codec_type"] == "video"), None)
    height = int(video_stream["height"])
    width = int(video_stream["width"])

    preview_height = aspect_ratios[a_r]["height"]
    preview_width = aspect_ratios[a_r]["width"]

    scale = max(max(height / preview_height, 1), max(width / preview_width, 1))

    # c_font_size = scale * font_size * quality / preview_height
    c_font_size = font_size * 1.4

    c_margin_v = preview_height * text_position / 100
    c_margin_x = preview_width / 10
    print("----------------------------------------------")
    print(scale, height, width, c_font_size, c_margin_x, c_margin_v)
    print("----------------------------------------------")

    # generate_subtitle(
    #     id,
    #     subtitle,
    #     height,
    #     width,
    #     font_size=c_font_size,
    #     margin_x=c_margin_x,
    #     margin_bottom=c_margin_v,
    #     primary_color=bgr,
    # )

    if not os.path.isdir(fonts_dir):
        os.makedirs(fonts_dir)

    if not os.path.exists(f"{fonts_dir}/{font_family}.ttf"):
        urllib.request.urlretrieve(font_link, f"{fonts_dir}/{font_family}.ttf")

    # subprocess.run(['ffmpeg', '-i', input_path, '-vf',
    #                f"subtitles={subtitle_path}:fontsdir={fonts_dir}:force_style='Outline=2,OutlineColour=&H000000&,FontName={font_family},Fontsize={c_font_size},PrimaryColour=&H{bgr}&,OutlineColour=&H000000&,MarginV={c_margin_v},MarginL={c_margin_x},MarginR={c_margin_x}'", '-vcodec', 'h264', output_path])
    # subprocess.run(["ffmpeg", "-i", input_path, "-vf", f"ass={subtitle_path}:fontsdir={fonts_dir}", output_path, "-y"])
    c_title_margin_y = height - height * 46 / 100
    c_title_font_size = 100 * width / preview_width
    subprocess.run(
        [
            "ffmpeg",
            "-i",
            output_path,
            "-vf",
            f"drawtext=fontfile='{fonts_dir}/{font_family}.ttf':text='Transcript':fontcolor=white:fontsize={c_title_font_size}:x=(w-text_w)/2:y=({c_title_margin_y}-text_h/100*80)",
            output_path_2,
            "-y",
        ]
    )


def download_stream(url) -> None:
    id = 'test'
    manifest_url = f"{url}/burn?type=json"
    manifest_object = requests.get(manifest_url).json()
    manifest_id = manifest_object["manifest_id"]
    chunks = manifest_object["chunks"]
    video_paths = []
    current_user_dir_path = os.path.dirname(
        os.path.dirname(os.path.realpath(__file__)))

    current_outpoint = 0
    for index, chunk in enumerate(chunks):
        resource_url = f"{url}/burn?manifest={manifest_id}&idx={index}"
        print("Sending req : ", resource_url)
        # multimedia = requests.get(resource_url)
        os.makedirs(f"tmp/{id}/", exist_ok=True)

        # with open(f"tmp/{id}/{manifest_id}_{index}.mp4", "wb") as file:
        #     file.write(multimedia.content)

        current_outpoint += chunk["duration"]
        video_paths.append(
            f"file {current_user_dir_path}/tmp/{id}/{manifest_id}_{index}.mp4 \noutpoint {current_outpoint:.2f}"
        )
        # \noutpoint {current_outpoint:.2f}
        # \nduration {chunk['duration']:.2f}
        #  \noutpoint {chunk['duration']}
        print("DONE!!!")

    with open(f"tmp/{id}/videos.txt", "w") as file:
        file.write("\n".join(video_paths))

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
            f"tmp/{id}/output.mp4",
        ]
    )


def main():
    print('hi')
    download_stream(
        'https://app.reduct.video/e/instagram--the-power-of-archiving-69f6b2577d50-7124ecc64b17d4455b66')


main()
