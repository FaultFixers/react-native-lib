import React from 'react';
import renderer from 'react-test-renderer';
import {Switch} from '../dist/test-bundle.js';
import {coreColors} from 'faultfixers-js-lib';

describe('Switch', function() {
    const noop = () => null;

    const numberFromHex = (hex) => {
        return Number('0x' + hex.replace(/^#/, ''));
    };

    it('should render a React Native <Switch> element', function() {
        const tree = renderer.create(<Switch value={true} onValueChange={noop} />).toJSON();
        expect(tree.type).toEqual('RCTSwitch');
    });

    it('should use the style property', function() {
        const style = {marginBottom: 20};
        const tree = renderer.create(<Switch value={true} onValueChange={noop} style={style} />).toJSON();
        expect(tree.props.style[1]).toEqual(style);
    });

    it('should have a lighter color for the "thumb" when the value is true', function() {
        const tree = renderer.create(<Switch value={true} onValueChange={noop} />).toJSON();

        const switchColor = numberFromHex(tree.props.onTintColor);
        const thumbColor = numberFromHex(tree.props.thumbTintColor);
        expect(thumbColor).toBeGreaterThan(switchColor);
    });

    it('should have a darker color for the "thumb" when the value is false', function() {
        const tree = renderer.create(<Switch value={false} onValueChange={noop} />).toJSON();

        const switchColor = numberFromHex(tree.props.onTintColor);
        const thumbColor = numberFromHex(tree.props.thumbTintColor);
        expect(thumbColor).toBeLessThan(switchColor);
    });

    it('should allow the "on" color to be customized', function() {
        const tree = renderer.create(<Switch value={true} onValueChange={noop} onColor='#abc123' />).toJSON();

        const switchColorHex = tree.props.onTintColor;
        const switchColorNumber = numberFromHex(switchColorHex);
        const thumbColorNumber = numberFromHex(tree.props.thumbTintColor);
        expect(switchColorHex).toBe('#abc123');
        expect(thumbColorNumber).toBeGreaterThan(switchColorNumber);
    });
});
