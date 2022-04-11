# Generated by Django 3.2 on 2022-04-07 08:18

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0007_template'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('client_name', models.TextField()),
            ],
        ),
        migrations.AddField(
            model_name='project',
            name='client',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='video.client'),
        ),
    ]