# Delta for share

Covers producing the read-only guest link from the current event, copying it, and showing a
QR code for it. The payload format defined here is the contract the `guest-view` capability
reads.

## ADDED Requirements

### Requirement: Share link generation and copying (RF-28)

The system MUST provide a share action that builds a link to the `/invitado` route carrying
the whole shareable event state in the URL fragment, with no server or database involved.
The payload MUST contain only a version marker, the event name, date, optional place, and
one entry per table with its name and its seat array of guest **names** (or `null` for an
empty seat). Because the payload carries names taken from seats, unseated guests MUST NOT
appear in the link. The payload MUST be serialized to JSON and compressed, and the compressed
text MUST be written into the fragment raw: the system MUST NOT apply `encodeURIComponent`
to it and MUST NOT route it through a query string or `URLSearchParams`. The share dialog
MUST copy the full link to the clipboard with a single click and confirm that it was copied.

#### Scenario: Link generated and copied

- GIVEN an event named "Casamiento Ana y Juan" with tables and seated guests
- WHEN the organizer opens the share dialog and clicks the copy button
- THEN the clipboard holds a URL of the form `<origin>/invitado#<compressed-payload>`
- AND a Spanish confirmation that the link was copied is shown

#### Scenario: Fragment is written raw

- GIVEN a compressed payload containing the characters `+` and `$`
- WHEN the share link is built
- THEN those characters appear literally in the fragment, not percent-encoded
- AND opening the link in the guest view decodes the payload successfully

#### Scenario: Unseated guests are absent from the link

- GIVEN an event with 30 guests of which 12 are unseated
- WHEN the link is generated and opened
- THEN only the 18 seated names are present in the shared data

### Requirement: QR code with length guard (RF-29)

The share dialog MUST show a QR code of the generated link when the link is at most 1,200
characters long, rendered at error-correction level L. When the link exceeds 1,200
characters, the dialog MUST NOT attempt to render the QR code; it MUST instead show the
copy-link control together with a Spanish note explaining that the link is too long for a
QR code. Under no input may the dialog crash or fail to render.

#### Scenario: Short link shows a QR

- GIVEN an event of about 60 guests whose share URL is under 1,200 characters
- WHEN the organizer opens the share dialog
- THEN a scannable QR code of the link is displayed alongside the copy button

#### Scenario: Long link falls back to copy plus note

- GIVEN an event of about 200 guests whose share URL exceeds 1,200 characters
- WHEN the organizer opens the share dialog
- THEN no QR code is rendered, the copy-link button and a Spanish explanatory note are shown,
  and the dialog renders without error

#### Scenario: Copying still works in the fallback state

- GIVEN the dialog is in the long-link fallback state
- WHEN the organizer clicks the copy button
- THEN the full link is copied to the clipboard exactly as in the QR case
