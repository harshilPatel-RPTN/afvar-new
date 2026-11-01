"""Build and verify the two uncropped display sizes from the preserved PNG.

Requires Pillow with WebP support. Run with --write to rebuild the assets and
metadata. A normal run only checks the checked-in files.
"""

from argparse import ArgumentParser
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "reference/approved.png"
MASTER_HASH = "f7896052ef18caad5ac7ede59c10e81bd7428a301967703e061e0c1d718b4eec"
REPORT = ROOT / "tools/source-fidelity.json"


def digest(data):
    return sha256(data).hexdigest()


def resized_rgba(master, size):
    return master.resize((size, size), Image.Resampling.LANCZOS)


def encode(reference, lite):
    image = reference
    if lite:
        # Chroma subsampling smears the blue ridges. Quantize RGB on this low
        # bandwidth tier, preserving the entire original alpha channel.
        image = reference.convert("RGB").quantize(
            colors=256, method=Image.Quantize.MEDIANCUT, kmeans=1
        ).convert("RGB")
        image.putalpha(reference.getchannel("A"))
    stream = BytesIO()
    image.save(stream, "WEBP", lossless=True, exact=True, method=4 if lite else 6)
    return stream.getvalue()


def inspect(encoded_path, reference, lite):
    encoded = encoded_path.read_bytes()
    with Image.open(BytesIO(encoded)) as image:
        rendered = image.convert("RGBA")
    if rendered.size != reference.size:
        raise ValueError("Canvas changed")
    alpha = reference.getchannel("A")
    alpha_difference = ImageChops.difference(rendered.getchannel("A"), alpha)
    if alpha_difference.getbbox() is not None:
        raise ValueError("Alpha differs from the resized source")

    base = Image.new("RGBA", reference.size, (6, 8, 12, 255))
    source_composite = Image.alpha_composite(base, reference).convert("RGB")
    output_composite = Image.alpha_composite(base, rendered).convert("RGB")
    error = ImageChops.difference(source_composite, output_composite)
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    stats = ImageStat.Stat(error, mask=visible)
    rgb_rmse = (sum(x * x for x in stats.rms) / 3) ** 0.5
    if (not lite and rgb_rmse != 0) or (lite and rgb_rmse > 7):
        raise ValueError("Visible RGB changed beyond the display tier's tolerance")
    if not lite and rendered.tobytes() != reference.tobytes():
        raise ValueError("Lossless standard output does not match resampled RGBA")
    return {
        "path": encoded_path.relative_to(ROOT).as_posix(),
        "canvas": list(reference.size),
        "bytes": len(encoded),
        "sha256": digest(encoded),
        "reference_alpha_sha256": digest(alpha.tobytes()),
        "alpha_max_absolute_error": alpha_difference.getextrema()[1],
        "visible_rgb_composite_rmse_0_to_255": round(rgb_rmse, 3),
        "display_encoding": "256 RGB colors, original alpha; lossless WebP" if lite
        else "full resampled RGBA; lossless WebP",
    }


def main(write):
    master_bytes = MASTER.read_bytes()
    if digest(master_bytes) != MASTER_HASH:
        raise ValueError("Master does not match the approved upload")
    with Image.open(BytesIO(master_bytes)) as image:
        assert image.size == (1254, 1254) and image.mode == "RGBA"
        master = image.copy()
    report = {
        "master": {"path": "reference/approved.png", "canvas": list(master.size),
                   "bytes": len(master_bytes), "sha256": MASTER_HASH},
        "resampling": "full canvas with Lanczos; no crop, translation, recolor or trace",
        "assets": [],
    }
    for name, size, lite in [("approved.webp", 640, False), ("approved-lite.webp", 320, True)]:
        reference = resized_rgba(master, size)
        path = ROOT / "assets" / name
        if write:
            path.write_bytes(encode(reference, lite))
        report["assets"].append(inspect(path, reference, lite))
    if write:
        REPORT.write_text(json.dumps(report, indent=2) + "\n")
    elif report != json.loads(REPORT.read_text()):
        raise ValueError("Checked-in assets differ from the recorded build")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    main(parser.parse_args().write)
