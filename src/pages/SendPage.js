import Page from 'components/Page';
import FileUpload from '../components/FileUpload';
import React, from 'react';
import {
  Card,
  CardBody,
  Col,
  Row,
} from 'reactstrap';

const SendPage = (props) => {

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
