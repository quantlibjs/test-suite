import { Actual360, AnalyticComplexChooserEngine, AnalyticSimpleChooserEngine, BlackScholesMertonProcess, ComplexChooserOption, DateExt, EuropeanExercise, Handle, Settings, SimpleChooserOption, SimpleQuote } from '/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

describe('Chooser option tests', () => {
    it('Testing analytic simple chooser option...', () => {
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const spot = new SimpleQuote(50.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.08);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticSimpleChooserEngine(stochProcess);
        const strike = 50.0;
        const exerciseDate = DateExt.add(today, 180);
        const exercise = new EuropeanExercise(exerciseDate);
        const choosingDate = DateExt.add(today, 90);
        const option = new SimpleChooserOption(choosingDate, strike, exercise);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 6.1071;
        const tolerance = 3e-5;
        expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
    });
    it('Testing analytic complex chooser option...', () => {
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(50.0);
        const qRate = new SimpleQuote(0.05);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.10);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.35);
        const volTS = flatVol1(today, vol, dc);
        const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticComplexChooserEngine(stochProcess);
        const callStrike = 55.0;
        const putStrike = 48.0;
        const choosingDate = DateExt.add(today, 90);
        const callExerciseDate = DateExt.add(choosingDate, 180);
        const putExerciseDate = DateExt.add(choosingDate, 210);
        const callExercise = new EuropeanExercise(callExerciseDate);
        const putExercise = new EuropeanExercise(putExerciseDate);
        const option = new ComplexChooserOption(choosingDate, callStrike, putStrike, callExercise, putExercise);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 6.0508;
        const error = Math.abs(calculated - expected);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
    });
});
//# sourceMappingURL=chooseroption.js.map