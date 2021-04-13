# AWS Image conversion pipeline

# Instructions

## Backend

**Note**: This stack has only been tested in `us-east-1`. I can't predict if it's 100% going to work in other regions.

1. Install: `cd backend; npm i`
2. Deploy (**Note**: Docker needs to run in order to package Lambdas):

```
npx cdk deploy '*' --profile [your AWS profile] --require-approval never --parameters FromEmailAddress=[your email address]
```

e.g.

```
npx cdk deploy '*' --profile staging-us --require-approval never --parameters FromEmailAddress=some.email@yourdomain.com
```

**Important**: The email address you provide will be used as the email sender (`FROM` field). In order to simply have 1 email to verify through AWS SES, please reuse that same email address in the frontend application (SES sandbox will not allow using unverified email addresses for either the `FROM` and `TO` fields).

3. In the stack outputs, look for the API Gateway endpoint, e.g.:

```
Outputs:
BackendStack.myapiEndpoint8EB17201 = https://213880wiie.execute-api.us-east-1.amazonaws.com/prod/
```

4. Look for SES verification email in inbox for [your email address]. Click on link in email to validate email address in SES.

## Frontend

1. Install: `cd frontend; npm i`
2. Modify the `.env` file to include the API Gateway endpoint and same email address used to setup Backend, e.g.:

```
REACT_APP_API_BASE_URL==https://213880wiie.execute-api.us-east-1.amazonaws.com/prod/
REACT_APP_DEFAULT_EMAIL=some.email@yourdomain.com
```

3. Start app: `npm start`
4. Open app (typically http://localhost:3000)
5. Choose picture and upload.
6. Open inbox for [your email address] to find email with converted image

Note: Email with converted image may land in your spam folder.
