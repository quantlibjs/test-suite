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
import { ActualActual, Array2D, Bilinear, BusinessDayConvention, CPI, CPICapFloor, DateExt, Frequency, Handle, InterpolatedCPICapFloorTermPriceSurface, InterpolatedZeroCurve, InterpolatingCPICapFloorEngine, Linear, MakeSchedule, Option, Period, PiecewiseZeroInflationCurve, RelinkableHandle, SavedSettings, Settings, SimpleQuote, TimeUnit, UKRPI, UnitedKingdom, ZeroCouponInflationSwapHelper, ZeroInflationTermStructure, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class Datum {
    constructor(date, rate) {
        this.date = date;
        this.rate = rate;
    }
}

function makeHelpers(U, iiData, N, ii, observationLag, calendar, bdc, dc) {
    const instruments = [];
    for (let i = 0; i < N; i++) {
        const maturity = iiData[i].date;
        const quote = new Handle(new SimpleQuote(iiData[i].rate / 100.0));
        const anInstrument = U.ibhInit(quote, observationLag, maturity, calendar, bdc, dc, ii);
        instruments.push(anInstrument);
    }
    return instruments;
}

class CommonVars {
    constructor() {
        this.hii = new RelinkableHandle();
        this.nominalUK = new RelinkableHandle();
        this.cpiUK = new RelinkableHandle();
        this.hcpi = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.nominals = [1000000];
        this.frequency = Frequency.Annual;
        this.volatility = 0.01;
        this.length = 7;
        this.calendar = new UnitedKingdom();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        const today = DateExt.UTC('1,June,2010');
        this.evaluationDate = this.calendar.adjust(today);
        Settings.evaluationDate.set(this.evaluationDate);
        this.settlementDays = 0;
        this.fixingDays = 0;
        this.settlement =
            this.calendar.advance1(today, this.settlementDays, TimeUnit.Days);
        this.startDate = this.settlement;
        this.dcZCIIS = new ActualActual();
        this.dcNominal = new ActualActual();
        const from = DateExt.UTC('1,July,2007');
        const to = DateExt.UTC('1,June,2010');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            206.1, 207.3, 208.0, 208.9, 209.7, 210.9,
            209.8, 211.4, 212.1, 214.0, 215.1, 216.8,
            216.5, 217.2, 218.4, 217.7, 216.0, 212.9,
            210.1, 211.4, 211.3, 211.5, 212.8, 213.4,
            213.4, 214.4, 215.3, 216.0, 216.6, 218.0,
            217.9, 219.2, 220.7, 222.8, -999, -999,
            -999
        ];
        const interp = false;
        this.ii = new UKRPI(interp, this.hcpi);
        for (let i = 0; i < rpiSchedule.size(); i++) {
            this.ii.addFixing(rpiSchedule.date(i), fixData[i], true);
        }
        const nominalData = [
            new Datum(DateExt.UTC('2,June,2010'), 0.499997),
            new Datum(DateExt.UTC('3,June,2010'), 0.524992),
            new Datum(DateExt.UTC('8,June,2010'), 0.524974),
            new Datum(DateExt.UTC('15,June,2010'), 0.549942),
            new Datum(DateExt.UTC('22,June,2010'), 0.549913),
            new Datum(DateExt.UTC('1,July,2010'), 0.574864),
            new Datum(DateExt.UTC('2,August,2010'), 0.624668),
            new Datum(DateExt.UTC('1,September,2010'), 0.724338),
            new Datum(DateExt.UTC('16,September,2010'), 0.769461),
            new Datum(DateExt.UTC('1,December,2010'), 0.997501),
            new Datum(DateExt.UTC('17,March,2011'), 0.916996),
            new Datum(DateExt.UTC('16,June,2011'), 0.984339),
            new Datum(DateExt.UTC('22,September,2011'), 1.06085),
            new Datum(DateExt.UTC('22,December,2011'), 1.141788),
            new Datum(DateExt.UTC('1,June,2012'), 1.504426),
            new Datum(DateExt.UTC('3,June,2013'), 1.92064),
            new Datum(DateExt.UTC('2,June,2014'), 2.290824),
            new Datum(DateExt.UTC('1,June,2015'), 2.614394),
            new Datum(DateExt.UTC('1,June,2016'), 2.887445),
            new Datum(DateExt.UTC('1,June,2017'), 3.122128),
            new Datum(DateExt.UTC('1,June,2018'), 3.322511),
            new Datum(DateExt.UTC('3,June,2019'), 3.483997),
            new Datum(DateExt.UTC('1,June,2020'), 3.616896),
            new Datum(DateExt.UTC('1,June,2022'), 3.8281),
            new Datum(DateExt.UTC('2,June,2025'), 4.0341),
            new Datum(DateExt.UTC('3,June,2030'), 4.070854),
            new Datum(DateExt.UTC('1,June,2035'), 4.023202),
            new Datum(DateExt.UTC('1,June,2040'), 3.954748),
            new Datum(DateExt.UTC('1,June,2050'), 3.870953),
            new Datum(DateExt.UTC('1,June,2060'), 3.85298),
            new Datum(DateExt.UTC('2,June,2070'), 3.757542),
            new Datum(DateExt.UTC('3,June,2080'), 3.651379)
        ];
        const nominalDataLength = 33 - 1;
        const nomD = [];
        const nomR = [];
        for (let i = 0; i < nominalDataLength; i++) {
            nomD.push(nominalData[i].date);
            nomR.push(nominalData[i].rate / 100.0);
        }
        const nominal = new InterpolatedZeroCurve(new Linear())
            .curveInit3(nomD, nomR, this.dcNominal);
        this.nominalUK.linkTo(nominal);
        this.observationLag = new Period().init1(2, TimeUnit.Months);
        this.contractObservationLag = new Period().init1(3, TimeUnit.Months);
        this.contractObservationInterpolation = CPI.InterpolationType.Flat;
        const zciisData = [
            new Datum(DateExt.UTC('1,June,2011'), 3.087),
            new Datum(DateExt.UTC('1,June,2012'), 3.12),
            new Datum(DateExt.UTC('1,June,2013'), 3.059),
            new Datum(DateExt.UTC('1,June,2014'), 3.11),
            new Datum(DateExt.UTC('1,June,2015'), 3.15),
            new Datum(DateExt.UTC('1,June,2016'), 3.207),
            new Datum(DateExt.UTC('1,June,2017'), 3.253),
            new Datum(DateExt.UTC('1,June,2018'), 3.288),
            new Datum(DateExt.UTC('1,June,2019'), 3.314),
            new Datum(DateExt.UTC('1,June,2020'), 3.401),
            new Datum(DateExt.UTC('1,June,2022'), 3.458),
            new Datum(DateExt.UTC('1,June,2025'), 3.52),
            new Datum(DateExt.UTC('1,June,2030'), 3.655),
            new Datum(DateExt.UTC('1,June,2035'), 3.668),
            new Datum(DateExt.UTC('1,June,2040'), 3.695),
            new Datum(DateExt.UTC('1,June,2050'), 3.634),
            new Datum(DateExt.UTC('1,June,2060'), 3.629)
        ];
        this.zciisDataLength = 17;
        for (let i = 0; i < this.zciisDataLength; i++) {
            this.zciisD.push(zciisData[i].date);
            this.zciisR.push(zciisData[i].rate);
        }
        const helpers = makeHelpers(new ZeroCouponInflationSwapHelper(), zciisData, this.zciisDataLength, this.ii, this.observationLag, this.calendar, this.convention, this.dcZCIIS);
        const baseZeroRate = zciisData[0].rate / 100.0;
        const pCPIts = new PiecewiseZeroInflationCurve(new Linear())
            .pwzicInit(this.evaluationDate, this.calendar, this.dcZCIIS, this.observationLag, this.ii.frequency(), this.ii.interpolated(), baseZeroRate, this.nominalUK, helpers);
        pCPIts.recalculate();
        this.cpiUK.linkTo(pCPIts);
        this.hii.linkTo(this.ii);
        this.hcpi.linkTo(pCPIts);
        const cfMat = [
            new Period().init1(3, TimeUnit.Years),
            new Period().init1(5, TimeUnit.Years),
            new Period().init1(7, TimeUnit.Years),
            new Period().init1(10, TimeUnit.Years),
            new Period().init1(15, TimeUnit.Years),
            new Period().init1(20, TimeUnit.Years),
            new Period().init1(30, TimeUnit.Years)
        ];
        const cStrike = [0.03, 0.04, 0.05, 0.06];
        const fStrike = [-0.01, 0, 0.01, 0.02];
        const ncStrikes = 4, nfStrikes = 4, ncfMaturities = 7;
        const cPrice = [
            [227.6, 100.27, 38.8, 14.94], [345.32, 127.9, 40.59, 14.11],
            [477.95, 170.19, 50.62, 16.88], [757.81, 303.95, 107.62, 43.61],
            [1140.73, 481.89, 168.4, 63.65], [1537.6, 607.72, 172.27, 54.87],
            [2211.67, 839.24, 184.75, 45.03]
        ];
        const fPrice = [
            [15.62, 28.38, 53.61, 104.6], [21.45, 36.73, 66.66, 129.6],
            [24.45, 42.08, 77.04, 152.24], [39.25, 63.52, 109.2, 203.44],
            [36.82, 63.62, 116.97, 232.73], [39.7, 67.47, 121.79, 238.56],
            [41.48, 73.9, 139.75, 286.75]
        ];
        this.cStrikesUK = [];
        this.fStrikesUK = [];
        this.cfMaturitiesUK = [];
        for (let i = 0; i < ncStrikes; i++) {
            this.cStrikesUK.push(cStrike[i]);
        }
        for (let i = 0; i < nfStrikes; i++) {
            this.fStrikesUK.push(fStrike[i]);
        }
        for (let i = 0; i < ncfMaturities; i++) {
            this.cfMaturitiesUK.push(cfMat[i]);
        }
        this.cPriceUK = Array2D.newMatrix(ncStrikes, ncfMaturities);
        this.fPriceUK = Array2D.newMatrix(nfStrikes, ncfMaturities);
        for (let i = 0; i < ncStrikes; i++) {
            for (let j = 0; j < ncfMaturities; j++) {
                this.cPriceUK[i][j] = cPrice[j][i] / 10000.0;
            }
        }
        for (let i = 0; i < nfStrikes; i++) {
            for (let j = 0; j < ncfMaturities; j++) {
                this.fPriceUK[i][j] = fPrice[j][i] / 10000.0;
            }
        }
    }
    dispose() {
        this.backup.dispose();
    }
}

