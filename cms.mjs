import { Actual365Fixed, AnalyticHaganPricer, Array1D, Array2D, BusinessDayConvention, CappedFlooredCmsCoupon, DateExt, Euribor6M, EuriborSwapIsdaFixA, GFunctionFactory, Handle, LinearTsrPricer, MakeCms, NumericHaganPricer, Period, QL_NULL_REAL, RelinkableHandle, SavedSettings, setCouponPricer, Settings, SimpleQuote, SwapIndex, SwaptionVolatilityMatrix, SwaptionVolCube1, SwaptionVolCube2, TARGET, TimeUnit } from '/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';
class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        const calendar = new TARGET();
        const referenceDate = calendar.adjust(new Date());
        Settings.evaluationDate.set(referenceDate);
        this.termStructure.linkTo(flatRate2(referenceDate, 0.05, new Actual365Fixed()));
        const atmOptionTenors = [];
        atmOptionTenors.push(new Period().init1(1, TimeUnit.Months));
        atmOptionTenors.push(new Period().init1(6, TimeUnit.Months));
        atmOptionTenors.push(new Period().init1(1, TimeUnit.Years));
        atmOptionTenors.push(new Period().init1(5, TimeUnit.Years));
        atmOptionTenors.push(new Period().init1(10, TimeUnit.Years));
        atmOptionTenors.push(new Period().init1(30, TimeUnit.Years));
        const atmSwapTenors = [];
        atmSwapTenors.push(new Period().init1(1, TimeUnit.Years));
        atmSwapTenors.push(new Period().init1(5, TimeUnit.Years));
        atmSwapTenors.push(new Period().init1(10, TimeUnit.Years));
        atmSwapTenors.push(new Period().init1(30, TimeUnit.Years));
        const m = Array2D.newMatrix(atmOptionTenors.length, atmSwapTenors.length);
        m[0][0] = 0.1300;
        m[0][1] = 0.1560;
        m[0][2] = 0.1390;
        m[0][3] = 0.1220;
        m[1][0] = 0.1440;
        m[1][1] = 0.1580;
        m[1][2] = 0.1460;
        m[1][3] = 0.1260;
        m[2][0] = 0.1600;
        m[2][1] = 0.1590;
        m[2][2] = 0.1470;
        m[2][3] = 0.1290;
        m[3][0] = 0.1640;
        m[3][1] = 0.1470;
        m[3][2] = 0.1370;
        m[3][3] = 0.1220;
        m[4][0] = 0.1400;
        m[4][1] = 0.1300;
        m[4][2] = 0.1250;
        m[4][3] = 0.1100;
        m[5][0] = 0.1130;
        m[5][1] = 0.1090;
        m[5][2] = 0.1070;
        m[5][3] = 0.0930;
        this.atmVol = new Handle(new SwaptionVolatilityMatrix().svmInit3(calendar, BusinessDayConvention.Following, atmOptionTenors, atmSwapTenors, m, new Actual365Fixed()));
        const optionTenors = [];
        optionTenors.push(new Period().init1(1, TimeUnit.Years));
        optionTenors.push(new Period().init1(10, TimeUnit.Years));
        optionTenors.push(new Period().init1(30, TimeUnit.Years));
        const swapTenors = [];
        swapTenors.push(new Period().init1(2, TimeUnit.Years));
        swapTenors.push(new Period().init1(10, TimeUnit.Years));
        swapTenors.push(new Period().init1(30, TimeUnit.Years));
        const strikeSpreads = [];
        strikeSpreads.push(-0.020);
        strikeSpreads.push(-0.005);
        strikeSpreads.push(+0.000);
        strikeSpreads.push(+0.005);
        strikeSpreads.push(+0.020);
        const nRows = optionTenors.length * swapTenors.length;
        const nCols = strikeSpreads.length;
        const volSpreadsMatrix = Array2D.newMatrix(nRows, nCols);
        volSpreadsMatrix[0][0] = 0.0599;
        volSpreadsMatrix[0][1] = 0.0049;
        volSpreadsMatrix[0][2] = 0.0000;
        volSpreadsMatrix[0][3] = -0.0001;
        volSpreadsMatrix[0][4] = 0.0127;
        volSpreadsMatrix[1][0] = 0.0729;
        volSpreadsMatrix[1][1] = 0.0086;
        volSpreadsMatrix[1][2] = 0.0000;
        volSpreadsMatrix[1][3] = -0.0024;
        volSpreadsMatrix[1][4] = 0.0098;
        volSpreadsMatrix[2][0] = 0.0738;
        volSpreadsMatrix[2][1] = 0.0102;
        volSpreadsMatrix[2][2] = 0.0000;
        volSpreadsMatrix[2][3] = -0.0039;
        volSpreadsMatrix[2][4] = 0.0065;
        volSpreadsMatrix[3][0] = 0.0465;
        volSpreadsMatrix[3][1] = 0.0063;
        volSpreadsMatrix[3][2] = 0.0000;
        volSpreadsMatrix[3][3] = -0.0032;
        volSpreadsMatrix[3][4] = -0.0010;
        volSpreadsMatrix[4][0] = 0.0558;
        volSpreadsMatrix[4][1] = 0.0084;
        volSpreadsMatrix[4][2] = 0.0000;
        volSpreadsMatrix[4][3] = -0.0050;
        volSpreadsMatrix[4][4] = -0.0057;
        volSpreadsMatrix[5][0] = 0.0576;
        volSpreadsMatrix[5][1] = 0.0083;
        volSpreadsMatrix[5][2] = 0.0000;
        volSpreadsMatrix[5][3] = -0.0043;
        volSpreadsMatrix[5][4] = -0.0014;
        volSpreadsMatrix[6][0] = 0.0437;
        volSpreadsMatrix[6][1] = 0.0059;
        volSpreadsMatrix[6][2] = 0.0000;
        volSpreadsMatrix[6][3] = -0.0030;
        volSpreadsMatrix[6][4] = -0.0006;
        volSpreadsMatrix[7][0] = 0.0533;
        volSpreadsMatrix[7][1] = 0.0078;
        volSpreadsMatrix[7][2] = 0.0000;
        volSpreadsMatrix[7][3] = -0.0045;
        volSpreadsMatrix[7][4] = -0.0046;
        volSpreadsMatrix[8][0] = 0.0545;
        volSpreadsMatrix[8][1] = 0.0079;
        volSpreadsMatrix[8][2] = 0.0000;
        volSpreadsMatrix[8][3] = -0.0042;
        volSpreadsMatrix[8][4] = -0.0020;
        const volSpreads = new Array(nRows);
        for (let i = 0; i < nRows; ++i) {
            volSpreads[i] = new Array(nCols);
            for (let j = 0; j < nCols; ++j) {
                volSpreads[i][j] = new Handle(new SimpleQuote(volSpreadsMatrix[i][j]));
            }
        }
        this.iborIndex = new Euribor6M(this.termStructure);
        const swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(10, TimeUnit.Years), this.termStructure);
        const shortSwapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(2, TimeUnit.Years), this.termStructure);
        const vegaWeightedSmileFit = false;
        this.SabrVolCube2 = new Handle(new SwaptionVolCube2(this.atmVol, optionTenors, swapTenors, strikeSpreads, volSpreads, swapIndexBase, shortSwapIndexBase, vegaWeightedSmileFit));
        this.SabrVolCube2.currentLink().enableExtrapolation();
        const guess = new Array(nRows);
        for (let i = 0; i < nRows; ++i) {
            guess[i] = new Array(4);
            guess[i][0] = new Handle(new SimpleQuote(0.2));
            guess[i][1] = new Handle(new SimpleQuote(0.5));
            guess[i][2] = new Handle(new SimpleQuote(0.4));
            guess[i][3] = new Handle(new SimpleQuote(0.0));
        }
        const isParameterFixed = Array1D.fromSizeValue(4, false);
        isParameterFixed[1] = true;
        const isAtmCalibrated = false;
        this.SabrVolCube1 = new Handle(new SwaptionVolCube1().svc1xInit(this.atmVol, optionTenors, swapTenors, strikeSpreads, volSpreads, swapIndexBase, shortSwapIndexBase, vegaWeightedSmileFit, guess, isParameterFixed, isAtmCalibrated));
        this.SabrVolCube1.currentLink().enableExtrapolation();
        this.yieldCurveModels = [];
        this.yieldCurveModels.push(GFunctionFactory.YieldCurveModel.Standard);
        this.yieldCurveModels.push(GFunctionFactory.YieldCurveModel.ExactYield);
        this.yieldCurveModels.push(GFunctionFactory.YieldCurveModel.ParallelShifts);
        this.yieldCurveModels.push(GFunctionFactory.YieldCurveModel.NonParallelShifts);
        this.yieldCurveModels.push(GFunctionFactory.YieldCurveModel
            .NonParallelShifts);
        const zeroMeanRev = new Handle(new SimpleQuote(0.0));
        this.numericalPricers = [];
        this.analyticPricers = [];
        for (let j = 0; j < this.yieldCurveModels.length; ++j) {
            if (j < this.yieldCurveModels.length - 1) {
                this.numericalPricers.push(new NumericHaganPricer(this.atmVol, this.yieldCurveModels[j], zeroMeanRev));
            }
            else {
                this.numericalPricers.push(new LinearTsrPricer(this.atmVol, zeroMeanRev));
            }
            this.analyticPricers.push(new AnalyticHaganPricer(this.atmVol, this.yieldCurveModels[j], zeroMeanRev));
        }
    }
}
describe('Cms tests', () => {
    it('Testing Hagan-pricer flat-vol equivalence for coupons...', () => {
        const vars = new CommonVars();
        const swapIndex = new SwapIndex().siInit('EuriborSwapIsdaFixA', new Period().init1(10, TimeUnit.Years), vars.iborIndex.fixingDays(), vars.iborIndex.currency(), vars.iborIndex.fixingCalendar(), new Period().init1(1, TimeUnit.Years), BusinessDayConvention.Unadjusted, vars.iborIndex.dayCounter(), vars.iborIndex);
        const startDate = DateExt.advance(vars.termStructure.currentLink().referenceDate(), 20, TimeUnit.Years);
        const paymentDate = DateExt.advance(startDate, 1, TimeUnit.Years);
        const endDate = paymentDate;
        const nominal = 1.0;
        const infiniteCap = QL_NULL_REAL;
        const infiniteFloor = QL_NULL_REAL;
        const gearing = 1.0;
        const spread = 0.0;
        const coupon = new CappedFlooredCmsCoupon(paymentDate, nominal, startDate, endDate, swapIndex.fixingDays(), swapIndex, gearing, spread, infiniteCap, infiniteFloor, startDate, endDate, vars.iborIndex.dayCounter());
        for (let j = 0; j < vars.yieldCurveModels.length; ++j) {
            vars.numericalPricers[j].setSwaptionVolatility(vars.atmVol);
            coupon.setPricer(vars.numericalPricers[j]);
            const rate0 = coupon.rate();
            vars.analyticPricers[j].setSwaptionVolatility(vars.atmVol);
            coupon.setPricer(vars.analyticPricers[j]);
            const rate1 = coupon.rate();
            const difference = Math.abs(rate1 - rate0);
            const tol = 2.0e-4;
            expect(difference).toBeLessThan(tol);
        }
        vars.backup.dispose();
    });
    it('Testing Hagan-pricer flat-vol equivalence for swaps...', () => {
        const vars = new CommonVars();
        const swapIndex = new SwapIndex().siInit('EuriborSwapIsdaFixA', new Period().init1(10, TimeUnit.Years), vars.iborIndex.fixingDays(), vars.iborIndex.currency(), vars.iborIndex.fixingCalendar(), new Period().init1(1, TimeUnit.Years), BusinessDayConvention.Unadjusted, vars.iborIndex.dayCounter(), vars.iborIndex);
        const spread = 0.0;
        const swapLengths = [];
        swapLengths.push(1);
        swapLengths.push(5);
        swapLengths.push(6);
        swapLengths.push(10);
        const n = swapLengths.length;
        const cms = new Array(n);
        for (let i = 0; i < n; ++i) {
            cms[i] =
                new MakeCms()
                    .init1(new Period().init1(swapLengths[i], TimeUnit.Years), swapIndex, vars.iborIndex, spread, new Period().init1(10, TimeUnit.Days))
                    .f();
        }
        for (let j = 0; j < vars.yieldCurveModels.length; ++j) {
            vars.numericalPricers[j].setSwaptionVolatility(vars.atmVol);
            vars.analyticPricers[j].setSwaptionVolatility(vars.atmVol);
            for (let sl = 0; sl < n; ++sl) {
                setCouponPricer(cms[sl].leg(0), vars.numericalPricers[j]);
                const priceNum = cms[sl].NPV();
                setCouponPricer(cms[sl].leg(0), vars.analyticPricers[j]);
                const priceAn = cms[sl].NPV();
                const difference = Math.abs(priceNum - priceAn);
                const tol = 2.0e-4;
                expect(difference).toBeLessThan(tol);
            }
        }
        vars.backup.dispose();
    });
    it('Testing put-call parity for capped-floored CMS coupons...', () => {
        const vars = new CommonVars();
        const swaptionVols = [];
        swaptionVols.push(vars.atmVol);
        swaptionVols.push(vars.SabrVolCube1);
        swaptionVols.push(vars.SabrVolCube2);
        const swapIndex = new EuriborSwapIsdaFixA().esInit1(new Period().init1(10, TimeUnit.Years), vars.iborIndex.forwardingTermStructure());
        const startDate = DateExt.advance(vars.termStructure.currentLink().referenceDate(), 20, TimeUnit.Years);
        const paymentDate = DateExt.advance(startDate, 1, TimeUnit.Years);
        const endDate = paymentDate;
        const nominal = 1.0;
        const infiniteCap = QL_NULL_REAL;
        const infiniteFloor = QL_NULL_REAL;
        const gearing = 1.0;
        const spread = 0.0;
        const discount = vars.termStructure.currentLink().discount1(paymentDate);
        const swaplet = new CappedFlooredCmsCoupon(paymentDate, nominal, startDate, endDate, swapIndex.fixingDays(), swapIndex, gearing, spread, infiniteCap, infiniteFloor, startDate, endDate, vars.iborIndex.dayCounter());
        for (let strike = .02; strike < .12; strike += 0.05) {
            const caplet = new CappedFlooredCmsCoupon(paymentDate, nominal, startDate, endDate, swapIndex.fixingDays(), swapIndex, gearing, spread, strike, infiniteFloor, startDate, endDate, vars.iborIndex.dayCounter());
            const floorlet = new CappedFlooredCmsCoupon(paymentDate, nominal, startDate, endDate, swapIndex.fixingDays(), swapIndex, gearing, spread, infiniteCap, strike, startDate, endDate, vars.iborIndex.dayCounter());
            for (let i = 0; i < swaptionVols.length; ++i) {
                for (let j = 0; j < vars.yieldCurveModels.length; ++j) {
                    vars.numericalPricers[j].setSwaptionVolatility(swaptionVols[i]);
                    vars.analyticPricers[j].setSwaptionVolatility(swaptionVols[i]);
                    const pricers = new Array(2);
                    pricers[0] = vars.numericalPricers[j];
                    pricers[1] = vars.analyticPricers[j];
                    for (let k = 0; k < pricers.length; ++k) {
                        swaplet.setPricer(pricers[k]);
                        caplet.setPricer(pricers[k]);
                        floorlet.setPricer(pricers[k]);
                        const swapletPrice = swaplet.price(vars.termStructure) +
                            nominal * swaplet.accrualPeriod() * strike * discount;
                        const capletPrice = caplet.price(vars.termStructure);
                        const floorletPrice = floorlet.price(vars.termStructure);
                        const difference = Math.abs(capletPrice + floorletPrice - swapletPrice);
                        let tol = 2.0e-5;
                        const linearTsr = k === 0 && j === vars.yieldCurveModels.length - 1;
                        if (linearTsr) {
                            tol = 1.0e-7;
                        }
                        expect(difference).toBeLessThan(tol);
                    }
                }
            }
        }
        vars.backup.dispose();
    });
});
//# sourceMappingURL=cms.js.map