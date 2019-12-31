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
import { D0Interpolator, NoArbSabrModel, NoArbSabrSmileSection, SabrSmileSection, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function checkD0(sigmaI, beta, rho, nu, tau, absorptions) {
    const forward = 0.03;
    const alpha = sigmaI / Math.pow(forward, beta - 1.0);
    const d = new D0Interpolator(forward, tau, alpha, beta, nu, rho);
    expect(Math.abs(d.f() * NoArbSabrModel.nsim - absorptions)).toBeLessThan(0.1);
    return;
}

describe(`NoArb Sabr Model tests ${version}`, () => {
  it('Testing no-arbitrage Sabr absorption matrix...', () => {
      checkD0(1, 0.01, 0.75, 0.1, 0.25, 60342);
      checkD0(0.8, 0.01, 0.75, 0.1, 0.25, 12148);
      checkD0(0.05, 0.01, 0.75, 0.1, 0.25, 0);
      checkD0(1, 0.01, 0.75, 0.1, 10.0, 1890509);
      checkD0(0.8, 0.01, 0.75, 0.1, 10.0, 1740233);
      checkD0(0.05, 0.01, 0.75, 0.1, 10.0, 0);
      checkD0(1, 0.01, 0.75, 0.1, 30.0, 2174176);
      checkD0(0.8, 0.01, 0.75, 0.1, 30.0, 2090672);
      checkD0(0.05, 0.01, 0.75, 0.1, 30.0, 31);
      checkD0(0.35, 0.10, -0.75, 0.1, 0.25, 0);
      checkD0(0.35, 0.10, -0.75, 0.1, 14.75, 1087841);
      checkD0(0.35, 0.10, -0.75, 0.1, 30.0, 1406569);
      checkD0(0.24, 0.90, 0.50, 0.8, 1.25, 27);
      checkD0(0.24, 0.90, 0.50, 0.8, 25.75, 167541);
      checkD0(0.05, 0.90, -0.75, 0.8, 2.0, 17);
      checkD0(0.05, 0.90, -0.75, 0.8, 30.0, 42100);
  });

  it('Testing consistency of noarb-sabr with Hagan et al (2002)', () => {
      const tau = 1.0;
      const beta = 0.5;
      const alpha = 0.026;
      const rho = -0.1;
      const nu = 0.4;
      const f = 0.0488;
      const sabr = new SabrSmileSection().sssInit1(tau, f, [alpha, beta, nu, rho]);
      const noarbsabr = new NoArbSabrSmileSection().nasssInit1(tau, f, [alpha, beta, nu, rho]);
      const absProb = noarbsabr.model().absorptionProbability();
      expect(absProb).toBeLessThan(1E-10);
      expect(absProb).toBeGreaterThanOrEqual(0.0);
      let strike = 0.0001;
      while (strike < 0.15) {
          const sabrPrice = sabr.optionPrice(strike);
          const noarbsabrPrice = noarbsabr.optionPrice(strike);
          expect(Math.abs(sabrPrice - noarbsabrPrice)).toBeLessThan(1e-5);
          const sabrDigital = sabr.digitalOptionPrice(strike);
          const noarbsabrDigital = noarbsabr.digitalOptionPrice(strike);
          expect(Math.abs(sabrDigital - noarbsabrDigital)).toBeLessThan(1e-3);
          const sabrDensity = sabr.density(strike);
          const noarbsabrDensity = noarbsabr.density(strike);
          expect(Math.abs(sabrDensity - noarbsabrDensity)).toBeLessThan(1e-0);
          strike += 0.0001;
      }
  });
});
