import { Actual360, Actual365Fixed, Array1D, Array2D, BusinessDayConvention, CappedFlooredCmsSpreadCoupon, CmsCoupon, CmsSpreadCoupon, ConstantSwaptionVolatility, DateExt, EuriborSwapIsdaFixA, FlatForward, Handle, IndexManager, InverseCumulativeNormal, LinearTsrPricer, LognormalCmsSpreadPricer, Period, pseudoSqrt, QL_MAX_REAL, QL_NULL_REAL, Settings, SimpleQuote, SobolRsg, SwapSpreadIndex, TARGET, TimeUnit, VolatilityType, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class TestData {
    constructor() {
        this.refDate = new Date('23-February-2018');
        Settings.evaluationDate.set(this.refDate);
        this.yts2 = new Handle(new FlatForward().ffInit2(this.refDate, 0.02, new Actual365Fixed()));
        this.swLn = new Handle(new ConstantSwaptionVolatility().csvInit4(this.refDate, new TARGET(), BusinessDayConvention.Following, 0.20, new Actual365Fixed(), VolatilityType.ShiftedLognormal, 0.0));
        this.swSln = new Handle(new ConstantSwaptionVolatility().csvInit4(this.refDate, new TARGET(), BusinessDayConvention.Following, 0.10, new Actual365Fixed(), VolatilityType.ShiftedLognormal, 0.01));
        this.swN = new Handle(new ConstantSwaptionVolatility().csvInit4(this.refDate, new TARGET(), BusinessDayConvention.Following, 0.0075, new Actual365Fixed(), VolatilityType.Normal, 0.01));
        this.reversion = new Handle(new SimpleQuote(0.01));
        this.cmsPricerLn =
            new LinearTsrPricer(this.swLn, this.reversion, this.yts2);
        this.cmsPricerSln =
            new LinearTsrPricer(this.swSln, this.reversion, this.yts2);
        this.cmsPricerN = new LinearTsrPricer(this.swN, this.reversion, this.yts2);
        this.correlation = new Handle(new SimpleQuote(0.6));
        this.cmsspPricerLn = new LognormalCmsSpreadPricer(this.cmsPricerLn, this.correlation, this.yts2, 32);
        this.cmsspPricerSln = new LognormalCmsSpreadPricer(this.cmsPricerSln, this.correlation, this.yts2, 32);
        this.cmsspPricerN = new LognormalCmsSpreadPricer(this.cmsPricerN, this.correlation, this.yts2, 32);
    }
}

function mcReferenceValue(cpn1, cpn2, cap, floor, vol, correlation) {
    const samples = 1000000;
    const acc = [];
    const Cov = Array2D.newMatrix(2, 2);
    Cov[0][0] = vol.currentLink().blackVariance2(cpn1.fixingDate(), cpn1.index().tenor(), cpn1.indexFixing());
    Cov[1][1] = vol.currentLink().blackVariance2(cpn2.fixingDate(), cpn2.index().tenor(), cpn2.indexFixing());
    Cov[0][1] = [1][0] = Math.sqrt(Cov[0][0] * Cov[1][1]) * correlation;
    const C = pseudoSqrt(Cov);
    const atmRate = new Array(2), adjRate = new Array(2), avg = new Array(2), volShift = new Array(2);
    atmRate[0] = cpn1.indexFixing();
    atmRate[1] = cpn2.indexFixing();
    adjRate[0] = cpn1.adjustedFixing();
    adjRate[1] = cpn2.adjustedFixing();
    if (vol.currentLink().volatilityType() === VolatilityType.ShiftedLognormal) {
        volShift[0] =
            vol.currentLink().shift2(cpn1.fixingDate(), cpn1.index().tenor());
        volShift[1] =
            vol.currentLink().shift2(cpn2.fixingDate(), cpn2.index().tenor());
        avg[0] = Math.log((adjRate[0] + volShift[0]) / (atmRate[0] + volShift[0])) -
            0.5 * Cov[0][0];
        avg[1] = Math.log((adjRate[1] + volShift[1]) / (atmRate[1] + volShift[1])) -
            0.5 * Cov[1][1];
    }
    else {
        avg[0] = adjRate[0];
        avg[1] = adjRate[1];
    }
    const icn = new InverseCumulativeNormal();
    const sb_ = new SobolRsg().init(2, 42);
    let w = new Array(2), z = new Array(2);
    for (let i = 0; i < samples; ++i) {
        const seq = sb_.nextSequence().value;
        w = seq.map(x => icn.f(x));
        z = Array1D.add(Array2D.mulVector(C, w), avg);
        for (let i = 0; i < 2; ++i) {
            if (vol.currentLink().volatilityType() ===
                VolatilityType.ShiftedLognormal) {
                z[i] = (atmRate[i] + volShift[i]) * Math.exp(z[i]) - volShift[i];
            }
        }
        acc.push(Math.min(Math.max(z[0] - z[1], floor), cap));
    }
    return acc.reduce((p, c) => p + c, 0) / acc.length;
}

describe(`Cms spread tests ${version}`, () => {
    it('Testing fixings of cms spread indices...', () => {
        const d = new TestData();
        const cms10y = new EuriborSwapIsdaFixA().esInit2(new Period().init1(10, TimeUnit.Years), d.yts2, d.yts2);
        const cms2y = new EuriborSwapIsdaFixA().esInit2(new Period().init1(2, TimeUnit.Years), d.yts2, d.yts2);
        const cms10y2y = new SwapSpreadIndex('cms10y2y', cms10y, cms2y);
        Settings.enforcesTodaysHistoricFixings = false;
        expect(() => cms10y2y.fixing(DateExt.sub(d.refDate, 1)))
            .toThrowError(/is not a valid fixing date/);
        expect(() => cms10y2y.fixing(d.refDate)).not.toThrow();
        expect(cms10y2y.fixing(d.refDate))
            .toEqual(cms10y.fixing(d.refDate) - cms2y.fixing(d.refDate));
        cms10y.addFixing(d.refDate, 0.05);
        expect(cms10y2y.fixing(d.refDate))
            .toEqual(cms10y.fixing(d.refDate) - cms2y.fixing(d.refDate));
        cms2y.addFixing(d.refDate, 0.04);
        expect(cms10y2y.fixing(d.refDate))
            .toEqual(cms10y.fixing(d.refDate) - cms2y.fixing(d.refDate));
        const futureFixingDate = new TARGET().adjust(DateExt.advance(d.refDate, 1, TimeUnit.Years));
        expect(cms10y2y.fixing(futureFixingDate))
            .toEqual(cms10y.fixing(futureFixingDate) - cms2y.fixing(futureFixingDate));
        IndexManager.clearHistories();
        Settings.enforcesTodaysHistoricFixings = true;
        expect(() => cms10y2y.fixing(d.refDate))
            .toThrowError(/is not a valid fixing date/);
        cms10y.addFixing(d.refDate, 0.05);
        expect(() => cms10y2y.fixing(d.refDate))
            .toThrowError(/is not a valid fixing date/);
        cms2y.addFixing(d.refDate, 0.04);
        expect(cms10y2y.fixing(d.refDate))
            .toEqual(cms10y.fixing(d.refDate) - cms2y.fixing(d.refDate));
        IndexManager.clearHistories();
    });
    it('Testing pricing of cms spread coupons...', () => {
        const d = new TestData();
        const tol = 1E-6;
        const cms10y = new EuriborSwapIsdaFixA().esInit2(new Period().init1(10, TimeUnit.Years), d.yts2, d.yts2);
        const cms2y = new EuriborSwapIsdaFixA().esInit2(new Period().init1(2, TimeUnit.Years), d.yts2, d.yts2);
        const cms10y2y = new SwapSpreadIndex('cms10y2y', cms10y, cms2y);
        const valueDate = cms10y2y.valueDate(d.refDate);
        const payDate = DateExt.advance(valueDate, 1, TimeUnit.Years);
        const cpn1a = new CmsCoupon(payDate, 10000.0, valueDate, payDate, cms10y.fixingDays(), cms10y, 1.0, 0.0, null, null, new Actual360(), false);
        const cpn1b = new CmsCoupon(payDate, 10000.0, valueDate, payDate, cms2y.fixingDays(), cms2y, 1.0, 0.0, null, null, new Actual360(), false);
        const cpn1 = new CmsSpreadCoupon(payDate, 10000.0, valueDate, payDate, cms10y2y.fixingDays(), cms10y2y, 1.0, 0.0, null, null, new Actual360(), false);
        expect(cpn1.fixingDate().valueOf()).toEqual(d.refDate.valueOf());
        cpn1a.setPricer(d.cmsPricerLn);
        cpn1b.setPricer(d.cmsPricerLn);
        cpn1.setPricer(d.cmsspPricerLn);
        const eqTol = 1e-13;
        expect(Math.abs(cpn1.rate() - cpn1a.rate() + cpn1b.rate()))
            .toBeLessThan(eqTol);
        cms10y.addFixing(d.refDate, 0.05);
        expect(Math.abs(cpn1.rate() - cpn1a.rate() + cpn1b.rate()))
            .toBeLessThan(eqTol);
        cms2y.addFixing(d.refDate, 0.03);
        expect(Math.abs(cpn1.rate() - cpn1a.rate() + cpn1b.rate()))
            .toBeLessThan(eqTol);
        IndexManager.clearHistories();
        const cpn2a = new CmsCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms10y, 1.0, 0.0, null, null, new Actual360(), false);
        const cpn2b = new CmsCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms2y, 1.0, 0.0, null, null, new Actual360(), false);
        const plainCpn = new CappedFlooredCmsSpreadCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms10y2y, 1.0, 0.0, QL_NULL_REAL, QL_NULL_REAL, null, null, new Actual360(), false);
        const cappedCpn = new CappedFlooredCmsSpreadCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms10y2y, 1.0, 0.0, 0.03, QL_NULL_REAL, null, null, new Actual360(), false);
        const flooredCpn = new CappedFlooredCmsSpreadCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms10y2y, 1.0, 0.0, QL_NULL_REAL, 0.01, null, null, new Actual360(), false);
        const collaredCpn = new CappedFlooredCmsSpreadCoupon(new Date('23-February-2029'), 10000.0, new Date('23-February-2028'), new Date('23-February-2029'), 2, cms10y2y, 1.0, 0.0, 0.03, 0.01, null, null, new Actual360(), false);
        cpn2a.setPricer(d.cmsPricerLn);
        cpn2b.setPricer(d.cmsPricerLn);
        plainCpn.setPricer(d.cmsspPricerLn);
        cappedCpn.setPricer(d.cmsspPricerLn);
        flooredCpn.setPricer(d.cmsspPricerLn);
        collaredCpn.setPricer(d.cmsspPricerLn);
        expect(Math.abs(plainCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, -QL_MAX_REAL, d.swLn, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(cappedCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, -QL_MAX_REAL, d.swLn, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(flooredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, 0.01, d.swLn, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(collaredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, 0.01, d.swLn, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        cpn2a.setPricer(d.cmsPricerSln);
        cpn2b.setPricer(d.cmsPricerSln);
        plainCpn.setPricer(d.cmsspPricerSln);
        cappedCpn.setPricer(d.cmsspPricerSln);
        flooredCpn.setPricer(d.cmsspPricerSln);
        collaredCpn.setPricer(d.cmsspPricerSln);
        expect(Math.abs(plainCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, -QL_MAX_REAL, d.swSln, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(cappedCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, -QL_MAX_REAL, d.swSln, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(flooredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, 0.01, d.swSln, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(collaredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, 0.01, d.swSln, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        cpn2a.setPricer(d.cmsPricerN);
        cpn2b.setPricer(d.cmsPricerN);
        plainCpn.setPricer(d.cmsspPricerN);
        cappedCpn.setPricer(d.cmsspPricerN);
        flooredCpn.setPricer(d.cmsspPricerN);
        collaredCpn.setPricer(d.cmsspPricerN);
        expect(Math.abs(plainCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, -QL_MAX_REAL, d.swN, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(cappedCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, -QL_MAX_REAL, d.swN, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(flooredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, QL_MAX_REAL, 0.01, d.swN, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
        expect(Math.abs(collaredCpn.rate() -
            mcReferenceValue(cpn2a, cpn2b, 0.03, 0.01, d.swN, d.correlation.currentLink().value())))
            .toBeLessThan(tol);
    });
});