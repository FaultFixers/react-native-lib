import React, {Component} from 'react';
import {Switch as NativeSwitch} from 'react-native';
import PropTypes from 'prop-types';
import {coreColors, getTint} from 'faultfixers-js-lib';

const DEFAULT_OFF_COLOR = '#cccccc';
const DEFAULT_ON_COLOR = coreColors.pink;

export default class Switch extends Component {
    static propTypes = {
        value: PropTypes.bool.isRequired,
        onValueChange: PropTypes.func.isRequired,
        style: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
        onColor: PropTypes.string,
    };

    render() {
        const onColor = this.props.onColor ? this.props.onColor : DEFAULT_ON_COLOR;

        return (
            <NativeSwitch
                value={this.props.value}
                onValueChange={this.props.onValueChange}
                trackColor={{true: onColor, false: DEFAULT_OFF_COLOR}}
                thumbColor={getTint(this.props.value ? onColor : DEFAULT_OFF_COLOR, 40)}
                style={this.props.style}
            />
        );
    }
}
