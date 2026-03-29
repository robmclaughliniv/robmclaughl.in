#!/usr/bin/env python3
"""
Bundle Analyzer Script

Analyzes JavaScript and CSS bundle sizes in build output.
Reports total sizes, per-file breakdown, and flags budget violations.

Usage:
    python bundle-analyzer.py
    python bundle-analyzer.py --dir ./out
    python bundle-analyzer.py --json

Requirements:
    - Python 3.8+
    - Build output directory (run npm run build first)
"""

import os
import sys
import gzip
import json
import argparse
from pathlib import Path
from typing import Any
from collections import defaultdict

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Performance budgets (in KB)
BUDGETS = {
    'total_js_gzip': 200,      # Total JS gzipped
    'initial_bundle': 100,      # Initial/main bundle
    'chunk_size': 50,           # Individual chunk
    'total_css': 50,            # Total CSS
    'single_css': 20,           # Single CSS file
}

# File patterns to analyze
JS_EXTENSIONS = {'.js', '.mjs'}
CSS_EXTENSIONS = {'.css'}
MAP_EXTENSIONS = {'.map'}


def get_gzip_size(filepath: Path) -> int:
    """Get gzipped size of a file."""
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        return len(gzip.compress(content, compresslevel=9))
    except Exception:
        return 0


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    elif size_bytes >= 1024:
        return f"{size_bytes / 1024:.2f} KB"
    return f"{size_bytes} B"


def analyze_directory(directory: Path) -> dict[str, Any]:
    """Analyze all JS and CSS files in directory."""
    results = {
        'js_files': [],
        'css_files': [],
        'source_maps': [],
        'total_js_raw': 0,
        'total_js_gzip': 0,
        'total_css_raw': 0,
        'total_css_gzip': 0,
        'total_maps': 0,
    }

    if not directory.exists():
        return results

    for filepath in directory.rglob('*'):
        if not filepath.is_file():
            continue

        ext = filepath.suffix.lower()
        raw_size = filepath.stat().st_size

        if ext in JS_EXTENSIONS:
            gzip_size = get_gzip_size(filepath)
            relative_path = filepath.relative_to(directory)

            results['js_files'].append({
                'path': str(relative_path),
                'raw': raw_size,
                'gzip': gzip_size,
            })
            results['total_js_raw'] += raw_size
            results['total_js_gzip'] += gzip_size

        elif ext in CSS_EXTENSIONS:
            gzip_size = get_gzip_size(filepath)
            relative_path = filepath.relative_to(directory)

            results['css_files'].append({
                'path': str(relative_path),
                'raw': raw_size,
                'gzip': gzip_size,
            })
            results['total_css_raw'] += raw_size
            results['total_css_gzip'] += gzip_size

        elif ext in MAP_EXTENSIONS:
            results['source_maps'].append({
                'path': str(filepath.relative_to(directory)),
                'size': raw_size,
            })
            results['total_maps'] += raw_size

    # Sort by gzipped size (largest first)
    results['js_files'].sort(key=lambda x: x['gzip'], reverse=True)
    results['css_files'].sort(key=lambda x: x['gzip'], reverse=True)

    return results


def identify_largest_dependencies(js_files: list[dict]) -> list[dict]:
    """Try to identify large dependencies from chunk names."""
    large_deps = []

    # Common patterns in chunk names
    dependency_patterns = {
        'react': 'React',
        'react-dom': 'React DOM',
        'next': 'Next.js',
        'webpack': 'Webpack runtime',
        'node_modules': 'Dependencies',
        'vendor': 'Vendor bundle',
        'framework': 'Framework',
        'main': 'Main bundle',
        'app': 'App bundle',
        'pages': 'Pages',
        'commons': 'Common chunks',
        'polyfill': 'Polyfills',
    }

    for file_info in js_files:
        path_lower = file_info['path'].lower()
        for pattern, name in dependency_patterns.items():
            if pattern in path_lower:
                large_deps.append({
                    'name': name,
                    'file': file_info['path'],
                    'size': file_info['gzip'],
                })
                break

    return large_deps[:10]  # Top 10


