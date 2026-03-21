#!/bin/bash
# Run this with credentials that have IAM permissions (e.g. root or an admin IAM user).
# Not with AyushAdmin – that user has IAM denied.
#
# Usage:
#   export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...   # admin/root credentials
#   ./scripts/aws-attach-s3-policy.sh

set -e
USER_NAME="AyushAdmin"
BUCKET_NAME="images-files-123"
POLICY_NAME="CampaignAppS3Upload"

# Create the policy document
POLICY_JSON=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutGetUploads",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::images-files-123/uploads/*"
    }
  ]
}
EOF
)

echo "Creating IAM policy: $POLICY_NAME"
aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document "$POLICY_JSON" \
  --description "Allow PutObject/GetObject on campaign S3 uploads prefix" \
  2>/dev/null || echo "(Policy may already exist)"

echo "Attaching policy to user: $USER_NAME"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$POLICY_ARN"

echo "Done. User $USER_NAME can now upload to s3://$BUCKET_NAME/uploads/"
echo "Restart the app if needed: sudo systemctl restart campaign"
