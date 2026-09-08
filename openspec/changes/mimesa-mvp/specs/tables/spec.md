# Delta for tables

Covers materializing the chosen template into round tables on the plan, table CRUD,
capacity, renaming, moving, clearing, and how a table is drawn. Seating a guest into a
seat belongs to the `seating` capability.

## ADDED Requirements

### Requirement: Template materialization and grid layout (RF-04 materialization, RF-05)

On event creation the system MUST create exactly the number of round tables the chosen
template defines, each with the template capacity, named automatically "Mesa 1",
"Mesa 2", … in creation order. Each table MUST have exactly `capacity` seats, all empty.
Tables MUST be laid out in a grid on a fixed 1600x1200 pixel scrolling canvas using a
5-column layout with a 290 pixel horizontal pitch, a 270 pixel vertical pitch and a
50 pixel margin. The canvas holds a maximum of 20 tables (5 columns by 4 rows).

#### Scenario: Preset template materialized

- GIVEN a new event created with "6 mesas de 8"
- WHEN the editor opens
- THEN the canvas shows 6 tables named "Mesa 1" through "Mesa 6"
- AND each table has 8 empty seats and sits in a 5-column grid inside the 1600x1200 canvas

#### Scenario: Grid wraps beyond the fifth column

- GIVEN a template of 10 tables
- WHEN the tables are laid out
- THEN tables 1-5 occupy the first row and 6-10 the second at the same pitch
- AND the canvas scrolls rather than resizing when the grid exceeds the viewport

### Requirement: Add and remove a table (RF-06)

The system MUST let the organizer add a new table by entering a capacity between 2 and 20,
appending it after the existing tables with the next automatic name. The system MUST let
the organizer delete a table after confirmation through the shared `ConfirmDialog`; every
guest seated at that table MUST return to the sidebar as unseated and MUST NOT be deleted.

#### Scenario: Add a table

- GIVEN an event with 6 tables
- WHEN the organizer adds a table with capacity 10
- THEN a seventh table with 10 empty seats appears on the canvas at the next grid position

#### Scenario: Delete an occupied table

- GIVEN "Mesa 3" has 4 seated guests
- WHEN the organizer deletes it and confirms
- THEN "Mesa 3" disappears from the canvas
- AND those 4 guests appear in the sidebar as unseated with their names intact

### Requirement: Change table capacity (RF-07)

The system MUST let the organizer change a table's capacity within 2 to 20. Increasing
capacity MUST append empty seats and preserve existing seat assignments. Decreasing
capacity MUST remove the highest-index seats, and every guest seated in a removed seat
MUST return to the sidebar as unseated.

#### Scenario: Increase capacity

- GIVEN a table of capacity 6 with guests in seats 0 and 3
- WHEN the capacity is set to 10
- THEN the table has 10 seats and those two guests remain in seats 0 and 3

#### Scenario: Decrease capacity displaces guests

- GIVEN a table of capacity 8 with a guest in seat 7
- WHEN the capacity is set to 6
- THEN the table has 6 seats and that guest appears in the sidebar as unseated

### Requirement: Rename a table (RF-08)

The system MUST let the organizer rename a table by double-clicking its centre name label
and MUST persist the new name. A double click MUST NOT start a table drag.

#### Scenario: Rename via double click

- GIVEN a table named "Mesa 2"
- WHEN the organizer double-clicks the centre label, types "Mesa novios", and confirms
- THEN the table shows "Mesa novios" and its position is unchanged

#### Scenario: Empty name rejected

- GIVEN the inline rename editor is open
- WHEN the organizer confirms an empty or whitespace-only name
- THEN the previous name is kept

### Requirement: Table drawing (RF-09)

Each table MUST be drawn as a circle with its seats distributed evenly around the disc,
its name in the centre, and its occupancy as "seated/capacity" (for example "5/8") on a
second line. A centre name too long for the disc MUST be truncated visually and MUST
expose the full name through a `title` tooltip.

#### Scenario: Occupancy label

- GIVEN a table of capacity 8 with 5 seated guests
- WHEN the canvas renders
- THEN the table centre shows the table name and "5/8"

#### Scenario: Long name at high capacity

- GIVEN a table of capacity 20 with a long name
- WHEN the canvas renders
- THEN the name is truncated inside the disc, the 20 seats stay legible and non-overlapping,
  and hovering the name reveals the full text

### Requirement: Occupancy colour (RF-10)

