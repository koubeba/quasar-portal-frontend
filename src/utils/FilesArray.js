import React from 'react';

const addFile = (files, filesToAdd) => {
  files.unshift(filesToAdd);
  return files.slice(0, 10);
}

const FilesContext = React.createContext({
  files: [],
  lastOffset: 0,
  addFile: () => {},
  updateOffset: () => {}
});

export { addFile, FilesContext };