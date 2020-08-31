import React, { Component } from 'react';

import { getColor } from 'utils/colors';
import { randomNum } from 'utils/demos';

import { Row, Col, Card, CardHeader, CardBody } from 'reactstrap';

import { Line, Pie, Doughnut, Bar, Radar, Polar } from 'react-chartjs-2';

import Page from 'components/Page';
import { getConnectionInfo, getMessages, getSchema } from '../utils/quasarServer';
import { toast } from 'react-toastify';

const axios = require('axios');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const processTimestamp = (timestamp) => {
  return new Date(timestamp);
};

const genPieData = () => {
  return {
    datasets: [
      {
        data: [randomNum(), randomNum(), randomNum()],
        backgroundColor: [
          getColor('primary'),
          getColor('secondary'),
          getColor('success'),
        ],
        label: 'Dataset 1',
      },
    ],
    labels: ['QSO', 'Galaxy', 'Star'],
  };
};

const handleFetchingError = (err) => {
  console.error(err);
};

class ResultsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rows_processed: undefined,
    };
  }

  componentDidMount() {
    this.fetchResults();
  }

  genLineData = (moreData = {}) => {
    return {
      datasets: [
        {
          label: 'Dataset 1',
          backgroundColor: getColor('primary'),
          borderColor: getColor('primary'),
          borderWidth: 1,
          fill: false,
          data: this.state.rows_processed,
        },
      ],
    };
  };

  fetchResults = () => {
    const topic = 'out-test';
    const updateRowsProcessed = (rows) => {
      this.setState({
        rows_processed: rows,
      });
    };
    (async () => {
      try {
        const result = await getMessages(topic, 10, handleFetchingError);
        updateRowsProcessed(result.map(r => {
          return {
            x: processTimestamp(r.timestamp),
            y: parseInt(r.value),
          };
        }));
      } catch (err) {
        toast.error('Couldn\'t fetch results!');
      }
    })();
  };

  render() {
    return (
      <Page title="Charts" breadcrumbs={[{ name: 'Charts', active: true }]}>
        <Row>
          <Col xl={6} lg={12} md={12}>
            <Card>
              <CardHeader>Rows processed</CardHeader>
              <CardBody>
                <Line
                  data={this.genLineData()}
                  options={{
                    scales: {
                      xAxes: [{
                        type: 'time',
                        bounds: 'data',
                        time: {
                          unit: 'hour',
                          round: 'second',
                          bounds: 'data',
                          displayFormats: {
                            second: 'H:mm',
                            minute: 'H:mm',
                            hour: 'H',
                            day: 'D MMM',
                          },
                        },
                      }],
                    },
                  }}
                />
              </CardBody>
            </Card>
          </Col>

          <Col xl={6} lg={12} md={12}>
            <Card>
              <CardHeader>Object Types</CardHeader>
              <CardBody>
                <Pie data={genPieData()}/>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Page>
    );
  }
};

export default ResultsPage;
