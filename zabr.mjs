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
import { SabrSmileSection, ZabrFullFd, ZabrLocalVolatility, ZabrShortMaturityLognormal, ZabrShortMaturityNormal, ZabrSmileSection, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Zabr model tests ${version}`, () => {
    it('Testing Consistency ...', () => {
        const tol = 1E-4;
        const alpha = 0.08;
        const beta = 0.70;
        const nu = 0.20;
        const rho = -0.30;
        const tau = 5.0;
        const forward = 0.03;
        const sabr = new SabrSmileSection().sssInit1(tau, forward, [alpha, beta, nu, rho]);
        const zabr0 = new ZabrSmileSection(new ZabrShortMaturityLognormal())
            .zssInit1(tau, forward, [alpha, beta, nu, rho, 1.0]);
        const zabr1 = new ZabrSmileSection(new ZabrShortMaturityNormal())
            .zssInit1(tau, forward, [alpha, beta, nu, rho, 1.0]);
        const zabr2 = new ZabrSmileSection(new ZabrLocalVolatility()).zssInit1(tau, forward, [
            alpha, beta, nu, rho, 1.0
        ]);
        const zabr3 = new ZabrSmileSection(new ZabrFullFd())
            .zssInit1(tau, forward, [alpha, beta, nu, rho, 1.0], [], 2);
        let k = 0.0001;
        while (k <= 0.70) {
            const c0 = sabr.optionPrice(k);
            const z0 = zabr0.optionPrice(k);
            const z1 = zabr1.optionPrice(k);
            const z2 = zabr2.optionPrice(k);
            const z3 = zabr3.optionPrice(k);
            expect(Math.abs(z0 - c0)).toBeLessThan(tol);
            expect(Math.abs(z1 - c0)).toBeLessThan(tol);
            expect(Math.abs(z2 - c0)).toBeLessThan(tol);
            expect(Math.abs(z3 - c0)).toBeLessThan(tol);
            k += 0.0001;
        }
    });
});