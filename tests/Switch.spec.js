import React from 'react';
import renderer from 'react-test-renderer';
import {Switch} from '../dist/test-bundle.js';

describe('Switch', function() {
    const noop = () => null;

    it('should render a React Native <Switch> element', function() {
        const tree = renderer.create(<Switch value={true} onValueChange={noop} />).toJSON();
        expect(tree.type).toEqual('RCTSwitch');
    });

    it('should use the style property', function() {
        const style = {marginBottom: 20};
        const tree = renderer.create(<Switch value={true} onValueChange={noop} style={style} />).toJSON();
        expect(tree.props.style[1]).toEqual(style);
    });
});
