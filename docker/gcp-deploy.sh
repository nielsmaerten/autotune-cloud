#!/bin/bash

# Run this script in GCP Console to build and deploy the docker container to GCP Container Registry
# curl -s https://raw.githubusercontent.com/nielsmaerten/autotune-cloud/master/docker/gcp-deploy.sh | bash

rm -rf autotune-cloud/
git clone https://github.com/nielsmaerten/autotune-cloud
cd autotune-cloud/docker

# My project ID on google cloud is 'autotune-cloud', replace it here if needed
# export PROJECT_ID="$(gcloud config get-value project -q)"
export PROJECT_ID=autotune-cloud

docker build -t gcr.io/${PROJECT_ID}/autotune .
docker push gcr.io/${PROJECT_ID}/autotune