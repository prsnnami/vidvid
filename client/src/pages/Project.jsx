import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useParams } from 'react-router';

import TestPage, { defaultVideoMetaData } from '../components/TestPage';

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
    ...defaultVideoMetaData,
  });

  const syncProjectMutation = useMutation(async body => {
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
        setVideoMeta(prevVidData => ({
          ...prevVidData,
          ...data.layers,
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
    <TestPage
      projectId={id}
      videoURL={sharePath}
      initialValue={videoMeta}
      projectName={projectName}
    />
  );
}
