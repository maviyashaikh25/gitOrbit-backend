AWS credentials and recommended setup

Overview

- Don't use AWS root account keys. Create an IAM user with least-privilege or use IAM roles (recommended for EC2/ECS/EKS).
- This repo prefers the AWS SDK default credential provider chain. That means the SDK will look in this order (simplified):
  1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  2. AWS_PROFILE (credentials in ~/.aws/credentials and ~/.aws/config)
  3. EC2/ECS/EKS instance metadata (IAM role attached to the instance/task)

Local developer options (safe)

- Option A (recommended for local dev): configure an AWS CLI profile with minimum permissions and set AWS_PROFILE before running:

  - aws configure --profile gitorbit-dev
  - Then run: setx AWS_PROFILE gitorbit-dev (or in PowerShell: $Env:AWS_PROFILE = "gitorbit-dev")

- Option B (only for quick local testing): create an IAM user with the minimal policy in `iam/s3-least-privilege-policy.json`, then place keys in a local `.env` (DO NOT COMMIT).
  - Copy `config/.env.example` to `config/.env` and fill in keys.

Using IAM roles in production

- For servers/containers, attach an IAM role with the necessary permissions. The SDK will pick up temporary credentials automatically from the instance metadata.

Testing your configuration

1. If using env vars (PowerShell):
   $Env:AWS_ACCESS_KEY_ID = "AKIA..."
   $Env:AWS_SECRET_ACCESS_KEY = "..."
   $Env:AWS_REGION = "ap-south-1"
   node index.js push

2. If using an AWS CLI profile:

   # set in PowerShell

   $Env:AWS_PROFILE = "gitorbit-dev"
   node index.js push

3. If push still fails with credentials error:
   - Confirm the credentials have S3 permissions for `maviyabucket` (list, get, put, delete).
   - Run `aws sts get-caller-identity --profile gitorbit-dev` to verify which identity is used.

Security notes

- Never check real keys into source control. Add `.env` to `.gitignore`.
- Prefer IAM roles and temporary credentials for servers.
- Rotate keys periodically and follow least-privilege principles.
