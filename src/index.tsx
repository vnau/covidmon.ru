import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import ReactGA from 'react-ga';
import ym from 'react-yandex-metrika';

const rootElement = document.getElementById("root");


const history = createBrowserHistory();
ReactGA.initialize("UA-48955267-10");
// Initialize google analytics page view tracking
history.listen(location => {
  ReactGA.set({ page: location.pathname }); // Update the user's current page
  ReactGA.pageview(location.pathname); // Record a pageview for the given page
  ym('hit', location.pathname);
});

if (rootElement) {
  if (rootElement.hasChildNodes()) {
    ReactDOM.hydrate(<Router history={history}><App /></Router>, rootElement);
  } else {
    ReactDOM.render(<Router history={history}><App /></Router>, rootElement);
  }
}


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
