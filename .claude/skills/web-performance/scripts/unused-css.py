#!/usr/bin/env python3
"""
Unused CSS Analyzer Script

Scans for potentially unused CSS rules by comparing selectors
against HTML/JSX/TSX content.

Usage:
    python unused-css.py
    python unused-css.py --dir ./src
    python unused-css.py --verbose

Requirements:
    - Python 3.8+

Note: This is a heuristic analysis. Some dynamically-applied classes
may be flagged incorrectly. Always verify before removing.
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import Any
from collections import defaultdict

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Regex patterns
CSS_RULE_PATTERN = re.compile(r'([.#]?[\w\-_]+(?:\[[^\]]+\])?(?::[:\w\-()]+)?)\s*\{', re.MULTILINE)
CLASS_IN_HTML_PATTERN = re.compile(r'class(?:Name)?=["\']([^"\']+)["\']', re.IGNORECASE)
CLASS_IN_CN_PATTERN = re.compile(r'cn\([^)]*["\']([^"\']+)["\']', re.MULTILINE)
TAILWIND_CLASS_PATTERN = re.compile(r'[\w\-:/@]+')
ID_IN_HTML_PATTERN = re.compile(r'id=["\']([^"\']+)["\']', re.IGNORECASE)

# Directories to skip
SKIP_DIRS = {'node_modules', '.next', 'out', 'dist', 'build', '.git', '__pycache__', 'coverage'}

# Known framework classes that shouldn't be flagged
FRAMEWORK_PREFIXES = {
    'radix-', 'data-', 'peer-', 'group-', 'state-',  # Radix UI
    'dark:', 'light:', 'md:', 'lg:', 'xl:', 'sm:', 'xs:',  # Tailwind variants
    'hover:', 'focus:', 'active:', 'disabled:',  # Tailwind states
    'prose', 'not-prose',  # Typography
    'animate-', 'transition-',  # Animations
}


def should_skip_selector(selector: str) -> bool:
    """Check if selector should be skipped (framework, variant, etc)."""
    selector_lower = selector.lower()

    # Skip pseudo-elements and complex selectors
    if '::' in selector or '>' in selector or '+' in selector or '~' in selector:
        return True

    # Skip attribute selectors
    if '[' in selector and ']' in selector:
        return True

    # Skip framework prefixes
    for prefix in FRAMEWORK_PREFIXES:
        if selector_lower.startswith(f'.{prefix}') or prefix in selector_lower:
            return True

    # Skip common reset/normalize classes
    skip_classes = {'html', 'body', '*', 'root', 'app'}
    clean_selector = selector.lstrip('.#')
    if clean_selector in skip_classes:
        return True

    return False


def extract_css_selectors(css_content: str, filepath: str) -> list[dict]:
    """Extract CSS selectors from content."""
    selectors = []

    # Remove comments
    css_content = re.sub(r'/\*[\s\S]*?\*/', '', css_content)

    # Find all selectors
    for match in CSS_RULE_PATTERN.finditer(css_content):
        selector = match.group(1).strip()

        # Split compound selectors
        parts = re.split(r'\s+', selector)
        for part in parts:
            part = part.strip()
            if not part or should_skip_selector(part):
                continue

            # Get line number
            line_num = css_content[:match.start()].count('\n') + 1

            selectors.append({
                'selector': part,
                'file': filepath,
                'line': line_num,
                'is_class': part.startswith('.'),
                'is_id': part.startswith('#'),
            })

    return selectors


def extract_used_classes(content: str) -> set[str]:
    """Extract all class names used in HTML/JSX/TSX content."""
    classes = set()

    # Find className/class attributes
    for match in CLASS_IN_HTML_PATTERN.finditer(content):
        class_string = match.group(1)
        # Split by whitespace and extract individual classes
        for cls in TAILWIND_CLASS_PATTERN.findall(class_string):
            classes.add(cls)

    # Find cn() utility calls
    for match in CLASS_IN_CN_PATTERN.finditer(content):
        class_string = match.group(1)
        for cls in TAILWIND_CLASS_PATTERN.findall(class_string):
            classes.add(cls)

    return classes


def extract_used_ids(content: str) -> set[str]:
    """Extract all IDs used in HTML/JSX/TSX content."""
    ids = set()

    for match in ID_IN_HTML_PATTERN.finditer(content):
        ids.add(match.group(1))

    return ids


def find_css_files(directory: Path) -> list[Path]:
    """Find all CSS files in directory."""
    css_files = []

    for filepath in directory.rglob('*.css'):
        if any(skip_dir in filepath.parts for skip_dir in SKIP_DIRS):
            continue
        css_files.append(filepath)

    # Also check for SCSS
    for filepath in directory.rglob('*.scss'):
        if any(skip_dir in filepath.parts for skip_dir in SKIP_DIRS):
            continue
        css_files.append(filepath)

    return css_files


def find_content_files(directory: Path) -> list[Path]:
    """Find all HTML/JSX/TSX files that might use CSS."""
    content_files = []
    patterns = ['*.html', '*.jsx', '*.tsx', '*.js', '*.ts']

    for pattern in patterns:
        for filepath in directory.rglob(pattern):
            if any(skip_dir in filepath.parts for skip_dir in SKIP_DIRS):
                continue
            content_files.append(filepath)

    return content_files


def analyze_css_usage(directory: Path) -> dict[str, Any]:
    """Analyze CSS usage across the project."""
    results = {
        'css_files': [],
        'total_selectors': 0,
        'potentially_unused': [],
        'used_classes': set(),
        'used_ids': set(),
        'duplicate_rules': [],
        'large_files': [],
    }

    # Find and analyze CSS files
    css_files = find_css_files(directory)
    all_selectors = []
    selector_locations = defaultdict(list)  # Track duplicates

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            relative_path = str(css_file.relative_to(directory))

            # Check file size
            size_kb = len(content.encode('utf-8')) / 1024
            if size_kb > 50:
                results['large_files'].append({
                    'file': relative_path,
                    'size_kb': size_kb,
                })

            selectors = extract_css_selectors(content, relative_path)
            all_selectors.extend(selectors)
            results['total_selectors'] += len(selectors)

            # Track for duplicates
            for sel in selectors:
                selector_locations[sel['selector']].append({
                    'file': sel['file'],
                    'line': sel['line'],
                })

            results['css_files'].append({
                'file': relative_path,
                'selectors': len(selectors),
                'size_kb': size_kb,
            })

        except Exception as e:
            print(f"Warning: Could not read {css_file}: {e}")

    # Find duplicates
    for selector, locations in selector_locations.items():
        if len(locations) > 1:
            results['duplicate_rules'].append({
                'selector': selector,
                'locations': locations,
            })

    # Find and analyze content files
    content_files = find_content_files(directory)

    for content_file in content_files:
        try:
            content = content_file.read_text(encoding='utf-8', errors='ignore')
            results['used_classes'].update(extract_used_classes(content))
            results['used_ids'].update(extract_used_ids(content))
        except Exception:
            pass

    # Find potentially unused selectors
    for selector_info in all_selectors:
        selector = selector_info['selector']

        if selector_info['is_class']:
            class_name = selector.lstrip('.')
            # Remove pseudo-class suffix for comparison
            class_name = class_name.split(':')[0]

            if class_name not in results['used_classes']:
                # Double-check it's not a Tailwind variant
                if not any(class_name.startswith(p.rstrip(':.-')) for p in FRAMEWORK_PREFIXES):
                    results['potentially_unused'].append(selector_info)

        elif selector_info['is_id']:
            id_name = selector.lstrip('#')
            if id_name not in results['used_ids']:
                results['potentially_unused'].append(selector_info)

    return results


def print_report(results: dict[str, Any], directory: Path, verbose: bool = False) -> None:
    """Print formatted CSS analysis report."""
    print("=" * 70)
    print("UNUSED CSS ANALYSIS REPORT")
    print("=" * 70)
    print(f"\nDirectory: {directory}")
    print("-" * 70)

    # Summary
    print("\n📊 SUMMARY")
    print("-" * 40)
    print(f"  CSS files analyzed: {len(results['css_files'])}")
    print(f"  Total selectors: {results['total_selectors']}")
    print(f"  Potentially unused: {len(results['potentially_unused'])}")
    print(f"  Duplicate rules: {len(results['duplicate_rules'])}")
    print(f"  Classes found in code: {len(results['used_classes'])}")

    # Large CSS files
    if results['large_files']:
        print("\n📦 LARGE CSS FILES (>50KB)")
        print("-" * 40)
        for f in results['large_files']:
            print(f"  🟡 {f['file']}: {f['size_kb']:.1f} KB")

    # Potentially unused selectors
    if results['potentially_unused']:
        print("\n⚠️  POTENTIALLY UNUSED SELECTORS")
        print("-" * 40)
        print("  (Verify before removing - may be dynamically applied)")

        # Group by file
        by_file = defaultdict(list)
        for sel in results['potentially_unused']:
            by_file[sel['file']].append(sel)

        for filepath, selectors in sorted(by_file.items()):
            print(f"\n  📄 {filepath} ({len(selectors)} unused)")

            shown = selectors[:5] if not verbose else selectors
            for sel in shown:
                print(f"     Line {sel['line']}: {sel['selector']}")

            if len(selectors) > 5 and not verbose:
                print(f"     ... and {len(selectors) - 5} more")

    # Duplicate rules
    if results['duplicate_rules']:
        print("\n🔄 DUPLICATE RULES")
        print("-" * 40)

        shown = results['duplicate_rules'][:10] if not verbose else results['duplicate_rules']
        for dup in shown:
            print(f"\n  {dup['selector']} defined {len(dup['locations'])} times:")
            for loc in dup['locations'][:3]:
                print(f"     - {loc['file']}:{loc['line']}")

        if len(results['duplicate_rules']) > 10 and not verbose:
            print(f"\n  ... and {len(results['duplicate_rules']) - 10} more duplicates")

    # File breakdown
    if verbose:
        print("\n📁 CSS FILE BREAKDOWN")
        print("-" * 40)
        for f in sorted(results['css_files'], key=lambda x: x['size_kb'], reverse=True):
            print(f"  {f['file']}: {f['selectors']} selectors, {f['size_kb']:.1f} KB")

    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 40)

    recommendations = []

    if len(results['potentially_unused']) > 20:
        recommendations.append("• Consider using PurgeCSS or Tailwind's purge feature to remove unused CSS")

    if results['duplicate_rules']:
        recommendations.append("• Remove duplicate CSS rules to reduce bundle size")

    if results['large_files']:
        recommendations.append("• Split large CSS files by route or component")

    if len(results['css_files']) > 5:
        recommendations.append("• Consider consolidating CSS files for fewer HTTP requests")

    if not recommendations:
        recommendations.append("• CSS appears well-optimized!")

    recommendations.append("\n• Integrate PurgeCSS into build pipeline:")
    recommendations.append("    npm install -D @fullhuman/postcss-purgecss")

    recommendations.append("\n• For Tailwind projects, ensure purge config is set:")
    recommendations.append("    content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}']")

    for rec in recommendations:
        print(f"  {rec}")

    # Caveats
    print("\n⚠️  IMPORTANT NOTES")
    print("-" * 40)
    print("  • This analysis is heuristic-based and may have false positives")
    print("  • Dynamically-generated classes (e.g., from variables) won't be detected")
    print("  • Third-party component styles may appear unused")
    print("  • Always test thoroughly after removing CSS")

    print("\n" + "=" * 70)


def main():
    parser = argparse.ArgumentParser(description='Analyze unused CSS')
    parser.add_argument('--dir', '-d', type=str, default='.', help='Directory to analyze')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed output')
    args = parser.parse_args()

    directory = Path(args.dir).resolve()

    if not directory.exists():
        print(f"Error: Directory not found: {directory}")
        sys.exit(1)

    # Analyze
    results = analyze_css_usage(directory)

    if not results['css_files']:
        print(f"No CSS files found in {directory}")
        sys.exit(0)

    # Print report
    print_report(results, directory, args.verbose)

    # Exit with non-zero if significant issues
    unused_ratio = len(results['potentially_unused']) / max(results['total_selectors'], 1)
    if unused_ratio > 0.3:  # More than 30% potentially unused
        sys.exit(1)


if __name__ == '__main__':
    main()
