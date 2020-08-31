const avro = require('avsc');

const avroSchema = (jsonSchema) => avro.Type.forSchema(JSON.parse(jsonSchema));

const decode = (avroSchema, encodedObject) => {
  return avroSchema.fromBuffer(encodedObject);
}

export {avroSchema, decode};