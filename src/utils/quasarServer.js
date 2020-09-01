const axios = require('axios');

// TODO: move to configuration file

const backendUrl = 'https://sleepy-island-55053.herokuapp.com';
const connectionInfoUrl = `${backendUrl}/connected`;
const inTopicsOffsetsUrl = `${backendUrl}/get_in_topics_offsets`;
const sendMsgUrl = `${backendUrl}/send_message`;
const getMsgUrl = `${backendUrl}/get_messages`;
const schemaUrl = `${backendUrl}/get_schema`;

const getOutTopicsUrl = `${backendUrl}/list_out_topics`;
const sendMessageUrl = (topic) => `${backendUrl}/send_message?topic=${topic}`;
const getMessagesUrl = (topic, count) => `${getMsgUrl}?topic=${topic}&count=${count}`;
const getSchemaUrl = (topic) => `${schemaUrl}?topic=${topic}`;


const getSchema = async (topic) => {
  const result = await getFromServer(getSchemaUrl(topic));
  return JSON.parse(result.data.data.schema);
};

const getOutTopics = async () => {
  const result = await getFromServer(getOutTopicsUrl);
  return result.data.data.topics;
};

const getInTopicsOffsets = async () => {
  const result = await getFromServer(inTopicsOffsetsUrl);
  return result.data.data.topic_offsets;
};

const getConnectionInfo = async () => {
  const result = await getFromServer(connectionInfoUrl);
  return result.data.data.connected_brokers;
};

const getMessages = async (topic, count) => {
  const result = await getFromServer(getMessagesUrl(topic, count));
  return result.data.data.messages;
};

const getFromServer = async (callUrl) => axios.get(callUrl);
const listInTopicsUrl = (format) => `${backendUrl}/list_in_topics?format=${format}`;


export {
  getSchemaUrl,
  getOutTopics, getInTopicsOffsets,
  getSchema, getConnectionInfo,
  getMessages, sendMessageUrl, listInTopicsUrl,
};