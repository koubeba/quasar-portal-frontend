import React, { Component } from 'react';

import { getColor } from 'utils/colors';
import { randomNum } from 'utils/demos';

import { Row, Col, Card, CardHeader, CardBody, Input } from 'reactstrap';

import { Line, Pie, Doughnut, Bar, Radar, Polar } from 'react-chartjs-2';

import Page from 'components/Page';
import { getOutTopics, getMessages, getSchema } from '../utils/quasarServer';
import { toast } from 'react-toastify';

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

const prettyPrintTopicName = (topic_name) => {
  return topic_name
    .substr(4);
};


const genLineData = (rows_processed) => {
  return {
    datasets: [
      {
        backgroundColor: getColor('primary'),
        borderColor: getColor('primary'),
        borderWidth: 1,
        fill: false,
        data: rows_processed,
      },
    ],
  };
};

const countOccurences = (possible_values, datapoints) => {
  const datapoint_values = datapoints.map(point => {
    return point.y;
  });
  const occ = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
  return possible_values.map(val => {
    return occ(datapoint_values, val);
  });
};

class ResultsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rows_processed: undefined,
      classification_results: undefined,
      schema: undefined,
      possible_values: undefined,
      selectedTopic: undefined,
      outTopics: [],
    };
  }

  componentDidMount() {
    this.getOutTopics();
  }

  getOutTopics = () => {
    const updateOutTopics = (outTopics) => {
      this.setState({
        outTopics: outTopics,
      });
    };
    (async () => {
      const result = await getOutTopics();
      updateOutTopics(result);
    })();
  };

  selectTopic = (topic) => {
    this.setState({
      selectedTopic: topic,
    });
    this.fetchResults(topic);
  };


  pieData = (possible_values, classification_results) => {
    return {
      datasets: [
        {
          data: countOccurences(possible_values, classification_results),
          backgroundColor: [
            getColor('primary'),
            getColor('secondary'),
            getColor('success'),
          ],
        },
      ],
      labels: possible_values,
    };
  };

  fetchResults = (topic) => {
    const updateRowsProcessed = (rows) => {
      this.setState({
        rows_processed: rows,
        classification_results: undefined,
      });
    };
    const updateClassification = (classification, rows_processed) => {
      this.setState({
        classification_results: classification,
        rows_processed: rows_processed,
      });
    };
    const updateSchema = (schema, possible_values) => {
      this.setState({
        schema: schema,
        possible_values: possible_values,
      });
    };
    (async () => {
      try {
        const schema = await getSchema(topic);
        try {
          if (schema.type !== 'classification' && schema.type !== 'rows_processed') {
            toast.error(`Schema of unknown type ${schema.type}`);
          } else {
            updateSchema(schema.type, schema.possible_values);
            const result = await getMessages(topic, 10, handleFetchingError);
            if (schema.type === 'classification') {
              updateClassification(result.map(r => {
                return {
                  x: processTimestamp(r.timestamp),
                  y: r.value,
                };
              }), result.map(r => {
                return {
                  x: processTimestamp(r.timestamp),
                  y: 1,
                };
              }));
            } else {
              updateRowsProcessed(result.map(r => {
                return {
                  x: processTimestamp(r.timestamp),
                  y: parseInt(r.value),
                };
              }));
            }
          }
        } catch (err) {
          toast.error(`Couldn't fetch schema: ${err}`);
        }
      } catch (err) {
        toast.error(`Couldn't fetch results for ${topic}: ${err}`);
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
                {this.state.rows_processed &&
                <Line
                  data={genLineData(this.state.rows_processed)}
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
                }
                {(this.state.rows_processed === undefined) &&
                <h1>N/A</h1>
                }
              </CardBody>
            </Card>
          </Col>

          <Col xl={6} lg={12} md={12}>
            <Card>
              <CardHeader>Object Types</CardHeader>
              <CardBody>
                {this.state.schema === 'classification' && this.state.classification_results &&
                <Pie data={this.pieData(this.state.possible_values, this.state.classification_results)}/>
                }
                {(this.state.classification_results === undefined) &&
                <h2>N/A</h2>
                }
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col xl={12} lg={12} md={12}>
            <Card>
              <CardHeader>
                Select Topic
              </CardHeader>
              <CardBody>
                <Input type="select" id="topic" className="topic-selection"
                       onChange={e => this.selectTopic(e.target.value || undefined)}>
                  <option value={undefined}>Select topic...</option>
                  {this.state.outTopics.map(t => (
                    <option value={t}>{prettyPrintTopicName(t)}</option>
                  ))}
                </Input>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Page>
    );
  }
};

export default ResultsPage;
