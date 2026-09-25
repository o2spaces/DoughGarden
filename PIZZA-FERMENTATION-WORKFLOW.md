# Pizza Fermentation Workflow — DoughGarden V19

## What changed
The `พิซซ่าซาวโดว์` workflow now has two fermentation paths:

1. **Cold Bulk**
   - เตรียมโดว์
   - พัฒนากลูเตน
   - Warm Bulk
   - Cold Bulk
   - แบ่งและกลึงเป็นลูก
   - คืนอุณหภูมิ
   - ยืด/ใส่หน้า/อบ

2. **Cold Ball Ferment**
   - เตรียมโดว์
   - พัฒนากลูเตน
   - Warm Bulk
   - แบ่งและกลึงเป็นลูก
   - Cold Ball Ferment
   - คืนอุณหภูมิ
   - ยืด/ใส่หน้า/อบ

## Adaptive timing
Warm Bulk is estimated from dough/room temperature, starter percentage, recorded levain activity and the recipe learning factor. It is intentionally shown as an **estimate window**; actual dough readiness should be verified by volume, bubbles, strength and extensibility.

Changing temperature on the Overview page while the Pizza Warm Bulk timer is running updates the active countdown because the Warm Bulk phase duration is derived from the adaptive fermentation model.

Changing Starter percentage also changes the Warm Bulk estimate because Starter percentage is an input to the adaptive model.

## Cold fermentation
Pizza cold-fermentation duration is user-selectable from **12–48 hours** and is separate from the generic bread `coldHours` setting.

## Research references
- The Perfect Loaf — Whole Wheat Sourdough Pizza Dough: https://www.theperfectloaf.com/whole-wheat-sourdough-pizza-dough/comment-page-3/
- King Arthur Baking — Sourdough Pizza Crust: https://www.kingarthurbaking.com/recipes/sourdough-pizza-crust-recipe

These sources illustrate multiple legitimate sourdough-pizza schedules (including multi-hour warm bulk and long cold fermentation). DoughGarden therefore treats timing as an adaptive estimate rather than a single fixed 90-minute Bulk value.
