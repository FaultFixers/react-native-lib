import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import Spinner from 'react-native-spinkit';
import {coreColors} from 'faultfixers-js-lib';

const colorsArray = Object.values(coreColors);

const CHANGE_COLOR_INTERVAL = 2000;

const LoadingStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        zIndex: 100,
    },
    spinner: {
        position: 'absolute',
        zIndex: 5,
    },
    darkBackground: {
        position: 'absolute',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#00000022',
        zIndex: 4,
    },
});

class LoadingSpinner extends Component {
    state = {
        color: colorsArray[0],
        isVisible: false,
    }
    colorIndex = 0;
    intervalId = null;

    getColor() {
        return colorsArray[this.colorIndex];
    }

    show() {
        this.showFromColorIndex(0);
    }

    showWhenScreenBackgroundIsBlue() {
        this.showFromColorIndex(1);
    }

    showFromColorIndex(startIndex) {
        if (this.state.isVisible) {
            return;
        }

        this.colorIndex = startIndex;
        this.setState({
            isVisible: true,
            color: this.getColor(),
        });

        this.intervalId = setInterval(() => {
            if (this.colorIndex === colorsArray.length - 1) {
                this.colorIndex = 0;
            } else {
                this.colorIndex++;
            }
            this.setState({color: this.getColor()});
        }, CHANGE_COLOR_INTERVAL);
    }

    hide() {
        this.setState({isVisible: false});
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    render() {
        if (!this.state.isVisible) {
            return null;
        }

        return (
            <View style={LoadingStyles.container}>
                <Spinner style={LoadingStyles.spinner} isVisible={true} size={100} type={'Bounce'} color={this.state.color} />
                <View style={LoadingStyles.darkBackground} />
            </View>
        );
    }
}

let elRef;

export default {
    element: <LoadingSpinner ref={ref => elRef = ref} />,
    show() {
        if (elRef) {
            elRef.show();
        }
    },
    showWhenScreenBackgroundIsBlue() {
        if (elRef) {
            elRef.showWhenScreenBackgroundIsBlue();
        }
    },
    hide() {
        if (elRef) {
            elRef.hide();
        }
    },
};
