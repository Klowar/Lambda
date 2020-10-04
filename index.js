const AWS = require('aws-sdk')
const api = require("libheif").default;
const fs = require("fs");
const { v4 } = require('uuid');

const s3 = new AWS.S3();
const BUCKET_NAME = "YOUR_BUCKET_NAME";

const download = async function (filename, key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };
    var origimage = await s3.getObject(params).promise();
    console.log(origimage);
    return new Promise(res => {
        const file = fs.createWriteStream(filename);
        file.write(origimage.Body, () => {
            file.end();
            res();
        });
    });
}

exports.handler = async (event, context, callback) => {
    const urls = event.files;
    const result = `/tmp/${v4()}.heic`;
    // Get files from S3
    const files = urls.map(_ => `/tmp/${_}`);
    await Promise.all(urls.map(_ => download(`/tmp/${_}`,_)))
    // Create heic from uploaded images
    api.createHeic([result, files[0]]);
    // Read result heic and upload to S3
    const buffer = fs.readFileSync(result);
    const upload_params = {
        Body: buffer, 
        Bucket: BUCKET_NAME, 
        Key: result
    };
    await s3.putObject(upload_params).promise();
    
    const response = {
        statusCode: 200,
        body: result
    };
    return response;
};
