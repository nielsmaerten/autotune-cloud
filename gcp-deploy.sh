#!/bin/bash

# Run this script in GCP Console to build and deploy the docker container to GCP Container Registry
# curl -s https://raw.githubusercontent.com/nielsmaerten/autotune-docker-cloud/master/gcp-deploy.sh | bash

rm -rf autotune-docker-cloud/
git clone https://github.com/nielsmaerten/autotune-docker-cloud
cd autotune-docker-cloud/
export PROJECT_ID="$(gcloud config get-value project -q)"
docker build -t gcr.io/${PROJECT_ID}/autotune .
docker push gcr.io/${PROJECT_ID}/autotune