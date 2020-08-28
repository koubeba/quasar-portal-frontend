const avro = require('avro-js');

const parseSchema = (jsonSchema) => {
  return avro.parse(jsonSchema);
}

const encode = (avroSchema, objectJson) => {
  return avroSchema.toBuffer(objectJson);
}

const decode = (avroSchema, encodedObject) => {
  return avroSchema.fromBuffer(encodedObject);
}

export {parseSchema, encode, decode};