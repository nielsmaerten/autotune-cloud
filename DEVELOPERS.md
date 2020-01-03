# Developer Documentation
This document will explain the high-level architecture of Autotune-Cloud, and show you how to deploy it yourself.  

## A. Architecture
Autotune-Cloud is made up of 2 high level components: a docker image, and a couple Firebase Cloud Functions.

### 1. Docker image
Found in `docker/`. This folder contains everything needed to set up a docker image that can run Autotune in response to an HTTP request.  
Starting the image using `docker-compose up --build` will create a container with:
* a basic installation of oref0 (OpenAPS) that can run oref0-autotune. At the time of writing, version 0.7.0 is used.
* a nodeJs express webserver. Send an HTTP GET request to this server to trigger an autotune run  
  parameters for autotune can be passed in using the querystring

### 2. Firebase Cloud Functions
Found in `firebase/`. This folder contains a firebase project consisting of 2 cloud functions:
* a scheduled function that runs every 15 minutes. This function queries the database (Firestore)
  to find all users that require an autotune run at that time. For each of those users, the function
  then creates a new document in the `jobs/` collection in Firestore
* a function that is triggered when a document gets created in the `jobs/` collection.
  This function will call the HTTP endpoint on the docker container above, and pass the user parameters in via the querystring
  
## B. Deploying
This section describes how to set up the entire system on your own.

### 1. Google Cloud Project
Create a new project on GCP. The project will need to have billing enabled, but it should stay within free limits under normal use.

### 2. Deploying the docker image
The docker image is meant to run on Google's Cloud Run infrastructure. 
The easiest way to deploy it, is by using the integrated cloud shell in the google cloud console.

Once you have the cloud shell open, check `docker/gcp-deploy.sh`. You can run this script directly or make changes as needed.
You may want to update region and the project id. After running the commands, you should have the docker image in your
container registry on GCP.

Now go to the 'Cloud Run' tab, and deploy a new instance based on the image you just pushed. Take note of the URL of the webservice,
you'll need this later. NB: you can add an environment value `TIMEOUT` and set it to the same number of seconds as the timeout on the
Cloud Run instance.

### 3. Deploying the Firebase functions
Add Firebase to the project that already contains the Cloud Run instance. 
You should have Cloud Functions, Firestore and Hosting enabled.

The functions will need to know the URL of the Cloud Run instance in order to call it.  
Set it by running this command in the `firebase/` directory 
```
npx firebase functions:config:set settings.autotune_url=[YOUR-CLOUDRUN-ENDPOINT]/api/v2/run-autotune
```
You may need to select your Firebase project first.

Once the url is set, build and deploy the functions by running:
```
npm i && npx firebase deploy
```

## C. Configuration
Finally, you'll need to add a collection `users/` to your Firestore database. 
In this collection, create a user document with the following fields:

* **categorizeUamAsBasal** (boolean) - Will be passed to oref0-autotune
* **enabled** (boolean) - If false, jobs won't be triggerd for this user
* **maxDecimals** (number) - Basal rates will be rounded to this number of decimals.  
  eg: '2' will round 0.456 to 0.46  
  This is required as not all pumps allow basal rates to have 3 decimals (autotune's default)
* **min5mCarbImpact** (number) - Check your own APS for this value. 8 is usually a good default.
  More info can be found here: https://openaps.readthedocs.io/en/latest/docs/While%20You%20Wait%20For%20Gear/preferences-and-safety-settings.html#min-5m-carbimpact
* **nextRun** (date) - In OpenAPS, autotune runs nightly at 4AM. Set this value to when you want Autotune
  to be triggered for the first time. After the first run, it will run again every 24 hours
* **nsSecret** (string) - The API secret of your nightscout site
* **nsSite** (string) - The full url of your nightscout site. Don't include a trailing backslash. 
  for example: `https://nightscout.herokuapp.com`
* **profileNames** (map)
  * **autotune** (string) - Name of the profile running on your pump, the one that should be tuned nightly
  * **backup** (string) - Name of your backup profile. This one won't be changed,
    but will serve as the baseline: Autotune will not deviate further from this profile than allowed by default autosens limits
