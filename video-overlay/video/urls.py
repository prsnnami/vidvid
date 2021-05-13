from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from . import views

urlpatterns = [
    path('', views.home_view, name='index'),
    path('download', views.send_file, name="send file"),
    path('generate', csrf_exempt(views.generate_reel_view), name="generate reel"),
    path('get_reels', views.get_reels, name="get reels"),

]
