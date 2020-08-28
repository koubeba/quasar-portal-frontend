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
  UncontrolledAlert,
} from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';

const avro = require('avsc');
const axios = require('axios');
require('../styles/file-upload.css');

// TODO: move these to configuration file
const backendUrl = 'http://localhost:5000';
const sendMsgUrl = `${backendUrl}/send_message`;
const schemaUrl = `${backendUrl}/get_schema`;

const testTopic = 'test';
const sendMessageUrl = (topic) => `${backendUrl}/send_message?topic=${topic}`;
const sendFileDataUrl = `${backendUrl}/send_message?topic=${testTopic}`;
const getSchemaUrl = (topic) => `${schemaUrl}?topic=${topic}`;

const listInTopicsUrl = `${backendUrl}/list_in_topics`;

const headerSize = (data) => {
  return Buffer.byteLength(Object.keys(data).toString());
};

const rowDataSize = (data) => {
  return Buffer.byteLength(Object.values(data).toString());
};

const prettyPrintSchema = (schema) => {
  console.log(schema)
  return (
    <CardText>
      {
        schema.fields.map(r => {
          return (
            <>
              <h5>{r.name} <Badge>{r.type}</Badge></h5>
              {'\n'}
            </>
          );
        })
      }
    </CardText>
  );
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
    this.listTopics();
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
      percentCompleted: 100
    })
  };

  changePercentCompleted = (counter, avgRowByteSize, allRowsSize) => {
    this.setState({
      rowsProcessed: counter,
      percentCompleted: counter * (avgRowByteSize / allRowsSize) * 100,
    });
  };

  processFile = () => {
    const topicName = this.state.selectedTopic;
    const avroSchema = avro.Type.forSchema(this.state.topicSchema);
    if (this.state.file !== undefined) {
      let counter = 0;
      let allRowsSize = this.state.file.size;
      let processedRowsByteSize = 0;
      let averageRowByteSize = 0;
      const updatePercent = this.changePercentCompleted;
      parse(this.state.file, {
        worker: true,
        header: true,
        step: function(row) {
          console.log(row.data)
          if (counter === 0) {
            allRowsSize -= headerSize(row.data);
          }
          counter += 1;
          processedRowsByteSize += rowDataSize(row.data);
          averageRowByteSize = processedRowsByteSize / counter;
          updatePercent(counter, averageRowByteSize, allRowsSize);
          console.log('Processed a row!');

          axios.post(sendMessageUrl(topicName),
            avroSchema.toBuffer(row.data),
          ).catch((error) => {
            console.log(error);
          });
        }, complete: this.setProgressToDone
      });
    }
  };

  updateSchemaState = (schema) => {
    this.setState({
      topicSchema: schema
    });
  };

  selectTopic = (topic) => {
    this.setState({
      selectedTopic: topic,
    });
    const updateSchemaState = this.updateSchemaState;
    if (topic) {
      (async () => {
        const result = await axios.get(getSchemaUrl(topic));
        updateSchemaState(JSON.parse(result.data.data.schema));
      })();
    } else {
      this.setState({
        topicSchema: undefined
      });
    }
  };

  updateTopics = (topics) => {
    this.setState({
      inTopics: topics,
    });
  };

  listTopics = () => {
    const update = this.updateTopics;
    (async () => {
      const result = await axios.get(listInTopicsUrl);
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
                <label>Upload Your File </label>
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
                        onClick={this.processFile}
                        disabled={(this.state.file === undefined) ||
                        (this.state.selectedTopic === undefined)}>
                  Send
                </Button>
                <Input type="select" id="topic" className="topic-selection"
                       onChange={e => this.selectTopic(e.target.value || undefined)}>
                  <option value=''>Select the topic...</option>
                  {this.state.inTopics.map(t => (
                    <option value={t}>{t.substring(3)}</option>
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
                <CardHeader>Schema for {this.state.selectedTopic.substring(3)}</CardHeader>
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