# DoughGarden V28 — Water Balance for User-Added Ingredients

## What changed
The Ingredient Builder now distinguishes three water concepts for non-flour additions:

- Moisture %: approximate total water contained in the ingredient.
- Water Availability %: the fraction of that moisture expected to behave as available water in the dough.
- Water Demand ×: the amount of extra dough water the ingredient is estimated to need, expressed as a multiple of ingredient weight (for example 0.50× means about 50 g water per 100 g ingredient).

These values are editable per selected inclusion and are also persisted for user-created library items.

## Calculation model
Baker's hydration remains based on flour and water. Add-ins are not silently reclassified as flour.

Available ingredient water = ingredient grams × moisture × availability.

Ingredient water demand = ingredient grams × demand factor.

Recommended mix water = base formula water − starter water − available ingredient water + ingredient water demand.

The flour basis is solved so the target dough weight still includes the selected add-in mass and net water effect where feasible.

## Important limitation
These are practical estimating controls, not laboratory measurements. Ingredients vary by brand, processing, storage, soaking, salting, fat content, and particle size. The user can override the defaults.
