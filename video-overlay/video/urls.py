from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r"projects", views.ProjectViewSet)
router.register(r"templates", views.TemplateViewSet)
router.register(r"clients", views.ClientsViewSet)

urlpatterns = [
    # path('', views.home_view, name='index'),
    path("", include(router.urls)),
    path("download", views.send_file, name="send file"),
    path("generate", csrf_exempt(views.generate_reel_view), name="generate reel"),
    path("get_reels", views.get_reels, name="get reels"),
    path("delete_reel", csrf_exempt(views.delete_reel_view), name="delete reels"),
    path(
        "generate_reel",
        csrf_exempt(views.GenerateReel.as_view()),
        name="generate reel 2",
    ),
    path(
        "save_image",
        csrf_exempt(views.SaveImage.as_view()),
        name="Save Image",
    )
    # path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]