def check_budgets(results: dict[str, Any]) -> list[dict]:
    """Check results against performance budgets."""
    violations = []

    # Total JS budget
    total_js_kb = results['total_js_gzip'] / 1024
    if total_js_kb > BUDGETS['total_js_gzip']:
        violations.append({
            'type': 'Total JavaScript (gzipped)',
            'actual': f"{total_js_kb:.1f} KB",
            'budget': f"{BUDGETS['total_js_gzip']} KB",
            'over_by': f"{total_js_kb - BUDGETS['total_js_gzip']:.1f} KB",
            'severity': 'critical' if total_js_kb > BUDGETS['total_js_gzip'] * 1.5 else 'high',
        })

    # Total CSS budget
    total_css_kb = results['total_css_gzip'] / 1024
    if total_css_kb > BUDGETS['total_css']:
        violations.append({
            'type': 'Total CSS',
            'actual': f"{total_css_kb:.1f} KB",
            'budget': f"{BUDGETS['total_css']} KB",
            'over_by': f"{total_css_kb - BUDGETS['total_css']:.1f} KB",
            'severity': 'high',
        })

    # Individual chunk budgets
    for js_file in results['js_files']:
        size_kb = js_file['gzip'] / 1024

        # Check if it's an initial/main bundle
        is_main = any(x in js_file['path'].lower() for x in ['main', 'app', 'index', 'page'])
        budget = BUDGETS['initial_bundle'] if is_main else BUDGETS['chunk_size']

        if size_kb > budget:
            violations.append({
                'type': f"Chunk: {js_file['path']}",
                'actual': f"{size_kb:.1f} KB",
                'budget': f"{budget} KB",
                'over_by': f"{size_kb - budget:.1f} KB",
                'severity': 'medium',
            })

    return violations


def print_report(results: dict[str, Any], directory: Path) -> None:
    """Print formatted bundle analysis report."""
    print("=" * 70)
    print("BUNDLE ANALYSIS REPORT")
    print("=" * 70)
    print(f"\nDirectory: {directory}")
    print("-" * 70)

    # Summary
    print("\n📊 SUMMARY")
    print("-" * 40)

    js_count = len(results['js_files'])
    css_count = len(results['css_files'])

    print(f"  JavaScript files: {js_count}")
    print(f"    Raw:    {format_size(results['total_js_raw'])}")
    print(f"    Gzip:   {format_size(results['total_js_gzip'])}")

    print(f"\n  CSS files: {css_count}")
    print(f"    Raw:    {format_size(results['total_css_raw'])}")
    print(f"    Gzip:   {format_size(results['total_css_gzip'])}")

    if results['source_maps']:
        print(f"\n  Source maps: {len(results['source_maps'])}")
        print(f"    Total:  {format_size(results['total_maps'])}")

    # Budget check
    violations = check_budgets(results)

    if violations:
        print("\n⚠️  BUDGET VIOLATIONS")
        print("-" * 40)
        for v in violations:
            severity_emoji = {'critical': '🔴', 'high': '🟡', 'medium': '🟢'}.get(v['severity'], '🔵')
            print(f"\n  {severity_emoji} {v['type']}")
            print(f"     Actual: {v['actual']} | Budget: {v['budget']} | Over by: {v['over_by']}")
    else:
        print("\n✅ All bundles within budget!")

    # JavaScript breakdown
    if results['js_files']:
        print("\n📦 JAVASCRIPT FILES (by gzipped size)")
        print("-" * 40)

        for i, js_file in enumerate(results['js_files'][:15], 1):  # Top 15
            size_kb = js_file['gzip'] / 1024
            raw_kb = js_file['raw'] / 1024

            # Determine if over budget
            is_main = any(x in js_file['path'].lower() for x in ['main', 'app', 'index', 'page'])
            budget = BUDGETS['initial_bundle'] if is_main else BUDGETS['chunk_size']

            status = '🔴' if size_kb > budget else '🟢'

            print(f"  {status} {js_file['path']}")
            print(f"     {size_kb:.1f} KB gzip ({raw_kb:.1f} KB raw)")

        if len(results['js_files']) > 15:
            print(f"\n  ... and {len(results['js_files']) - 15} more files")

    # CSS breakdown
    if results['css_files']:
        print("\n🎨 CSS FILES (by gzipped size)")
        print("-" * 40)

        for css_file in results['css_files'][:10]:  # Top 10
            size_kb = css_file['gzip'] / 1024
            raw_kb = css_file['raw'] / 1024
            status = '🔴' if size_kb > BUDGETS['single_css'] else '🟢'

            print(f"  {status} {css_file['path']}")
            print(f"     {size_kb:.1f} KB gzip ({raw_kb:.1f} KB raw)")

    # Largest dependencies
    large_deps = identify_largest_dependencies(results['js_files'])
    if large_deps:
        print("\n📚 LARGEST IDENTIFIED BUNDLES")
        print("-" * 40)
        for dep in large_deps[:5]:
            print(f"  • {dep['name']}: {format_size(dep['size'])}")

    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 40)

    recommendations = []

    total_js_kb = results['total_js_gzip'] / 1024
    if total_js_kb > BUDGETS['total_js_gzip']:
        recommendations.append("• Total JS exceeds budget: Consider code splitting, tree shaking, or removing unused dependencies")

    total_css_kb = results['total_css_gzip'] / 1024
    if total_css_kb > BUDGETS['total_css']:
        recommendations.append("• Total CSS exceeds budget: Use PurgeCSS, remove unused styles, or split CSS by route")

    # Check for large individual chunks
    large_chunks = [f for f in results['js_files'] if f['gzip'] / 1024 > BUDGETS['chunk_size']]
    if large_chunks:
        recommendations.append(f"• {len(large_chunks)} chunk(s) exceed {BUDGETS['chunk_size']}KB: Consider splitting into smaller chunks")

    # Check source maps in production
    if results['source_maps'] and results['total_maps'] > 1024 * 1024:
        recommendations.append("• Large source maps detected: Ensure they're not served to users in production")

    if not recommendations:
        recommendations.append("• Great job! All bundles are within budget.")
        recommendations.append("• Consider monitoring bundle size in CI to prevent regression.")

    for rec in recommendations:
        print(f"  {rec}")

    print("\n" + "=" * 70)


