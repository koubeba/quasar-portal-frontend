import Page from 'components/Page';
import React, { Component } from 'react';
import { Card, CardBody, CardHeader, Col, Row, Table, UncontrolledAlert } from 'reactstrap';
import { FilesContext } from '../utils/FilesArray';

require('../styles/sent-data-history-page.css');

const axios = require('axios');

const tableTypes = ['', 'bordered', 'striped', 'hover'];

const timestampToStr = (timestamp) => {
  return new Date(timestamp * 1000);
};

const renderRow = (row, index) => {
  console.log(row);
  return (
    <tr key={index}>
      <td>{row.filename}</td>
      <td>{row.format}</td>
      <td>{row.size}</td>
      <td>{row.rows}</td>
      <td>{row.time}</td>
    </tr>
  );
};

class SentDataHistoryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fetching_error: undefined,
    };
  };

  componentDidMount() {
    const filesContext = this.context;
    this.fetchSentFiles(filesContext);
  };

  fetchSentFiles = (filesContext) => {
    console.log('Fetching');
    (async () => {
      try {
        const result = await axios.get('http://localhost:5000/get_sent_files');
        filesContext.addFile(Object.values(result.data.data.messages));
      } catch (err) {
        console.error(err);
        this.setState({
          fetching_error: err,
        });
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
                    <th scope="col">filename</th>
                    <th scope="col">format</th>
                    <th scope="col">size</th>
                    <th scope="col">rows</th>
                    <th scope="col">time</th>
                  </tr>
                  </thead>
                  <FilesContext.Consumer>
                    {(filesContext) => {
                      return (
                        <tbody>
                        {
                          filesContext.files.map((row, index) => {
                            return renderRow(row[0], index);
                          })
                        }
                        </tbody>
                      );
                    }}
                  </FilesContext.Consumer>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
        {this.state.fetching_error &&
        <Row className="alert-container">
          <UncontrolledAlert color="danger">
            Couldn't fetch file history!
          </UncontrolledAlert>
        </Row>
        }
      </Page>

    );
  }

}

SentDataHistoryPage.contextType = FilesContext;

export default SentDataHistoryPage;
