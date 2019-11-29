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
import { BarrelUnitOfMeasure, GallonUnitOfMeasure, KilolitreUnitOfMeasure, LitreUnitOfMeasure, MBUnitOfMeasure, NullCommodityType, Quantity, UnitOfMeasureConversion, UnitOfMeasureConversionManager, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Commodity Unit Of Measure tests ${version}`, () => {
    it('Testing direct commodity unit of measure conversions...', () => {
        let actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new MBUnitOfMeasure(), new BarrelUnitOfMeasure(), 1000)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        let calc = UnitOfMeasureConversionManager
            .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new MBUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new BarrelUnitOfMeasure(), new GallonUnitOfMeasure(), 42)
            .convert(new Quantity().init2(new NullCommodityType(), new GallonUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new GallonUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new GallonUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new BarrelUnitOfMeasure(), new LitreUnitOfMeasure(), 158.987)
            .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new LitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual =
            new UnitOfMeasureConversion()
                .init1(new NullCommodityType(), new KilolitreUnitOfMeasure(), new BarrelUnitOfMeasure(), 6.28981)
                .convert(new Quantity().init2(new NullCommodityType(), new KilolitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new BarrelUnitOfMeasure(), new KilolitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new KilolitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new GallonUnitOfMeasure(), new MBUnitOfMeasure(), 42000)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        calc = UnitOfMeasureConversionManager
            .lookup(new NullCommodityType(), new GallonUnitOfMeasure(), new MBUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
            .convert(new Quantity().init2(new NullCommodityType(), new MBUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
        actual = new UnitOfMeasureConversion()
            .init1(new NullCommodityType(), new LitreUnitOfMeasure(), new GallonUnitOfMeasure(), 3.78541)
            .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        calc =
            UnitOfMeasureConversionManager
                .lookup(new NullCommodityType(), new GallonUnitOfMeasure(), new LitreUnitOfMeasure(), UnitOfMeasureConversion.Type.Direct)
                .convert(new Quantity().init2(new NullCommodityType(), new LitreUnitOfMeasure(), 1000));
        expect(calc.close(actual)).toBeTruthy();
    });
});
