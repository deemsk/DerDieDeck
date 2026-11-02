# Resume incomplete note sets safely

## Why
A note set can be partially saved. The existing verb duplicate check stops on a saved form or lemma and cannot distinguish an incomplete operation from an intentional existing card. A failed AnkiConnect write may also have succeeded despite the missing response.

## What Changes
For sentence-form word cards, persist an approved creation plan and operation journal before the first note write. Give each planned note a stable operation-specific step tag, reconcile every uncertain step against the same Anki collection, and explicitly resume only missing steps. Preserve generated content, chosen examples and media references. Stop on ambiguous results or collection mismatch; never blindly repeat a write. Verb form and morphology package recovery remain separate follow-up work. Existing notes are not changed by introducing this feature.
