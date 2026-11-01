# AFVAR final logo

The standalone front-facing AFVAR mark is the approved design. Its head, horns, outer A and lower ribbons stay fixed during loading. Only the eyes, brows and nostril highlights respond to the pointer. A blink closes the original upper ribbons over the eyes. Moving the pointer out of the page returns the face to its neutral design.

## Open the preview

Serve this directory locally and open [the final loader](http://127.0.0.1:8771/).

```sh
python3 -m http.server 8771 --bind 127.0.0.1
```

**Replay** resets the expression. **Pause** freezes the expression and loading dots. **Preview exit** settles the face, moves the mark into the upper-left corner and opens the local content slot from the AFVAR wordmark.

## Use the loader

Mount your page in `#content-slot`. Once it is usable, call `window.afvarLoader.ready()` or dispatch `afvar:ready` on the window. Listen for `afvar:opened` when the exit finishes. The standalone review opens a local placeholder in that slot.

The runtime chooses between two transparent copies of the same approved artwork. Reduced motion displays the still logo. The image reference in `reference/approved.png` is the original master, and `tools/source-fidelity.json` records the relationship between the master and the browser assets.

## Check the final design

```sh
node --test tests/*.test.mjs
```
