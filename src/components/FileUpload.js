import React, { Component } from 'react';
import { parse } from 'papaparse';
import { Button, Col, Input, Progress, Row } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';

const axios = require('axios');

 // TODO: move these to configuration file
const backendUrl = 'http://localhost:5000';
const sendMsgUrl = `${backendUrl}/send_message`;

const testTopic = 'test';
const sendMessageUrl = (topic) => `${backendUrl}/send_message?topic=${topic}`;
const sendFileDataUrl = `${backendUrl}/send_message?topic=${testTopic}`;

const listInTopicsUrl = `${backendUrl}/list_in_topics`;

const headerSize = (data) => {
  return Buffer.byteLength(Object.keys(data).toString());
};

const rowDataSize = (data) => {
  return Buffer.byteLength(Object.values(data).toString());
};

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: undefined,
      rowsProcessed: 0,
      percentCompleted: 0,
      inTopics: [],
      selectedTopic: undefined
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

  changePercentCompleted = (counter, avgRowByteSize, allRowsSize) => {
    this.setState({
      rowsProcessed: counter,
      percentCompleted: counter * (avgRowByteSize / allRowsSize) * 100,
    });
  };

  processFile = () => {
    const topicName = this.state.selectedTopic
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
          if (counter === 0) {
            allRowsSize -= headerSize(row);
            console.log('')
          }
          counter += 1;
          processedRowsByteSize += rowDataSize(row);
          averageRowByteSize = processedRowsByteSize / counter;
          updatePercent(counter, averageRowByteSize, allRowsSize);
          console.log('Processed a row!');

          axios.post(sendMessageUrl(topicName), row.data)
            .then(r => console.log(r));
        },
      });
      axios.post(sendFileDataUrl, {
        id: uuidv4(),
        filename: this.state.file.name,
        format: 'CSV',
        size: allRowsSize,
        rows: this.state.rowsProcessed,
        time: Date.now()
      }).then(r => console.log(r));
    }
  };

  updateTopics = (topics) => {
    this.setState({
      inTopics: topics
    })
  }

  listTopics = () => {
    const update = this.updateTopics;
    (async () => {
      const result = await axios.get(listInTopicsUrl);
      update(Object.values(result.data.data.topics))
    })();
  }

  render() {
    return (
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
            <Row>
              <Button color="info" size="lg"
                      onClick={this.processFile}
                      disabled={(this.state.file === undefined) ||
                      (this.state.selectedTopic === undefined)}>
                Send
              </Button>
              <Input type="select" id="topic"
                     onChange={e => this.setState(
                       { selectedTopic: e.target.value || undefined }
                       )}>
                <option value=''>Select the topic...</option>
                {this.state.inTopics.map(t => (
                  <option value={t}>{t.substring(3)}</option>
                ))}
              </Input>
            </Row>
          </div>
        </Col>
      </Row>
    );
  }
}

FileUpload.defaultProps = {};

export default FileUpload;