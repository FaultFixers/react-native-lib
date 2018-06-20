import React, {Component} from 'react';
import {Text} from 'react-native';
import PropTypes from 'prop-types';
import ReactMoment from 'react-moment';
import {toTitleCase} from 'faultfixers-js-lib';

export default class Moment extends Component {
    static propTypes = {
        date: PropTypes.instanceOf(Date).isRequired,
        style: PropTypes.any,
        fromNow: PropTypes.bool,
        format: PropTypes.string,
        /**
         * When used in conjunction with `fromNow`, converts the output string to title case.
         */
        titleCase: PropTypes.bool,
        /**
         * When used in conjunction with `fromNow`, prevents the output string being in the future.
         *
         * Useful when the local device and a remote server don't have the exact same time.
         */
        maxNow: PropTypes.bool,
    }

    constructor(props) {
        if (!props.fromNow && !props.format) {
            throw new Error('fromNow or format is required');
        }

        super(props);
    }

    render() {
        const date = (this.props.maxNow === true && this.props.date.getTime() > Date.now()) ? new Date() : this.props.date;
        const filter = (this.props.fromNow === true && this.props.titleCase === true ? toTitleCase : undefined);

        return (
            <ReactMoment element={Text} style={this.props.style} fromNow={this.props.fromNow} format={this.props.format} filter={filter}>
                {date}
            </ReactMoment>
        );
    }
}
