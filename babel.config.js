module.exports = function babel(api) {
    api.cache(true);

    return {
        presets: ['module:metro-react-native-babel-preset'],
    };
};
