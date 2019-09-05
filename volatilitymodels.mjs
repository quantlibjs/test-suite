import { ConstantEstimator, SimpleLocalEstimator, TimeSeries } from '/ql.mjs';
describe('volatility models tests', () => {
    it('Testing volatility model construction...', () => {
        const ts = new TimeSeries();
        ts.set(new Date('25,March,2005'), 1.2);
        ts.set(new Date('29,March,2005'), 2.3);
        ts.set(new Date('15,March,2005'), 0.3);
        const sle = new SimpleLocalEstimator(1 / 360.0);
        const locale = sle.calculate1(ts);
        const ce = new ConstantEstimator(1);
        const sv = ce.calculate1(locale);
        console.log(sv);
    });
});
//# sourceMappingURL=volatilitymodels.js.map