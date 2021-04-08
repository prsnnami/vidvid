from django.http import HttpResponse, FileResponse
from django.shortcuts import render
from .functions import download_video, add_overlay

# Create your views here.


def home_view(request):
    if request.method == 'POST':
        url = request.POST.get('url')
        color = request.POST.get('color')
        opacity = request.POST.get('opacity')

        rgb = [int(color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)]
        video_name = download_video(url)
        video = add_overlay(f"tmp/{video_name}", f"tmp/edited_{video_name}", rgb, opacity)
        return FileResponse(open(f"tmp/edited_{video_name}", 'rb'), as_attachment=True, filename=video_name)

    return render(request, "home.html", {})