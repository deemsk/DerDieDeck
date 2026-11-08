# Unified bilingual examples

Goal: One lifecycle owns preparation, pair validation and preview/save handoff for lexical examples; grammar-specific checks remain injected policies.

1. Add a shared example coordinator with structural validation, policy injection, bounded feedback-aware repair and strict pairing. Test unchanged, changed, missing and rejected examples.
2. Adapt picture nouns and adjectives to the coordinator, retaining short adjective phrases and showing the exact verified German/Russian pair in the card preview and note. Keep selected sense and noun protections.
3. Adapt sentence, cloze and verb workflows to validate final bilingual pairs through the same coordinator while keeping their dedicated morphology, target and uniqueness policies; ensure changes invalidate old translations and user choices are not silently replaced.
4. Add regressions for selected sense, edited text, prompt candidates, saved fields, failure and exact form; check recovery behavior.
5. Verify the specific existing note only with explicit authorization, backup and unchanged scheduling. Validate OpenSpec and run focused and full tests; request code review.
