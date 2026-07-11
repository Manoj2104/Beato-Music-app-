import os
from PIL import Image, ImageFilter, ImageDraw

def process_logo():
    # Source image: 1024x1024 high resolution logo
    input_path = r"C:\Users\manoj\.gemini\antigravity\brain\e0930092-4f2b-40c7-892e-207a8cebcad7\media__1783755878921.jpg"
    if not os.path.exists(input_path):
        print(f"Error: input file {input_path} does not exist!")
        return

    # Load original image (1024x1024)
    img = Image.open(input_path).convert("RGBA")

    # Center crop to get a perfect square of the logo contents
    # The logo is centered. Let's crop it tightly to 920x920 to remove unnecessary margins.
    w, h = img.size
    crop_size = 920
    left = (w - crop_size) // 2
    top = (h - crop_size) // 2
    right = left + crop_size
    bottom = top + crop_size
    cropped = img.crop((left, top, right, bottom)) # 920x920 perfect square

    # Apply unsharp mask to make it look extremely sharp (4K quality like)
    # This removes any JPEG compression artifacts or blurriness.
    sharpened = cropped.filter(ImageFilter.UnsharpMask(radius=3, percent=175, threshold=2))

    # Save base logo for Web
    web_logo_path = r"c:\Users\manoj\.gemini\antigravity\scratch\soundsphere\public\logo.png"
    # Resize to 512x512 with high quality sampling for web logo
    web_logo = sharpened.resize((512, 512), Image.Resampling.LANCZOS)
    web_logo.save(web_logo_path, "PNG", quality=100)
    print(f"Saved web logo to {web_logo_path}")

    # Generate Android launcher icons:
    res_base = r"c:\Users\manoj\.gemini\antigravity\scratch\soundsphere\android\app\src\main\res"
    densities = {
        "mipmap-xxxhdpi": (192, 192),
        "mipmap-xxhdpi": (144, 144),
        "mipmap-xhdpi": (96, 96),
        "mipmap-hdpi": (72, 72),
        "mipmap-mdpi": (48, 48)
    }

    for folder, size in densities.items():
        folder_path = os.path.join(res_base, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. Standard Launcher Icon (ic_launcher.png)
        # Paste squircle logo in center of pure white canvas
        square_canvas = Image.new("RGBA", (920, 920), (255, 255, 255, 255))
        # Keep logo size at ~80% of canvas to look well-proportioned
        sq_logo_size = int(920 * 0.80)
        sq_logo = sharpened.resize((sq_logo_size, sq_logo_size), Image.Resampling.LANCZOS)
        sq_offset = (920 - sq_logo_size) // 2
        square_canvas.paste(sq_logo, (sq_offset, sq_offset), sq_logo)
        
        icon_path = os.path.join(folder_path, "ic_launcher.png")
        square_canvas.resize(size, Image.Resampling.LANCZOS).save(icon_path, "PNG")
        
        # 2. Round Launcher Icon (ic_launcher_round.png)
        # Draw a white circle, then paste squircle logo inside
        round_canvas = Image.new("RGBA", (920, 920), (0, 0, 0, 0))
        draw = ImageDraw.Draw(round_canvas)
        draw.ellipse([4, 4, 916, 916], fill=(255, 255, 255, 255))
        
        # Keep logo size at ~72% to fit perfectly within the circular white card
        rd_logo_size = int(920 * 0.72)
        rd_logo = sharpened.resize((rd_logo_size, rd_logo_size), Image.Resampling.LANCZOS)
        rd_offset = (920 - rd_logo_size) // 2
        round_canvas.paste(rd_logo, (rd_offset, rd_offset), rd_logo)
        
        round_icon_path = os.path.join(folder_path, "ic_launcher_round.png")
        round_canvas.resize(size, Image.Resampling.LANCZOS).save(round_icon_path, "PNG")
        
        # 3. Adaptive Foreground Icon (ic_launcher_foreground.png)
        # Transparent canvas with scaled-down logo in the center (72% size)
        fg_canvas = Image.new("RGBA", (920, 920), (0, 0, 0, 0))
        fg_logo_size = int(920 * 0.72)
        fg_logo = sharpened.resize((fg_logo_size, fg_logo_size), Image.Resampling.LANCZOS)
        fg_offset = (920 - fg_logo_size) // 2
        fg_canvas.paste(fg_logo, (fg_offset, fg_offset), fg_logo)
        
        fg_icon_path = os.path.join(folder_path, "ic_launcher_foreground.png")
        fg_canvas.resize(size, Image.Resampling.LANCZOS).save(fg_icon_path, "PNG")
        
        print(f"Generated sharp, custom-background icons in {folder} at size {size}")

if __name__ == "__main__":
    process_logo()
