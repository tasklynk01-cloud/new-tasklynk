import os
import base64
from io import BytesIO
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(REPO_ROOT, "public")
src_app_dir = os.path.join(REPO_ROOT, "src", "app")

# Master source: public/tl-logo-512.png
master_source_path = os.path.join(public_dir, "tl-logo-512.png")
img = Image.open(master_source_path).convert("RGBA")

# Crop tightly to non-transparent pixels
bbox = img.getbbox()
cropped = img.crop(bbox)
cw, ch = cropped.size

def make_square_icon(size, padding_ratio=0.03):
    usable_h = int(size * (1 - 2 * padding_ratio))
    scale = usable_h / float(ch)
    usable_w = int(round(cw * scale))
    resized = cropped.resize((usable_w, usable_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - usable_w) // 2
    y = (size - usable_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

# 1. Generate PNG sizes in public/
png_targets = {
    os.path.join(public_dir, "favicon-16x16.png"): 16,
    os.path.join(public_dir, "favicon-32x32.png"): 32,
    os.path.join(public_dir, "favicon.png"): 256,
    os.path.join(public_dir, "apple-touch-icon.png"): 180,
    os.path.join(public_dir, "tl-logo-192.png"): 192,
    os.path.join(public_dir, "tl-logo-512.png"): 512,
    os.path.join(public_dir, "tasklynk-logo.png"): 512,
    os.path.join(public_dir, "logo.png"): 512,
}

for path, size in png_targets.items():
    sq = make_square_icon(size)
    sq.save(path, format="PNG")
    print(f"Wrote {os.path.relpath(path, REPO_ROOT)} ({size}x{size})")

# 2. Generate ICO files with multiple embedded sizes
ico_512 = make_square_icon(512)
for ico_path in [
    os.path.join(public_dir, "favicon.ico"),
    os.path.join(src_app_dir, "favicon.ico")
]:
    ico_512.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print(f"Wrote {os.path.relpath(ico_path, REPO_ROOT)} (ICO multi-res 16, 32, 48, 64)")

# 3. Generate SVG files
buffer = BytesIO()
ico_512.save(buffer, format="PNG")
b64_png = base64.b64encode(buffer.getvalue()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,{b64_png}"/>
</svg>
'''

for svg_path in [
    os.path.join(public_dir, "tl-logo.svg"),
    os.path.join(public_dir, "icon.svg"),
    os.path.join(src_app_dir, "icon.svg")
]:
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Wrote {os.path.relpath(svg_path, REPO_ROOT)}")

# 4. Generate src/app/icon.tsx
icon_32 = make_square_icon(32)
buf_32 = BytesIO()
icon_32.save(buf_32, format="PNG")
b64_32 = base64.b64encode(buf_32.getvalue()).decode("utf-8")

icon_tsx_template = """import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

const LOGO_DATA_URI = '__LOGO_DATA_URI__';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={LOGO_DATA_URI}
          width="64"
          height="64"
          style={{ objectFit: 'contain' }}
          alt="TaskLynk"
        />
      </div>
    ),
    size
  );
}
"""

with open(os.path.join(src_app_dir, "icon.tsx"), "w", encoding="utf-8") as f:
    f.write(icon_tsx_template.replace("__LOGO_DATA_URI__", f"data:image/png;base64,{b64_32}"))

print(f"Wrote {os.path.relpath(os.path.join(src_app_dir, 'icon.tsx'), REPO_ROOT)}")
print("All brand icons and favicons generated successfully!")
