import React from 'react';
import renderer from 'react-test-renderer';
import {Moment} from '../dist/test-bundle.js';
import ShallowRenderer from 'react-test-renderer/shallow';

describe('Moment', function() {
    const now = new Date();
    const fiveSecondsInFuture = new Date(Date.now() + 5000);
    const twoHoursAgo = new Date(Date.now() - (60000 * 60 * 2));
    const may23 = new Date(2018, 4, 23, 12, 30, 15);

    it('should render a text element', function() {
        const tree = renderer.create(<Moment date={now} format='LLL' />).toJSON();
        expect(tree.type).toEqual('Text');
    });

    it('should use the style property', function() {
        const style = {color: 'red'};
        const tree = renderer.create(<Moment date={now} style={style} format='LLL' />).toJSON();
        expect(tree.props.style).toEqual(style);
    });

    describe('with the fromNow property', function() {
        it('should format now as "a few seconds ago"', function() {
            const tree = renderer.create(<Moment date={now} fromNow />).toJSON();
            expect(tree.type).toEqual('Text');
            expect(tree.children).toEqual(['a few seconds ago']);
        });

        it('should format 2 hours ago as "2 hours ago"', function() {
            const tree = renderer.create(<Moment date={twoHoursAgo} fromNow />).toJSON();
            expect(tree.type).toEqual('Text');
            expect(tree.children).toEqual(['2 hours ago']);
        });

        it('should prevent future dates if the maxNow property is given', function() {
            const tree = renderer.create(<Moment date={fiveSecondsInFuture} fromNow maxNow />).toJSON();
            expect(tree.children).toEqual(['a few seconds ago']);
        });

        it('should format using title case if the titleCase property is given', function() {
            const tree = renderer.create(<Moment date={twoHoursAgo} fromNow titleCase />).toJSON();
            expect(tree.children).toEqual(['2 Hours Ago']);
        });
    });

    describe('with the format property', function() {
        it('should output in the given format', function() {
            const tree = renderer.create(<Moment date={now} format='LLL' />).toJSON();
            expect(tree.children[0]).toMatch(/[A-Z][a-z]+ \d{1,2}, 20\d{2} \d{1,2}:\d{2} [AP]M/);
        });
    });

    it('should throw if not given format or fromNow properties', function() {
        expect(() => {
            new ShallowRenderer().render(<Moment date={now} />);
        }).toThrow('fromNow or format is required');
    });
});
