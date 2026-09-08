# Delta for event

Covers the single active event: identity fields, editing, reset, and the table-template
choice presented at creation time. Materializing the chosen template into tables belongs
to the `tables` capability.

## ADDED Requirements

### Requirement: Event creation (RF-01)

The system MUST let the organizer create the single active event with a name (required),
a date (required, ISO `yyyy-mm-dd`), and a place (optional). The system MUST reject
submission while name or date is empty and MUST NOT create a partial event.

#### Scenario: Create an event with the required fields

- GIVEN no event exists and the editor shows the creation form
- WHEN the organizer enters a name and a date, leaves the place empty, and submits
- THEN the event is created with that name and date and an empty place
- AND the editor replaces the form with the topbar, guest sidebar, and canvas

#### Scenario: Missing required field blocks creation

- GIVEN the creation form is open
- WHEN the organizer submits with an empty name or an empty date
- THEN the form MUST show a Spanish validation message and no event is created

### Requirement: Event editing (RF-02)

The system MUST let the organizer change the event name, date, and place at any time after
creation. Editing these fields MUST NOT alter tables, seats, or guests.

#### Scenario: Rename the event after seating guests

- GIVEN an event with tables and seated guests
- WHEN the organizer edits the name, date, and place and confirms
- THEN the topbar shows the new values
- AND every table position, seat assignment, and guest remains unchanged

#### Scenario: Clearing the optional place

- GIVEN an event with a place set
- WHEN the organizer clears the place field and confirms
- THEN the event has no place and no validation error is raised

### Requirement: New event resets all state (RF-03)

The action "Nuevo evento" MUST discard the entire current event — tables, seats, and
guests — and MUST require explicit confirmation through the shared `ConfirmDialog`
component before doing so. The system MUST NOT use `window.confirm`.

#### Scenario: Confirmed reset

- GIVEN an event with tables, guests, and seat assignments
- WHEN the organizer activates "Nuevo evento" and confirms in the dialog
- THEN all event state is discarded and the creation form is shown again

#### Scenario: Cancelled reset

- GIVEN the "Nuevo evento" confirmation dialog is open
- WHEN the organizer cancels
- THEN the dialog closes and the event state is completely unchanged

### Requirement: Table template choice (RF-04, form)

The creation form MUST offer exactly four table templates: "6 mesas de 8",
"10 mesas de 10", "8 mesas de 6", and "Personalizado". Choosing "Personalizado" MUST
expose a numeric table count and a numeric capacity. The system MUST accept a table count
between 1 and 20 inclusive and a capacity between 2 and 20 inclusive, and MUST reject
values outside those bounds before the event is created.

#### Scenario: Preset template selected

- GIVEN the creation form with valid name and date
- WHEN the organizer selects "6 mesas de 8" and submits
- THEN the event is created and the `tables` capability materializes 6 tables of capacity 8

#### Scenario: Custom template within bounds

- GIVEN "Personalizado" is selected
- WHEN the organizer enters 12 tables of capacity 6 and submits
- THEN the event is created with 12 tables of capacity 6

#### Scenario: Custom template out of bounds

- GIVEN "Personalizado" is selected
- WHEN the organizer enters 0 or 31 tables, or a capacity of 1 or 21
- THEN the form MUST show a Spanish validation message and no event is created
