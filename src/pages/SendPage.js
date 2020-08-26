import Page from 'components/Page';
import FileUpload from '../components/FileUpload';
import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Col, Progress,
  Row,
} from 'reactstrap';

const SendPage = (props) => {

  const [activeTab, setActiveTab] = useState('1');

  const toggle = tab => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <Page title="Send data" breadcrumbs={[{ name: 'send data', active: true }]}>
      <Row>
        <Col md={12} sm={12} xs={12} className="mb-3">
          <Card>
            <CardBody>
              <FileUpload/>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Page>
  )
    ;
};

export default SendPage;
