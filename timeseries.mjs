import { IntervalPrice, Month, TimeSeries } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
const second = 1;

describe('time series tests', () => {
    it('Testing time series construction...', () => {
        const ts = new TimeSeries();
        ts.set(new Date(2005, Month.March - 1, 25), 1.2);
        ts.set(new Date(2005, Month.March - 1, 29), 2.3);
        ts.set(new Date(2005, Month.March - 1, 15), 0.3);
        ts.sort();
        expect(ts.firstDate().valueOf())
            .toEqual(new Date(2005, Month.March - 1, 15).valueOf());
        expect(ts.first()[second]).toEqual(0.3);
        ts.set(new Date(2005, Month.March - 1, 15), 3.5);
        expect(ts.first()[second]).toEqual(3.5);
    });
    it('Testing time series interval price...', () => {
        const date = [];
        const open = [], close = [], high = [], low = [];
        date.push(new Date(2005, Month.March - 1, 25));
        date.push(new Date(2005, Month.March - 1, 29));
        open.push(1.3);
        open.push(2.3);
        close.push(2.3);
        close.push(3.4);
        high.push(3.4);
        high.push(3.5);
        low.push(3.4);
        low.push(3.2);
        const tsiq = IntervalPrice.makeSeries(date, open, close, high, low);
        expect(tsiq.firstDate().valueOf())
            .toEqual(new Date(2005, Month.March - 1, 25).valueOf());
    });
    it('Testing time series iterators...', () => {
    });
});
//# sourceMappingURL=timeseries.js.map
