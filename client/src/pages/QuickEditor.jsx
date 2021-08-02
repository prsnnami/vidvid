import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate, useParams } from 'react-router';
import Editor from '../components/Editor/Editor';

export default function QuickEditor() {
  const { sharePath } = useParams();
  const navigate = useNavigate();

  const mutation = useMutation(async function ({ projectName, body }) {
    console.log('here', body);

    await fetch('/borderer/projects/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_name: projectName, layers: body }),
    })
      .then(res => res.json())
      .then(res => navigate('/project/' + res.id));
  });

  return <Editor sharePath={sharePath} saveProjectMutation={mutation} />;
}
