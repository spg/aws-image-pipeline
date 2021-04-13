import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import * as s3 from "@aws-cdk/aws-s3";
import * as path from "path";
import * as s3n from "@aws-cdk/aws-s3-notifications";
import * as iam from "@aws-cdk/aws-iam";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as cr from "@aws-cdk/custom-resources";

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Improvement ideas:
     * - Configure lifecycle policy to expire uploaded files after a set number of days
     */
    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
        },
      ],
    });

    const ouputBucket = new s3.Bucket(this, "OutputBucket");

    /**
     * Improvement ideas:
     * - Limit log retention
     */
    const uploadFunc = new lambda.NodejsFunction(this, "upload", {
      environment: { BUCKET_NAME: uploadBucket.bucketName },
      entry: path.join(__dirname, "upload/index.ts"),
    });

    const distro = new cloudfront.Distribution(this, "Distro", {
      defaultBehavior: { origin: new origins.S3Origin(ouputBucket) },
    });

    const fromEmailAddressParam = new cdk.CfnParameter(
      this,
      "FromEmailAddress"
    );
    const fromEmailAddress = fromEmailAddressParam.valueAsString;

    /**
     * Improvement ideas:
     * - Limit log retention
     * - Fine tune memory and timeout (TBD depending on file sizes)
     */
    const convertFunc = new lambda.NodejsFunction(this, "convert", {
      entry: path.join(__dirname, "convert/index.ts"),
      bundling: { nodeModules: ["sharp"] },
      timeout: cdk.Duration.minutes(2),
      environment: {
        DESTINATION_BUCKET: ouputBucket.bucketName,
        DISTRO_DOMAIN_NAME: distro.domainName,
        FROM_EMAIL_ADDRESS: fromEmailAddress,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["ses:SendEmail"],
          resources: ["*"],
        }),
      ],
    });

    uploadBucket.addObjectCreatedNotification(
      new s3n.LambdaDestination(convertFunc)
    );
    uploadBucket.grantRead(convertFunc);
    uploadBucket.grantPut(uploadFunc);

    ouputBucket.grantWrite(convertFunc);

    new apigateway.LambdaRestApi(this, "API", {
      handler: uploadFunc,
    });

    new cr.AwsCustomResource(this, "EmailVerification", {
      onUpdate: {
        service: "SESV2",
        action: "createEmailIdentity",
        parameters: {
          EmailIdentity: fromEmailAddress,
        },
        physicalResourceId: cr.PhysicalResourceId.of(fromEmailAddress),
      },
      onDelete: {
        service: "SESV2",
        action: "deleteEmailIdentity",
        parameters: {
          EmailIdentity: fromEmailAddress,
        },
      },
      /**
       * Since SES V2 uses the same service prefix ("ses:..") as SES for IAM Actions,
       * we cannot use cr.AwsCustomResourcePolicy.fromSdkCalls(...) here
       */
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["ses:createEmailIdentity", "ses:deleteEmailIdentity"],
          resources: ["*"],
        }),
      ]),
    });
  }
}
