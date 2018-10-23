FaultFixers reporter websites
=============================

## Install

```
yarn
cp config/example.js config/local.js
# Now configure the file config/local.js
```

To run in dev mode: `FF_ENV=local DEBUG=reporter-web:* npm start`

## Development

Set up the Git pre-commit hook to prevent committing simple mistakes:

```
ln -s ../../bin/pre-commit .git/hooks/pre-commit
```
