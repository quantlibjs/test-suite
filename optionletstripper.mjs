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
import { Actual365Fixed, Array1D, Array2D, BachelierCapFloorEngine, BlackCapFloorEngine, BusinessDayConvention, CapFloor, CapFloorTermVolCurve, CapFloorTermVolSurface, DateExt, Euribor6M, FlatForward, Handle, InterpolatedZeroCurve, Linear, MakeCapFloor, OptionletStripper1, OptionletStripper2, Period, QL_NULL_REAL, RelinkableHandle, SavedSettings, Settings, SimpleQuote, StrippedOptionletAdapter, TARGET, TimeUnit, VolatilityType, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class CommonVars {
    constructor() {
        this.yieldTermStructure = new RelinkableHandle();
        this.discountingYTS = new RelinkableHandle();
        this.forwardingYTS = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.accuracy = 1.0e-6;
        this.tolerance = 2.5e-8;
    }
    setTermStructure() {
        this.calendar = new TARGET();
        this.dayCounter = new Actual365Fixed();
        const flatFwdRate = 0.04;
        this.yieldTermStructure.linkTo(new FlatForward().ffInit4(0, this.calendar, flatFwdRate, this.dayCounter));
    }
    setRealTermStructure() {
        this.calendar = new TARGET();
        this.dayCounter = new Actual365Fixed();
        let dates = [];
        let datesTmp = [
            42124, 42129, 42143, 42221, 42254, 42282, 42313, 42345,
            42374, 42405, 42465, 42495, 42587, 42681, 42772, 42860,
            43227, 43956, 44321, 44686, 45051, 45418, 45782, 46147,
            46512, 47609, 49436, 51263, 53087, 56739, 60392
        ];
        for (let it = 0; it < datesTmp.length; ++it) {
            dates.push(DateExt.fromSerial(datesTmp[it]));
        }
        let rates = [
            -0.00292, -0.00292, -0.001441, -0.00117, -0.001204, -0.001212,
            -0.001223, -0.001236, -0.001221, -0.001238, -0.001262, -0.00125,
            -0.001256, -0.001233, -0.00118, -0.001108, -0.000619, 0.000833,
            0.001617, 0.002414, 0.003183, 0.003883, 0.004514, 0.005074,
            0.005606, 0.006856, 0.00813, 0.008709, 0.009136, 0.009601,
            0.009384
        ];
        this.discountingYTS.linkTo(new InterpolatedZeroCurve(new Linear())
            .curveInit1(dates, rates, this.dayCounter, this.calendar));
        datesTmp = [];
        dates = [];
        rates = [];
        datesTmp = [
            42124, 42313, 42436, 42556, 42618, 42800, 42830, 42860, 43227, 43591,
            43956, 44321, 44686, 45051, 45418, 45782, 46147, 46512, 46878, 47245,
            47609, 47973, 48339, 48704, 49069, 49436, 49800, 50165, 50530, 50895,
            51263, 51627, 51991, 52356, 52722, 53087, 54913, 56739, 60392, 64045
        ];
        for (let it = 0; it < datesTmp.length; ++it) {
            dates.push(DateExt.fromSerial(datesTmp[it]));
        }
        rates = [
            0.000649, 0.000649, 0.000684, 0.000717, 0.000745, 0.000872, 0.000905,
            0.000954, 0.001532, 0.002319, 0.003147, 0.003949, 0.004743, 0.00551,
            0.006198, 0.006798, 0.007339, 0.007832, 0.008242, 0.008614, 0.008935,
            0.009205, 0.009443, 0.009651, 0.009818, 0.009952, 0.010054, 0.010146,
            0.010206, 0.010266, 0.010315, 0.010365, 0.010416, 0.010468, 0.010519,
            0.010571, 0.010757, 0.010806, 0.010423, 0.010217
        ];
        this.forwardingYTS.linkTo(new InterpolatedZeroCurve(new Linear())
            .curveInit1(dates, rates, this.dayCounter, this.calendar));
    }
    setFlatTermVolCurve() {
        this.setTermStructure();
        Array1D.resize(this.optionTenors, 10);
        for (let i = 0; i < this.optionTenors.length; ++i) {
            this.optionTenors[i] = new Period().init1(i + 1, TimeUnit.Years);
        }
        const flatVol = .18;
        const curveVHandle = new Array(this.optionTenors.length);
        for (let i = 0; i < this.optionTenors.length; ++i) {
            curveVHandle[i] = new Handle(new SimpleQuote(flatVol));
        }
        this.flatTermVolCurve = new Handle(new CapFloorTermVolCurve().cftvcInit1(0, this.calendar, BusinessDayConvention.Following, this.optionTenors, curveVHandle, this.dayCounter));
    }
    setFlatTermVolSurface() {
        this.setTermStructure();
        Array1D.resize(this.optionTenors, 10);
        for (let i = 0; i < this.optionTenors.length; ++i) {
            this.optionTenors[i] = new Period().init1(i + 1, TimeUnit.Years);
        }
        Array1D.resize(this.strikes, 10);
        for (let j = 0; j < this.strikes.length; ++j) {
            this.strikes[j] = (j + 1) / 100.0;
        }
        const flatVol = .18;
        this.termV = Array2D.newMatrix(this.optionTenors.length, this.strikes.length, flatVol);
        this.flatTermVolSurface = new CapFloorTermVolSurface().cftvsInit4(0, this.calendar, BusinessDayConvention.Following, this.optionTenors, this.strikes, this.termV, this.dayCounter);
    }
    setCapFloorTermVolCurve() {
        this.setTermStructure();
        this.optionTenors = [];
        this.optionTenors.push(new Period().init1(1, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(18, TimeUnit.Months));
        this.optionTenors.push(new Period().init1(2, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(3, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(4, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(5, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(6, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(7, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(8, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(9, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(10, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(12, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(15, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(20, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(25, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(30, TimeUnit.Years));
        this.atmTermV = [];
        this.atmTermV.push(0.090304);
        this.atmTermV.push(0.12180);
        this.atmTermV.push(0.13077);
        this.atmTermV.push(0.14832);
        this.atmTermV.push(0.15570);
        this.atmTermV.push(0.15816);
        this.atmTermV.push(0.15932);
        this.atmTermV.push(0.16035);
        this.atmTermV.push(0.15951);
        this.atmTermV.push(0.15855);
        this.atmTermV.push(0.15754);
        this.atmTermV.push(0.15459);
        this.atmTermV.push(0.15163);
        this.atmTermV.push(0.14575);
        this.atmTermV.push(0.14175);
        this.atmTermV.push(0.13889);
        Array1D.resize(this.atmTermVolHandle, this.optionTenors.length);
        for (let i = 0; i < this.optionTenors.length; ++i) {
            this.atmTermVolHandle[i] = new Handle(new SimpleQuote(this.atmTermV[i]));
        }
        this.capFloorVolCurve = new Handle(new CapFloorTermVolCurve().cftvcInit1(0, this.calendar, BusinessDayConvention.Following, this.optionTenors, this.atmTermVolHandle, this.dayCounter));
    }
    setCapFloorTermVolSurface() {
        this.setTermStructure();
        this.optionTenors = [];
        this.optionTenors.push(new Period().init1(1, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(18, TimeUnit.Months));
        this.optionTenors.push(new Period().init1(2, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(3, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(4, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(5, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(6, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(7, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(8, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(9, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(10, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(12, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(15, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(20, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(25, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(30, TimeUnit.Years));
        this.strikes = [];
        this.strikes.push(0.015);
        this.strikes.push(0.0175);
        this.strikes.push(0.02);
        this.strikes.push(0.0225);
        this.strikes.push(0.025);
        this.strikes.push(0.03);
        this.strikes.push(0.035);
        this.strikes.push(0.04);
        this.strikes.push(0.05);
        this.strikes.push(0.06);
        this.strikes.push(0.07);
        this.strikes.push(0.08);
        this.strikes.push(0.1);
        this.termV =
            Array2D.newMatrix(this.optionTenors.length, this.strikes.length);
        this.termV[0][0] = 0.287;
        this.termV[0][1] = 0.274;
        this.termV[0][2] = 0.256;
        this.termV[0][3] = 0.245;
        this.termV[0][4] = 0.227;
        this.termV[0][5] = 0.148;
        this.termV[0][6] = 0.096;
        this.termV[0][7] = 0.09;
        this.termV[0][8] = 0.11;
        this.termV[0][9] = 0.139;
        this.termV[0][10] = 0.166;
        this.termV[0][11] = 0.19;
        this.termV[0][12] = 0.214;
        this.termV[1][0] = 0.303;
        this.termV[1][1] = 0.258;
        this.termV[1][2] = 0.22;
        this.termV[1][3] = 0.203;
        this.termV[1][4] = 0.19;
        this.termV[1][5] = 0.153;
        this.termV[1][6] = 0.126;
        this.termV[1][7] = 0.118;
        this.termV[1][8] = 0.147;
        this.termV[1][9] = 0.165;
        this.termV[1][10] = 0.18;
        this.termV[1][11] = 0.192;
        this.termV[1][12] = 0.212;
        this.termV[2][0] = 0.303;
        this.termV[2][1] = 0.257;
        this.termV[2][2] = 0.216;
        this.termV[2][3] = 0.196;
        this.termV[2][4] = 0.182;
        this.termV[2][5] = 0.154;
        this.termV[2][6] = 0.134;
        this.termV[2][7] = 0.127;
        this.termV[2][8] = 0.149;
        this.termV[2][9] = 0.166;
        this.termV[2][10] = 0.18;
        this.termV[2][11] = 0.192;
        this.termV[2][12] = 0.212;
        this.termV[3][0] = 0.305;
        this.termV[3][1] = 0.266;
        this.termV[3][2] = 0.226;
        this.termV[3][3] = 0.203;
        this.termV[3][4] = 0.19;
        this.termV[3][5] = 0.167;
        this.termV[3][6] = 0.151;
        this.termV[3][7] = 0.144;
        this.termV[3][8] = 0.16;
        this.termV[3][9] = 0.172;
        this.termV[3][10] = 0.183;
        this.termV[3][11] = 0.193;
        this.termV[3][12] = 0.209;
        this.termV[4][0] = 0.294;
        this.termV[4][1] = 0.261;
        this.termV[4][2] = 0.216;
        this.termV[4][3] = 0.201;
        this.termV[4][4] = 0.19;
        this.termV[4][5] = 0.171;
        this.termV[4][6] = 0.158;
        this.termV[4][7] = 0.151;
        this.termV[4][8] = 0.163;
        this.termV[4][9] = 0.172;
        this.termV[4][10] = 0.181;
        this.termV[4][11] = 0.188;
        this.termV[4][12] = 0.201;
        this.termV[5][0] = 0.276;
        this.termV[5][1] = 0.248;
        this.termV[5][2] = 0.212;
        this.termV[5][3] = 0.199;
        this.termV[5][4] = 0.189;
        this.termV[5][5] = 0.172;
        this.termV[5][6] = 0.16;
        this.termV[5][7] = 0.155;
        this.termV[5][8] = 0.162;
        this.termV[5][9] = 0.17;
        this.termV[5][10] = 0.177;
        this.termV[5][11] = 0.183;
        this.termV[5][12] = 0.195;
        this.termV[6][0] = 0.26;
        this.termV[6][1] = 0.237;
        this.termV[6][2] = 0.21;
        this.termV[6][3] = 0.198;
        this.termV[6][4] = 0.188;
        this.termV[6][5] = 0.172;
        this.termV[6][6] = 0.161;
        this.termV[6][7] = 0.156;
        this.termV[6][8] = 0.161;
        this.termV[6][9] = 0.167;
        this.termV[6][10] = 0.173;
        this.termV[6][11] = 0.179;
        this.termV[6][12] = 0.19;
        this.termV[7][0] = 0.25;
        this.termV[7][1] = 0.231;
        this.termV[7][2] = 0.208;
        this.termV[7][3] = 0.196;
        this.termV[7][4] = 0.187;
        this.termV[7][5] = 0.172;
        this.termV[7][6] = 0.162;
        this.termV[7][7] = 0.156;
        this.termV[7][8] = 0.16;
        this.termV[7][9] = 0.165;
        this.termV[7][10] = 0.17;
        this.termV[7][11] = 0.175;
        this.termV[7][12] = 0.185;
        this.termV[8][0] = 0.244;
        this.termV[8][1] = 0.226;
        this.termV[8][2] = 0.206;
        this.termV[8][3] = 0.195;
        this.termV[8][4] = 0.186;
        this.termV[8][5] = 0.171;
        this.termV[8][6] = 0.161;
        this.termV[8][7] = 0.156;
        this.termV[8][8] = 0.158;
        this.termV[8][9] = 0.162;
        this.termV[8][10] = 0.166;
        this.termV[8][11] = 0.171;
        this.termV[8][12] = 0.18;
        this.termV[9][0] = 0.239;
        this.termV[9][1] = 0.222;
        this.termV[9][2] = 0.204;
        this.termV[9][3] = 0.193;
        this.termV[9][4] = 0.185;
        this.termV[9][5] = 0.17;
        this.termV[9][6] = 0.16;
        this.termV[9][7] = 0.155;
        this.termV[9][8] = 0.156;
        this.termV[9][9] = 0.159;
        this.termV[9][10] = 0.163;
        this.termV[9][11] = 0.168;
        this.termV[9][12] = 0.177;
        this.termV[10][0] = 0.235;
        this.termV[10][1] = 0.219;
        this.termV[10][2] = 0.202;
        this.termV[10][3] = 0.192;
        this.termV[10][4] = 0.183;
        this.termV[10][5] = 0.169;
        this.termV[10][6] = 0.159;
        this.termV[10][7] = 0.154;
        this.termV[10][8] = 0.154;
        this.termV[10][9] = 0.156;
        this.termV[10][10] = 0.16;
        this.termV[10][11] = 0.164;
        this.termV[10][12] = 0.173;
        this.termV[11][0] = 0.227;
        this.termV[11][1] = 0.212;
        this.termV[11][2] = 0.197;
        this.termV[11][3] = 0.187;
        this.termV[11][4] = 0.179;
        this.termV[11][5] = 0.166;
        this.termV[11][6] = 0.156;
        this.termV[11][7] = 0.151;
        this.termV[11][8] = 0.149;
        this.termV[11][9] = 0.15;
        this.termV[11][10] = 0.153;
        this.termV[11][11] = 0.157;
        this.termV[11][12] = 0.165;
        this.termV[12][0] = 0.22;
        this.termV[12][1] = 0.206;
        this.termV[12][2] = 0.192;
        this.termV[12][3] = 0.183;
        this.termV[12][4] = 0.175;
        this.termV[12][5] = 0.162;
        this.termV[12][6] = 0.153;
        this.termV[12][7] = 0.147;
        this.termV[12][8] = 0.144;
        this.termV[12][9] = 0.144;
        this.termV[12][10] = 0.147;
        this.termV[12][11] = 0.151;
        this.termV[12][12] = 0.158;
        this.termV[13][0] = 0.211;
        this.termV[13][1] = 0.197;
        this.termV[13][2] = 0.185;
        this.termV[13][3] = 0.176;
        this.termV[13][4] = 0.168;
        this.termV[13][5] = 0.156;
        this.termV[13][6] = 0.147;
        this.termV[13][7] = 0.142;
        this.termV[13][8] = 0.138;
        this.termV[13][9] = 0.138;
        this.termV[13][10] = 0.14;
        this.termV[13][11] = 0.144;
        this.termV[13][12] = 0.151;
        this.termV[14][0] = 0.204;
        this.termV[14][1] = 0.192;
        this.termV[14][2] = 0.18;
        this.termV[14][3] = 0.171;
        this.termV[14][4] = 0.164;
        this.termV[14][5] = 0.152;
        this.termV[14][6] = 0.143;
        this.termV[14][7] = 0.138;
        this.termV[14][8] = 0.134;
        this.termV[14][9] = 0.134;
        this.termV[14][10] = 0.137;
        this.termV[14][11] = 0.14;
        this.termV[14][12] = 0.148;
        this.termV[15][0] = 0.2;
        this.termV[15][1] = 0.187;
        this.termV[15][2] = 0.176;
        this.termV[15][3] = 0.167;
        this.termV[15][4] = 0.16;
        this.termV[15][5] = 0.148;
        this.termV[15][6] = 0.14;
        this.termV[15][7] = 0.135;
        this.termV[15][8] = 0.131;
        this.termV[15][9] = 0.132;
        this.termV[15][10] = 0.135;
        this.termV[15][11] = 0.139;
        this.termV[15][12] = 0.146;
        this.capFloorVolSurface = new CapFloorTermVolSurface().cftvsInit4(0, this.calendar, BusinessDayConvention.Following, this.optionTenors, this.strikes, this.termV, this.dayCounter);
    }
    setRealCapFloorTermVolSurface() {
        this.setRealTermStructure();
        this.optionTenors = [];
        this.optionTenors.push(new Period().init1(1, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(18, TimeUnit.Months));
        this.optionTenors.push(new Period().init1(2, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(3, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(4, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(5, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(6, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(7, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(8, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(9, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(10, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(12, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(15, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(20, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(25, TimeUnit.Years));
        this.optionTenors.push(new Period().init1(30, TimeUnit.Years));
        this.strikes = [];
        this.strikes.push(-0.005);
        this.strikes.push(-0.0025);
        this.strikes.push(-0.00125);
        this.strikes.push(0.0);
        this.strikes.push(0.00125);
        this.strikes.push(0.0025);
        this.strikes.push(0.005);
        this.strikes.push(0.01);
        this.strikes.push(0.015);
        this.strikes.push(0.02);
        this.strikes.push(0.03);
        this.strikes.push(0.05);
        this.strikes.push(0.1);
        const rawVols = [
            0.49, 0.39, 0.34, 0.31, 0.34, 0.37, 0.50, 0.75, 0.99, 1.21, 1.64, 2.44,
            4.29, 0.44, 0.36, 0.33, 0.31, 0.33, 0.35, 0.45, 0.65, 0.83, 1.00, 1.32,
            1.93, 3.30, 0.40, 0.35, 0.33, 0.31, 0.33, 0.34, 0.41, 0.55, 0.69, 0.82,
            1.08, 1.56, 2.68, 0.42, 0.39, 0.38, 0.37, 0.38, 0.39, 0.43, 0.54, 0.64,
            0.74, 0.94, 1.31, 2.18, 0.46, 0.43, 0.42, 0.41, 0.42, 0.43, 0.47, 0.56,
            0.66, 0.75, 0.93, 1.28, 2.07, 0.49, 0.47, 0.46, 0.45, 0.46, 0.47, 0.51,
            0.59, 0.68, 0.76, 0.93, 1.25, 1.99, 0.51, 0.49, 0.49, 0.48, 0.49, 0.50,
            0.54, 0.62, 0.70, 0.78, 0.94, 1.24, 1.94, 0.52, 0.51, 0.51, 0.51, 0.52,
            0.53, 0.56, 0.63, 0.71, 0.79, 0.94, 1.23, 1.89, 0.53, 0.52, 0.52, 0.52,
            0.53, 0.54, 0.57, 0.65, 0.72, 0.79, 0.94, 1.21, 1.83, 0.55, 0.54, 0.54,
            0.54, 0.55, 0.56, 0.59, 0.66, 0.72, 0.79, 0.91, 1.15, 1.71, 0.56, 0.56,
            0.56, 0.56, 0.57, 0.58, 0.61, 0.67, 0.72, 0.78, 0.89, 1.09, 1.59, 0.59,
            0.58, 0.58, 0.59, 0.59, 0.60, 0.63, 0.68, 0.73, 0.78, 0.86, 1.03, 1.45,
            0.61, 0.61, 0.61, 0.61, 0.62, 0.62, 0.64, 0.69, 0.73, 0.77, 0.85, 1.02,
            1.44, 0.62, 0.62, 0.63, 0.63, 0.64, 0.64, 0.65, 0.69, 0.72, 0.76, 0.82,
            0.96, 1.32, 0.62, 0.63, 0.63, 0.63, 0.65, 0.66, 0.66, 0.68, 0.72, 0.74,
            0.80, 0.93, 1.25, 0.62, 0.62, 0.62, 0.62, 0.66, 0.67, 0.67, 0.67, 0.72,
            0.72, 0.78, 0.90, 1.25
        ];
        this.termV = Array2D.from1D(rawVols, this.strikes.length);
        this.termV = Array2D.divScalar(this.termV, 100);
        this.capFloorVolRealSurface = new CapFloorTermVolSurface().cftvsInit4(0, this.calendar, BusinessDayConvention.Following, this.optionTenors, this.strikes, this.termV, this.dayCounter);
    }
    dispose() {
        this.backup.dispose();
    }
}

describe(`Optionlet stripper tests ${version}`, () => {
    it('Testing forward/forward vol stripping from flat' +
        ' term vol surface using OptionletStripper1 class...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC('28,October,2013'));
        vars.setFlatTermVolSurface();
        const iborIndex = new Euribor6M(vars.yieldTermStructure);
        const optionletStripper1 = new OptionletStripper1(vars.flatTermVolSurface, iborIndex, QL_NULL_REAL, vars.accuracy);
        const strippedOptionletAdapter = new StrippedOptionletAdapter(optionletStripper1);
        const vol = new Handle(strippedOptionletAdapter);
        vol.currentLink().enableExtrapolation();
        const strippedVolEngine = new BlackCapFloorEngine().init3(vars.yieldTermStructure, vol);
        let cap;
        for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
            for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
                cap = new MakeCapFloor(CapFloor.Type.Cap, vars.optionTenors[tenorIndex], iborIndex, vars.strikes[strikeIndex], new Period().init1(0, TimeUnit.Days))
                    .withPricingEngine(strippedVolEngine)
                    .f();
                const priceFromStrippedVolatility = cap.NPV();
                const blackCapFloorEngineConstantVolatility = new BlackCapFloorEngine().init1(vars.yieldTermStructure, vars.termV[tenorIndex][strikeIndex]);
                cap.setPricingEngine(blackCapFloorEngineConstantVolatility);
                const priceFromConstantVolatility = cap.NPV();
                const error = Math.abs(priceFromStrippedVolatility - priceFromConstantVolatility);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing forward/forward vol stripping from non-flat' +
        ' term vol surface using OptionletStripper1 class...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC('28,October,2013'));
        vars.setCapFloorTermVolSurface();
        const iborIndex = new Euribor6M(vars.yieldTermStructure);
        const optionletStripper1 = new OptionletStripper1(vars.capFloorVolSurface, iborIndex, QL_NULL_REAL, vars.accuracy);
        const strippedOptionletAdapter = new StrippedOptionletAdapter(optionletStripper1);
        const vol = new Handle(strippedOptionletAdapter);
        vol.currentLink().enableExtrapolation();
        const strippedVolEngine = new BlackCapFloorEngine().init3(vars.yieldTermStructure, vol);
        let cap;
        for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
            for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
                cap = new MakeCapFloor(CapFloor.Type.Cap, vars.optionTenors[tenorIndex], iborIndex, vars.strikes[strikeIndex], new Period().init1(0, TimeUnit.Days))
                    .withPricingEngine(strippedVolEngine)
                    .f();
                const priceFromStrippedVolatility = cap.NPV();
                const blackCapFloorEngineConstantVolatility = new BlackCapFloorEngine().init1(vars.yieldTermStructure, vars.termV[tenorIndex][strikeIndex]);
                cap.setPricingEngine(blackCapFloorEngineConstantVolatility);
                const priceFromConstantVolatility = cap.NPV();
                const error = Math.abs(priceFromStrippedVolatility - priceFromConstantVolatility);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing forward/forward vol stripping from non-flat normal vol term' +
        ' vol surface for normal vol setup using OptionletStripper1 class...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC('30,April,2015'));
        vars.setRealCapFloorTermVolSurface();
        const iborIndex = new Euribor6M(vars.forwardingYTS);
        const optionletStripper1 = new OptionletStripper1(vars.capFloorVolRealSurface, iborIndex, QL_NULL_REAL, vars.accuracy, 100, vars.discountingYTS, VolatilityType.Normal);
        const strippedOptionletAdapter = new StrippedOptionletAdapter(optionletStripper1);
        const vol = new Handle(strippedOptionletAdapter);
        vol.currentLink().enableExtrapolation();
        const strippedVolEngine = new BachelierCapFloorEngine().init3(vars.discountingYTS, vol);
        let cap;
        for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
            for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
                cap = new MakeCapFloor(CapFloor.Type.Cap, vars.optionTenors[tenorIndex], iborIndex, vars.strikes[strikeIndex], new Period().init1(0, TimeUnit.Days))
                    .withPricingEngine(strippedVolEngine)
                    .f();
                const priceFromStrippedVolatility = cap.NPV();
                const bachelierCapFloorEngineConstantVolatility = new BachelierCapFloorEngine().init1(vars.discountingYTS, vars.termV[tenorIndex][strikeIndex]);
                cap.setPricingEngine(bachelierCapFloorEngineConstantVolatility);
                const priceFromConstantVolatility = cap.NPV();
                const error = Math.abs(priceFromStrippedVolatility - priceFromConstantVolatility);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing forward/forward vol stripping from non-flat normal vol term vol' +
        ' surface for normal vol setup using OptionletStripper1 class...', () => {
        const vars = new CommonVars();
        const shift = 0.03;
        Settings.evaluationDate.set(DateExt.UTC('30,April,2015'));
        vars.setRealCapFloorTermVolSurface();
        const iborIndex = new Euribor6M(vars.forwardingYTS);
        const optionletStripper1 = new OptionletStripper1(vars.capFloorVolRealSurface, iborIndex, QL_NULL_REAL, vars.accuracy, 100, vars.discountingYTS, VolatilityType.ShiftedLognormal, shift, true);
        const strippedOptionletAdapter = new StrippedOptionletAdapter(optionletStripper1);
        const vol = new Handle(strippedOptionletAdapter);
        vol.currentLink().enableExtrapolation();
        const strippedVolEngine = new BlackCapFloorEngine().init3(vars.discountingYTS, vol);
        let cap;
        for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
            for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
                cap = new MakeCapFloor(CapFloor.Type.Cap, vars.optionTenors[tenorIndex], iborIndex, vars.strikes[strikeIndex], new Period().init1(0, TimeUnit.Days))
                    .withPricingEngine(strippedVolEngine)
                    .f();
                const priceFromStrippedVolatility = cap.NPV();
                const blackCapFloorEngineConstantVolatility = new BlackCapFloorEngine().init1(vars.discountingYTS, vars.termV[tenorIndex][strikeIndex], vars.capFloorVolRealSurface.dayCounter(), shift);
                cap.setPricingEngine(blackCapFloorEngineConstantVolatility);
                const priceFromConstantVolatility = cap.NPV();
                const error = Math.abs(priceFromStrippedVolatility - priceFromConstantVolatility);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing forward/forward vol stripping from flat term ' +
        'vol surface using OptionletStripper2 class...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC());
        vars.setFlatTermVolCurve();
        vars.setFlatTermVolSurface();
        const iborIndex = new Euribor6M(vars.yieldTermStructure);
        const optionletStripper1 = new OptionletStripper1(vars.flatTermVolSurface, iborIndex, QL_NULL_REAL, vars.accuracy);
        const strippedOptionletAdapter1 = new StrippedOptionletAdapter(optionletStripper1);
        const vol1 = new Handle(strippedOptionletAdapter1);
        vol1.currentLink().enableExtrapolation();
        const optionletStripper2 = new OptionletStripper2(optionletStripper1, vars.flatTermVolCurve);
        const strippedOptionletAdapter2 = new StrippedOptionletAdapter(optionletStripper2);
        const vol2 = new Handle(strippedOptionletAdapter2);
        vol2.currentLink().enableExtrapolation();
        for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
            for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
                const strippedVol1 = vol1.currentLink().volatility1(vars.optionTenors[tenorIndex], vars.strikes[strikeIndex], true);
                const strippedVol2 = vol2.currentLink().volatility1(vars.optionTenors[tenorIndex], vars.strikes[strikeIndex], true);
                const error = Math.abs(strippedVol1 - strippedVol2);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing forward/forward vol stripping from non-flat' +
        ' term vol surface using OptionletStripper2 class...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC());
        vars.setCapFloorTermVolCurve();
        vars.setCapFloorTermVolSurface();
        const iborIndex = new Euribor6M(vars.yieldTermStructure);
        const optionletStripper1 = new OptionletStripper1(vars.capFloorVolSurface, iborIndex, QL_NULL_REAL, vars.accuracy);
        const strippedOptionletAdapter1 = new StrippedOptionletAdapter(optionletStripper1);
        const vol1 = new Handle(strippedOptionletAdapter1);
        vol1.currentLink().enableExtrapolation();
        const optionletStripper2 = new OptionletStripper2(optionletStripper1, vars.capFloorVolCurve);
        const strippedOptionletAdapter2 = new StrippedOptionletAdapter(optionletStripper2);
        const vol2 = new Handle(strippedOptionletAdapter2);
        vol2.currentLink().enableExtrapolation();
        for (let strikeIndex = 0; strikeIndex < vars.strikes.length; ++strikeIndex) {
            for (let tenorIndex = 0; tenorIndex < vars.optionTenors.length; ++tenorIndex) {
                const strippedVol1 = vol1.currentLink().volatility1(vars.optionTenors[tenorIndex], vars.strikes[strikeIndex], true);
                const strippedVol2 = vol2.currentLink().volatility1(vars.optionTenors[tenorIndex], vars.strikes[strikeIndex], true);
                const error = Math.abs(strippedVol1 - strippedVol2);
                expect(error).toBeLessThan(vars.tolerance);
            }
        }
        vars.dispose();
    });

    it('Testing switch strike level and recalibration of' +
        ' level in case of curve relinking...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(DateExt.UTC('28,October,2013'));
        vars.setCapFloorTermVolSurface();
        const yieldTermStructure = new RelinkableHandle();
        yieldTermStructure.linkTo(new FlatForward().ffInit4(0, vars.calendar, 0.03, vars.dayCounter));
        const iborIndex = new Euribor6M(yieldTermStructure);
        const optionletStripper1 = new OptionletStripper1(vars.capFloorVolSurface, iborIndex, QL_NULL_REAL, vars.accuracy);
        let expected;
        if (Settings.QL_USE_INDEXED_COUPON) {
            expected = 0.02981258;
        }
        else {
            expected = 0.02981223;
        }
        let error = Math.abs(optionletStripper1.switchStrike() - expected);
        expect(error).toBeLessThan(vars.tolerance);
        yieldTermStructure.linkTo(new FlatForward().ffInit4(0, vars.calendar, 0.05, vars.dayCounter));
        if (Settings.QL_USE_INDEXED_COUPON) {
            expected = 0.0499381;
        }
        else {
            expected = 0.0499371;
        }
        error = Math.abs(optionletStripper1.switchStrike() - expected);
        expect(error).toBeLessThan(vars.tolerance);
    });
});
