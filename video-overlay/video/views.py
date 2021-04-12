from django.http import HttpResponse, FileResponse, HttpResponseBadRequest
from django.shortcuts import render
from .functions import download_video, add_overlay, send_video
import asyncio
import subprocess
from multiprocessing import Process
import os


# Create your views here.


def send_file(request):
    if request.method != 'GET':
        return HttpResponse('<h1>404</h1>')
    filename = request.GET.get('file')

    try:
        return FileResponse(open(f"tmp/{filename}", "rb"), as_attachment=True, filename=filename)
    except Exception as e:
        print(e)
        return HttpResponseBadRequest('<h1>Invalid Request</h1>')


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
