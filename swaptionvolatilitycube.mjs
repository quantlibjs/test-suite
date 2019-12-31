/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
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
import { Actual365Fixed, Array1D, EuriborSwapIsdaFixA, Handle, Period, RelinkableHandle, SavedSettings, Settings, SimpleQuote, SpreadedSwaptionVolatility, SwaptionVolatilityMatrix, SwaptionVolCube1, SwaptionVolCube2, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag, flatRate4 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.atmVolMatrix = new RelinkableHandle();
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.conventions.setConventions();
        this.atm.setMarketData();
        this.atmVolMatrix =
            new RelinkableHandle(new SwaptionVolatilityMatrix().svmInit1(this.conventions.calendar, this.conventions.optionBdc, this.atm.tenors.options, this.atm.tenors.swaps, this.atm.volsHandle, this.conventions.dayCounter));
        this.cube.setMarketData();
        this.termStructure.linkTo(flatRate4(0.05, new Actual365Fixed()));
        this.swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(2, TimeUnit.Years), this.termStructure);
        this.shortSwapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years), this.termStructure);
        this.vegaWeighedSmileFit = false;
    }
    makeAtmVolTest(volCube, tolerance) {
        for (let i = 0; i < this.atm.tenors.options.length; i++) {
            for (let j = 0; j < this.atm.tenors.swaps.length; j++) {
                const strike = volCube.atmStrike2(this.atm.tenors.options[i], this.atm.tenors.swaps[j]);
                const expVol = this.atmVolMatrix.currentLink().volatility1(this.atm.tenors.options[i], this.atm.tenors.swaps[j], strike, true);
                const actVol = volCube.volatility1(this.atm.tenors.options[i], this.atm.tenors.swaps[j], strike, true);
                const error = Math.abs(expVol - actVol);
                expect(error).toBeLessThan(tolerance);
            }
        }
    }
    makeVolSpreadsTest(volCube, tolerance) {
        for (let i = 0; i < this.cube.tenors.options.length; i++) {
            for (let j = 0; j < this.cube.tenors.swaps.length; j++) {
                for (let k = 0; k < this.cube.strikeSpreads.length; k++) {
                    const atmStrike = volCube.atmStrike2(this.cube.tenors.options[i], this.cube.tenors.swaps[j]);
                    const atmVol = this.atmVolMatrix.currentLink().volatility1(this.cube.tenors.options[i], this.cube.tenors.swaps[j], atmStrike, true);
                    const vol = volCube.volatility1(this.cube.tenors.options[i], this.cube.tenors.swaps[j], atmStrike + this.cube.strikeSpreads[k], true);
                    const spread = vol - atmVol;
                    const expVolSpread = this.cube.volSpreads[i * this.cube.tenors.swaps.length + j][k];
                    const error = Math.abs(expVolSpread - spread);
                    expect(error).toBeLessThan(tolerance);
                }
            }
        }
    }
    dispose() {
        this.backup.dispose();
    }
}