A table's fill colour MUST indicate its occupancy: slate when no seat is taken, amber when
some but not all seats are taken, and emerald when every seat is taken. The colour MUST
update immediately whenever a seat assignment changes.

#### Scenario: Colour transitions with seating

- GIVEN an empty table of capacity 4 drawn in slate
- WHEN one guest is seated
- THEN the table is drawn in amber
- AND when the fourth guest is seated the table is drawn in emerald

#### Scenario: Colour reverts when the table is emptied

- GIVEN a full table drawn in emerald
- WHEN all its guests are unseated
- THEN the table is drawn in slate

### Requirement: Move a table (RF-11)

The system MUST let the organizer move a table by dragging it on the canvas, MUST store
the resulting position with the event, and MUST clamp the stored `x`/`y` so the whole
table stays inside the 1600x1200 canvas rectangle. The drag MUST start only from the
table's centre label handle and only after the pointer moves at least 5 pixels.

#### Scenario: Move and persist

- GIVEN a table at a grid position
- WHEN the organizer drags its centre label 200 pixels right and drops it
- THEN the table renders at the new position
- AND the position survives a page reload

#### Scenario: Drag beyond the canvas edge is clamped

- GIVEN a table near the canvas boundary
- WHEN the organizer drags it past the edge
- THEN the stored position is clamped so the table remains fully inside the canvas

#### Scenario: Click without movement does not move the table

- GIVEN a table on the canvas
- WHEN the organizer presses and releases the centre label without moving 5 pixels
- THEN the table position is unchanged and no drag occurred

### Requirement: Empty a single table (RF-12)

The system MUST offer a per-table action that returns every guest seated at that table to
the sidebar as unseated, leaving the table itself, its name, capacity, and position intact.

#### Scenario: Empty one table

- GIVEN "Mesa 4" has 6 seated guests and "Mesa 5" has 3
- WHEN the organizer empties "Mesa 4" from its menu
- THEN "Mesa 4" shows 0/capacity in slate and its 6 guests are unseated in the sidebar
- AND "Mesa 5" still has its 3 seated guests

### Requirement: Empty all tables (RF-13)

The topbar MUST offer an action that returns every seated guest of every table to the
sidebar, after confirmation through the shared `ConfirmDialog`. No table and no guest may
be deleted by this action.

#### Scenario: Confirmed empty-all

- GIVEN several tables with seated guests
- WHEN the organizer activates the empty-all action and confirms
- THEN every table shows zero occupancy and every guest is listed in the sidebar
- AND the table count, names, capacities, and positions are unchanged

#### Scenario: Cancelled empty-all

- GIVEN the empty-all confirmation dialog is open
- WHEN the organizer cancels
- THEN all seat assignments remain exactly as before

### Requirement: Canvas zoom (RF-36)

The canvas MUST offer zoom between 50% and 200% through "-", "100 %" and "+" controls at the
bottom-right corner of the canvas area and through Ctrl + mouse wheel. Zoom is UI state: it
MUST NOT be persisted with the event and MUST NOT change the PNG export. Dragging a table
while zoomed MUST move it by the on-canvas distance, not the on-screen distance.

#### Scenario: Zoom in with the button

- GIVEN the canvas at 100%
- WHEN the organizer presses "+" twice
- THEN the label reads 120% and every table is drawn larger, and the canvas scrolls further
- AND the canvas size in the exported PNG is unchanged

#### Scenario: Table move under zoom

- GIVEN the canvas at 200%
- WHEN the organizer drags a table label 200px to the right on screen
- THEN the table moves 100px on the canvas and stays where it was released

### Requirement: Table selection and visual size (RF-37)

Clicking the disc of a table MUST select it, shown with an accent outline. The selected
table MUST offer a "Tamaño" control with "-" and "+" steps of 0.25 between 0.75x and 2x that
scales the whole drawing, seats included, without changing the capacity or the seating. The
size MUST persist with the event. Escape or a click on the canvas background MUST deselect.

#### Scenario: Enlarge a table

- GIVEN "Mesa 3" with 5 of 8 seats occupied at size 1x
- WHEN the organizer selects it and presses "+" twice on "Tamaño"
- THEN "Mesa 3" is drawn at 1.5x with the same 5 guests in the same seats and still reads 5/8
- AND after a reload it is still drawn at 1.5x

#### Scenario: Size bounds

- GIVEN a table at 2x
- WHEN the organizer presses "+"
- THEN the size stays at 2x and the "+" control is disabled
