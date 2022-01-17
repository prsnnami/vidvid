import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useParams } from 'react-router';
import Editor from '../components/Editor/Editor';

const OpenSans = {
  variants: ['regular'],
  files: {
    regular:
      'http://fonts.gstatic.com/s/opensans/v20/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf',
  },
  category: 'sans-serif',
  kind: 'webfonts#webfont',
  family: 'Open Sans',
  id: 'open-sans',
};

export default function Project() {
  const { id } = useParams();

  useEffect(() => {
    document.addEventListener(
      'keydown',
      function (e) {
        if (
          e.keyCode === 83 &&
          (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
        ) {
          e.preventDefault();
          //your implementation or function calls
        }
      },
      false
    );
  }, []);

  const [videoMeta, setVideoMeta] = useState({
    transcript: null,
    subtitle: null,
    manifestUrl: null,
    aspectRatio: '16:9',
    color: '#000000',
    textColor: '#ffffff',
    fontSize: 75,
    activeFontFamily: OpenSans,
    textPosition: 10,
    outlineWidth: 2,
    outlineColor: '#000000',
    fontWeight: 400,
    italic: false,
    showTitle: false,
    titlePosition: 85,
    titleTextSize: 150,
    title: 'Transcript',
    fontUppercase: false,
  });

  const syncProjectMutation = useMutation(async body => {
    console.log('call ghere');
    return await fetch('/borderer/projects/' + id + '/', {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ layers: body }),
    });
  });

  const projectQuery = useQuery(
    ['projects', id],
    async () => {
      return await fetch('/borderer/projects/' + id)
        .then(res => {
          if (!res.ok) {
            throw new Error('Not 2xx response');
          } else {
            return res.json();
          }
        })
        .catch(e => {
          throw e;
        });
    },
    {
      retry: false,
      onSuccess: data => {
        const {
          canvas,
          video,
          subtitle,
          title: titleDescription,
        } = data.layers;
        console.log(data);
        setVideoMeta(prevVidData => ({
          ...prevVidData,
          color: canvas.bgColor,
          textColor: subtitle.color,
          showTitle: canvas.subtitle,
          fontSize: subtitle.fontSize,
          title: titleDescription.title,
          subtitle: data.layers.subtitle,
          aspectRatio: canvas.aspect_ratio,
          outlineColor: subtitle.outlineColor,
          outlineWidth: subtitle.outlineWidth,
          textPosition: data.layers.textPosition,
          titlePosition: data.layers.titlePosition,
          titleTextSize: titleDescription.fontSize,
          fontUppercase: titleDescription.uppercase,
          activeFontFamily: titleDescription.fontFamily,
        }));
      },
    }
  );

  if (projectQuery.isLoading) return 'Loading';

  if (!projectQuery.isSuccess) return 'Project not found';

  let projectName = projectQuery.data?.project_name;
  let sharePath = projectQuery.data?.layers.video.url.split(
    'https://app.reduct.video/e/'
  )[1];

  return (
    <Editor
      projectName={projectName}
      projectId={id}
      initialValue={videoMeta}
      sharePath={sharePath}
      syncProjectMutation={syncProjectMutation}
    />
  );
}
