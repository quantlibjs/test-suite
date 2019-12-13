/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Actual365Fixed, BlackSwaptionEngine, Comparison, DateExt, EuriborSwapIsdaFixA, FlatForward, Handle, MakeSwaption, RelinkableHandle, SavedSettings, Settings, SwaptionVolatilityMatrix, TimeUnit, VolatilityType } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
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
        if (referenceDateFloating) {
            expect(initialVol).toEqual(newVol);
        }
        else {
            expect(initialVol).not.toEqual(newVol);
        }
        if (mktDataFloating) {
            const initialVolatility = this.atm.volsHandle[0][0].currentLink().value();
            this.atm.volsHandle[0][0].currentLink().setValue(10);
            newVol = vol.volatility2(DateExt.advance(referenceDate, this.atm.tenors.options[0].length(), this.atm.tenors.options[0].units()), this.atm.tenors.swaps[0], dummyStrike, false);
            this.atm.volsHandle[0][0].currentLink()
                .setValue(initialVolatility);
            expect(initialVol).not.toEqual(newVol);
        }
    }
    makeCoherenceTest(description, vol) {
        for (let i = 0; i < this.atm.tenors.options.length; ++i) {
            const optionDate = vol.optionDateFromTenor(this.atm.tenors.options[i]);
            expect(optionDate.valueOf()).toEqual(vol.optionDates()[i].valueOf());
            const optionTime = vol.timeFromReference(optionDate);
            expect(Comparison.close(optionTime, vol.optionTimes()[i])).toBeTruthy();
        }
        const engine = new BlackSwaptionEngine().bseInit3(this.termStructure, new Handle(vol));
        for (let j = 0; j < this.atm.tenors.swaps.length; j++) {
            const swapLength = vol.swapLength1(this.atm.tenors.swaps[j]);
            expect(Comparison.close(swapLength, this.atm.tenors.swaps[j].length()))
                .toBeTruthy();
            const swapIndex = new EuriborSwapIsdaFixA().esInit1(this.atm.tenors.swaps[j], this.termStructure);
            for (let i = 0; i < this.atm.tenors.options.length; ++i) {
                let error;
                const tolerance = 1.0e-16;
                let actVol;
                const expVol = this.atm.vols[i][j];
                actVol = vol.volatility1(this.atm.tenors.options[i], this.atm.tenors.swaps[j], 0.05, true);
                error = Math.abs(expVol - actVol);
                expect(error).toBeLessThan(tolerance);
                const optionDate = vol.optionDateFromTenor(this.atm.tenors.options[i]);
                actVol =
                    vol.volatility2(optionDate, this.atm.tenors.swaps[j], 0.05, true);
                error = Math.abs(expVol - actVol);
                expect(error).toBeLessThan(tolerance);
                const optionTime = vol.timeFromReference(optionDate);
                actVol = vol.volatility6(optionTime, swapLength, 0.05, true);
                error = Math.abs(expVol - actVol);
                expect(error).toBeLessThan(tolerance);
                const swaption = new MakeSwaption()
                    .init1(swapIndex, this.atm.tenors.options[i])
                    .withPricingEngine(engine)
                    .f();
                const exerciseDate = swaption.exercise().dates()[0];
                expect(exerciseDate.valueOf()).toEqual(vol.optionDates()[i].valueOf());
                const start = swaption.underlyingSwap().startDate();
                const end = swaption.underlyingSwap().maturityDate();
                const swapLength2 = vol.swapLength2(start, end);
                expect(Comparison.close(swapLength2, swapLength)).toBeTruthy();
                const npv = swaption.NPV();
                actVol = swaption.impliedVolatility(npv, this.termStructure, expVol * 0.98, 1e-6, 100, 10.0e-7, 4.0, VolatilityType.ShiftedLognormal, 0.0);
                error = Math.abs(expVol - actVol);
                const tolerance2 = 0.000001;
                expect(error).toBeLessThan(tolerance2);
            }
        }
    }
    dispose() {
        this.backup.dispose();
    }
}

describe('Swaption Volatility Matrix tests', () => {
    it('Testing swaption volatility matrix observability...', () => {
        const vars = new CommonVars();
        let vol;
        let description;
        description = 'floating reference date, floating market data';
        vol = new SwaptionVolatilityMatrix().svmInit1(vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeObservabilityTest(description, vol, true, true);
        description = 'fixed reference date, floating market data';
        vol = new SwaptionVolatilityMatrix().svmInit2(Settings.evaluationDate.f(), vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeObservabilityTest(description, vol, true, false);
        description = 'floating reference date, fixed market data';
        vol = new SwaptionVolatilityMatrix().svmInit1(vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeObservabilityTest(description, vol, false, true);
        description = 'fixed reference date, fixed market data';
        vol = new SwaptionVolatilityMatrix().svmInit2(Settings.evaluationDate.f(), vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeObservabilityTest(description, vol, false, false);
        vars.dispose();
    });

    it('Testing swaption volatility matrix...', () => {
        const vars = new CommonVars();
        let vol;
        let description;
        description = 'floating reference date, floating market data';
        vol = new SwaptionVolatilityMatrix().svmInit1(vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeCoherenceTest(description, vol);
        description = 'fixed reference date, floating market data';
        vol = new SwaptionVolatilityMatrix().svmInit2(Settings.evaluationDate.f(), vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeCoherenceTest(description, vol);
        description = 'floating reference date, fixed market data';
        vol = new SwaptionVolatilityMatrix().svmInit1(vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeCoherenceTest(description, vol);
        description = 'fixed reference date, fixed market data';
        vol = new SwaptionVolatilityMatrix().svmInit2(Settings.evaluationDate.f(), vars.conventions.calendar, vars.conventions.optionBdc, vars.atm.tenors.options, vars.atm.tenors.swaps, vars.atm.volsHandle, vars.conventions.dayCounter);
        vars.makeCoherenceTest(description, vol);
        vars.dispose();
    });
});