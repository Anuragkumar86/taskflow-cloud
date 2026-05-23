// Simple script to test S3 upload using environment credentials
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION || 'us-east-1';

if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('Missing AWS config. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET_NAME in .env');
  process.exit(1);
}

(async () => {
  const s3 = new S3Client({ region, credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }});

  const key = `test/test-upload-${Date.now()}.txt`;
  const body = 'This is a test upload from taskflow test script.';

  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'text/plain' }));
    console.log('S3 upload succeeded:', key);
    console.log(`Object URL: https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  } catch (err) {
    console.error('S3 upload failed:', err.message || err);
    process.exit(2);
  }
})();
