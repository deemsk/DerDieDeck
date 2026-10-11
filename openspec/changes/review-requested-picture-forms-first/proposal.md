# Review requested picture-verb forms first

## Why
A requested form only bypassed the placeholder picture dialog when a picture
lemma note was found. `sah` therefore showed a content-free continuation prompt
and implicitly prepared `sehen`. Basic lemma and verb sentence notes were missed.

## What Changes
Always present the complete requested-form review first in the picture route.
Check existing picture, Basic lemma, and verb sentence notes. Only after accepting
the form, offer a separate complete infinitive preview when no existing note was
found. This optional preview defaults to Skip, does not autoplay infinitive audio,
and cannot toggle the already reviewed form. Skipping it still saves the form.
Skipping the form stops the item. Remove both picture and sentence placeholder
renderers and guard their entry points against future misuse. Uncertain lookup must not implicitly create an
infinitive. Preserve independent writes, duplicate protection, and dry-run rules.

The user approved this bounded repair in chat. Existing notes are not migrated.