describe(`CPI swaption tests ${version}`, () => {
    it('Testing cpi capfloor price surface...', () => {
        const common = new CommonVars();
        const nominal = 1.0;
        const cpiSurf = new InterpolatedCPICapFloorTermPriceSurface(new Bilinear())
            .icpicftpsInit(nominal, common.baseZeroRate, common.observationLag, common.calendar, common.convention, common.dcZCIIS, common.hii, common.nominalUK, common.cStrikesUK, common.fStrikesUK, common.cfMaturitiesUK, common.cPriceUK, common.fPriceUK);
        for (let i = 0; i < common.fStrikesUK.length; i++) {
            const qK = common.fStrikesUK[i];
            const nMat = common.cfMaturitiesUK.length;
            for (let j = 0; j < nMat; j++) {
                const t = common.cfMaturitiesUK[j];
                const a = common.fPriceUK[i][j];
                const b = cpiSurf.floorPrice1(t, qK);
                expect(Math.abs(a - b)).toBeLessThan(1e-7);
            }
        }
        for (let i = 0; i < common.cStrikesUK.length; i++) {
            const qK = common.cStrikesUK[i];
            const nMat = common.cfMaturitiesUK.length;
            for (let j = 0; j < nMat; j++) {
                const t = common.cfMaturitiesUK[j];
                const a = common.cPriceUK[i][j];
                const b = cpiSurf.capPrice1(t, qK);
                expect(Math.abs(a - b)).toBeLessThan(1e-7);
            }
        }
        const premium = cpiSurf.price1(new Period().init1(3, TimeUnit.Years), 0.01);
        const expPremium = common.fPriceUK[2][0];
        expect(Math.abs(premium - expPremium)).toBeLessThan(1e-12);
        common.hcpi.linkTo(new ZeroInflationTermStructure());
        common.dispose();
    });

    it('Testing cpi capfloor pricer...', () => {
        const common = new CommonVars();
        const nominal = 1.0;
        const cpiCFpriceSurf = new InterpolatedCPICapFloorTermPriceSurface(new Bilinear())
            .icpicftpsInit(nominal, common.baseZeroRate, common.observationLag, common.calendar, common.convention, common.dcZCIIS, common.hii, common.nominalUK, common.cStrikesUK, common.fStrikesUK, common.cfMaturitiesUK, common.cPriceUK, common.fPriceUK);
        common.cpiCFsurfUK = cpiCFpriceSurf;
        const startDate = Settings.evaluationDate.f();
        const maturity = DateExt.advance(startDate, 3, TimeUnit.Years);
        const fixCalendar = new UnitedKingdom(), payCalendar = new UnitedKingdom();
        const fixConvention = BusinessDayConvention.Unadjusted, payConvention = BusinessDayConvention.ModifiedFollowing;
        const strike = 0.03;
        const baseCPI = common.hii.currentLink().fixing(fixCalendar.adjust(DateExt.subPeriod(startDate, common.observationLag), fixConvention));
        const observationInterpolation = CPI.InterpolationType.AsIndex;
        const aCap = new CPICapFloor(Option.Type.Call, nominal, startDate, baseCPI, maturity, fixCalendar, fixConvention, payCalendar, payConvention, strike, common.hii, common.observationLag, observationInterpolation);
        const cpiCFsurfUKh = new Handle(common.cpiCFsurfUK);
        const engine = new InterpolatingCPICapFloorEngine(cpiCFsurfUKh);
        aCap.setPricingEngine(engine);
        const cached = common.cPriceUK[0][0];
        expect(Math.abs(cached - aCap.NPV())).toBeLessThan(1e-10);
        common.hcpi.linkTo(new ZeroInflationTermStructure());
        common.dispose();
    });
});
