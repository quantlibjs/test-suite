import { Actual360, Actual365Fixed, EndCriteria, Euribor6M, Handle, HullWhite, JamshidianSwaptionEngine, LevenbergMarquardt, Period, SavedSettings, Settings, SimpleQuote, SwaptionHelper, Thirty360, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class CalibrationData {
    constructor(start, length, volatility) {
        this.start = start;
        this.length = length;
        this.volatility = volatility;
    }
}

describe('Short-rate model tests', () => {
    it('Testing Hull-White calibration against ' +
        'cached values using swaptions with start delay...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const today = new Date('15-February-2002');
        const settlement = new Date('19-February-2002');
        Settings.evaluationDate.set(today);
        const termStructure = new Handle(flatRate2(settlement, 0.04875825, new Actual365Fixed()));
        const model = new HullWhite(termStructure);
        const data = [
            new CalibrationData(1, 5, 0.1148), new CalibrationData(2, 4, 0.1108),
            new CalibrationData(3, 3, 0.1070), new CalibrationData(4, 2, 0.1021),
            new CalibrationData(5, 1, 0.1000)
        ];
        const index = new Euribor6M(termStructure);
        const engine = new JamshidianSwaptionEngine(model);
        const swaptions = [];
        for (let i = 0; i < data.length; i++) {
            const vol = new SimpleQuote(data[i].volatility);
            const helper = new SwaptionHelper().shInit1(new Period().init1(data[i].start, TimeUnit.Years), new Period().init1(data[i].length, TimeUnit.Years), new Handle(vol), index, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), termStructure);
            helper.setPricingEngine(engine);
            swaptions.push(helper);
        }
        const optimizationMethod = new LevenbergMarquardt(1.0e-8, 1.0e-8, 1.0e-8);
        const endCriteria = new EndCriteria(10000, 100, 1e-6, 1e-8, 1e-8);
        model.calibrate(swaptions, optimizationMethod, endCriteria);
        const ecType = model.endCriteria();
        const cachedA = 0.0463679, cachedSigma = 0.00579831;
        const tolerance = 1.0e-5;
        const xMinCalculated = model.params();
        const yMinCalculated = model.value(xMinCalculated, swaptions);
        const xMinExpected = [cachedA, cachedSigma];
        const yMinExpected = model.value(xMinExpected, swaptions);
        if (Math.abs(xMinCalculated[0] - cachedA) > tolerance &&
            Math.abs(xMinCalculated[1] - cachedSigma) > tolerance) {
            throw new Error(`
        Failed to reproduce cached calibration results:
        calculated: a = ${xMinCalculated[0]}
        sigma = ${xMinCalculated[1]}
        f(a) = ${yMinCalculated}
        expected:   a = ${xMinExpected[0]}
        sigma = ${xMinExpected[1]}
        f(a) = ${yMinExpected}
        difference: a = ${xMinCalculated[0] - xMinExpected[0]}
        sigma = ${xMinCalculated[1] - xMinExpected[1]}
        f(a) = ${yMinCalculated - yMinExpected}
        end criteria = ${ecType}
      `);
        }
        backup.dispose();
        cleaner.dispose();
    });
    it('Testing Hull-White calibration with ' +
        'fixed reversion against cached values...', () => {
    });
    it('Testing Hull-White calibration against cached' +
        ' values using swaptions without start delay...', () => {
    });
    it('Testing Hull-White swap pricing against known values...', () => {
    });
    it('Testing Hull-White futures convexity bias...', () => {
    });
    it('Testing zero bond pricing for extended CIR model ...', () => {
    });
});