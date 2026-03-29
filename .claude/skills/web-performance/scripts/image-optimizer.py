#!/usr/bin/env python3
"""
Image Optimization Analyzer Script

Scans images for optimization opportunities including:
- Large images (>100KB)
- Non-optimal formats (should be WebP/AVIF)
- Missing width/height attributes in code
- Missing lazy loading

Usage:
    python image-optimizer.py <directory>
    python image-optimizer.py ./public
    python image-optimizer.py ./public/images

Requirements:
    - Python 3.8+
"""

import os
import sys
import re
from pathlib import Path
from typing import Any

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Image thresholds
THRESHOLDS = {
    'max_size_kb': 100,          # Max size for regular images
    'max_hero_size_kb': 200,     # Max size for hero/background images
    'max_icon_size_kb': 5,       # Max size for icons
}

# Image formats
LEGACY_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
MODERN_FORMATS = {'.webp', '.avif'}
VECTOR_FORMATS = {'.svg'}
ALL_IMAGE_FORMATS = LEGACY_FORMATS | MODERN_FORMATS | VECTOR_FORMATS

# Patterns for finding image usage in code
IMG_TAG_PATTERN = re.compile(r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)
NEXT_IMAGE_PATTERN = re.compile(r'<Image[^>]*src=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)
CSS_URL_PATTERN = re.compile(r'url\(["\']?([^"\')\s]+)["\']?\)', re.IGNORECASE)
LAZY_PATTERN = re.compile(r'loading=["\']lazy["\']', re.IGNORECASE)
DIMENSIONS_PATTERN = re.compile(r'(width|height)=["\']?\d+["\']?', re.IGNORECASE)


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    elif size_bytes >= 1024:
        return f"{size_bytes / 1024:.2f} KB"
    return f"{size_bytes} B"


def get_image_type(filepath: Path) -> str:
    """Categorize image by likely usage based on path/name."""
    name_lower = filepath.name.lower()
    path_lower = str(filepath).lower()

    if any(x in name_lower for x in ['icon', 'favicon', 'logo-small']):
        return 'icon'
    if any(x in path_lower for x in ['hero', 'background', 'banner', 'cover']):
        return 'hero'
    return 'regular'


def analyze_images(directory: Path) -> dict[str, Any]:
    """Analyze all images in directory."""
    results = {
        'images': [],
        'total_count': 0,
        'total_size': 0,
        'legacy_format_count': 0,
        'oversized_count': 0,
        'potential_savings': 0,
    }

    if not directory.exists():
        return results

    for filepath in directory.rglob('*'):
        if not filepath.is_file():
            continue

        ext = filepath.suffix.lower()
        if ext not in ALL_IMAGE_FORMATS:
            continue

        size = filepath.stat().st_size
        size_kb = size / 1024
        image_type = get_image_type(filepath)

        # Determine appropriate threshold
        if image_type == 'icon':
            threshold = THRESHOLDS['max_icon_size_kb']
        elif image_type == 'hero':
            threshold = THRESHOLDS['max_hero_size_kb']
        else:
            threshold = THRESHOLDS['max_size_kb']

        is_oversized = size_kb > threshold
        is_legacy = ext in LEGACY_FORMATS

        # Estimate potential savings
        potential_saving = 0
        if is_legacy and ext != '.gif':  # Can't easily convert animated GIFs
            # WebP typically saves 25-35% over JPEG, 25-50% over PNG
            if ext == '.png':
                potential_saving = size * 0.40  # 40% savings estimate
            else:
                potential_saving = size * 0.30  # 30% savings estimate

        image_info = {
            'path': str(filepath.relative_to(directory)),
            'full_path': str(filepath),
            'size': size,
            'size_kb': size_kb,
            'format': ext,
            'type': image_type,
            'threshold': threshold,
            'is_oversized': is_oversized,
            'is_legacy_format': is_legacy,
            'potential_saving': potential_saving,
            'issues': [],
        }

        if is_oversized:
            image_info['issues'].append(f"Exceeds {threshold}KB threshold ({size_kb:.1f}KB)")
            results['oversized_count'] += 1

        if is_legacy:
            image_info['issues'].append(f"Legacy format ({ext}) - consider WebP/AVIF")
            results['legacy_format_count'] += 1

        results['images'].append(image_info)
        results['total_count'] += 1
        results['total_size'] += size
        results['potential_savings'] += potential_saving

    # Sort by size (largest first)
    results['images'].sort(key=lambda x: x['size'], reverse=True)

    return results


def find_code_files(project_root: Path) -> list[Path]:
    """Find HTML, JSX, TSX, CSS files that might reference images."""
    code_files = []

    # Patterns to search
    patterns = ['**/*.html', '**/*.jsx', '**/*.tsx', '**/*.css', '**/*.scss', '**/*.js', '**/*.ts']

    # Directories to skip
    skip_dirs = {'node_modules', '.next', 'out', 'dist', 'build', '.git', '__pycache__'}

    for pattern in patterns:
        for filepath in project_root.rglob(pattern):
            # Skip excluded directories
            if any(skip_dir in filepath.parts for skip_dir in skip_dirs):
                continue
            code_files.append(filepath)

    return code_files


def analyze_image_usage(project_root: Path, images: list[dict]) -> dict[str, list[dict]]:
    """Analyze how images are used in code."""
    usage_issues = {}

    code_files = find_code_files(project_root)

    for code_file in code_files:
        try:
            content = code_file.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue

        # Find img tags
        img_matches = IMG_TAG_PATTERN.finditer(content)
        for match in img_matches:
            full_tag = match.group(0)
            src = match.group(1)

            issues = []

            # Check for lazy loading
            if 'loading=' not in full_tag.lower():
                issues.append("Missing lazy loading (add loading=\"lazy\")")

            # Check for dimensions
            has_width = 'width=' in full_tag.lower() or 'width:' in full_tag.lower()
            has_height = 'height=' in full_tag.lower() or 'height:' in full_tag.lower()
            if not has_width or not has_height:
                issues.append("Missing explicit dimensions (causes CLS)")

            if issues:
                key = f"{code_file.name}:{src}"
                usage_issues[key] = {
                    'file': str(code_file.relative_to(project_root)),
                    'src': src,
                    'tag_type': 'img',
                    'issues': issues,
                }

        # Find Next.js Image components (these handle optimization automatically)
        next_matches = NEXT_IMAGE_PATTERN.finditer(content)
        for match in next_matches:
            full_tag = match.group(0)
            src = match.group(1)

            # Next/Image requires width/height or fill
            if 'width=' not in full_tag.lower() and 'fill' not in full_tag.lower():
                key = f"{code_file.name}:{src}"
                usage_issues[key] = {
                    'file': str(code_file.relative_to(project_root)),
                    'src': src,
                    'tag_type': 'Next/Image',
                    'issues': ["Missing width/height or fill prop"],
                }

    return usage_issues


def print_report(results: dict[str, Any], usage_issues: dict, directory: Path) -> None:
    """Print formatted image optimization report."""
    print("=" * 70)
    print("IMAGE OPTIMIZATION REPORT")
    print("=" * 70)
    print(f"\nDirectory: {directory}")
    print("-" * 70)

    # Summary
    print("\n📊 SUMMARY")
    print("-" * 40)
    print(f"  Total images: {results['total_count']}")
    print(f"  Total size: {format_size(results['total_size'])}")
    print(f"  Legacy formats: {results['legacy_format_count']}")
    print(f"  Oversized: {results['oversized_count']}")

    if results['potential_savings'] > 0:
        print(f"\n  💰 Potential savings: ~{format_size(int(results['potential_savings']))}")
        print(f"     (by converting to WebP/AVIF)")

    # Oversized images
    oversized = [img for img in results['images'] if img['is_oversized']]
    if oversized:
        print("\n🔴 OVERSIZED IMAGES")
        print("-" * 40)

        for img in oversized[:10]:
            print(f"\n  • {img['path']}")
            print(f"    Size: {img['size_kb']:.1f} KB (threshold: {img['threshold']} KB)")
            print(f"    Type: {img['type']}, Format: {img['format']}")

            if img['potential_saving'] > 0:
                print(f"    Potential saving: ~{format_size(int(img['potential_saving']))}")

        if len(oversized) > 10:
            print(f"\n  ... and {len(oversized) - 10} more oversized images")

    # Legacy format images
    legacy = [img for img in results['images'] if img['is_legacy_format'] and not img['is_oversized']]
    if legacy:
        print("\n🟡 LEGACY FORMAT IMAGES (consider WebP/AVIF)")
        print("-" * 40)

        # Group by format
        by_format = {}
        for img in legacy:
            fmt = img['format']
            if fmt not in by_format:
                by_format[fmt] = []
            by_format[fmt].append(img)

        for fmt, images in sorted(by_format.items()):
            total_size = sum(img['size'] for img in images)
            potential = sum(img['potential_saving'] for img in images)
            print(f"\n  {fmt.upper()} files: {len(images)} ({format_size(total_size)})")
            print(f"  Potential savings: ~{format_size(int(potential))}")

            for img in images[:3]:
                print(f"    - {img['path']} ({img['size_kb']:.1f} KB)")

            if len(images) > 3:
                print(f"    ... and {len(images) - 3} more")

    # Usage issues
    if usage_issues:
        print("\n⚠️  CODE USAGE ISSUES")
        print("-" * 40)

        for key, issue in list(usage_issues.items())[:10]:
            print(f"\n  📄 {issue['file']}")
            print(f"     Image: {issue['src']}")
            for i in issue['issues']:
                print(f"     ❌ {i}")

        if len(usage_issues) > 10:
            print(f"\n  ... and {len(usage_issues) - 10} more issues")

    # Good images
    good_images = [img for img in results['images'] if not img['issues']]
    if good_images:
        print(f"\n✅ OPTIMIZED IMAGES: {len(good_images)}")

    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 40)

    recommendations = []

    if results['oversized_count'] > 0:
        recommendations.append("• Compress oversized images using tools like squoosh.app or imageoptim")

    if results['legacy_format_count'] > 0:
        recommendations.append("• Convert legacy formats (JPG, PNG) to WebP for 25-50% size reduction")
        recommendations.append("• Consider AVIF for even better compression (70%+ savings)")

    if any('lazy' in str(issue.get('issues', [])).lower() for issue in usage_issues.values()):
        recommendations.append("• Add loading=\"lazy\" to images below the fold")

    if any('dimension' in str(issue.get('issues', [])).lower() for issue in usage_issues.values()):
        recommendations.append("• Add explicit width/height to prevent Cumulative Layout Shift (CLS)")

    if not recommendations:
        recommendations.append("• Great job! All images appear to be optimized.")

    recommendations.append("\n• Use Next.js <Image> component for automatic optimization")
    recommendations.append("• Consider using a CDN with image optimization (Cloudflare, imgix)")

    for rec in recommendations:
        print(f"  {rec}")

    # Code examples
    print("\n📝 CODE EXAMPLES")
    print("-" * 40)

    print("\n  Proper img tag:")
    print('    <img')
    print('      src="/image.webp"')
    print('      alt="Description"')
    print('      width="800"')
    print('      height="600"')
    print('      loading="lazy"')
    print('    />')

    print("\n  Next.js Image component:")
    print('    import Image from "next/image";')
    print('    <Image')
    print('      src="/image.webp"')
    print('      alt="Description"')
    print('      width={800}')
    print('      height={600}')
    print('      placeholder="blur"')
    print('    />')

    print("\n" + "=" * 70)


def main():
    if len(sys.argv) < 2:
        print("Usage: python image-optimizer.py <directory>")
        print("Example: python image-optimizer.py ./public")
        sys.exit(1)

    directory = Path(sys.argv[1])

    if not directory.exists():
        print(f"Error: Directory not found: {directory}")
        sys.exit(1)

    # Find project root (for code analysis)
    project_root = directory
    while project_root.parent != project_root:
        if (project_root / 'package.json').exists():
            break
        project_root = project_root.parent
    else:
        project_root = Path.cwd()

    # Analyze images
    results = analyze_images(directory)

    if results['total_count'] == 0:
        print(f"No images found in {directory}")
        sys.exit(0)

    # Analyze code usage
    usage_issues = analyze_image_usage(project_root, results['images'])

    # Print report
    print_report(results, usage_issues, directory)

    # Exit with non-zero if significant issues
    if results['oversized_count'] > 5 or results['potential_savings'] > 500 * 1024:
        sys.exit(1)


if __name__ == '__main__':
    main()
