# Delta for guests

Covers the guest list itself: bulk and individual creation, the sidebar of unseated
guests, deletion, search, and the topbar counters. Placing a guest in a seat belongs to
the `seating` capability.

## ADDED Requirements

### Requirement: Bulk guest input (RF-14)

The system MUST provide a text area accepting one guest name per line and an "Aceptar"
button that creates one guest per non-empty line. Leading and trailing whitespace MUST be
trimmed from each name, empty and whitespace-only lines MUST be ignored, and repeated
names MUST be accepted as distinct guests.

#### Scenario: Bulk load with blank lines and padding

- GIVEN an empty guest list
- WHEN the organizer pastes "  Ana  \n\n Juan\n\n  " and activates "Aceptar"
- THEN exactly two guests named "Ana" and "Juan" are created
- AND the text area is cleared

#### Scenario: Repeated names are kept

- GIVEN an empty guest list
- WHEN the organizer submits "Ana\nAna"
- THEN two distinct guests both named "Ana" exist and both appear in the sidebar

### Requirement: Unseated guest sidebar (RF-15)

The sidebar MUST list every unseated guest as a card showing the guest name. A guest is
unseated exactly when the guest id occupies no seat at any table. The list MUST update
immediately when a guest is seated or unseated.

#### Scenario: Sidebar reflects seating state

- GIVEN 10 guests exist and none is seated
- WHEN the organizer seats 3 of them
- THEN the sidebar lists exactly the remaining 7 guests as cards

### Requirement: Add a single guest (RF-16)

The sidebar MUST let the organizer add one guest by name. A name that is empty after
trimming MUST NOT create a guest.

#### Scenario: Add one guest

- GIVEN a sidebar with 4 unseated guests
- WHEN the organizer types "Pedro" and confirms
- THEN a guest named "Pedro" is created and appears in the sidebar

#### Scenario: Empty name rejected

- GIVEN the single-guest input is focused
- WHEN the organizer confirms an empty or whitespace-only value
- THEN no guest is created and no error state blocks further input

### Requirement: Delete a guest (RF-17)

The system MUST let the organizer delete a guest from the sidebar and from that guest's
seat, after confirmation through the shared `ConfirmDialog`. Deleting a seated guest MUST
free that seat.

#### Scenario: Delete an unseated guest

- GIVEN a guest listed in the sidebar
- WHEN the organizer deletes it and confirms
- THEN the guest disappears from the sidebar and from the counters

#### Scenario: Delete a seated guest from the seat

- GIVEN a guest seated in seat 2 of "Mesa 1"
- WHEN the organizer deletes the guest from that seat and confirms
- THEN seat 2 becomes empty, the table occupancy decreases, and the guest is not in the sidebar

### Requirement: Guest search (RF-18)

The sidebar MUST provide a search field filtering the unseated guest list by partial match,
ignoring letter case and diacritics. An empty search field MUST show the whole unseated list.

#### Scenario: Accent- and case-insensitive partial match

- GIVEN unseated guests "José Pérez", "Josefina" and "Mariano"
- WHEN the organizer types "jose"
- THEN the sidebar lists "José Pérez" and "Josefina" only

#### Scenario: Clearing the search

- GIVEN an active filter hiding most guests
- WHEN the organizer clears the search field
- THEN the sidebar lists every unseated guest again

### Requirement: Find a seated guest and point the plan at them (RF-40)

The RF-18 search MUST also match guests who already hold a seat. Those matches MUST appear
under "Ya sentados", inside the group of the table each one sits at (RF-43). Choosing one MUST
bring that table into the middle of the canvas viewport and mark that guest's seat for a few
seconds, after which the mark clears on its own. The mark MUST NOT reach the PNG export.

#### Scenario: A seated guest is found and pointed at

- GIVEN "Ana" occupies a seat of "Mesa 7", which is scrolled out of view
- WHEN the organizer types "ana" and chooses her entry under "Ya sentados"
- THEN the canvas scrolls to centre "Mesa 7" and Ana's seat is marked

#### Scenario: Seated and unseated matches are told apart

- GIVEN "Ana Rossi" is seated and "Ana Gómez" is unseated
- WHEN the organizer types "ana"
- THEN "Ana Gómez" appears as a draggable card under "Sin ubicar" and "Ana Rossi" appears under "Ya sentados", inside the group of her table

#### Scenario: The mark clears itself

- GIVEN a seat marked by a search
- WHEN a few seconds pass with no further action
- THEN the mark is gone and the plan is otherwise unchanged

### Requirement: The panel lists every guest, seated ones grouped by table (RF-43)

The sidebar MUST list every guest of the event, not only the unseated ones, and MUST do so
with or without a search. It MUST be split into a "Sin ubicar" section holding the draggable
cards and a "Ya sentados" section grouping the seated guests under the table each one sits at.
Every table group MUST be foldable from its own subtitle, which MUST carry the table name and
how many guests it holds. Folding MUST be ignored while a search is active, so no match can
hide inside a folded group, and the fold state MUST survive clearing that search. The fold
state MUST NOT be persisted. Rows under "Ya sentados" MUST NOT be draggable, because the panel
is itself the RF-38 unseat target and a short drag would silently unseat the guest.

#### Scenario: Seated guests are listed without searching

- GIVEN eight guests are seated across "Mesa 1" and "Mesa 2" and three are unseated
- WHEN the organizer looks at the panel with an empty search field
- THEN the three are listed under "Sin ubicar" and the eight under "Ya sentados", grouped under "Mesa 1" and "Mesa 2"

#### Scenario: A table group folds away

- GIVEN "Mesa 1" is showing its guests
- WHEN the organizer clicks the "Mesa 1" subtitle
- THEN its guests are hidden, its count stays visible, and the other groups are untouched

#### Scenario: A search reaches inside a folded group

- GIVEN "Mesa 1" is folded and "Ana" is seated at it
- WHEN the organizer types "ana"
- THEN Ana is visible under "Mesa 1", and clearing the search folds "Mesa 1" again

#### Scenario: Every guest is seated

- GIVEN every guest of the event holds a seat
- WHEN the organizer looks at the panel
- THEN "Sin ubicar" says that all the guests are placed and "Ya sentados" lists all of them

### Requirement: Topbar counters (RF-19)

The topbar MUST display four counters: total guests, seated guests, unseated guests, and
free seats. Free seats MUST equal the sum of all table capacities minus the number of
seated guests. All four counters MUST update immediately after any change to guests,
seats, tables, or capacities.

#### Scenario: Counters after seating

- GIVEN 20 guests, 3 tables of capacity 8 (24 seats), and 5 guests seated
- WHEN the topbar renders
- THEN it shows total 20, seated 5, unseated 15, and free seats 19

#### Scenario: Counters after a capacity change

- GIVEN the state above
- WHEN one table's capacity is reduced from 8 to 6 without displacing any seated guest
- THEN free seats becomes 17 and the other three counters are unchanged