describe(`Swaption Volatility Cube tests ${version}`, () => {
    it('Testing swaption volatility cube (atm vols)...', () => {
        const vars = new CommonVars();
        const volCube = new SwaptionVolCube2(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit);
        const tolerance = 1.0e-16;
        vars.makeAtmVolTest(volCube, tolerance);
        vars.dispose();
    });

    it('Testing swaption volatility cube (smile)...', () => {
        const vars = new CommonVars();
        const volCube = new SwaptionVolCube2(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit);
        const tolerance = 1.0e-16;
        vars.makeVolSpreadsTest(volCube, tolerance);
        vars.dispose();
    });

    it('Testing swaption volatility cube (sabr interpolation)...', () => {
        const vars = new CommonVars();
        const parametersGuess = new Array(vars.cube.tenors.options.length * vars.cube.tenors.swaps.length);
        for (let i = 0; i < vars.cube.tenors.options.length * vars.cube.tenors.swaps.length; i++) {
            parametersGuess[i] = new Array(4);
            parametersGuess[i][0] = new Handle(new SimpleQuote(0.2));
            parametersGuess[i][1] = new Handle(new SimpleQuote(0.5));
            parametersGuess[i][2] = new Handle(new SimpleQuote(0.4));
            parametersGuess[i][3] = new Handle(new SimpleQuote(0.0));
        }
        const isParameterFixed = Array1D.fromSizeValue(4, false);
        const volCube = new SwaptionVolCube1().svc1xInit(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit, parametersGuess, isParameterFixed, true);
        let tolerance = 3.0e-4;
        vars.makeAtmVolTest(volCube, tolerance);
        tolerance = 12.0e-4;
        vars.makeVolSpreadsTest(volCube, tolerance);
        vars.dispose();
    });

    it('Testing spreaded swaption volatility cube...', () => {
        const vars = new CommonVars();
        const parametersGuess = new Array(vars.cube.tenors.options.length * vars.cube.tenors.swaps.length);
        for (let i = 0; i < vars.cube.tenors.options.length * vars.cube.tenors.swaps.length; i++) {
            parametersGuess[i] = new Array(4);
            parametersGuess[i][0] = new Handle(new SimpleQuote(0.2));
            parametersGuess[i][1] = new Handle(new SimpleQuote(0.5));
            parametersGuess[i][2] = new Handle(new SimpleQuote(0.4));
            parametersGuess[i][3] = new Handle(new SimpleQuote(0.0));
        }
        const isParameterFixed = Array1D.fromSizeValue(4, false);
        const volCube = new Handle(new SwaptionVolCube1().svc1xInit(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit, parametersGuess, isParameterFixed, true));
        const spread = new SimpleQuote(0.0001);
        const spreadHandle = new Handle(spread);
        const spreadedVolCube = new SpreadedSwaptionVolatility(volCube, spreadHandle);
        const strikes = [];
        for (let k = 1; k < 100; k++) {
            strikes.push(k * .01);
        }
        for (let i = 0; i < vars.cube.tenors.options.length; i++) {
            for (let j = 0; j < vars.cube.tenors.swaps.length; j++) {
                const smileSectionByCube = volCube.currentLink().smileSection1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j]);
                const smileSectionBySpreadedCube = spreadedVolCube.smileSection1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j]);
                for (let k = 0; k < strikes.length; k++) {
                    const strike = strikes[k];
                    let diff = spreadedVolCube.volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], strike) -
                        volCube.currentLink().volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], strike);
                    expect(Math.abs(diff - spread.value())).toBeLessThan(1e-16);
                    diff = smileSectionBySpreadedCube.volatility1(strike) -
                        smileSectionByCube.volatility1(strike);
                    expect(Math.abs(diff - spread.value())).toBeLessThan(1e-16);
                }
            }
        }
        const f = new Flag();
        f.registerWith(spreadedVolCube);
        volCube.currentLink().update();
        expect(f.isUp()).toBeTruthy();
        f.lower();
        spread.setValue(.001);
        expect(f.isUp()).toBeTruthy();
        vars.dispose();
    });

    it('Testing volatility cube observability...', () => {
        const vars = new CommonVars();
        const parametersGuess = new Array(vars.cube.tenors.options.length * vars.cube.tenors.swaps.length);
        for (let i = 0; i < vars.cube.tenors.options.length * vars.cube.tenors.swaps.length; i++) {
            parametersGuess[i] = new Array(4);
            parametersGuess[i][0] = new Handle(new SimpleQuote(0.2));
            parametersGuess[i][1] = new Handle(new SimpleQuote(0.5));
            parametersGuess[i][2] = new Handle(new SimpleQuote(0.4));
            parametersGuess[i][3] = new Handle(new SimpleQuote(0.0));
        }
        const isParameterFixed = Array1D.fromSizeValue(4, false);
        let volCube1_0, volCube1_1;
        volCube1_0 = new SwaptionVolCube1().svc1xInit(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit, parametersGuess, isParameterFixed, true);
        const referenceDate = Settings.evaluationDate.f();
        Settings.evaluationDate.set(vars.conventions.calendar.advance1(referenceDate, 1, TimeUnit.Days, vars.conventions.optionBdc));
        volCube1_1 = new SwaptionVolCube1().svc1xInit(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit, parametersGuess, isParameterFixed, true);
        const dummyStrike = 0.03;
        for (let i = 0; i < vars.cube.tenors.options.length; i++) {
            for (let j = 0; j < vars.cube.tenors.swaps.length; j++) {
                for (let k = 0; k < vars.cube.strikeSpreads.length; k++) {
                    const v0 = volCube1_0.volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], dummyStrike + vars.cube.strikeSpreads[k], false);
                    const v1 = volCube1_1.volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], dummyStrike + vars.cube.strikeSpreads[k], false);
                    expect(Math.abs(v0 - v1)).toBeLessThan(1e-14);
                }
            }
        }
        Settings.evaluationDate.set(referenceDate);
        let volCube2_0, volCube2_1;
        volCube2_0 = new SwaptionVolCube2(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit);
        Settings.evaluationDate.set(vars.conventions.calendar.advance1(referenceDate, 1, TimeUnit.Days, vars.conventions.optionBdc));
        volCube2_1 = new SwaptionVolCube2(vars.atmVolMatrix, vars.cube.tenors.options, vars.cube.tenors.swaps, vars.cube.strikeSpreads, vars.cube.volSpreadsHandle, vars.swapIndexBase, vars.shortSwapIndexBase, vars.vegaWeighedSmileFit);
        for (let i = 0; i < vars.cube.tenors.options.length; i++) {
            for (let j = 0; j < vars.cube.tenors.swaps.length; j++) {
                for (let k = 0; k < vars.cube.strikeSpreads.length; k++) {
                    const v0 = volCube2_0.volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], dummyStrike + vars.cube.strikeSpreads[k], false);
                    const v1 = volCube2_1.volatility1(vars.cube.tenors.options[i], vars.cube.tenors.swaps[j], dummyStrike + vars.cube.strikeSpreads[k], false);
                    expect(Math.abs(v0 - v1)).toBeLessThan(1e-14);
                }
            }
        }
        Settings.evaluationDate.set(referenceDate);
    });
});