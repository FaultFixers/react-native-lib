module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "amd": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2017
    },
    "rules": {
        "arrow-body-style": 0,
        "object-curly-spacing": [2, "never"],
        "max-len": [
            "error", {"code": 160},
        ],
        "global-require": 0,
        "class-methods-use-this": 0,
        "prefer-destructuring": 0,
        "no-plusplus": 0,
        "no-return-assign": 0,
        "indent": ["error", 4],
        "arrow-parens": 0,
        "no-nested-ternary": 0,
        "no-else-return": 0,
        "import/no-extraneous-dependencies": 0,
        "import/prefer-default-export": 0,
        "comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "functions": "ignore",
        }],
        "no-param-reassign": 0,
        "default-case": 0,
        "no-underscore-dangle": 0,
        "prefer-rest-params": 0,
        "prefer-template": 0,
        "no-use-before-define": 0,
        "no-console": 0,
        "no-case-declarations": 0
    },
    "globals": {
        "doApiPostRequest": 0,
        "doApiFileUpload": 0,
        "doApiRequest": 0,
        "Logger": 0,
    }
};
