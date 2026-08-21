# iOS Accessibility Identifiers

Open before adding SwiftUI controls that UI tests or smoke scripts will tap,
type into, or wait on.

Put identifiers on concrete controls:

- text fields users type into;
- submit buttons;
- microphone buttons;
- settings buttons;
- destructive account actions.

Avoid putting one identifier on a parent row that contains multiple child
buttons or fields. XCUITest can flatten descendants under the parent identity,
making the real control hard to target.

For displayed data rows, prefer an identifier or accessibility label on a leaf
`Text`, not the row container.

For fixture-driven tests, avoid generated IDs in selectors. Prefer stable
control identifiers and user-visible labels derived from fixture text.
