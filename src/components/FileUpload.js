import React, { Component } from 'react';
import { parse } from 'papaparse';
import { Button, Col, Progress, Row } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';

const axios = require('axios');

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
    };
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
          if (counter === 0) allRowsSize -= headerSize(row);
          counter += 1;
          processedRowsByteSize += rowDataSize(row);
          averageRowByteSize = processedRowsByteSize / counter;
          updatePercent(counter, averageRowByteSize, allRowsSize);
          console.log('Processed a row!');

          axios.post('http://localhost:5000/send_message', row.data)
            .then(r => console.log(r));
        },
      });
      axios.post('http://localhost:5000/send_file_data', {
        id: uuidv4(),
        filename: this.state.file.name,
        format: 'CSV',
        size: allRowsSize,
        rows: this.state.rowsProcessed,
        time: Date.now()
      }).then(r => console.log(r));
    }
  };

  fileInputLabel = () => {
    if (this.state.file === undefined) return 'Upload Your File'
    else return this.state.file.name
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
            <h3> {this.state.rowsProcessed} rows processed</h3>
            <Button color="info" size="lg"
                    onClick={this.processFile}
                    disabled={(this.state.file === undefined)}>
              Send
            </Button>
          </div>
        </Col>
      </Row>
    );
  }
}

FileUpload.defaultProps = {};

export default FileUpload;