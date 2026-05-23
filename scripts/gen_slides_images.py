"""Generate all slide images via SAM gpt-image-2."""
import httpx
import json
import base64
import os
from pathlib import Path

API_KEY = "YOUR_SAM_API_KEY"
BASE_URL = "https://sam.soonsoon.ai"
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "website" / "slides" / "week2" / "img"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Common style suffix for all images
STYLE = (
    "Editorial dossier aesthetic, dark charcoal background #0b0b0d, "
    "warm off-white #f4f1e8 lines and text, electric lime #d4ff3a accent (use very sparingly), "
    "subtle paper grain texture, ultra-minimalist, generous negative space, "
    "academic research notebook feel, no logos, no faces, no people, "
    "thin precise lines, asymmetric composition, cinematic. "
    "Aspect ratio 16:9, 1792x1024."
)

IMAGES = {
    "cover-bg": (
        "Abstract geometric composition: a partially-mapped 9x10 grid matrix where "
        "some cells glow electric lime and others remain empty with dashed borders. "
        "Thin connecting lines like a technical schematic across the dark void. "
        "A few scattered tiny monospace annotations. Asymmetric placement, mostly empty space. "
        "Suggesting a research framework being discovered. NO TEXT, NO NUMBERS. "
        + STYLE
    ),
    "matrix-discovery": (
        "Top-down view of a research notebook page: hand-drawn sketch of a coordinate "
        "system with an X axis and Y axis emerging from messy notes. Some grid cells "
        "are filled in lime green, others empty. Faint annotations and arrows. "
        "Pencil/ink texture on dark charcoal paper. Sense of discovery and revelation. "
        "NO TEXT. " + STYLE
    ),
    "z-tower": (
        "Isometric architectural drawing of 5 stacked translucent rectangular layers "
        "forming a tower, viewed from a slight angle. Each layer slightly different size, "
        "the middle two layers glow subtly with lime accent. Thin technical-drawing lines. "
        "Background of faint grid. Suggests difficulty levels building up. NO TEXT. "
        + STYLE
    ),
    "global-map": (
        "Abstract minimalist world map showing 5 nodes connected by thin dashed lines, "
        "like a constellation. One node glows more brightly in lime than the others. "
        "Geographic landmasses suggested only by sparse outlines. "
        "Dark void background. NO TEXT, NO COUNTRY NAMES. " + STYLE
    ),
    "weakness-cracks": (
        "Abstract image: three vertical cracks/fissures running through a dark monolithic "
        "surface, illuminated subtly by red-orange light from within. Suggests structural "
        "weakness in something otherwise solid. Editorial photography aesthetic, very minimal. "
        "NO TEXT. Use color #ff4d3d for the crack glow instead of lime. " + STYLE
    ),
    "roadmap-path": (
        "Abstract minimalist horizontal path: 6 nodes connected left to right by a dashed line, "
        "the middle node glowing lime (current position), nodes to the left filled solid (done), "
        "nodes to the right empty outlines (future). Like a metro map or progression diagram. "
        "Dark void background. Very technical and clean. NO TEXT. " + STYLE
    ),
    "closing-horizon": (
        "Abstract editorial image: a thin lime horizon line across a dark vast space, "
        "with a few tiny scattered dots like distant stars or future milestones above the line. "
        "Below the line, a subtle suggestion of a notebook page edge. "
        "Cinematic, contemplative, sense of looking forward. NO TEXT. " + STYLE
    ),
}


def generate(name, prompt):
    print(f"→ Generating {name}...")
    try:
        r = httpx.post(
            f"{BASE_URL}/v1/generate",
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            json={
                "model": "gpt-image-2",
                "messages": [{"role": "user", "content": prompt}],
                "options": {"size": "1792x1024", "stream": False},
            },
            timeout=180.0,
        )
        r.raise_for_status()
        data = r.json()
        images = data.get("output", {}).get("images", [])
        if not images:
            print(f"  ? no images in response")
            print(f"    output keys: {list(data.get('output', {}).keys())}")
            return
        for img in images:
            if isinstance(img, dict):
                img_b64 = (
                    img.get("image_base64")
                    or img.get("b64_json")
                    or img.get("data")
                    or img.get("base64")
                )
                if img_b64:
                    if img_b64.startswith("data:"):
                        img_b64 = img_b64.split(",", 1)[1]
                    out_path = OUT_DIR / f"{name}.png"
                    out_path.write_bytes(base64.b64decode(img_b64))
                    size_kb = out_path.stat().st_size / 1024
                    print(f"  ✓ {name}.png saved ({size_kb:.0f}KB)")
                    return
            elif isinstance(img, str):
                # Direct base64 string
                if img.startswith("data:"):
                    img = img.split(",", 1)[1]
                out_path = OUT_DIR / f"{name}.png"
                out_path.write_bytes(base64.b64decode(img))
                size_kb = out_path.stat().st_size / 1024
                print(f"  ✓ {name}.png saved ({size_kb:.0f}KB)")
                return
        # Debug
        print(f"  ? could not extract image")
        print(f"    first image keys: {list(images[0].keys()) if isinstance(images[0], dict) else type(images[0])}")
    except Exception as e:
        print(f"  ✗ {name} failed: {e}")


if __name__ == "__main__":
    for name, prompt in IMAGES.items():
        generate(name, prompt)

    print("\nAll done. Files:")
    for f in sorted(OUT_DIR.glob("*.png")):
        print(f"  {f.name}: {f.stat().st_size/1024:.0f}KB")
