import { Context, S3Event } from "aws-lambda";
import * as AWS from "aws-sdk";

const sharp = require("sharp");

const S3 = new AWS.S3({
  signatureVersion: "v4",
});

const SES = new AWS.SESV2();

const destinationBucket = process.env.DESTINATION_BUCKET!;
const distroDomainName = process.env.DISTRO_DOMAIN_NAME!;
const fromEmailAddress = process.env.FROM_EMAIL_ADDRESS;

export const handler = async (event: S3Event, context: Context) => {
  console.log(JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const {
      s3: {
        bucket: { name: Bucket },
        object: { key: Key },
      },
    } = record;

    const { Body, Metadata } = await S3.getObject({
      Bucket,
      Key,
    }).promise();

    const key = `${uuidv4()}.jpg`;
    await S3.putObject({
      Body: await sharp(Body).resize(500, 500).jpeg().toBuffer(),
      Key: key,
      Bucket: destinationBucket,
    }).promise();

    await SES.sendEmail({
      Content: {
        Simple: {
          Subject: { Data: "Your image is ready" },
          Body: { Text: { Data: `https://${distroDomainName}/${key}` } },
        },
      },
      Destination: { ToAddresses: [Metadata!.email] },
      FromEmailAddress: fromEmailAddress,
    }).promise();
  }
};

// https://stackoverflow.com/a/8809472
function uuidv4() {
  var d = new Date().getTime(); //Timestamp
  var d2 = 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      // Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
