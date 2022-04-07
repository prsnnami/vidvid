from django.db import models
import uuid

# Create your models here.


class Client(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    client_name = models.TextField()


class Project(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    project_name = models.TextField()
    layers = models.JSONField(default=dict)
    client = models.ForeignKey(
        Client, related_name='projects', on_delete=models.SET_NULL, null=True)


class Template(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    template_name = models.TextField()
    layers = models.JSONField(default=dict)
