# Session Note - 2026-05-25 - NMS Buildings Split

## Summary
The single "Floors F1-F16" network node group in NMS Topology Map was split into two buildings:
1. **Medicine Building (ตึก Medicine - 16 Floors)**
2. **Med Building (ตึก Med - 11 Floors)**

This split was reflected on the SVG map nodes, cabling links, sidebar tree lists, and Event Log filters.

## Current State
- All code changes are implemented and verified in the active browser session.
- Production build passes successfully.

## Decisions
- Used `medicine16` and `med11` as the new zone keys to separate the groups cleanly.
- Placed the Medicine building at coordinates `x: 650-730, y: 130-310` (middle-right of the canvas) and Med building at `x: 810-890, y: 130-310` (far-right of the canvas).
- Re-routed environmental sensor gear to connect to the new Medicine building switches to match logical network paths.

## Blockers
- None.

## Files Touched
- `src/components/NmsTopology.tsx`

## Commands Run
- `npm run build`
- `python .agents/scripts/update_repo_context.py`

## Next Todo
- Await additional requests from the user.

## Resume Prompt
Run the Vite development server (`npm run dev`) and open `localhost:3000/`. Switch to "Topology NMS" and verify that both "Medicine Bldg (16 Fl)" and "Med Bldg (11 Fl)" render correctly on the canvas and in the left sidebar tree, and that the simulation updates their statuses dynamically.
