# Generated by Django 3.2 on 2022-02-13 16:39

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0006_auto_20210801_0743'),
    ]

    operations = [
        migrations.CreateModel(
            name='Template',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('template_name', models.TextField()),
                ('layers', models.JSONField(default=dict)),
            ],
        ),
    ]