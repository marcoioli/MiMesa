# Delta for seating

Covers assigning guests to seats: drag and drop from the sidebar and between seats,
rejection feedback, the click menus on seated guests and empty seats, and auto-seating.

## ADDED Requirements

### Requirement: Seat a guest by dropping on an empty seat (RF-20)

The system MUST let the organizer drag a guest card from the sidebar and drop it on an
empty seat, which seats that guest in that exact seat. The guest MUST then disappear from
the sidebar and the table occupancy MUST increase by one.

#### Scenario: Drop on a specific empty seat

- GIVEN an unseated guest "Ana" and an empty seat 3 of "Mesa 2"
- WHEN the organizer drags "Ana" onto seat 3 and releases
- THEN "Ana" occupies seat 3 of "Mesa 2"
- AND "Ana" is no longer listed in the sidebar

#### Scenario: Small seat targets remain reachable

- GIVEN a table of capacity 20 whose seats are small
- WHEN the pointer is released while inside a specific empty seat
- THEN that seat, not the table body, receives the drop

### Requirement: Seat a guest by dropping on the table body (RF-21)

Dropping a guest on a table area that is not a seat MUST seat the guest in the first free
seat of that table, scanning seat indexes in ascending order. If the pointer is over a
seat, the seat MUST win over the table body.

#### Scenario: First free seat is chosen

- GIVEN "Mesa 1" of capacity 6 with seats 0 and 1 occupied
- WHEN a guest is dropped on the table body
- THEN the guest is seated in seat 2

### Requirement: Rejected drops (RF-22)

A drop on an occupied seat, or on a table with no free seat, MUST be rejected: the seat
assignment MUST NOT change and the dragged guest MUST return to its origin (sidebar or
previous seat). The system MUST signal the rejection with a red ring on the invalid seat
or table while it is hovered during the drag, plus a brief notice on release.

#### Scenario: Drop on an occupied seat

- GIVEN seat 2 of "Mesa 1" is occupied by "Juan"
- WHEN the organizer drags "Ana" from the sidebar over seat 2
- THEN seat 2 shows a red ring during the drag
- AND on release "Juan" still occupies seat 2, "Ana" is back in the sidebar, and a notice appears

#### Scenario: Drop on a full table

- GIVEN "Mesa 3" has every seat occupied
- WHEN a guest is dropped on its table body
- THEN the drop is rejected, the guest returns to its origin, and a notice appears

### Requirement: Move a seated guest (RF-23)

The system MUST let the organizer drag an already-seated guest to another empty seat or
onto another table body. A successful move MUST free the origin seat in the same operation
and MUST NOT create a duplicate of the guest.

#### Scenario: Reseat within another table

- GIVEN "Ana" occupies seat 1 of "Mesa 1" and seat 4 of "Mesa 5" is empty
- WHEN the organizer drags "Ana" onto seat 4 of "Mesa 5"
- THEN "Ana" occupies seat 4 of "Mesa 5", seat 1 of "Mesa 1" is empty, and the counters are unchanged

#### Scenario: Rejected reseat keeps the origin

- GIVEN "Ana" occupies seat 1 of "Mesa 1"
- WHEN the organizer drops her on an occupied seat
- THEN "Ana" still occupies seat 1 of "Mesa 1"

### Requirement: Seated guest menu (RF-24)

Clicking a seated guest MUST open a menu offering "Quitar de la mesa", which frees the seat
and returns the guest to the sidebar, and "Eliminar invitado", which deletes the guest after
confirmation. A click MUST NOT start a drag: a drag MUST begin only after the pointer moves
at least 5 pixels.

#### Scenario: Remove from the table

- GIVEN "Ana" occupies seat 0 of "Mesa 2"
- WHEN the organizer clicks her and chooses "Quitar de la mesa"
- THEN seat 0 is empty and "Ana" appears in the sidebar

#### Scenario: Click and drag coexist

- GIVEN a seated guest
- WHEN the organizer presses and releases without moving 5 pixels
- THEN the menu opens and no seat assignment changed

### Requirement: Empty seat picker (RF-25)

Clicking an empty seat MUST open a picker listing the unseated guests with its own search
field, plus a "Nuevo invitado" field that creates a guest from a typed name and seats that
guest in the clicked seat in one action. Choosing a listed guest MUST seat that guest in the
clicked seat.

#### Scenario: Seat an existing unseated guest

- GIVEN seat 5 of "Mesa 4" is empty and "Pedro" is unseated
- WHEN the organizer clicks seat 5, searches "ped", and selects "Pedro"
- THEN "Pedro" occupies seat 5 and the picker closes

#### Scenario: Create and seat in one step

- GIVEN seat 2 of "Mesa 1" is empty
- WHEN the organizer types "Lucía" into "Nuevo invitado" and confirms
- THEN a guest "Lucía" is created and immediately occupies seat 2
- AND "Lucía" never appears in the sidebar as unseated

### Requirement: Auto-seat (RF-26)

The auto-seat action MUST seat every unseated guest, taken in sidebar insertion order, into
the free seats found by scanning tables in order and seat indexes in ascending order within
each table. Auto-seat MUST ignore any active sidebar search filter and MUST always consider
the full unseated list. If free seats run out, the remaining guests MUST stay unseated in
the sidebar and the system MUST show a notice.

#### Scenario: Enough free seats

- GIVEN 5 unseated guests and 12 free seats spread across tables
- WHEN the organizer activates auto-seat
- THEN all 5 guests are seated, filling the earliest free seats table by table
- AND the sidebar is empty

#### Scenario: Not enough free seats

- GIVEN 10 unseated guests and only 4 free seats
- WHEN the organizer activates auto-seat
- THEN the first 4 unseated guests in sidebar order are seated
- AND the remaining 6 stay in the sidebar and a notice is shown

#### Scenario: Active filter does not change the order

- GIVEN 8 unseated guests and a sidebar search filter showing only 2 of them
- WHEN the organizer activates auto-seat
- THEN all 8 guests are considered in full insertion order, not just the 2 visible ones
