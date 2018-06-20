# FaultFixers React Native lib

Provides some common code that can be used across the FaultFixers React Native apps.

## Install

```
yarn
```

## Development

Set up the Git pre-commit hook to prevent committing simple mistakes:

```
ln -s ../../bin/pre-commit .git/hooks/pre-commit
```

## Use

The example below shows how to use the `Moment` component.

```
import {Moment} from 'faultfixers-react-native-lib';
<Moment date={date} fromNow />
```
