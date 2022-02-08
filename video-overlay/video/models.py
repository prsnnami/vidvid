from django.db import models
import uuid

# Create your models here.


class Project(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    project_name = models.TextField()
    layers = models.JSONField(default=dict)


class Template(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    template_name = models.TextField()
    layers = models.JSONField(default=dict)
