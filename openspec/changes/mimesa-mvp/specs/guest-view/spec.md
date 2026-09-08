# Delta for guest-view

Covers the read-only `/invitado` screen a guest opens from the shared link: its data source,
the event header, name search, the result with the table drawing, the not-found state, and
mobile usability.

## ADDED Requirements

### Requirement: Guest view header from the fragment only (RF-30)

The `/invitado` route MUST read its entire data set from the URL fragment and from nothing
else. It MUST NOT read browser local storage and MUST NOT read the editor store, because
those hold the visitor's own data rather than the shared event. The fragment MUST be read
raw, without `decodeURIComponent`, and decompressed to the shared payload. The screen MUST
show the event name, the date, the place when present, and a "Buscá tu nombre" search field.
A missing, empty, malformed, or unknown-version fragment MUST produce a Spanish error message
and MUST NOT crash the application.

#### Scenario: Header rendered from a valid link

- GIVEN a valid share link for "Casamiento Ana y Juan" on 2026-11-20 at "Salón Sur"
- WHEN a guest opens it
- THEN the screen shows that name, date and place and the "Buscá tu nombre" field
- AND no data from the visitor's own browser storage influences what is shown

#### Scenario: Missing or invalid fragment

- GIVEN `/invitado` opened with no fragment, with truncated text, or with an unknown payload version
- WHEN the screen loads
- THEN a Spanish error message explaining that the link is invalid is shown
- AND the application does not crash and shows no partial event data

### Requirement: Name search in the guest view (RF-31)

The search MUST match partially and MUST ignore letter case and diacritics. Every seated
occurrence matching the text MUST be offered as a distinct result identified by guest name,
table name, and seat index, so repeated names remain distinguishable. When exactly one
occurrence matches, the system MAY show its result directly.

#### Scenario: Partial accent-insensitive match

- GIVEN the shared event seats "José Pérez"
- WHEN a guest types "jose"
- THEN "José Pérez" is offered as a match

#### Scenario: Repeated names are listed as distinct seats

- GIVEN two guests named "Ana" seated at "Mesa 1" seat 0 and "Mesa 4" seat 3
- WHEN a guest searches "ana"
- THEN both occurrences are listed, each showing its table name
- AND choosing one selects that exact seat

### Requirement: Result with the table drawing (RF-32)

After a match is chosen the system MUST show the caption "Estás en la mesa" followed by the table name as a headline on its own line (so a renamed table such as "Amigas" reads correctly), using the table name from
the payload, MUST draw that table with every seated person on it, and MUST highlight the seat
of the chosen match. Empty seats MUST be drawn as empty.

#### Scenario: Table shown with the seat highlighted

- GIVEN a guest chose the occurrence "Ana" at "Mesa 4", seat 3
- WHEN the result is shown
- THEN the screen shows the caption "Estás en la mesa" with the headline "Mesa 4", the circle of "Mesa 4" with all its seated
  names, and seat 3 visually highlighted

#### Scenario: The other duplicate is not highlighted

- GIVEN two guests named "Ana" seated at different tables
- WHEN the guest chooses the "Mesa 1" occurrence
- THEN only seat 0 of "Mesa 1" is highlighted and the "Mesa 4" occurrence is not shown

### Requirement: Not-found state (RF-33)

When the search text matches no seated name, the system MUST show exactly the message
"No encontramos tu nombre. Consultá al organizador." and MUST NOT show a table drawing.

#### Scenario: No match

- GIVEN a shared event that does not seat anyone named "Carlos"
- WHEN a guest searches "carlos"
- THEN the screen shows "No encontramos tu nombre. Consultá al organizador."

#### Scenario: Guest was loaded but never seated

- GIVEN the organizer created a guest and never seated that guest
- WHEN that guest searches their own name in the shared link
- THEN the not-found message is shown, because the link carries seated names only

### Requirement: Mobile guest view (RF-34)

The guest view MUST be usable on a phone: the header, the search field, the match list, and
the table drawing MUST fit a viewport of about 360 pixels wide without horizontal scrolling,
and tap targets MUST be large enough to select a match reliably.

#### Scenario: Phone-sized viewport

- GIVEN the guest view opened on a 360x640 pixel viewport
- WHEN a guest searches a name and selects a match
- THEN the header, search field, message, and table drawing are fully readable with no
  horizontal scrolling and the match is selectable by tap
