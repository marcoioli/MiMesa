# Delta for export

Covers exporting the plan drawn in the editor as a downloadable PNG image.

## ADDED Requirements

### Requirement: Export the plan as PNG (RF-35)

The editor MUST offer an "Exportar PNG" action that downloads an image of the whole plan
area, including every table with its name, occupancy and seated names, and not only the
part currently visible in the viewport. The file name MUST be `plano-<slug>.png`, where
`<slug>` is the event name lowercased, with diacritics stripped and every run of
non-alphanumeric characters replaced by a single hyphen. Transient interface elements —
drag overlays, open menus, dialogs and toasts — MUST NOT appear in the image, and the image
MUST have an opaque white background.

#### Scenario: Export produces a named file

- GIVEN an event named "Casamiento Ana y Juan" with 6 tables
- WHEN the organizer activates "Exportar PNG"
- THEN a PNG file named `plano-casamiento-ana-y-juan.png` is downloaded

#### Scenario: The whole canvas is captured

- GIVEN a plan wider than the visible viewport, requiring horizontal scrolling
- WHEN the plan is exported
- THEN every table appears in the image, including those outside the current viewport

#### Scenario: Interface chrome is excluded

- GIVEN a table menu is open when the export is triggered
- WHEN the image is produced
- THEN the menu is absent from the image and the background is opaque white
