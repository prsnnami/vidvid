from django.urls import path

from . import views

urlpatterns = [
    path('', views.home_view, name='index'),
    path('download', views.send_file, name="send file")
]
