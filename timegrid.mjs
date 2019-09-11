import { TimeGrid } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

describe('Timegrid tests', () => {
    it('TimeGrid constructor with additional steps...', () => {
        const test_times = [];
        test_times.push(1.0);
        test_times.push(2.0);
        test_times.push(4.0);
        const tg = new TimeGrid().init3(test_times, 0, test_times.length, 8);
        const expected_times = [];
        expected_times.push(0.0);
        expected_times.push(0.5);
        expected_times.push(1.0);
        expected_times.push(1.5);
        expected_times.push(2.0);
        expected_times.push(2.5);
        expected_times.push(3.0);
        expected_times.push(3.5);
        expected_times.push(4.0);
        expect(tg.size()).toEqual(expected_times.length);
        for (let i = 0; i < tg.size(); i++) {
            expect(tg.at(i)).toEqual(expected_times[i]);
        }
    });
    it('TimeGrid constructor with only mandatory points...', () => {
        const test_times = [];
        test_times.push(0.0);
        test_times.push(1.0);
        test_times.push(2.0);
        test_times.push(4.0);
        const tg = new TimeGrid().init2(test_times, 0, test_times.length);
        expect(tg.size()).toEqual(test_times.length);
        for (let i = 0; i < tg.size(); i++) {
            expect(tg.at(i)).toEqual(test_times[i]);
        }
    });
    it('Test TimeGrid construction with n evenly spaced points...', () => {
        const end_time = 10;
        const steps = 5;
        const tg = new TimeGrid().init1(end_time, steps);
        const expected_times = [];
        expected_times.push(0.0);
        expected_times.push(2.0);
        expected_times.push(4.0);
        expected_times.push(6.0);
        expected_times.push(8.0);
        expected_times.push(10.0);
        expect(tg.size()).toEqual(expected_times.length);
        for (let i = 0; i < tg.size(); i++) {
            expect(tg.at(i)).toEqual(expected_times[i]);
        }
    });
    it('Test if the constructor raises an error for empty iterators...', () => {
        expect(() => new TimeGrid().init2([], 0, 0))
            .toThrowError(/empty time sequence/);
    });
    it('Test if the constructor raises an error for negative time values...', () => {
        const times = [];
        times.push(-3.0);
        times.push(1.0);
        times.push(4.0);
        times.push(5.0);
        expect(() => new TimeGrid().init2(times, 0, times.length))
            .toThrowError(/negative times not allowed/);
    });
    it('Test returned index is closest to the requested time...', () => {
        const test_times = [];
        test_times.push(1.0);
        test_times.push(2.0);
        test_times.push(5.0);
        const tg = new TimeGrid().init2(test_times, 0, test_times.length);
        const expected_index = 3;
        expect(tg.closestIndex(4)).toEqual(expected_index);
    });
    it('Test returned time matches to the requested index...', () => {
        const test_times = [];
        test_times.push(1.0);
        test_times.push(2.0);
        test_times.push(5.0);
        const tg = new TimeGrid().init2(test_times, 0, test_times.length);
        const expected_time = 5;
        expect(tg.closestTime(4)).toEqual(expected_time);
    });
    it('Test mandatory times are recalled correctly...', () => {
        const test_times = [];
        test_times.push(1.0);
        test_times.push(2.0);
        test_times.push(4.0);
        const tg = new TimeGrid().init3(test_times, 0, test_times.length, 8);
        const tg_mandatory_times = tg.mandatoryTimes();
        expect(tg_mandatory_times.length).toEqual(test_times.length);
        for (let i = 0; i < tg_mandatory_times.length; i++) {
            expect(tg_mandatory_times[i]).toEqual(test_times[i]);
        }
    });
});