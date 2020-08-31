import React from 'react';

const SentDataContext = React.createContext({
  topicOffsets: [],
  updateTopicOffsets: (newOffsets) => {}
});

export { SentDataContext };