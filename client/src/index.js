import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';

const theme = extendTheme({
  styles: {
    global: {
      'html, body, #root': {
        height: '100%',
      },
      html: {
        fontFamily: 'montserrat',
        scrollBehavior: 'smooth',
      },
      '#font-picker': {
        width: '100%',
        borderRadius: '8px',
        boxShadow: 'none',
        border: '1px solid #E2E8F0',
        button: {
          background: 'white',
        },
      },
    },
  },
});

const queryClient = new QueryClient();

ReactDOM.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Router>
          <ColorModeScript />
          <App />
        </Router>
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
