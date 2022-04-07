import json
import os
import traceback
import uuid
from multiprocessing import Process

from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.http import FileResponse, HttpResponse, HttpResponseBadRequest
from django.http.response import (HttpResponseNotFound,
                                  HttpResponseServerError, JsonResponse)
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .functions import delete_reel, generate_reel_v2
from .models import Project, Template, Client
from .serializers import ClientSerializer, ProjectSerializer, TemplateSerializer
from .utils import MultipartJsonParser

# Create your views here.


def send_file(request):
    if request.method != "GET":
        return HttpResponse("<h1>404</h1>")
    path = request.GET.get("file")
    filename = path.split("/")[-1]
    base_dir = os.path.dirname(os.path.dirname(
        os.path.realpath(__file__)))

    try:
        return FileResponse(
            open(f"{base_dir}/{path}", "rb"), as_attachment=True, filename=filename
        )
    except Exception as e:
        print(e)
        return HttpResponseBadRequest("<h1>Invalid Request</h1>")


def generate_reel_view(request):
    if request.method != "POST":
        return HttpResponseNotFound("404")

    body = json.loads(request.body)
    subtitle = body["subtitle"]
    url = body["url"]
    manifest_url = body["manifest_url"]
    name = body["name"]
    a_r = body["a_r"]
    color = body.get("color") or "#000000"
    quality = body.get("quality")
    text_color = body.get("textColor") or "#ffffff"
    font = body.get("font")
    font_family = body.get("fontFamily")
    font_size = body.get("fontSize") or 22
    text_position = body.get("textPosition") or 10
    outline_width = body.get("outlineWidth") or 2
    outline_color = body.get("outlineColor") or "#000000"
    show_title = body.get("showTitle") or False
    title_position = body.get("titlePosition") or 85
    title_text_size = body.get("titleTextSize") or 150
    title = body.get("title")
    font_uppercase = body.get("fontUppercase") or False

    if (
        not subtitle
        or not url
        or not manifest_url
        or not name
        or not a_r
        or not quality
        or not text_color
        or not font
        or not font_family
        or not font_size
        or not text_position
    ):
        return HttpResponseBadRequest()

    # print(subtitle)
    # return HttpResponse("Success")

    p = Process(
        target=generate_reel,
        args=(
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
            font_uppercase
            # font_weight,
            # italic,
        ),
    )
    p.start()

    return HttpResponse("Success")


def home_view(request):
    print(f"{os.getenv('BASE_URL')}/download/")
    if request.method == "POST":
        url = request.POST.get("url")
        color = request.POST.get("color")
        opacity = request.POST.get("opacity")
        email = request.POST.get("email")

        p = Process(target=send_video, args=(url, color, opacity, email))
        p.start()
        context = {"state": "processing_data"}
        # return FileResponse(open(f"tmp/edited_{video_name}", 'rb'), as_attachment=True, filename=video_name)
        return render(request, "home.html", context)

    return render(request, "home.html", {})


def get_reels(request):
    if request.method != "GET":
        return HttpResponseBadRequest()

    try:
        dir_path = os.path.dirname(os.path.dirname(
            os.path.realpath(__file__))) + "/media/reels"
        dirs = os.listdir(dir_path)
        response = {}
        for dir in dirs:
            try:
                with open(f"{dir_path}/{dir}/meta.json") as f:
                    response[dir] = json.load(f)
            except:
                continue
        return JsonResponse(response)
    except:
        return HttpResponseServerError()


def delete_reel_view(request):
    if request.method != "POST":
        return HttpResponseBadRequest()

    try:
        body = json.loads(request.body)
        id = body.get("id")
        print(id)
        delete_reel(id)
        return HttpResponse("Success")
    except:
        return HttpResponseServerError()


class ClientsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows project to be viewed or edited.
    """

    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows project to be viewed or edited.
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def create(self, request):
        files = request.FILES
        body = json.loads(request.data['body'])
        name = request.data['projectName']
        print('reached here \n')

        # parsed = json.loads(request.data['layers']['images'])
        # print(json.dumps(parsed, indent=4, sort_keys=True))
        try:
            for filename in files:

                path = FileSystemStorage().save(
                    f"images/{filename}", ContentFile(files[filename].read())
                )
                body[filename]['url'] = f"media/{path}"

            project = Project(project_name=name, layers=body)
            client_name = request.data['clientName']
            client_id = request.data['clientId']

            if(client_id and client_id != 'create-new-client'):
                client = Client.objects.get(id=client_id)
                project.client = client
            elif (client_name and client_id == 'create-new-client'):
                client = Client(client_name=client_name)
                client.save()
                project.client = client

            project.save()

            return Response({"success": True, "project_id": project.id})
        except Exception as e:
            print(e)

    def update(self, request, **kwargs):
        files = request.FILES
        body = json.loads(request.data['body'])
        id = request.data['id']

        try:
            for filename in files:

                path = FileSystemStorage().save(
                    f"images/{filename}", ContentFile(files[filename].read())
                )
                body[filename]['url'] = f"media/{path}"

            project = Project.objects.get(id=id)
            # print(project)
            project.layers = body
            project.save()

            return Response({"success": True, "project_id": project.id})
        except Exception as e:
            print(e)


class TemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows project to be viewed or edited.
    """

    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

    def create(self, request):
        files = request.FILES
        body = json.loads(request.data['body'])
        name = request.data['templateName']
        print('reached here \n')

        try:
            for filename in files:

                path = FileSystemStorage().save(
                    f"images/{filename}", ContentFile(files[filename].read())
                )
                body[filename]['url'] = f"media/{path}"

            template = Template(template_name=name, layers=body)
            template.save()

            return Response({"success": True, "template_id": template.id})
        except Exception as e:
            print(e)

    def update(self, request, **kwargs):
        files = request.FILES
        body = json.loads(request.data['body'])
        id = request.data['id']

        try:
            for filename in files:

                path = FileSystemStorage().save(
                    f"images/{filename}", ContentFile(files[filename].read())
                )
                body[filename]['url'] = path

            template = Template.objects.get(id=id)
            template.layers = body
            template.save()

            return Response({"success": True, "template_id": template.id})
        except Exception as e:
            print(e)


class GenerateReel(APIView):
    parser_classes = (
        MultipartJsonParser,
        MultiPartParser,
        FormParser,
    )

    def post(self, request):
        id = str(uuid.uuid4())
        files = request._request.FILES

        try:
            generate_reel_v2(body=json.loads(
                request.data["body"]), id=id, files=files)

        except Exception as e:
            traceback.print_exc()

        return Response(
            {
                "raw": "request.data",
            }
        )


class SaveImage(APIView):
    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def post(self, request):
        files = request._request.FILES

        try:
            print("here")
            print(files)

        except Exception as e:
            # print(f"error in {e}", e)
            traceback.print_exc()

        return Response(
            {
                "raw": "request.data",
            }
        )
