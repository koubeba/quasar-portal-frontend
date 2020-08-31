import GAListener from 'components/GAListener';
import { MainLayout } from 'components/Layout';
import PageSpinner from 'components/PageSpinner';
import React from 'react';

import componentQueries from 'react-component-queries';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { SentDataContext } from './utils/SentDataArray';
import './styles/reduction.scss';

const SendPage = React.lazy(() => import('pages/SendPage'));
const ResultsPage = React.lazy(() => import('pages/ResultsPage'));
const SentDataHistoryPage = React.lazy(() => import('pages/SentDataHistoryPage'));


const getBasename = () => {
  return `/${process.env.PUBLIC_URL.split('/').pop()}`;
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.updateTopicOffsets = (newTopicOffsets) => {
      this.setState({
        topicOffsets: newTopicOffsets,
      });
    };
    this.state = {
      topicOffsets: [],
      updateTopicOffsets: this.updateTopicOffsets,
    };
  }

  render() {
    return (
      <BrowserRouter basename={getBasename()}>
        <SentDataContext.Provider value={this.state}>
          <GAListener>
            <Switch>
              <MainLayout breakpoint={this.props.breakpoint} cookies={this.props.cookies}>
                <React.Suspense fallback={<PageSpinner/>}>
                  <Route exact path="/" component={SendPage}/>
                  <Route exact path="/results" component={ResultsPage}/>
                  <Route exact path="/sent-data" component={SentDataHistoryPage}/>
                  <Route exact path="/send" component={SendPage}/>
                </React.Suspense>
              </MainLayout>
              <Redirect to="/"/>
            </Switch>
          </GAListener>
        </SentDataContext.Provider>
      </BrowserRouter>
    );
  }
}

const query = ({ width }) => {
  if (width < 575) {
    return { breakpoint: 'xs' };
  }

  if (576 < width && width < 767) {
    return { breakpoint: 'sm' };
  }

  if (768 < width && width < 991) {
    return { breakpoint: 'md' };
  }

  if (992 < width && width < 1199) {
    return { breakpoint: 'lg' };
  }

  if (width > 1200) {
    return { breakpoint: 'xl' };
  }

  return { breakpoint: 'xs' };
};

export default componentQueries(query)(App);
