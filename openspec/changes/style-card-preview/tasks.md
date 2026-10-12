- [x] Update preview title, frame color and English labels.
- [x] Verify existing preview tests, wrapping, colors and plain output.
- [x] Validate OpenSpec and inspect rendered output.

Verification: 59 tests across preview, verb workflow and word summary suites
passed. Checked rendered output, narrow wrapping, green frame/cyan target,
plain output and strict OpenSpec change validation.

- [x] Route all interactive pre-save preview branches through a shared renderer.
- [x] Verify workflow coverage and full regression suite.

Expanded verification: 46 suites / 465 tests passed, including nine real
confirmation-route rendering checks. Inspected the Blumenstrauß rendering.
Strict OpenSpec validation passed. No Anki or audio API writes were used.
