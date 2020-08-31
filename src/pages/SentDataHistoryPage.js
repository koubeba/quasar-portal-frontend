import Page from 'components/Page';
import React, { Component } from 'react';
import { Card, CardBody, CardHeader, Col, Row, Table, UncontrolledAlert } from 'reactstrap';
import { FilesContext } from '../utils/FilesArray';
import { toast } from 'react-toastify';
import { getInTopicsOffsets } from '../utils/quasarServer';
import { SentDataContext } from '../utils/SentDataArray';

require('../styles/sent-data-history-page.css');

const axios = require('axios');

const tableTypes = ['', 'bordered', 'striped', 'hover'];

const timestampToStr = (timestamp) => {
  return new Date(timestamp * 1000);
};

const renderRow = (row, index) => {
  return (
    <tr key={index}>
      <td>{row.topic_name}</td>
      <td>{row.csv}</td>
      <td>{row.json}</td>
    </tr>
  );
};

class SentDataHistoryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topicOffsets: [],
    };
  };

  componentDidMount() {
    const sentDataContext = this.context;
    this.fetchTopicOffsets(sentDataContext);

    this.tickID = setInterval(
      (() => this.fetchTopicOffsets(sentDataContext)),
      5000,
    );
  };

  componentWillUnmount() {
    clearInterval(this.tickID);
  }

  handleFetchingError = (err) => {
    toast.error(`Couldn't fetch topics! ${err}`, {
      autoClose: 4000,
    });
  };

  fetchTopicOffsets = (sentDataContext) => {
    const handleError = this.handleFetchingError;
    const updateTopicOffsets = (topicOffsets) => {
      sentDataContext.updateTopicOffsets(topicOffsets);
    };
    (async () => {
      try {
        const result = await getInTopicsOffsets();
        updateTopicOffsets(result);
      } catch (err) {
        handleError(err);
      }
    })();
  };


  render() {
    let filesContext = this.context;
    return (
      <Page
        title="Sent Data History"
        breadcrumbs={[{ name: 'sent data history', active: true }]}
        className="SentDataPage"
      >
        <Row>
          <Col>
            <Card className="mb-3">
              <CardHeader>Sent data</CardHeader>
              <CardBody>
                <Table>
                  <thead>
                  <tr>
                    <th scope="col">topic name</th>
                    <th scope="col">CSV</th>
                    <th scope="col">JSON</th>
                  </tr>
                  </thead>
                  <SentDataContext.Consumer>
                    {(sentDataContext) => {
                      return sentDataContext.topicOffsets.map((row, index) => {
                        return renderRow(row, index);
                      });
                    }}
                  </SentDataContext.Consumer>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Page>

    );
  }

}

SentDataHistoryPage.contextType = SentDataContext;

export default SentDataHistoryPage;
