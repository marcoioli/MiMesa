# Delta for persistence

Covers automatic browser-local storage of the whole event. This capability is written as a
single round-trip requirement over the entire `Event` model, not per entity.

## ADDED Requirements

### Requirement: Automatic whole-event round trip (RF-27)

The system MUST persist the entire active event — name, date, place, every table with its
name, capacity, position and seat array, and every guest with id and name — to browser
local storage automatically after any change, with no explicit save action. On page load
the system MUST restore that event so the editor shows exactly the state it had before,
and MUST show the creation form when nothing is stored. Only event data may be persisted;
transient interface state such as the search text, the selected table, or open dialogs MUST
NOT be stored. A stored payload whose version does not match the current one MUST be
discarded in favour of an empty state rather than loaded partially or allowed to crash the
application.

#### Scenario: Reload preserves the full event

- GIVEN an event with 8 tables, one renamed and one moved, 40 guests and 25 of them seated
- WHEN the organizer reloads the page
- THEN the editor shows the same event name, date and place, the same table names,
  capacities and positions, the same guests, and the same seat assignments

#### Scenario: First visit with nothing stored

- GIVEN a browser with no stored MiMesa event
- WHEN the organizer opens the editor
- THEN the creation form is shown and no error is displayed

#### Scenario: Reset clears the stored event

- GIVEN a stored event
- WHEN the organizer confirms "Nuevo evento" and then reloads the page
- THEN the creation form is shown, not the discarded event

#### Scenario: Stored payload from an incompatible version

- GIVEN local storage holds a MiMesa payload written under a different store version
- WHEN the organizer opens the editor
- THEN the stored payload is discarded, the creation form is shown, and the application does not crash
