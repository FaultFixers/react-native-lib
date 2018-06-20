import React from 'react';
import renderer from 'react-test-renderer';
import {LoadingSpinner} from '../dist/test-bundle.js';
import ShallowRenderer from 'react-test-renderer/shallow';

describe('LoadingSpinner', function() {
    it('should render an element', function() {
        expect(LoadingSpinner.element.$$typeof).toBe(Symbol.for('react.element'));
    });

    it('should have a "show" method', function() {
        expect(LoadingSpinner.show).toBeInstanceOf(Function);
    });

    it('should have a "showWhenScreenBackgroundIsBlue" method', function() {
        expect(LoadingSpinner.showWhenScreenBackgroundIsBlue).toBeInstanceOf(Function);
    });

    it('should have a "hide" method', function() {
        expect(LoadingSpinner.hide).toBeInstanceOf(Function);
    });
});
