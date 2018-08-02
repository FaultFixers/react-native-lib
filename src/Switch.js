import React, {Component} from 'react';
import {Switch as NativeSwitch} from 'react-native';
import PropTypes from 'prop-types';
import {coreColors} from 'faultfixers-js-lib';

const offColor = '#cccccc';
const onColor = coreColors.pink;

export default class Switch extends Component {
    static propTypes = {
        value: PropTypes.bool.isRequired,
        onValueChange: PropTypes.func.isRequired,
        style: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    };

    render() {
        return (
            <NativeSwitch
                value={this.props.value}
                onValueChange={this.props.onValueChange}
                tintColor={offColor}
                onTintColor={onColor}
                thumbTintColor={this.props.value ? onColor : offColor}
                style={this.props.style}
            />
        );
    }
}
