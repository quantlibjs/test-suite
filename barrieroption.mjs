import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, Actual365Fixed, AmericanExercise, AnalyticBarrierEngine, AnalyticEuropeanEngine, Array2D, Barrier, BarrierOption, Bicubic, BinomialBarrierEngine, blackFormula1, BlackScholesMertonProcess, BlackScholesProcess, BlackVarianceCurve, BlackVarianceSurface, Business252, CoxRossRubinstein, DateExt, DeltaVolQuote, DiscretizedBarrierOption, DiscretizedDermanKaniBarrierOption, DividendBarrierOption, EuropeanExercise, EuropeanOption, Exercise, FdBlackScholesBarrierEngine, FdHestonBarrierEngine, FdmSchemeDesc, Handle, HestonModel, HestonProcess, LowDiscrepancy, MakeMCBarrierEngine, Option, PerturbativeBarrierOptionEngine, PlainVanillaPayoff, RelinkableHandle, SavedSettings, Settings, SimpleQuote, TARGET, TimeUnit, VannaVolgaBarrierEngine, ZeroCurve } from '/ql.mjs';
import { flatRate1, flatRate2, flatVol1, flatVol2 } from '/test-suite/utilities.mjs';
class BarrierOptionData {
    constructor(type, volatility, strike, barrier, callValue, putValue) {
        this.type = type;
        this.volatility = volatility;
        this.strike = strike;
        this.barrier = barrier;
        this.callValue = callValue;
        this.putValue = putValue;
    }
}
class NewBarrierOptionData {
    constructor(barrierType, barrier, rebate, type, exType, strike, s, q, r, t, v, result, tol) {
        this.barrierType = barrierType;
        this.barrier = barrier;
        this.rebate = rebate;
        this.type = type;
        this.exType = exType;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}
class BarrierFxOptionData {
    constructor(barrierType, barrier, rebate, type, strike, s, q, r, t, vol25Put, volAtm, vol25Call, v, result, tol) {
        this.barrierType = barrierType;
        this.barrier = barrier;
        this.rebate = rebate;
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.vol25Put = vol25Put;
        this.volAtm = volAtm;
        this.vol25Call = vol25Call;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}
describe('Barrier option tests', () => {
    it('Testing that knock-in plus knock-out barrier options ' +
        'replicate a European option...', () => {
        const today = Settings.evaluationDate.f();
        const dc = new Actual360();
        const spot = new SimpleQuote(100.0);
        const rTS = flatRate2(today, 0.01, dc);
        const volTS = flatVol2(today, 0.20, dc);
        const volHandle = new RelinkableHandle(volTS);
        const stochProcess = new BlackScholesProcess(new Handle(spot), new Handle(rTS), volHandle);
        const exerciseDate = DateExt.advance(today, 6, TimeUnit.Months);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 100.0);
        const exercise = new EuropeanExercise(exerciseDate);
        const knockIn = new BarrierOption(Barrier.Type.DownIn, 90.0, 0.0, payoff, exercise);
        const knockOut = new BarrierOption(Barrier.Type.DownOut, 90.0, 0.0, payoff, exercise);
        const european = new EuropeanOption(payoff, exercise);
        const barrierEngine = new AnalyticBarrierEngine(stochProcess);
        const europeanEngine = new AnalyticEuropeanEngine().init1(stochProcess);
        knockIn.setPricingEngine(barrierEngine);
        knockOut.setPricingEngine(barrierEngine);
        european.setPricingEngine(europeanEngine);
        let replicated = knockIn.NPV() + knockOut.NPV();
        let expected = european.NPV();
        let error = Math.abs(replicated - expected);
        expect(error).toBeLessThan(1e-7);
        volHandle.linkTo(flatVol2(today, 0.20, new Business252(new TARGET())));
        replicated = knockIn.NPV() + knockOut.NPV();
        expected = european.NPV();
        error = Math.abs(replicated - expected);
        expect(error).toBeLessThan(1e-7);
    });
    it('Testing barrier options against Haug\'s values...', () => {
        const european = Exercise.Type.European;
        const american = Exercise.Type.American;
        const values = [
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 9.0246, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 6.7924, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 4.8759, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 2.6789, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 2.3580, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.3453, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 7.7627, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 4.0109, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.0576, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 13.8333, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 7.8494, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 3.9795, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 14.1112, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 8.4482, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 4.5910, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 8.8334, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 7.0285, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 5.4137, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 2.6341, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 2.4389, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 2.4315, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 9.0093, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 5.1370, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 2.8517, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 14.8816, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 9.2045, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 5.3043, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 15.2098, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 9.7278, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 5.8350, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 2.2798, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 2.2947, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.6252, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 3.7760, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 5.4932, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 7.5187, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 2.9586, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 6.5677, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 11.9752, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 2.2845, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 5.9085, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 11.6465, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 1.4653, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.3721, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 7.0846, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 2.4170, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 2.4258, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 2.6246, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 4.2293, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 5.8032, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 7.5649, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 3.8769, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 7.7989, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 13.3078, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 3.3328, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 7.2636, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 12.9713, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 90, 100.0, 0.04, 0.08, 0.50, 0.30, 2.0658, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 100, 100.0, 0.04, 0.08, 0.50, 0.30, 4.4226, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, european, 110, 100.0, 0.04, 0.08, 0.50, 0.30, 8.3686, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 0.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 10.4655, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 0.0, Option.Type.Call, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 4.5159, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 0.0, Option.Type.Call, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.5971, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 0.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 11.8076, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 0.0, Option.Type.Call, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.3993, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.3457, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 2.2795, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 0.0, Option.Type.Put, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.3512, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 0.0, Option.Type.Put, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 11.5773, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 3.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 0.0, Option.Type.Put, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 1.4763, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 0.0, Option.Type.Put, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 3.3001, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 0.0, Option.Type.Put, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 10.0000, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 7.7615, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, american, 100, 100.0, 0.04, 0.08, 0.50, 0.25, 4.0118, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 2.0544, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 13.8308, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, american, 90, 100.0, 0.04, 0.08, 0.50, 0.25, 14.1150, 1.0e-4),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, american, 110, 100.0, 0.04, 0.08, 0.50, 0.25, 4.5900, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            let exercise;
            if (values[i].exType === Exercise.Type.European) {
                exercise = new EuropeanExercise(exDate);
            }
            else {
                exercise = new AmericanExercise().init2(exDate);
            }
            const barrierOption = new BarrierOption(values[i].barrierType, values[i].barrier, values[i].rebate, payoff, exercise);
            let engine;
            let calculated;
            let expected;
            let error;
            if (values[i].exType === Exercise.Type.European) {
                engine = new AnalyticBarrierEngine(stochProcess);
                barrierOption.setPricingEngine(engine);
                let calculated = barrierOption.NPV();
                let expected = values[i].result;
                let error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(values[i].tol);
                engine = new FdBlackScholesBarrierEngine(stochProcess, 200, 400);
                barrierOption.setPricingEngine(engine);
                calculated = barrierOption.NPV();
                expected = values[i].result;
                error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(5.0e-3);
            }
            engine = new BinomialBarrierEngine(new CoxRossRubinstein(), new DiscretizedBarrierOption())
                .init(stochProcess, 400);
            barrierOption.setPricingEngine(engine);
            calculated = barrierOption.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            let tol = 1.1e-2;
            expect(error).toBeLessThan(tol);
            engine =
                new BinomialBarrierEngine(new CoxRossRubinstein(), new DiscretizedDermanKaniBarrierOption())
                    .init(stochProcess, 400);
            barrierOption.setPricingEngine(engine);
            calculated = barrierOption.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            tol = 4e-2;
            expect(error).toBeLessThan(tol);
        }
    });
    it('Testing barrier options against Babsiri\'s values...', () => {
        const values = [
            new BarrierOptionData(Barrier.Type.DownIn, 0.10, 100, 90, 0.07187, 0.0),
            new BarrierOptionData(Barrier.Type.DownIn, 0.15, 100, 90, 0.60638, 0.0),
            new BarrierOptionData(Barrier.Type.DownIn, 0.20, 100, 90, 1.64005, 0.0),
            new BarrierOptionData(Barrier.Type.DownIn, 0.25, 100, 90, 2.98495, 0.0),
            new BarrierOptionData(Barrier.Type.DownIn, 0.30, 100, 90, 4.50952, 0.0),
            new BarrierOptionData(Barrier.Type.UpIn, 0.10, 100, 110, 4.79148, 0.0),
            new BarrierOptionData(Barrier.Type.UpIn, 0.15, 100, 110, 7.08268, 0.0),
            new BarrierOptionData(Barrier.Type.UpIn, 0.20, 100, 110, 9.11008, 0.0),
            new BarrierOptionData(Barrier.Type.UpIn, 0.25, 100, 110, 11.06148, 0.0),
            new BarrierOptionData(Barrier.Type.UpIn, 0.30, 100, 110, 12.98351, 0.0)
        ];
        const underlyingPrice = 100.0;
        const rebate = 0.0;
        const r = 0.05;
        const q = 0.02;
        const dc = new Actual360();
        const today = new Date();
        const underlying = new SimpleQuote(underlyingPrice);
        const qH_SME = new SimpleQuote(q);
        const qTS = flatRate1(today, qH_SME, dc);
        const rH_SME = new SimpleQuote(r);
        const rTS = flatRate1(today, rH_SME, dc);
        const volatility = new SimpleQuote(0.10);
        const volTS = flatVol1(today, volatility, dc);
        const exDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exDate);
        for (let i = 0; i < values.length; i++) {
            volatility.setValue(values[i].volatility);
            const callPayoff = new PlainVanillaPayoff(Option.Type.Call, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(underlying), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticBarrierEngine(stochProcess);
            const barrierCallOption = new BarrierOption(values[i].type, values[i].barrier, rebate, callPayoff, exercise);
            barrierCallOption.setPricingEngine(engine);
            let calculated = barrierCallOption.NPV();
            const expected = values[i].callValue;
            let error = Math.abs(calculated - expected);
            const maxErrorAllowed = 1.0e-5;
            expect(error).toBeLessThan(maxErrorAllowed);
            const maxMcRelativeErrorAllowed = 2.0e-2;
            const mcEngine = new MakeMCBarrierEngine(new LowDiscrepancy())
                .init(stochProcess)
                .withStepsPerYear(1)
                .withBrownianBridge()
                .withSamples(131071)
                .withMaxSamples(1048575)
                .withSeed(5)
                .f();
            barrierCallOption.setPricingEngine(mcEngine);
            calculated = barrierCallOption.NPV();
            error = Math.abs(calculated - expected) / expected;
            expect(error).toBeLessThan(maxMcRelativeErrorAllowed);
        }
    });
    it('Testing barrier options against Beaglehole\'s values...', () => {
        const values = [new BarrierOptionData(Barrier.Type.DownOut, 0.50, 50, 45, 5.477, 0.0)];
        const underlyingPrice = 50.0;
        const rebate = 0.0;
        const r = Math.log(1.1);
        const q = 0.00;
        const dc = new Actual360();
        const today = new Date();
        const underlying = new SimpleQuote(underlyingPrice);
        const qH_SME = new SimpleQuote(q);
        const qTS = flatRate1(today, qH_SME, dc);
        const rH_SME = new SimpleQuote(r);
        const rTS = flatRate1(today, rH_SME, dc);
        const volatility = new SimpleQuote(0.10);
        const volTS = flatVol1(today, volatility, dc);
        const exDate = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(exDate);
        for (let i = 0; i < values.length; i++) {
            volatility.setValue(values[i].volatility);
            const callPayoff = new PlainVanillaPayoff(Option.Type.Call, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(underlying), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticBarrierEngine(stochProcess);
            const barrierCallOption = new BarrierOption(values[i].type, values[i].barrier, rebate, callPayoff, exercise);
            barrierCallOption.setPricingEngine(engine);
            let calculated = barrierCallOption.NPV();
            const expected = values[i].callValue;
            const maxErrorAllowed = 1.0e-3;
            let error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(maxErrorAllowed);
            const maxMcRelativeErrorAllowed = 0.01;
            const mcEngine = new MakeMCBarrierEngine(new LowDiscrepancy(), stochProcess)
                .withStepsPerYear(1)
                .withBrownianBridge()
                .withSamples(131071)
                .withMaxSamples(1048575)
                .withSeed(10)
                .f();
            barrierCallOption.setPricingEngine(mcEngine);
            calculated = barrierCallOption.NPV();
            error = Math.abs(calculated - expected) / expected;
            expect(error).toBeLessThan(maxMcRelativeErrorAllowed);
        }
    });
    it('Testing local volatility and Heston FD engines' +
        ' for barrier options...', () => {
        const backup = new SavedSettings();
        const settlementDate = new Date('5-July-2002');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const calendar = new TARGET();
        const t = [13, 41, 75, 165, 256, 345, 524, 703];
        const r = [0.0357, 0.0349, 0.0341, 0.0355, 0.0359, 0.0368, 0.0386, 0.0401];
        const rates = [0.0357];
        const dates = [settlementDate];
        for (let i = 0; i < 8; ++i) {
            dates.push(DateExt.add(settlementDate, t[i]));
            rates.push(r[i]);
        }
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dayCounter));
        const qTS = new Handle(flatRate2(settlementDate, 0.0, dayCounter));
        const s0 = new Handle(new SimpleQuote(4500.00));
        const tmp = [
            100, 500, 2000, 3400, 3600, 3800, 4000, 4200, 4400, 4500,
            4600, 4800, 5000, 5200, 5400, 5600, 7500, 10000, 20000, 30000
        ];
        const strikes = Array.from(tmp);
        const v = [
            1.015873, 1.015873, 1.015873, 0.89729, 0.796493, 0.730914, 0.631335,
            0.568895, 0.711309, 0.711309, 0.711309, 0.641309, 0.635593, 0.583653,
            0.508045, 0.463182, 0.516034, 0.500534, 0.500534, 0.500534, 0.448706,
            0.416661, 0.375470, 0.353442, 0.516034, 0.482263, 0.447713, 0.387703,
            0.355064, 0.337438, 0.316966, 0.306859, 0.497587, 0.464373, 0.430764,
            0.374052, 0.344336, 0.328607, 0.310619, 0.301865, 0.479511, 0.446815,
            0.414194, 0.361010, 0.334204, 0.320301, 0.304664, 0.297180, 0.461866,
            0.429645, 0.398092, 0.348638, 0.324680, 0.312512, 0.299082, 0.292785,
            0.444801, 0.413014, 0.382634, 0.337026, 0.315788, 0.305239, 0.293855,
            0.288660, 0.428604, 0.397219, 0.368109, 0.326282, 0.307555, 0.298483,
            0.288972, 0.284791, 0.420971, 0.389782, 0.361317, 0.321274, 0.303697,
            0.295302, 0.286655, 0.282948, 0.413749, 0.382754, 0.354917, 0.316532,
            0.300016, 0.292251, 0.284420, 0.281164, 0.400889, 0.370272, 0.343525,
            0.307904, 0.293204, 0.286549, 0.280189, 0.277767, 0.390685, 0.360399,
            0.334344, 0.300507, 0.287149, 0.281380, 0.276271, 0.274588, 0.383477,
            0.353434, 0.327580, 0.294408, 0.281867, 0.276746, 0.272655, 0.271617,
            0.379106, 0.349214, 0.323160, 0.289618, 0.277362, 0.272641, 0.269332,
            0.268846, 0.377073, 0.347258, 0.320776, 0.286077, 0.273617, 0.269057,
            0.266293, 0.266265, 0.399925, 0.369232, 0.338895, 0.289042, 0.265509,
            0.255589, 0.249308, 0.249665, 0.423432, 0.406891, 0.373720, 0.314667,
            0.281009, 0.263281, 0.246451, 0.242166, 0.453704, 0.453704, 0.453704,
            0.381255, 0.334578, 0.305527, 0.268909, 0.251367, 0.517748, 0.517748,
            0.517748, 0.416577, 0.364770, 0.331595, 0.287423, 0.264285
        ];
        const blackVolMatrix = Array2D.newMatrix(strikes.length, dates.length - 1);
        for (let i = 0; i < strikes.length; ++i) {
            for (let j = 1; j < dates.length; ++j) {
                blackVolMatrix[i][j - 1] = v[i * (dates.length - 1) + j - 1];
            }
        }
        const volTS = new BlackVarianceSurface(settlementDate, calendar, dates.slice(1, dates.length), strikes, blackVolMatrix, dayCounter);
        volTS.setInterpolation(new Bicubic());
        const localVolProcess = new BlackScholesMertonProcess(s0, qTS, rTS, new Handle(volTS));
        const v0 = 0.195662;
        const kappa = 5.6628;
        const theta = 0.0745911;
        const sigma = 1.1619;
        const rho = -0.511493;
        const hestonProcess = new HestonProcess(rTS, qTS, s0, v0, kappa, theta, sigma, rho);
        const hestonModel = new HestonModel(hestonProcess);
        const fdHestonEngine = new FdHestonBarrierEngine(hestonModel, 100, 400, 50);
        const fdLocalVolEngine = new FdBlackScholesBarrierEngine(localVolProcess, 100, 400, 0, FdmSchemeDesc.Douglas(), true, 0.35);
        const strike = s0.currentLink().value();
        const barrier = 3000;
        const rebate = 100;
        const exDate = DateExt.advance(settlementDate, 20, TimeUnit.Months);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const exercise = new EuropeanExercise(exDate);
        const barrierOption = new BarrierOption(Barrier.Type.DownOut, barrier, rebate, payoff, exercise);
        barrierOption.setPricingEngine(fdHestonEngine);
        const expectedHestonNPV = 111.5;
        const calculatedHestonNPV = barrierOption.NPV();
        barrierOption.setPricingEngine(fdLocalVolEngine);
        const expectedLocalVolNPV = 132.8;
        const calculatedLocalVolNPV = barrierOption.NPV();
        const tol = 0.01;
        expect(Math.abs(expectedHestonNPV - calculatedHestonNPV))
            .toBeLessThan(tol * expectedHestonNPV);
        expect(Math.abs(expectedLocalVolNPV - calculatedLocalVolNPV))
            .toBeLessThan(tol * expectedLocalVolNPV);
        backup.dispose();
    });
    it('Testing barrier option pricing with discrete dividends...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('11-February-2018');
        const maturity = DateExt.advance(today, 1, TimeUnit.Years);
        Settings.evaluationDate.set(today);
        const spot = 100.0;
        const strike = 105.0;
        const rebate = 5.0;
        const barriers = [80.0, 120.0];
        const barrierTypes = [Barrier.Type.DownOut, Barrier.Type.UpOut];
        const r = 0.05;
        const q = 0.0;
        const v = 0.02;
        const s0 = new Handle(new SimpleQuote(spot));
        const qTS = new Handle(flatRate2(today, q, dc));
        const rTS = new Handle(flatRate2(today, r, dc));
        const volTS = new Handle(flatVol2(today, v, dc));
        const bsProcess = new BlackScholesMertonProcess(s0, qTS, rTS, volTS);
        const douglas = new FdBlackScholesBarrierEngine(bsProcess, 100, 100, 0, FdmSchemeDesc.Douglas());
        const craigSnyed = new FdBlackScholesBarrierEngine(bsProcess, 100, 100, 0, FdmSchemeDesc.CraigSneyd());
        const hundsdorfer = new FdBlackScholesBarrierEngine(bsProcess, 100, 100, 0, FdmSchemeDesc.Hundsdorfer());
        const mol = new FdBlackScholesBarrierEngine(bsProcess, 100, 100, 0, FdmSchemeDesc.MethodOfLines());
        const trPDF2 = new FdBlackScholesBarrierEngine(bsProcess, 100, 100, 0, FdmSchemeDesc.TrBDF2());
        const hestonEngine = new FdHestonBarrierEngine(new HestonModel(new HestonProcess(rTS, qTS, s0, v * v, 1.0, v * v, 0.005, 0.0)), 50, 101, 3);
        const engines = [douglas, trPDF2, craigSnyed, hundsdorfer, mol, hestonEngine];
        const payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const exercise = new EuropeanExercise(maturity);
        const divAmount = 30;
        const divDate = DateExt.advance(today, 6, TimeUnit.Months);
        const expected = [
            rTS.currentLink().discount1(divDate) * rebate,
            payoff.f((spot - divAmount * rTS.currentLink().discount1(divDate)) /
                rTS.currentLink().discount1(maturity)) *
                rTS.currentLink().discount1(maturity)
        ];
        const relTol = 1e-4;
        for (let i = 0; i < barriers.length; ++i) {
            for (let j = 0; j < engines.length; ++j) {
                const barrier = barriers[i];
                const barrierType = barrierTypes[i];
                const barrierOption = new DividendBarrierOption(barrierType, barrier, rebate, payoff, exercise, [divDate], [divAmount]);
                barrierOption.setPricingEngine(engines[j]);
                const calculated = barrierOption.NPV();
                const diff = Math.abs(calculated - expected[i]);
                expect(diff).toBeLessThan(relTol * expected[i]);
            }
        }
        backup.dispose();
    });
});
describe('Barrier option experimental tests', () => {
    it('Testing perturbative engine for barrier options...', () => {
        const S = 100.0;
        const rebate = 0.0;
        const r = 0.03;
        const q = 0.02;
        const dc = new Actual360();
        const today = new Date();
        const underlying = new SimpleQuote(S);
        const qTS = flatRate2(today, q, dc);
        const rTS = flatRate2(today, r, dc);
        const dates = new Array(2);
        const vols = new Array(2);
        dates[0] = DateExt.add(today, 90);
        vols[0] = 0.105;
        dates[1] = DateExt.add(today, 180);
        vols[1] = 0.11;
        const volTS = new BlackVarianceCurve(today, dates, vols, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(underlying), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const strike = 101.0;
        const barrier = 101.0;
        const exDate = DateExt.add(today, 180);
        const exercise = new EuropeanExercise(exDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const option = new BarrierOption(Barrier.Type.UpOut, barrier, rebate, payoff, exercise);
        let order = 0;
        const zeroGamma = false;
        let engine = new PerturbativeBarrierOptionEngine(stochProcess, order, zeroGamma);
        option.setPricingEngine(engine);
        let calculated = option.NPV();
        let expected = 0.897365;
        const tolerance = 1.0e-6;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
        order = 1;
        engine =
            new PerturbativeBarrierOptionEngine(stochProcess, order, zeroGamma);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        expected = 0.894374;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });
    it('Testing barrier FX options against Vanna/Volga values...', () => {
        const backup = new SavedSettings();
        const values = [
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.148127, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.075943, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.0274771, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.00573, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00012, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00697606, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.020078, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.0489395, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.0969877, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.5, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.157, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.0322202, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.0241491, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.0164275, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.01, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00489, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.000560713, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.000546804, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.000130649, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.000300828, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.5, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00135, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.17746, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.0994142, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.0439, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.01574, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00501, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00612, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.00426, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.00257, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.00122, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00045, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00022, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.00284, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.02032, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.058235, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.1, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.109432, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.00017, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00083, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00289, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.00067784, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.17423, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.09584, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.04133, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.01452, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.00456, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00732, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.01778, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.02875, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.0390535, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.1, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.0489236, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.11638, 0.00753, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.10088, 0.02062, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08925, 0.04907, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08463, 0.09711, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1, 0.10087, 0.08925, 0.08463, 0.08412, 0.15752, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.20493, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.105577, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.0358872, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.00634958, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.0108218, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.0313339, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.0751237, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.153407, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpOut, 1.6, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.253767, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.05402, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.0410069, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.0279562, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.0173055, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00764, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.000962737, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.00102637, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.000419834, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.00159277, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.UpIn, 1.6, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00473629, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.255098, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.145701, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.06384, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.02366, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00764, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.00592, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.00421, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.00256, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.0012, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.0004, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.00280549, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.0279945, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.0896352, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.175182, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.00000, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.00000, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.00000, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.0002, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownOut, 1.3, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00096, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.00384783, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.000883232, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.00000, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00000, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.25302, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.14238, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.06128, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.02245, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.00725, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.01178, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.0295548, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.047549, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.0653642, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.0833221, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.12511, 0.01178, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.1089, 0.03236, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09444, 0.07554, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09197, 0.15479, 1.0e-4),
            new BarrierFxOptionData(Barrier.Type.DownIn, 1.3, 0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2, 0.10891, 0.09525, 0.09197, 0.09261, 0.25754, 1.0e-4)
        ];
        const dc = new Actual365Fixed();
        const today = new Date('5-March-2013');
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol25Put = new SimpleQuote(0.0);
        const volAtm = new SimpleQuote(0.0);
        const vol25Call = new SimpleQuote(0.0);
        for (let i = 0; i < values.length; i++) {
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol25Put.setValue(values[i].vol25Put);
            volAtm.setValue(values[i].volAtm);
            vol25Call.setValue(values[i].vol25Call);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 365 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            const volAtmQuote = new Handle(new DeltaVolQuote().init2(new Handle(volAtm), DeltaVolQuote.DeltaType.Fwd, values[i].t, DeltaVolQuote.AtmType.AtmDeltaNeutral));
            const vol25PutQuote = new Handle(new DeltaVolQuote().init1(-0.25, new Handle(vol25Put), values[i].t, DeltaVolQuote.DeltaType.Fwd));
            const vol25CallQuote = new Handle(new DeltaVolQuote().init1(0.25, new Handle(vol25Call), values[i].t, DeltaVolQuote.DeltaType.Fwd));
            const barrierOption = new BarrierOption(values[i].barrierType, values[i].barrier, values[i].rebate, payoff, exercise);
            const bsVanillaPrice = blackFormula1(values[i].type, values[i].strike, spot.value() * qTS.discount2(values[i].t) /
                rTS.discount2(values[i].t), values[i].v * Math.sqrt(values[i].t), rTS.discount2(values[i].t));
            const vannaVolgaEngine = new VannaVolgaBarrierEngine(volAtmQuote, vol25PutQuote, vol25CallQuote, new Handle(spot), new Handle(rTS), new Handle(qTS), true, bsVanillaPrice);
            barrierOption.setPricingEngine(vannaVolgaEngine);
            const calculated = barrierOption.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
        backup.dispose();
    });
});
//# sourceMappingURL=barrieroption.js.map