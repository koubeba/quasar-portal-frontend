import React, { Component } from 'react';
import { parse } from 'papaparse';
import {
  Badge,
  Button,
  Card,
  CardText,
  CardHeader,
  CardBody,
  Col,
  Input,
  Progress,
  Row,
} from 'reactstrap';
import { getConnectionInfo } from '../utils/quasarServer';
import { toast } from 'react-toastify';
import { sendMessageUrl, listInTopicsUrl, getSchema } from '../utils/quasarServer';

const avro = require('avsc');
const axios = require('axios');

const csvFormat = 'CSV';

require('../styles/file-upload.css');


const headerSize = (data) => {
  return Buffer.byteLength(Object.keys(data).toString());
};

const rowDataSize = (data) => {
  return Buffer.byteLength(Object.values(data).toString());
};

const prettyPrintType = (type) => {
  if (type.constructor === Object) {
    return <Badge>{type.type}({type.items})</Badge>;
  } else {
    return <Badge>{type}</Badge>;
  }
};

const prettyPrintSchema = (schema) => {
  return (
    <CardText>
      {
        schema.fields.map(r => {
          return (
            <>
              <h5>{r.name} {prettyPrintType(r.type)}</h5>
              {'\n'}
            </>
          );
        })
      }
    </CardText>
  );
};

const prettyPrintTopicName = (topic_name) => {
  return topic_name
    .substr(3)
    .replace(`-${csvFormat.toLowerCase()}`, '');
};

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: undefined,
      rowsProcessed: 0,
      percentCompleted: 0,
      inTopics: [],
      selectedTopic: undefined,
      topicSchema: undefined
    };
  }

  componentDidMount() {
    this.listTopics(this.state.activeTab);
    (async () => {
      try {
        const connection_info = await getConnectionInfo();
        toast(`Connected to ${connection_info} Kafka brokers`);
      } catch (err) {
        toast.error('Couldn\'t connect to Kafka!');
      }
    })();
  }

  onFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      this.resetProgress();
      this.setState({ file: files[0] });
    }
  };

  resetProgress = () => {
    this.setState({
      file: undefined,
      rowsProcessed: 0,
      percentCompleted: 0,
    });
  };

  setProgressToDone = () => {
    this.setState({
      percentCompleted: 100,
    });
  };

  changePercentCompleted = (counter, avgRowByteSize, allRowsSize) => {
    this.setState({
      rowsProcessed: counter,
      percentCompleted: counter * (avgRowByteSize / allRowsSize) * 100,
    });
  };

  processCSVFile = async () => {
    const topicName = this.state.selectedTopic;
    const avroSchema = avro.Type.forSchema(this.state.topicSchema);
    const format = this.state.activeTab;
    if (this.state.file !== undefined) {
      let counter = 0;
      let allRowsSize = this.state.file.size;
      let processedRowsByteSize = 0;
      let averageRowByteSize = 0;
      const updatePercent = this.changePercentCompleted;
      parse(this.state.file, {
        worker: true,
        header: true,
        step: async function(row) {
          if (counter === 0) {
            allRowsSize -= headerSize(row.data);
          }
          try {
            await axios.post(sendMessageUrl(topicName, format),
              avroSchema.toBuffer(row.data),
            );
            counter += 1;
            processedRowsByteSize += rowDataSize(row.data);
            averageRowByteSize = processedRowsByteSize / counter;
            updatePercent(counter, averageRowByteSize, allRowsSize);
            console.log('Processed a row!');
          } catch (e) {
            toast.error(`Error while sending a row no. ${counter}: ${e}`);
          }
        },
        error: function(err, file, inputElem, reason) {
        },
        complete: this.setProgressToDone,
      });
    }
  };

  updateSchemaState = (schema) => {
    this.setState({
      topicSchema: schema,
    });
  };

  selectTopic = (topic) => {
    this.setState({
      selectedTopic: topic,
    });
    const updateSchemaState = this.updateSchemaState;
    if (topic) {
      (async () => {
        const result = await getSchema(topic);
        updateSchemaState(JSON.parse(result));
      })();
    } else {
      this.setState({
        topicSchema: undefined,
      });
    }
  };

  updateTopics = (topics) => {
    this.setState({
      inTopics: topics,
      file: undefined,
      selectedTopic: undefined,
      topicSchema: undefined,
    });
  };

  listTopics = (format) => {
    const update = this.updateTopics;
    (async () => {
      const result = await axios.get(listInTopicsUrl(format));
      update(Object.values(result.data.data.topics));
    })();
  };

  render() {
    return (
      <div>
        <Row>
          <Col md={3} sm={6} xs={12} className="mb-3">
            <div className="container">
              <div className="form-group files">
                <label>Upload Your CSV file:</label>
                <input type="file" className="form-control" multiple=""
                       onChange={this.onFileChange}/>
              </div>
            </div>
          </Col>
          <Col md={9} sm={6} xs={12} className="mb-3 vertical-flex">
            <div className="progress-container">
              <Progress
                key="file-upload-progress"
                animated
                color="secondary"
                value={this.state.percentCompleted}
                className="mb-3"
              />
              <h3>{this.state.rowsProcessed} rows processed</h3>
              <Row className="mb-3 topic-selection-row">
                <Button color="info" size="lg"
                        onClick={this.processCSVFile}
                        disabled={(this.state.file === undefined) ||
                                  (this.state.selectedTopic === undefined) ||
                                  (this.state.topicSchema === undefined)}>
                  Send
                </Button>
                <Input type="select" id="topic" className="topic-selection"
                       onChange={e => this.selectTopic(e.target.value || undefined)}>
                  <option value=''>Select the topic...</option>
                  {this.state.inTopics.map(t => (
                    <option value={t}>{prettyPrintTopicName(t)}</option>
                  ))}
                </Input>
              </Row>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={3} sm={6} xs={12} className="mb-3"/>
          <Col md={9} sm={6} xs={12} className="mb-3 vertical-flex">
            <div className="progress-container">
              {this.state.topicSchema &&
              <Card>
                <CardHeader>
                  Schema for {prettyPrintTopicName(this.state.selectedTopic)}
                </CardHeader>
                <CardBody>{prettyPrintSchema(this.state.topicSchema)}</CardBody>
              </Card>
              }
            </div>
          </Col>
        </Row>
      </div>

    );
  }
}

FileUpload.defaultProps = {};

export default FileUpload;