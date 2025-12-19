const AWS = require("aws-sdk");

const awsConfig = { region: process.env.AWS_REGION || "ap-south-1" };

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

AWS.config.update(awsConfig);

const s3 = new AWS.S3();

const S3_BUCKET = process.env.S3_BUCKET || "maviyabucket";

module.exports = { s3, S3_BUCKET };
