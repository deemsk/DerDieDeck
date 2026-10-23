- [x] Classify synonym ambiguity independently and test correct/incorrect cases.
- [x] Offer fallback/edit/skip and reuse sentence preparation.
- [x] Test workflow outcomes and validate OpenSpec.

Verification: 49 suites / 500 tests passed. Covered sentence fallback without
main/cloze notes or reanalysis, edit revalidation, skip without writes/audio,
and negative synonym classification. Strict OpenSpec validation passed.
No live model calls or Anki writes were performed; semantic classification
depends on the validation model.
