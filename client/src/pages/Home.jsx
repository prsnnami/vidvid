import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import React, { useRef } from 'react';
import { useNavigate } from 'react-router';

export default function Home() {
  const inputRef = useRef();
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    console.log(inputRef.current.value);
    const shareUrl = inputRef.current.value;
    let split = shareUrl.split('app.reduct.video/e/');
    if (split.length < 2) {
      alert('Invalid Link');
      return;
    }

    navigate('/editor/' + split[1]);
  }

  return (
    <Flex justifyContent="center" alignItems="center" h="100%" w="100%">
      <Box>
        <form onSubmit={submit}>
          <Stack spacing="4">
            <Heading>Welcome to Borderer</Heading>
            <Input ref={inputRef} placeholder="Enter video share link" />
            <Button type="submit">Go!</Button>
          </Stack>
        </form>
      </Box>
    </Flex>
  );
}
