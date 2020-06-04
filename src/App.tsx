import React from 'react';
import Main from './Main';
import Header from './Header';
import { YMInitializer } from 'react-yandex-metrika';

class App extends React.Component {
  render() {
    return <div>
      <YMInitializer accounts={[61554964]}></YMInitializer>
      <Header />
      <Main />
    </div>
  }
}

export default App;
