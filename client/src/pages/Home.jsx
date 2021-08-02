import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import { Link } from '@chakra-ui/react';
import React, { useRef } from 'react';
import { useNavigate } from 'react-router';
import { Link as RouteLink } from 'react-router-dom';

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
    <Flex direction="column" h="100%" w="100%">
      <Stack direction="row" justify="flex-end" p="4" fontSize="lg" spacing="4">
        <Link as={RouteLink} to="/reels">
          Reels
        </Link>
        <Link as={RouteLink} to="/projects">
          Projects
        </Link>
      </Stack>
      <Flex justifyContent="center" alignItems="center" flexGrow="1">
        <Box>
          <form onSubmit={submit}>
            <Stack spacing="4">
              <Heading>Welcome to Borderer</Heading>
              <Input
                ref={inputRef}
                defaultValue="https://app.reduct.video/e/borderer-testing-84e3ce2ba0-f81df100c4861287a746"
                placeholder="Enter video share link"
              />
              <Button type="submit">Go!</Button>
            </Stack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
}
