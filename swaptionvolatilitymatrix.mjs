import { Actual365Fixed, BlackSwaptionEngine, Comparison, DateExt, EuriborSwapIsdaFixA, FlatForward, Handle, MakeSwaption, RelinkableHandle, SavedSettings, Settings, SwaptionVolatilityMatrix, TimeUnit, VolatilityType } from '/ql.mjs';
import { AtmVolatility, SwaptionMarketConventions } from '/test-suite/swaptionvolstructuresutilities.mjs';
class CommonVars {
    constructor() {
        this.conventions = new SwaptionMarketConventions();
        this.atm = new AtmVolatility();
        this.termStructure = new RelinkableHandle();
        this.atmVolMatrix = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.conventions.setConventions();
        this.atm.setMarketData();
        Settings.evaluationDate.set(this.conventions.calendar.adjust(new Date()));
        this.atmVolMatrix = new RelinkableHandle(new SwaptionVolatilityMatrix().svmInit1(this.conventions.calendar, this.conventions.optionBdc, this.atm.tenors.options, this.atm.tenors.swaps, this.atm.volsHandle, this.conventions.dayCounter));
        this.termStructure.linkTo(new FlatForward().ffInit4(0, this.conventions.calendar, 0.05, new Actual365Fixed()));
    }
    makeObservabilityTest(description, vol, mktDataFloating, referenceDateFloating) {
        const dummyStrike = .02;
        const referenceDate = Settings.evaluationDate.f();
        const initialVol = vol.volatility2(DateExt.advance(referenceDate, this.atm.tenors.options[0].length(), this.atm.tenors.options[0].units()), this.atm.tenors.swaps[0], dummyStrike, false);
        Settings.evaluationDate.set(DateExt.advance(referenceDate, -1, TimeUnit.Years));
        let newVol = vol.volatility2(DateExt.advance(referenceDate, this.atm.tenors.options[0].length(), this.atm.tenors.options[0].units()), this.atm.tenors.swaps[0], dummyStrike, false);
        Settings.evaluationDate.set(referenceDate);
        if (referenceDateFloating && (initialVol === newVol)) {
            throw new Error(`${description}
      the volatility should change when the reference date is changed !`);
        }
        if (!referenceDateFloating && (initialVol !== newVol)) {
            throw new Error(`${description}
      the volatility should not change when the reference date is changed !`);
        }
        if (mktDataFloating) {
            const initialVolatility = this.atm.volsHandle[0][0].currentLink().value();
            this.atm.volsHandle[0][0].currentLink().setValue(10);
            newVol = vol.volatility2(DateExt.advance(referenceDate, this.atm.tenors.options[0].length(), this.atm.tenors.options[0].units()), this.atm.tenors.swaps[0], dummyStrike, false);
            this.atm.volsHandle[0][0].currentLink()
                .setValue(initialVolatility);
            if (initialVol === newVol) {
                throw new Error(`${description} the market data is changed !`);
            }
        }
    }
    makeCoherenceTest(description, vol) {
        for (let i = 0; i < this.atm.tenors.options.length; ++i) {
            const optionDate = vol.optionDateFromTenor(this.atm.tenors.options[i]);
            if (optionDate.valueOf() !== vol.optionDates()[i].valueOf()) {
                throw new Error(`optionDateFromTenor failure for
                    ${description} :
                           option tenor: ${this.atm.tenors.options[i]}
                    actual option date : ${optionDate}
                      exp. option date : ${vol.optionDates()[i]}`);
            }
            const optionTime = vol.timeFromReference(optionDate);
            if (!Comparison.close(optionTime, vol.optionTimes()[i])) {
                throw new Error(`timeFromReference failure for
                    ${description} :
                           option tenor: ${this.atm.tenors.options[i]}
                           option date : ${optionDate}
                    actual option time : ${optionTime}
                      exp. option time : ${vol.optionTimes()[i]}`);
            }
        }
        const engine = new BlackSwaptionEngine().bseInit3(this.termStructure, new Handle(vol));
        for (let j = 0; j < this.atm.tenors.swaps.length; j++) {
            const swapLength = vol.swapLength1(this.atm.tenors.swaps[j]);
            if (!Comparison.close(swapLength, this.atm.tenors.swaps[j].length())) {
                throw new Error(`convertSwapTenor failure for
                               ${description} :
                                      swap tenor : ${this.atm.tenors.swaps[j]}
                               actual swap length: ${swapLength}
                                 exp. swap length: ${this.atm.tenors.swaps[j].length()}`);
            }
            const swapIndex = new EuriborSwapIsdaFixA().esInit1(this.atm.tenors.swaps[j], this.termStructure);
            for (let i = 0; i < this.atm.tenors.options.length; ++i) {
                let error;
                const tolerance = 1.0e-16;
                let actVol;
                const expVol = this.atm.vols[i][j];
                actVol = vol.volatility1(this.atm.tenors.options[i], this.atm.tenors.swaps[j], 0.05, true);
                error = Math.abs(expVol - actVol);
                if (error > tolerance) {
                    throw new Error(`recovery of atm vols failed for
                         ${description} :
                         option tenor = ${this.atm.tenors.options[i]}
                          swap length = ${this.atm.tenors.swaps[j]}
                         expected vol = ${expVol}
                           actual vol = ${actVol}
                                error = ${error}
                            tolerance = ${tolerance}`);
                }
                const optionDate = vol.optionDateFromTenor(this.atm.tenors.options[i]);
                actVol =
                    vol.volatility2(optionDate, this.atm.tenors.swaps[j], 0.05, true);
                error = Math.abs(expVol - actVol);
                if (error > tolerance) {
                    throw new Error(`recovery of atm vols failed for
                        ${description} :
                          option tenor: ${this.atm.tenors.options[i]}
                          option date : ${optionDate}
                            swap tenor: ${this.atm.tenors.swaps[j]}
                              exp. vol: ${expVol}
                            actual vol: ${actVol}
                                 error: ${error}
                             tolerance: ${tolerance}`);
                }
                const optionTime = vol.timeFromReference(optionDate);
                actVol = vol.volatility6(optionTime, swapLength, 0.05, true);
                error = Math.abs(expVol - actVol);
                if (error > tolerance) {
                    throw new Error(`recovery of atm vols failed for
                       ${description} :
                         noption tenor: ${this.atm.tenors.options[i]}
                          option time : ${optionTime}
                            swap tenor: ${this.atm.tenors.swaps[j]}
                           swap length: ${swapLength}
                              exp. vol: ${expVol}
                            actual vol: ${actVol}
                                 error: ${error}
                             tolerance: ${tolerance}`);
                }
                const swaption = new MakeSwaption()
                    .init1(swapIndex, this.atm.tenors.options[i])
                    .withPricingEngine(engine)
                    .f();
                const exerciseDate = swaption.exercise().dates()[0];
                if (exerciseDate.valueOf() !== vol.optionDates()[i].valueOf()) {
                    throw new Error(`optionDateFromTenor mismatch for
                        ${description} :
                              option tenor: ${this.atm.tenors.options[i]}
                        actual option date: ${exerciseDate}
                          exp. option date: ${vol.optionDates()[i]}`);
                }
                const start = swaption.underlyingSwap().startDate();
                const end = swaption.underlyingSwap().maturityDate();
                const swapLength2 = vol.swapLength2(start, end);
                if (!Comparison.close(swapLength2, swapLength)) {
                    throw new Error(`swapLength failure for " <<
                                   ${description} :
                                       exp. swap length: ${swapLength}
                                     actual swap length: ${swapLength2}
                                            swap tenor : ${this.atm.tenors.swaps[j]}
                                      swap index tenor : ${swapIndex.tenor()}
                                            option date: ${exerciseDate}
                                             start date: ${start}
                                          maturity date: ${end}
                                   `);
                }
                const npv = swaption.NPV();
                actVol = swaption.impliedVolatility(npv, this.termStructure, expVol * 0.98, 1e-6, 100, 10.0e-7, 4.0, VolatilityType.ShiftedLognormal, 0.0);
                error = Math.abs(expVol - actVol);
                const tolerance2 = 0.000001;
                if (error > tolerance2) {
                    throw new Error(`recovery of atm vols through BlackSwaptionEngine failed for
                       ${description} :
                          option tenor: ${this.atm.tenors.options[i]}
                          option time : ${optionTime}
                            swap tenor: ${this.atm.tenors.swaps[j]}
                           swap length: ${swapLength}
                              exp. vol: ${expVol}
                            actual vol: ${actVol}
                                 error: ${error}
                             tolerance: ${tolerance2}`);
                }
            }
        }
    }
}
describe('Swaption Volatility Matrix tests', () => {
    it('Testing swaption volatility matrix observability...', () => {
    });
    it('Testing swaption volatility matrix...', () => {
        const vars = new CommonVars();
        let vol;
        let description;
        description = 'floating reference date, floating market data';
        vol = new SwaptionVolatilityMatrix().svmInit1(vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeCoherenceTest(description, vol);
    });
});
//# sourceMappingURL=swaptionvolatilitymatrix.js.map