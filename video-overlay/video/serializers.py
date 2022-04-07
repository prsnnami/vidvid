from .models import Project, Template, Client
from rest_framework import serializers


class TemplateSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Template
        fields = ["id", "template_name", "layers"]
    # def update(self, instance, validated_data):
    #     """
    #     Update and return an existing `Snippet` instance, given the validated data.
    #     """
    #     instance.layers = validated_data.get("layers", instance.layers)
    #     instance.save()
    #     return instance


class ClientSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "client_name", "projects"]


class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    client = ClientSerializer()

    class Meta:
        model = Project
        fields = ["id", "project_name", "layers", "client"]
