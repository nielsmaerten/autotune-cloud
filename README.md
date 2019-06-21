# Autotune Docker Cloud

### https://autotune.diabase.app <== Try it out :)

_Run oref-autotune as a dockerized HTTP service_

### Information

This image is based on [autotune-docker](https://github.com/p5nbTgip0r/autotune-docker) and is designed to allow you to run `oref0-autotune` ([docs](http://openaps.readthedocs.io/en/latest/docs/Customize-Iterate/autotune.html)) without needing to have a full copy of oref0 installed to your system. 

### Comparison to AutotuneWeb and autotune-docker
**[Autotune Web](https://autotuneweb.azurewebsites.net/)** allows you to enter the URL to your Nightscout profile, and then runs autotune for you in the cloud.

**[autotune-docker](https://autotuneweb.azurewebsites.net/)** lets you run autotune on your own machine, without having to install dependencies or go through the setup.

**autotune-cloud (this project)** adds an HTTP server on top of autotune-docker, making it functionally equivalent to Autotune Web, but with better scalability and faster results. You can still run it yourself without too much setup, or in the cloud on a Kubernetes cluster.


### Starting the http service

Go into the directory that includes `docker-compose.yaml` and run  
```ssh
docker-compose up --build
```

### cURL command
To run oref0-autotune on your own Nightscout site, send this POST request to the server:
```curl
curl -X POST \
  'http://localhost:3000?nsHost=https://my.ns.site&startDate=2019-05-25' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Host: localhost:3000' \
  -F profile=@/path/to/your/profile.json
```
The following query parameters are available:
* ``nsHost``: the url to your nightscout site
* ``startDate``: default=null
* ``endDate``: default=null
* ``startDaysAgo``: default=1
* ``endDaysAgo``: default=null
* ``categorizeUamAsBasal``: default=false
