import asyncio
import json
import os
import subprocess
from multiprocessing import Process
from uuid import uuid4

from django.http import FileResponse, HttpResponse, HttpResponseBadRequest
from django.http.response import HttpResponseBase, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from .functions import (add_overlay, burn_subtitles, create_srt,
                        download_reduct_stream, download_video, generate_reel,
                        generate_thumbnail, get_timestamp, resize_video,
                        send_video)

# Create your views here.


def send_file(request):
    if request.method != 'GET':
        return HttpResponse('<h1>404</h1>')
    filename = request.GET.get('file')
    print(filename)

    try:
        return FileResponse(open(f"tmp/{filename}", "rb"), as_attachment=True, filename=filename)
    except Exception as e:
        print(e)
        return HttpResponseBadRequest('<h1>Invalid Request</h1>')


def generate_reel_view(request):
    if request.method != 'POST':
        return HttpResponseNotFound('404')

    body = json.loads(request.body)
    subtitle = body['subtitle']
    url = body['url']
    manifest_url = body['manifest_url']
    name = body['name']
    a_r = body['a_r']
    color = body.get('color') or '#000000'
    quality = body.get('quality')

    if not subtitle or not url or not manifest_url or not name or not a_r or not quality:
        return HttpResponseBadRequest()

    p = Process(target=generate_reel, args=(
        subtitle, url, manifest_url, name, a_r, color, quality))
    p.start()

    return HttpResponse('Success')


def home_view(request):
    print(f"{os.getenv('BASE_URL')}/download/")
    if request.method == 'POST':
        url = request.POST.get('url')
        color = request.POST.get('color')
        opacity = request.POST.get('opacity')
        email = request.POST.get('email')

        p = Process(target=send_video, args=(url, color, opacity, email))
        p.start()
        context = {
            'state': 'processing_data'
        }
        # return FileResponse(open(f"tmp/edited_{video_name}", 'rb'), as_attachment=True, filename=video_name)
        return render(request, "home.html", context)

    return render(request, "home.html", {})


def get_reels(request):
    if request.method != 'GET':
        return HttpResponseBadRequest()

    dir_path = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__))) + '/tmp'
    dirs = os.listdir(dir_path)
    response = {}
    for dir in dirs:
        try:
            with open(f'{dir_path}/{dir}/meta.json') as f:
                response[dir] = json.load(f)
        except:
            continue
    return JsonResponse(response)
