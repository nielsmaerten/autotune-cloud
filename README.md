
# Autotune Cloud
Iteratively run Autotune for people using AndroidAPS and Loop  
[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/6da840e2363e08be7c69)

## What is Autotune?
Autotune uses historic data from Nightscout to automatically tune your basal profile.  Or, in the [words of Dana Lewis](https://diyps.org/2017/01/20/autotune-automatically-assessing-basal-rates-isf-and-carb-ratio-with-openaps-and-even-without-it/):
> What if, instead of guessing needed changes (the current most used method) basal rates, ISF, and carb ratios…we could use data to empirically determine how these ratios should be adjusted? Meet Autotune.

If you're running an OpenAPS rig, Autotune can automatically adjust your settings every night. We call this **iterative tuning**. Unfortunately, this feature is not available to users of AndroidAPS and Loop. But that's where Autotune Cloud comes in.

## What does Autotune Cloud do?
If you only want to run Autotune sporadically, I suggest checking out [Autotune Web](https://autotuneweb.azurewebsites.net/). But if you're interested in running Autotune every night/week/month/... then Autotune Cloud is for you.
I'm currently testing Autotune Cloud privately. Every night at 1 AM, Autotune analyzes my Nightscout data of the past day. Then my pump is automatically updated with the tuned profile.

## Deprecation notice
This project is no longer maintained. 
- After v2.8, AndroidAPS stopped accepting profile changes coming from Nightscout, making remotely updating/tuning the profile impractical.
- The HTTPS API endpoint still exists and you can still use it if you want.
  - If you want to tune on a schedule, you'll have to write your own cron job to trigger the endpoint at regular intervals.
- AutotuneCloud has not been tested with the latest version of Nightscout
  - Be very cautious before allowing it to update your profile on its own
- If you want to set up this full project on your own, refer to [DEVELOPERS.md](./DEVELOPERS.md)
- If you're interested in running Autotune with AndroidAPS, check out [this PR](https://github.com/nightscout/AndroidAPS/pull/34) by Philoul.

## HTTPS API
Autotune Cloud has a publicly available API at:
```
https://autotune.lab.glucocheck.app/api/v2/run-autotune
```
You can run Autotune for yourself by visiting the URL above.  
Configure Autotune by appending parameters to the URL like so:  
`?parameter1=value1&parameter2=value2` and so on...

| Parameter | Default value | Required? | Info |
|-----------|---------------|-----------|------|
| `nsSite` | - | Yes | The full url of your Nightscout site. E.g.: https://cgm.herokuapp.com |
| `nsSecret` | - | Yes | The API key of your Nightscout site. We will not keep this value any longer than needed.|
|`categorizeUamAsBasal`| - |No|Only add this option if you enter **ALL** carbs into Nightscout (even rescue/low carbs). See [OpenAPS docs](https://openaps.readthedocs.io/en/latest/docs/While%20You%20Wait%20For%20Gear/preferences-and-safety-settings.html#min-5m-carbimpact) for more info. |
|`writeRecommendations`| - |No|Adding this parameter will automatically update your profile in Nightscout to the autotuned recommendations. Leave this parameter out to just receive the results. |
|`startDaysAgo`|1|No|How many days Autotune should analyze when tuning your profile. |
|`min5mCarbImpact`|8|Yes|You'll find this value in your AndroidAPS settings. See [OpenAPS docs](https://openaps.readthedocs.io/en/latest/docs/While%20You%20Wait%20For%20Gear/preferences-and-safety-settings.html#min-5m-carbimpact) for more info. |
|`profileNames[backup]`|Backup Profile|No|The name of your Nightscout profile that's considered the baseline. See further for more info. |
|`profileNames[autotune]`|Autotune|No|The name of the profile that should be tuned and (if `writeRecommendations` is enabled) updated. |

## Profile requirements
You need to have 2 profiles in your Nightscout:

* a profile called "Autotune", which should be the one you're using on your rig. This one will be updated automatically
* a profile called "Backup Profile". Autotune will not deviate further than 20% from this profile, and it can be used as a fallback in case anything goes wrong.

If you have these profile, but they have different names, use the `profileNames` parameter to set them.

## A full example
Calling the following url will perform a full Autotune run on https://cgm.herokuapp.com and return the results. It won't automatically change any profiles.
```
https://autotune.lab.glucocheck.app/api/v2/run-autotune?nsSite=https://cgm.herokuapp.com&nsSecret=xyz&min5mCarbImpact=8
```
