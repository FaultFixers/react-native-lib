FaultFixers reporter websites
=============================

## Install

```
yarn
cp config/example.js config/local.js
# Now configure the file config/local.js
```

To run in dev mode: `FF_ENV=local DEBUG=reporter-web:* npm start`

Add this line to your `/etc/hosts`:

```
127.0.0.1    wework.faultfixers.local islington.faultfixers.local dundermifflin.faultfixers.local
```

Set up the Git pre-commit hook to prevent committing simple mistakes:

```
ln -s ../../bin/pre-commit .git/hooks/pre-commit
```

The API contains some fixture websites:
* wework.faultfixers.local
* islington.faultfixers.local
* dundermifflin.faultfixers.local

## Development

If you add an icon in `src/public/images`, re-generate the icon font with `grunt webfont`.

## Setting up a new website

First, create a record in the admin app.

Next, create a DNS record for the domain, as a CNAME, with the target being one of these:

Production: reporter-websites.faultfixers.com
Staging: staging-reporter-websites.faultfixers.com
Dev: dev-reporter-websites.faultfixers.com

The CNAME IPs are (as of 12 November 2018):

reporter-websites.faultfixers.com: 35.177.198.241
staging-reporter-websites.faultfixers.com: 35.178.27.94
dev-reporter-websites.faultfixers.com: 52.56.175.217

## Deployment

To update: `git fetch origin && git reset origin/master --hard && yarn && killall node`
