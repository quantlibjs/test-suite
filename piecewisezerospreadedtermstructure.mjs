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
import { Actual360, BackwardFlat, Compounding, Cubic, CubicInterpolation, DateExt, ForwardFlat, Frequency, Handle, InterpolatedPiecewiseZeroSpreadedTermStructure, Linear, PiecewiseZeroSpreadedTermStructure, SavedSettings, Settings, SimpleQuote, TARGET, TimeUnit, ZeroCurve } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class CommonVars {
    constructor() {
        this.backup = new SavedSettings();
        this.calendar = new TARGET();
        this.settlementDays = 2;
        this.today = DateExt.UTC('9,June,2009');
        this.compounding = Compounding.Continuous;
        this.dayCount = new Actual360();
        this.settlementDate =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        Settings.evaluationDate.set(this.today);
        const ts = [13, 41, 75, 165, 256, 345, 524, 703];
        const r = [0.035, 0.033, 0.034, 0.034, 0.036, 0.037, 0.039, 0.040];
        const rates = [0.035];
        const dates = [this.settlementDate];
        for (let i = 0; i < 8; ++i) {
            dates.push(this.calendar.advance1(this.today, ts[i], TimeUnit.Days));
            rates.push(r[i]);
        }
        this.termStructure =
            new ZeroCurve().curveInit1(dates, rates, this.dayCount);
    }
}

describe('Interpolated piecewise zero spreaded yield curve tests', () => {
    it('Testing flat interpolation before the first spreaded date...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 8, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 15, TimeUnit.Months));
        const interpolationDate = vars.calendar.advance1(vars.today, 6, TimeUnit.Months);
        const spreadedTermStructure = new PiecewiseZeroSpreadedTermStructure(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + spread1.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing flat interpolation after the last spreaded date...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 8, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 15, TimeUnit.Months));
        const interpolationDate = vars.calendar.advance1(vars.today, 20, TimeUnit.Months);
        const spreadedTermStructure = new PiecewiseZeroSpreadedTermStructure(new Handle(vars.termStructure), spreads, spreadDates);
        spreadedTermStructure.enableExtrapolation();
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + spread2.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing linear interpolation with more than two spreaded dates...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.02);
        const spread3 = new SimpleQuote(0.035);
        const spread4 = new SimpleQuote(0.04);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        spreads.push(new Handle(spread3));
        spreads.push(new Handle(spread4));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 90, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 150, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 30, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 40, TimeUnit.Months));
        const interpolationDate = vars.calendar.advance1(vars.today, 120, TimeUnit.Days);
        const spreadedTermStructure = new PiecewiseZeroSpreadedTermStructure(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() +
            spread1.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing linear interpolation between two dates...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 100, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 150, TimeUnit.Days));
        const interpolationDate = vars.calendar.advance1(vars.today, 120, TimeUnit.Days);
        const spreadedTermStructure = new InterpolatedPiecewiseZeroSpreadedTermStructure(new Linear())
            .ipzstsInit(new Handle(vars.termStructure), spreads, spreadDates);
        const d0 = vars.calendar.advance1(vars.today, 100, TimeUnit.Days);
        const d1 = vars.calendar.advance1(vars.today, 150, TimeUnit.Days);
        const d2 = vars.calendar.advance1(vars.today, 120, TimeUnit.Days);
        const m = (0.03 - 0.02) / vars.dayCount.yearFraction(d0, d1);
        const expectedRate = m * vars.dayCount.yearFraction(d0, d2) + 0.054;
        const t = vars.dayCount.yearFraction(vars.settlementDate, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing forward flat interpolation between two dates...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.02);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 75, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 160, TimeUnit.Days));
        const interpolationDate = vars.calendar.advance1(vars.today, 100, TimeUnit.Days);
        const spreadedTermStructure = new PiecewiseZeroSpreadedTermStructure(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + spread1.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing backward flat interpolation between two dates...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        const spread3 = new SimpleQuote(0.04);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        spreads.push(new Handle(spread3));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 100, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 200, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 300, TimeUnit.Days));
        const interpolationDate = vars.calendar.advance1(vars.today, 110, TimeUnit.Days);
        const spreadedTermStructure = new InterpolatedPiecewiseZeroSpreadedTermStructure(new BackwardFlat())
            .ipzstsInit(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + spread2.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing default interpolation between two dates...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 75, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 260, TimeUnit.Days));
        const interpolationDate = vars.calendar.advance1(vars.today, 100, TimeUnit.Days);
        const spreadedTermStructure = new InterpolatedPiecewiseZeroSpreadedTermStructure(new ForwardFlat())
            .ipzstsInit(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + spread1.value();
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing factory constructor with additional parameters...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        const spread3 = new SimpleQuote(0.01);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        spreads.push(new Handle(spread3));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 8, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 15, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 25, TimeUnit.Months));
        const interpolationDate = vars.calendar.advance1(vars.today, 11, TimeUnit.Months);
        const freq = Frequency.NoFrequency;
        const spreadedTermStructure = new InterpolatedPiecewiseZeroSpreadedTermStructure(new Cubic(CubicInterpolation.DerivativeApprox.Spline, false))
            .ipzstsInit(new Handle(vars.termStructure), spreads, spreadDates, vars.compounding, freq, vars.dayCount);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        const interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        const expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + 0.026065770863;
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing term structure max date...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 8, TimeUnit.Months));
        spreadDates.push(vars.calendar.advance1(vars.today, 15, TimeUnit.Months));
        const spreadedTermStructure = new PiecewiseZeroSpreadedTermStructure(new Handle(vars.termStructure), spreads, spreadDates);
        const maxDate = spreadedTermStructure.maxDate();
        const expectedDate = DateExt.min(vars.termStructure.maxDate(), spreadDates[spreadDates.length - 1]);
        expect(maxDate.valueOf()).toEqual(expectedDate.valueOf());
        vars.backup.dispose();
    });

    it('Testing quote update...', () => {
        const vars = new CommonVars();
        const spreads = [];
        const spread1 = new SimpleQuote(0.02);
        const spread2 = new SimpleQuote(0.03);
        spreads.push(new Handle(spread1));
        spreads.push(new Handle(spread2));
        const spreadDates = [];
        spreadDates.push(vars.calendar.advance1(vars.today, 100, TimeUnit.Days));
        spreadDates.push(vars.calendar.advance1(vars.today, 150, TimeUnit.Days));
        const interpolationDate = vars.calendar.advance1(vars.today, 120, TimeUnit.Days);
        const spreadedTermStructure = new InterpolatedPiecewiseZeroSpreadedTermStructure(new BackwardFlat())
            .ipzstsInit(new Handle(vars.termStructure), spreads, spreadDates);
        const t = vars.dayCount.yearFraction(vars.today, interpolationDate);
        let interpolatedZeroRate = spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        const tolerance = 1e-9;
        let expectedRate = vars.termStructure.zeroRate2(t, vars.compounding).f() + 0.03;
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        spread2.setValue(0.025);
        interpolatedZeroRate =
            spreadedTermStructure.zeroRate2(t, vars.compounding).f();
        expectedRate =
            vars.termStructure.zeroRate2(t, vars.compounding).f() + 0.025;
        expect(Math.abs(interpolatedZeroRate - expectedRate))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
    });
});