def output_json(results: dict[str, Any]) -> None:
    """Output results as JSON."""
    violations = check_budgets(results)

    output = {
        'summary': {
            'total_js_raw': results['total_js_raw'],
            'total_js_gzip': results['total_js_gzip'],
            'total_css_raw': results['total_css_raw'],
            'total_css_gzip': results['total_css_gzip'],
            'js_file_count': len(results['js_files']),
            'css_file_count': len(results['css_files']),
        },
        'budgets': BUDGETS,
        'violations': violations,
        'js_files': results['js_files'],
        'css_files': results['css_files'],
        'largest_dependencies': identify_largest_dependencies(results['js_files']),
    }

    print(json.dumps(output, indent=2))


def find_build_directory() -> Path | None:
    """Find the build output directory."""
    cwd = Path.cwd()

    # Check common build directories in order of preference
    candidates = [
        cwd / 'out',           # Next.js static export
        cwd / '.next' / 'static',  # Next.js dev/build
        cwd / 'build',         # Create React App
        cwd / 'dist',          # Vite, generic
        cwd / 'public',        # Some static setups
    ]

    for candidate in candidates:
        if candidate.exists() and any(candidate.rglob('*.js')):
            return candidate

    return None


def main():
    parser = argparse.ArgumentParser(description='Analyze bundle sizes')
    parser.add_argument('--dir', '-d', type=str, help='Build directory to analyze')
    parser.add_argument('--json', '-j', action='store_true', help='Output as JSON')
    args = parser.parse_args()

    # Find build directory
    if args.dir:
        directory = Path(args.dir)
    else:
        directory = find_build_directory()

    if not directory or not directory.exists():
        print("Error: Could not find build directory.")
        print("Make sure to run 'npm run build' first.")
        print("Or specify directory with --dir <path>")
        sys.exit(1)

    # Analyze
    results = analyze_directory(directory)

    if not results['js_files'] and not results['css_files']:
        print(f"No JS or CSS files found in {directory}")
        sys.exit(1)

    # Output
    if args.json:
        output_json(results)
    else:
        print_report(results, directory)

    # Exit with non-zero if budget exceeded
    violations = check_budgets(results)
    critical_violations = [v for v in violations if v['severity'] == 'critical']
    if critical_violations:
        sys.exit(1)


if __name__ == '__main__':
    main()
