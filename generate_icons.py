#!/usr/bin/env python3
"""Generate icons for V-Streaming Tauri application."""

from PIL import Image, ImageDraw

def create_icon_image(size):
    """Create a simple V-Streaming icon at the specified size."""
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a gradient-like background circle (representing streaming/video)
    center = size // 2
    radius = int(size * 0.45)
    
    # Draw outer circle (blue/purple gradient effect)
    for i in range(radius, 0, -1):
        ratio = i / radius
        r = int(102 + (138 - 102) * (1 - ratio))  # Purple-ish
        g = int(126 + (43 - 126) * (1 - ratio))   # Gradient
        b = int(234 + (226 - 234) * (1 - ratio))  # Blue-ish
        draw.ellipse([center - i, center - i, center + i, center + i], 
                     fill=(r, g, b, 255))
    
    # Draw a "V" shape in the center (white)
    v_width = int(size * 0.15)
    v_height = int(size * 0.35)
    v_top_y = int(size * 0.3)
    v_bottom_y = int(size * 0.7)
    
    # V shape points
    points = [
        (center - v_width, v_top_y),      # Top left
        (center, v_bottom_y),              # Bottom center
        (center + v_width, v_top_y),       # Top right
        (center + v_width - v_width//3, v_top_y),  # Inner top right
        (center, v_bottom_y - v_height//4),  # Inner bottom
        (center - v_width + v_width//3, v_top_y),  # Inner top left
    ]
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    return img

def main():
    import os
    
    # Create icons directory if it doesn't exist
    icons_dir = os.path.join(os.path.dirname(__file__), 'src-tauri', 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate PNG icons for various sizes
    png_sizes = [32, 128, 256, 512]
    for size in png_sizes:
        img = create_icon_image(size)
        img.save(os.path.join(icons_dir, f'{size}x{size}.png'))
        print(f'Created {size}x{size}.png')
    
    # Create a 1024x1024 icon for high-res displays
    img_1024 = create_icon_image(1024)
    img_1024.save(os.path.join(icons_dir, 'icon.png'))
    print('Created icon.png (1024x1024)')
    
    # Create ICO file for Windows (multi-resolution)
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = [create_icon_image(size) for size in ico_sizes]
    ico_images[0].save(
        os.path.join(icons_dir, 'icon.ico'),
        format='ICO',
        sizes=[(img.width, img.height) for img in ico_images],
        append_images=ico_images[1:]
    )
    print('Created icon.ico (multi-resolution)')
    
    # Create ICNS placeholder (we'll use png2icns concept - but for now just copy the 1024px)
    # Note: ICNS creation requires specific tools on macOS, so we'll create a placeholder
    # The 1024x1024 PNG can be converted on macOS with: iconutil -c icns icons.iconset
    img_1024.save(os.path.join(icons_dir, 'icon.icns'), format='ICNS')
    print('Created icon.icns')
    
    print('\nAll icons generated successfully!')

if __name__ == '__main__':
    main()