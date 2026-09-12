# Temperature → Guided Workflow recalculation

When room temperature or dough temperature is changed on the Overview page while a temperature-sensitive phase is actively running in `04 — GUIDED WORKFLOW · V28`, the live countdown now recalculates immediately.

Behavior:
- Uses the current adaptive phase duration (`phases[activePhase].hours`).
- Preserves the original phase start time.
- Recomputes the phase end time from that start + the new duration.
- Updates the countdown without requiring the user to restart the timer.
- Applies to Country phases 03 Strength Building, 04 Bulk Fermentation, 07 Final Proof, and to Bulk/Proof phases in other bread styles.
- If the new calculated end is already past, the timer stops at zero.

The planned timeline (`phaseTimeline`) was already reactive to temperature changes; this patch adds the same behavior to the **currently running countdown**.
