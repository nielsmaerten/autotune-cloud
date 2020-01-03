# Autotune Docker Cloud
Runs oref0-autotune
* in a docker container
* as an HTTP webservice
* for any nightscout site
* and pushes the results back to nightscout

## This is a Work in Progress...

## Purpose
This is meant to replace the nightly run of Autotune
that exists on OpenAPS rigs.  
Since this feature is not available in AndroidAPS.

Make an HTTP request like this one:
```
http://127.0.0.1:3000/api/v2/run-autotune?nsSite=[NS-SITE]&nsSecret=[NS-SECRET]&maxDecimals=2&writeRecommendations
```

Replace [NS-SITE] with the URL of your own Nightscout site. (eg https://my-ns.herokuapp.com) and [NS-SECRET] with your API secret

This will: 
* Fetch your current profile from your Nightscout site  
* Run Autotune on your data of the past day
* Update the profile on your site with the results

## Requirements
You need to have 2 profiles in your Nightscout:
* a profile called "Autotune", which should be the one you're using on your rig. This one will be updated automatically
* a profile called "Backup Profile". Autotune will not deviate further than 20% from this profile, and it can be used as a fallback in case anything goed wrong.

## Options
All of these can be passed using the querystring
* `profileNames[autotune]`: Name of the profile to be tuned and auto-updated. Default: `Autotune`
* `profileNames[backup]`: Name of your backup profile. Default: `Backup Profile`
* `min5mCarbImpact`: Default: `8`
* `categorizeUamAsBasal`: Default: `false`
* `nsSite`: Full URL of the Nightscout site to be tuned. Required.
* `nsSecret`: API Secret of the Nightscout site. Required if you want the Nightscout profile to be updated
* `writeRecommendations`: Default `false`. CAREFUL! By default you'll just receive the Autotune recommendations, but Nightscout won't be updated. If you add this option (no matter its value), recommendations will be applied directly to Nightscout.

## Next steps...
To use this service, you still need
* a cron job that calls it every night **
* an automation task in AndroidAPS to switch your profile after it's been updated

These functions will eventually be implemented in this project natively.
  
** This is now available in private beta. Contact me if you'd like to join.  
I will add you to the list of users, and Autotune will run nightly for you.