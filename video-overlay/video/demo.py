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
    fonts_dir = f"{dir_path}/media/fonts"

    rgb = text_color.split("#")[1]
    bgr = rgb[-2:] + rgb[2:4] + rgb[:2]
    probe = ffmpeg.probe(input_path)
    video_stream = next((stream for stream in probe["streams"] if stream["codec_type"] == "video"), None)
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

    generate_subtitle(
        id,
        subtitle,
        height,
        width,
        font_size=c_font_size,
        margin_x=c_margin_x,
        margin_bottom=c_margin_v,
        primary_color=bgr,
    )

    if not os.path.isdir(fonts_dir):
        os.makedirs(fonts_dir)

    if not os.path.exists(f"{fonts_dir}/{font_family}.ttf"):
        urllib.request.urlretrieve(font_link, f"{fonts_dir}/{font_family}.ttf")

    # subprocess.run(['ffmpeg', '-i', input_path, '-vf',
    #                f"subtitles={subtitle_path}:fontsdir={fonts_dir}:force_style='Outline=2,OutlineColour=&H000000&,FontName={font_family},Fontsize={c_font_size},PrimaryColour=&H{bgr}&,OutlineColour=&H000000&,MarginV={c_margin_v},MarginL={c_margin_x},MarginR={c_margin_x}'", '-vcodec', 'h264', output_path])
    subprocess.run(["ffmpeg", "-i", input_path, "-vf", f"ass={subtitle_path}:fontsdir={fonts_dir}", output_path])


def main():
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    font = "http://fonts.gstatic.com/s/didactgothic/v14/ahcfv8qz1zt6hCC5G4F_P4ASpUySp0LlcyQ.ttf"
    textColor = "#ffffff"
    font_size = 90
    a_r = "9:16"
    textPosition = 10
    subtitle = [
        {"start": 1.16999899999999, "end": 4.269999999999996, "text": "What can weasdasd design now as an outcome "},
        {"start": 4.299999999999997, "end": 6.319999999999993, "text": "that wants it's ready? You'll sign off on. "},
    ]

    burn_subtitles(
        id="123",
        a_r=a_r,
        name="1080",
        text_color=textColor,
        font_link=font,
        font_family="Didact Gothic",
        font_size=font_size,
        text_position=textPosition,
        input_path=f"{dir_path}/tmp/123/output_resized_1080p.mp4",
        quality=1080,
        subtitle=subtitle,
    )

    # burn_subtitles(id="123", a_r=a_r, name='480', text_color=textColor, font_link=font,
    #                font_family='Didact Gothic', font_size=font_size, text_position=textPosition, input_path=f"{dir_path}/tmp/123/output_resized_480p.mp4", quality=480)
    # burn_subtitles(id="123", a_r=a_r, name='240', text_color=textColor, font_link=font,
    #                font_family='Didact Gothic', font_size=font_size, text_position=textPosition, input_path=f"{dir_path}/tmp/123/output_resized_240p.mp4", quality=240)


main()
