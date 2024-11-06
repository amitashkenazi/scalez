import os
import boto3
import mimetypes
import time
from pathlib import Path

def deploy_react_app(build_dir='build', stage='dev'):
    """
    Deploy React app to S3 and invalidate CloudFront cache
    
    Parameters:
    build_dir (str): Path to React build directory
    stage (str): Deployment stage (dev, prod, etc.)
    """
    # Initialize AWS clients
    s3 = boto3.client('s3')
    cloudfront = boto3.client('cloudfront')
    
    # Get bucket name and CloudFront distribution ID from environment or parameters
    bucket_name = f'scale-management-system-website-{stage}'
    
    print(f'Deploying to bucket: {bucket_name}')
    
    # Walk through the build directory
    build_path = Path(build_dir)
    for path in build_path.rglob('*'):
        # Skip directories
        if path.is_dir():
            continue
            
        # Get relative path
        relative_path = str(path.relative_to(build_dir))
        
        # Normalize path separators
        relative_path = relative_path.replace('\\', '/')
        
        # Guess content type
        content_type = mimetypes.guess_type(str(path))[0]
        if content_type is None:
            if path.suffix == '.js':
                content_type = 'application/javascript'
            elif path.suffix == '.css':
                content_type = 'text/css'
            elif path.suffix == '.json':
                content_type = 'application/json'
            else:
                content_type = 'application/octet-stream'
        
        print(f'Uploading: {relative_path} ({content_type})')
        
        # Upload file
        with path.open('rb') as f:
            extra_args = {
                'ContentType': content_type,
            }
            
            # Set appropriate caching headers
            if relative_path == 'index.html':
                extra_args['CacheControl'] = 'no-cache, no-store, must-revalidate'
            elif any(relative_path.startswith(prefix) for prefix in ['static/', 'assets/']):
                extra_args['CacheControl'] = 'public, max-age=31536000, immutable'
            else:
                extra_args['CacheControl'] = 'public, max-age=3600'
                
            s3.upload_fileobj(
                f,
                bucket_name,
                relative_path,
                ExtraArgs=extra_args
            )
    
    print('Upload complete!')
    
    # Get CloudFront distribution ID and domain name
    response = cloudfront.list_distributions()
    distribution_id = None
    domain_name = None
    
    for distribution in response['DistributionList']['Items']:
        if f'{bucket_name}.s3' in distribution['Origins']['Items'][0]['DomainName']:
            distribution_id = distribution['Id']
            domain_name = distribution['DomainName']
            break
    
    if distribution_id:
        print(f'Creating CloudFront invalidation for distribution: {distribution_id}')
        cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': ['/*']
                },
                'CallerReference': str(int(time.time()))
            }
        )
        print('CloudFront invalidation created!')
        
        if domain_name:
            print('\nYour application is available at:')
            print(f'https://{domain_name}')
            print('\nNote: It may take a few minutes for the CloudFront invalidation to complete.')
    
    print('\nDeployment completed successfully!')

if __name__ == '__main__':
    import sys
    stage = sys.argv[1] if len(sys.argv) > 1 else 'dev'
    deploy_react_app(stage=stage)