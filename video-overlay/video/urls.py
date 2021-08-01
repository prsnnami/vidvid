from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r"projects", views.ProjectViewSet)

urlpatterns = [
    # path('', views.home_view, name='index'),
    path("", include(router.urls)),
    path("download", views.send_file, name="send file"),
    path("generate", csrf_exempt(views.generate_reel_view), name="generate reel"),
    path("get_reels", views.get_reels, name="get reels"),
    path("delete_reel", csrf_exempt(views.delete_reel_view), name="delete reels"),
    # path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]
