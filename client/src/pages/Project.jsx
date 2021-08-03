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
        console.log(data);
        setVideoMeta({
          ...videoMeta,
          aspectRatio: data.layers.a_r,
          color: data.layers.color,
          fontSize: data.layers.fontSize,
          manifestUrl: data.layers.manifest_url,
          outlineColor: data.layers.outlineColor,
          outlineWidth: data.layers.outlineWidth,
          showTitle: data.layers.showTitle,
          subtitle: data.layers.subtitle,
          textColor: data.layers.textColor,
          textPosition: data.layers.textPosition,
          title: data.layers.title,
          titlePosition: data.layers.titlePosition,
          titleTextSize: data.layers.titleTextSize,
          fontUppercase: data.layers.fontUppercase,
          activeFontFamily: data.layers.activeFontFamily,
        });
      },
    }
  );

  if (projectQuery.isLoading) return 'Loading';

  if (!projectQuery.isSuccess) return 'Project not found';

  let projectName = projectQuery.data?.project_name;
  console.log(projectQuery.data);
  let sharePath = projectQuery.data?.layers.url.split(
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
