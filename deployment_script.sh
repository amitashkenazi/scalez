#!/bin/bash
STAGE=${1:-dev}

# Get the S3 bucket name and CloudFront distribution ID from serverless outputs
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name scale-management-system-${STAGE} --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name scale-management-system-${STAGE} --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)

echo "Deploying to bucket: $BUCKET_NAME"
echo "CloudFront distribution: $DISTRIBUTION_ID"

# Build the React app with production env
echo "Building React app..."
if [ "$STAGE" = "prod" ]; then
    echo "Using production configuration..."
    cp .env.production .env
fi

npm run build



# Upload to S3
echo "Uploading to S3..."
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"