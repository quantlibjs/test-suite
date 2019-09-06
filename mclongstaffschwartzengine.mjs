import { Actual365Fixed, AmericanExercise, Array2D, BlackConstantVol, CrankNicolson, EarlyExercisePathPricer, FDAmericanEngine, FlatForward, GeneralizedBlackScholesProcess, Handle, LongstaffSchwartzPathPricer, LsmBasisSystem, MakeMCAmericanEngine, MC, MCLongstaffSchwartzEngine, NullCalendar, Option, PlainVanillaPayoff, PseudoRandom, QL_NULL_INTEGER, QL_NULL_REAL, RelinkableHandle, SavedSettings, Settings, SimpleQuote, StochasticProcessArray, VanillaOption, VanillaOptionEngine } from '/ql.mjs';
import { std } from '/test-suite/std.mjs';

class AmericanMaxPathPricer extends EarlyExercisePathPricer {
    constructor(payoff) {
        super();
        this._payoff = payoff;
    }
    state(path, t) {
        const tmp = new Array(path.assetNumber());
        for (let i = 0; i < path.assetNumber(); ++i) {
            tmp[i] = path.at(i).at(t);
        }
        return tmp;
    }
    f(path, t) {
        const tmp = this.state(path, t);
        return this._payoff.f(std.max_element(tmp));
    }
    basisSystem() {
        return LsmBasisSystem.multiPathBasisSystem(2, 2, LsmBasisSystem.PolynomType.Monomial);
    }
}
class MCAmericanMaxEngine extends MCLongstaffSchwartzEngine {
    constructor(RNG) {
        super(new VanillaOptionEngine.engine(), MC.MultiVariate, RNG);
    }
    mcameInit(processes, timeSteps, timeStepsPerYear, brownianbridge, antitheticVariate, controlVariate, requiredSamples, requiredTolerance, maxSamples, seed, nCalibrationSamples = QL_NULL_INTEGER) {
        this.mclseInit(processes, timeSteps, timeStepsPerYear, brownianbridge, antitheticVariate, controlVariate, requiredSamples, requiredTolerance, maxSamples, seed, nCalibrationSamples);
        return this;
    }
    lsmPathPricer() {
        let processArray = (this._process);
        if (!(processArray instanceof StochasticProcessArray)) {
            processArray = null;
        }
        if (processArray === null || processArray.size() === 0) {
            throw new Error('Stochastic process array required');
        }
        let process = (processArray.process(0));
        if (!(process instanceof GeneralizedBlackScholesProcess)) {
            process = null;
        }
        if (process == null) {
            throw new Error('generalized Black-Scholes proces required');
        }
        const earlyExercisePathPricer = new AmericanMaxPathPricer(this._arguments.payoff);
        return new LongstaffSchwartzPathPricer(this.timeGrid(), earlyExercisePathPricer, process.riskFreeRate().currentLink());
    }
}

