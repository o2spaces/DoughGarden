# DoughGarden · Optional Water Balance Ingredient Profiles

## Behavior
Water Balance is **off by default per inclusion**. It is enabled only when the user ticks `ใช้ข้อมูลนี้ในการคำนวณน้ำสูตร` on that ingredient.

When off, Moisture / Water Availability / Water Demand are reference data only and have zero effect on the recipe calculation.

When on, the recipe engine uses only that ingredient's profile:

- **Moisture %** — estimated percentage of the ingredient's weight that is water.
- **Water Availability %** — estimated percentage of that water that is treated as available to affect dough hydration.
- **Water Demand ×** — water compensation factor. Example: `0.50×` means 50 g water per 100 g of that ingredient.

## Calculation
For each enabled custom inclusion:

`waterContribution = ingredientWeight × moisture × availability`

`waterDemand = ingredientWeight × demandFactor`

The main formula water is adjusted by:

`adjustedWater = baseFormulaWater - waterContribution + waterDemand`

The ingredient's own weight remains part of the dough weight as usual; the profile only changes how much of the target water is supplied by or reserved for that ingredient.

## UI
The profile panel starts collapsed. The checkbox is shown first so the user can explicitly opt in. Numeric fields are shown only when the checkbox is enabled, with a plain-language explanation of what each field changes in the formula.

## Important
These values are estimates, not laboratory measurements. Different brands, processing methods, and ingredient forms can behave differently. The user can change the profile later and the values are saved with the personal ingredient library.
