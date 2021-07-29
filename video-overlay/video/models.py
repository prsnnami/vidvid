from django.db import models

# Create your models here.
class Project(models.Model):
    project_name = models.TextField()
    layers = models.JSONField(default=dict)