describe('Longstaff Schwartz MC engine tests', () => {
    it('Testing Monte-Carlo pricing of American options...', () => {
        const backup = new SavedSettings();
        const type = Option.Type.Put;
        const underlying = 36;
        const dividendYield = 0.00;
        const riskFreeRate = 0.06;
        const volatility = 0.20;
        const todaysDate = new Date('15,May,1998');
        const settlementDate = new Date('17,May,1998');
        Settings.evaluationDate.set(todaysDate);
        const maturity = new Date('17,May,1999');
        const dayCounter = new Actual365Fixed();
        const americanExercise = new AmericanExercise().init1(settlementDate, maturity);
        const flatTermStructure = new Handle(new FlatForward().ffInit2(settlementDate, riskFreeRate, dayCounter));
        const flatDividendTS = new Handle(new FlatForward().ffInit2(settlementDate, dividendYield, dayCounter));
        const expectedExProb = [
            [
                0.48013,
                0.51678,
                0.54598
            ],
            [
                0.75549,
                0.67569,
                0.65562
            ]
        ];
        const polynomTypes = [
            LsmBasisSystem.PolynomType.Monomial, LsmBasisSystem.PolynomType.Laguerre,
            LsmBasisSystem.PolynomType.Hermite, LsmBasisSystem.PolynomType.Hyperbolic,
            LsmBasisSystem.PolynomType.Chebyshev2nd
        ];
        for (let i = 0; i < 2; ++i) {
            for (let j = 0; j < 3; ++j) {
                const flatVolTS = new Handle(new BlackConstantVol().bcvInit1(settlementDate, new NullCalendar(), volatility + 0.1 * j, dayCounter));
                const payoff = new PlainVanillaPayoff(type, underlying + 4 * i);
                const underlyingH = new Handle(new SimpleQuote(underlying));
                const stochasticProcess = new GeneralizedBlackScholesProcess().init1(underlyingH, flatDividendTS, flatTermStructure, flatVolTS);
                const americanOption = new VanillaOption(payoff, americanExercise);
                const mcengine = new MakeMCAmericanEngine(new PseudoRandom())
                    .mmcaeInit(stochasticProcess)
                    .withSteps(75)
                    .withAntitheticVariate()
                    .withAbsoluteTolerance(0.02)
                    .withSeed(42)
                    .withPolynomOrder(3)
                    .withBasisSystem(polynomTypes[0 * (i * 3 + j) % polynomTypes.length])
                    .f();
                americanOption.setPricingEngine(mcengine);
                const calculated = americanOption.NPV();
                const errorEstimate = americanOption.errorEstimate();
                const exerciseProbability = americanOption.result('exerciseProbability');
                americanOption.setPricingEngine(new FDAmericanEngine(new CrankNicolson())
                    .fdmaeInit(stochasticProcess, 401, 200));
                const expected = americanOption.NPV();
                expect(Math.abs(calculated - expected))
                    .toBeLessThan(2.34 * errorEstimate);
                expect(Math.abs(exerciseProbability - expectedExProb[i][j]))
                    .toBeLessThan(0.015);
            }
        }
        backup.dispose();
    });
    it('Testing Monte-Carlo pricing of American max options...', () => {
        const backup = new SavedSettings();
        const type = Option.Type.Call;
        const strike = 100;
        const dividendYield = 0.10;
        const riskFreeRate = 0.05;
        const volatility = 0.20;
        const todaysDate = new Date('15-May-1998');
        const settlementDate = new Date('17-May-1998');
        Settings.evaluationDate.set(todaysDate);
        const maturity = new Date('16-May-2001');
        const dayCounter = new Actual365Fixed();
        const americanExercise = new AmericanExercise().init1(settlementDate, maturity);
        const flatTermStructure = new Handle(new FlatForward().ffInit2(settlementDate, riskFreeRate, dayCounter));
        const flatDividendTS = new Handle(new FlatForward().ffInit2(settlementDate, dividendYield, dayCounter));
        const flatVolTS = new Handle(new BlackConstantVol().bcvInit1(settlementDate, new NullCalendar(), volatility, dayCounter));
        const payoff = new PlainVanillaPayoff(type, strike);
        const underlyingH = new RelinkableHandle();
        const stochasticProcess = new GeneralizedBlackScholesProcess().init1(underlyingH, flatDividendTS, flatTermStructure, flatVolTS);
        const numberAssets = 2;
        const corr = Array2D.newMatrix(numberAssets, numberAssets, 0.0);
        const v = [];
        for (let i = 0; i < numberAssets; ++i) {
            v.push(stochasticProcess);
            corr[i][i] = 1.0;
        }
        const process = new StochasticProcessArray(v, corr);
        const americanMaxOption = new VanillaOption(payoff, americanExercise);
        const mcengine = new MCAmericanMaxEngine(new PseudoRandom())
            .mcameInit(process, 25, QL_NULL_INTEGER, false, true, false, 4096, QL_NULL_REAL, QL_NULL_INTEGER, 42, 1024);
        americanMaxOption.setPricingEngine(mcengine);
        const expected = [8.08, 13.90, 21.34];
        for (let i = 0; i < 3; ++i) {
            const underlying = 90.0 + i * 10.0;
            underlyingH.linkTo(new SimpleQuote(underlying));
            const calculated = americanMaxOption.NPV();
            const errorEstimate = americanMaxOption.errorEstimate();
            expect(Math.abs(calculated - expected[i]))
                .toBeLessThan(2.34 * errorEstimate);
        }
        backup.dispose();
    });
});