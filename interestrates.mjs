import { Actual360, Compounding, DateExt, Frequency, InterestRate, Rounding, TimeUnit } from '/ql.mjs';

class InterestRateData {
    constructor(r, comp, freq, t, comp2, freq2, expected, precision) {
        this.r = r;
        this.comp = comp;
        this.freq = freq;
        this.t = t;
        this.comp2 = comp2;
        this.freq2 = freq2;
        this.expected = expected;
        this.precision = precision;
    }
}

describe('Interest Rate tests', () => {
    it('Testing interest-rate conversions...', () => {
        const cases = [
            new InterestRateData(0.0800, Compounding.Compounded, Frequency.Quarterly, 1.00, Compounding.Continuous, Frequency.Annual, 0.0792, 4),
            new InterestRateData(0.1200, Compounding.Continuous, Frequency.Annual, 1.00, Compounding.Compounded, Frequency.Annual, 0.1275, 4),
            new InterestRateData(0.0800, Compounding.Compounded, Frequency.Quarterly, 1.00, Compounding.Compounded, Frequency.Annual, 0.0824, 4),
            new InterestRateData(0.0700, Compounding.Compounded, Frequency.Quarterly, 1.00, Compounding.Compounded, Frequency.Semiannual, 0.0706, 4),
            new InterestRateData(0.0100, Compounding.Compounded, Frequency.Annual, 1.00, Compounding.Simple, Frequency.Annual, 0.0100, 4),
            new InterestRateData(0.0200, Compounding.Simple, Frequency.Annual, 1.00, Compounding.Compounded, Frequency.Annual, 0.0200, 4),
            new InterestRateData(0.0300, Compounding.Compounded, Frequency.Semiannual, 0.50, Compounding.Simple, Frequency.Annual, 0.0300, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Annual, 0.50, Compounding.Compounded, Frequency.Semiannual, 0.0400, 4),
            new InterestRateData(0.0500, Compounding.Compounded, Frequency.EveryFourthMonth, 1.0 / 3, Compounding.Simple, Frequency.Annual, 0.0500, 4),
            new InterestRateData(0.0600, Compounding.Simple, Frequency.Annual, 1.0 / 3, Compounding.Compounded, Frequency.EveryFourthMonth, 0.0600, 4),
            new InterestRateData(0.0500, Compounding.Compounded, Frequency.Quarterly, 0.25, Compounding.Simple, Frequency.Annual, 0.0500, 4),
            new InterestRateData(0.0600, Compounding.Simple, Frequency.Annual, 0.25, Compounding.Compounded, Frequency.Quarterly, 0.0600, 4),
            new InterestRateData(0.0700, Compounding.Compounded, Frequency.Bimonthly, 1.0 / 6, Compounding.Simple, Frequency.Annual, 0.0700, 4),
            new InterestRateData(0.0800, Compounding.Simple, Frequency.Annual, 1.0 / 6, Compounding.Compounded, Frequency.Bimonthly, 0.0800, 4),
            new InterestRateData(0.0900, Compounding.Compounded, Frequency.Monthly, 1.0 / 12, Compounding.Simple, Frequency.Annual, 0.0900, 4),
            new InterestRateData(0.1000, Compounding.Simple, Frequency.Annual, 1.0 / 12, Compounding.Compounded, Frequency.Monthly, 0.1000, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.25, Compounding.Simple, Frequency.Annual, 0.0300, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.25, Compounding.Simple, Frequency.Semiannual, 0.0300, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.25, Compounding.Simple, Frequency.Quarterly, 0.0300, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.50, Compounding.Simple, Frequency.Annual, 0.0300, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.50, Compounding.Simple, Frequency.Semiannual, 0.0300, 4),
            new InterestRateData(0.0300, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.75, Compounding.Compounded, Frequency.Semiannual, 0.0300, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.25, Compounding.SimpleThenCompounded, Frequency.Quarterly, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.25, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.25, Compounding.SimpleThenCompounded, Frequency.Annual, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Compounded, Frequency.Quarterly, 0.50, Compounding.SimpleThenCompounded, Frequency.Quarterly, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.50, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.50, Compounding.SimpleThenCompounded, Frequency.Annual, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Compounded, Frequency.Quarterly, 0.75, Compounding.SimpleThenCompounded, Frequency.Quarterly, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Compounded, Frequency.Semiannual, 0.75, Compounding.SimpleThenCompounded, Frequency.Semiannual, 0.0400, 4),
            new InterestRateData(0.0400, Compounding.Simple, Frequency.Semiannual, 0.75, Compounding.SimpleThenCompounded, Frequency.Annual, 0.0400, 4)
        ];
        let roundingPrecision;
        let r3;
        const d1 = new Date();
        let d2;
        let ir, ir2, ir3, expectedIR;
        let compoundf, error;
        let disc;
        for (let i = 0; i < cases.length; i++) {
            ir = new InterestRate(cases[i].r, new Actual360(), cases[i].comp, cases[i].freq);
            d2 = new Date(d1.valueOf());
            DateExt.advance(d2, Math.floor(360 * cases[i].t + 0.5), TimeUnit.Days);
            roundingPrecision = new Rounding(cases[i].precision);
            compoundf = ir.compoundFactor2(d1, d2);
            disc = ir.discountFactor2(d1, d2);
            error = Math.abs(disc - 1.0 / compoundf);
            expect(error).toBeLessThan(1e-15);
            ir2 = ir.equivalentRate2(ir.dayCounter(), ir.compounding(), ir.frequency(), d1, d2);
            error = Math.abs(ir.rate() - ir2.rate());
            expect(error).toBeLessThan(1e-15);
            expect(ir.dayCounter()).toEqual(ir2.dayCounter());
            expect(ir.compounding()).toEqual(ir2.compounding());
            expect(ir.frequency()).toEqual(ir2.frequency());
            ir3 = ir.equivalentRate2(ir.dayCounter(), cases[i].comp2, cases[i].freq2, d1, d2);
            expectedIR = new InterestRate(cases[i].expected, ir.dayCounter(), cases[i].comp2, cases[i].freq2);
            r3 = roundingPrecision.f(ir3.rate());
            error = Math.abs(r3 - expectedIR.rate());
            expect(error).toBeLessThan(1.0e-17);
            expect(ir3.dayCounter()).toEqual(expectedIR.dayCounter());
            expect(ir3.compounding()).toEqual(expectedIR.compounding());
            expect(ir3.frequency()).toEqual(expectedIR.frequency());
            ir3 = ir.equivalentRate2(ir.dayCounter(), cases[i].comp2, cases[i].freq2, d1, d2);
            r3 = roundingPrecision.f(r3);
            error = Math.abs(r3 - cases[i].expected);
            expect(error).toBeLessThan(1.0e-17);
        }
    });
});