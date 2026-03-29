#!/usr/bin/env python3
"""
Lighthouse Performance Audit Script

Runs Lighthouse on a given URL and extracts Core Web Vitals metrics.
Flags issues that exceed performance thresholds.

Usage:
    python lighthouse-audit.py <url>
    python lighthouse-audit.py http://localhost:3000
    python lighthouse-audit.py https://robmclaughl.in

Requirements:
    - Node.js installed
    - Lighthouse: npm install -g lighthouse (or will use npx)
"""

import json
import subprocess
import sys
import tempfile
import os
from pathlib import Path
from typing import Any

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Performance thresholds
THRESHOLDS = {
    'performance': {'good': 90, 'needs_improvement': 70},
    'lcp': {'good': 2500, 'poor': 4000},  # milliseconds
    'cls': {'good': 0.1, 'poor': 0.25},
    'inp': {'good': 200, 'poor': 500},  # milliseconds (replaces FID)
    'tbt': {'good': 200, 'poor': 600},  # milliseconds
    'fcp': {'good': 1800, 'poor': 3000},  # milliseconds
    'si': {'good': 3400, 'poor': 5800},  # milliseconds (Speed Index)
}

# Budget thresholds
BUDGETS = {
    'total_js_kb': 200,
    'initial_bundle_kb': 100,
    'total_css_kb': 50,
}


def get_rating(value: float, metric: str) -> tuple[str, str]:
    """Get rating and emoji for a metric value."""
    if metric not in THRESHOLDS:
        return 'unknown', '❓'

    thresh = THRESHOLDS[metric]

    if metric == 'performance':
        if value >= thresh['good']:
            return 'good', '🟢'
        elif value >= thresh['needs_improvement']:
            return 'needs_improvement', '🟡'
        else:
            return 'poor', '🔴'
    else:
        if value <= thresh['good']:
            return 'good', '🟢'
        elif value <= thresh['poor']:
            return 'needs_improvement', '🟡'
        else:
            return 'poor', '🔴'


def format_time(ms: float) -> str:
    """Format milliseconds to human-readable string."""
    if ms >= 1000:
        return f"{ms / 1000:.2f}s"
    return f"{ms:.0f}ms"


def run_lighthouse(url: str) -> dict[str, Any] | None:
    """Run Lighthouse and return JSON results."""
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
        output_path = f.name

    try:
        # Try global lighthouse first, fall back to npx
        lighthouse_cmd = ['lighthouse']
        try:
            subprocess.run(['lighthouse', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            lighthouse_cmd = ['npx', 'lighthouse']

        cmd = lighthouse_cmd + [
            url,
            '--output=json',
            f'--output-path={output_path}',
            '--only-categories=performance',
            '--chrome-flags="--headless --no-sandbox --disable-gpu"',
            '--quiet'
        ]

        print(f"Running Lighthouse audit on {url}...")
        print(f"Command: {' '.join(cmd)}")
        print("This may take 30-60 seconds...\n")

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            print(f"Lighthouse error: {result.stderr}")
            return None

        with open(output_path, 'r') as f:
            return json.load(f)

    except subprocess.TimeoutExpired:
        print("Error: Lighthouse timed out after 120 seconds")
        return None
    except FileNotFoundError:
        print("Error: Lighthouse not found. Install with: npm install -g lighthouse")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing Lighthouse output: {e}")
        return None
    finally:
        if os.path.exists(output_path):
            os.unlink(output_path)


def extract_metrics(data: dict[str, Any]) -> dict[str, Any]:
    """Extract key metrics from Lighthouse JSON."""
    metrics = {}

    # Performance score
    categories = data.get('categories', {})
    perf = categories.get('performance', {})
    metrics['performance_score'] = (perf.get('score') or 0) * 100

    # Core Web Vitals and other metrics
    audits = data.get('audits', {})

    metric_map = {
        'largest-contentful-paint': 'lcp',
        'cumulative-layout-shift': 'cls',
        'total-blocking-time': 'tbt',
        'first-contentful-paint': 'fcp',
        'speed-index': 'si',
        'interactive': 'tti',
    }

    for audit_key, metric_key in metric_map.items():
        audit = audits.get(audit_key, {})
        if 'numericValue' in audit:
            metrics[metric_key] = audit['numericValue']
        elif 'score' in audit:
            # CLS is reported as a score
            metrics[metric_key] = audit.get('numericValue', audit.get('score', 0))

    # INP might not be in Lighthouse yet (lab approximation)
    # Use TBT as a proxy for now
    if 'inp' not in metrics and 'tbt' in metrics:
        metrics['inp_estimated'] = True
        metrics['inp'] = metrics['tbt']  # Rough approximation

    # Extract diagnostics
    metrics['diagnostics'] = []

    diagnostic_audits = [
        'render-blocking-resources',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'uses-optimized-images',
        'uses-responsive-images',
        'offscreen-images',
        'unminified-javascript',
        'unminified-css',
        'efficient-animated-content',
        'duplicated-javascript',
        'legacy-javascript',
        'dom-size',
        'critical-request-chains',
        'largest-contentful-paint-element',
        'layout-shift-elements',
        'long-tasks',
    ]

    for audit_key in diagnostic_audits:
        audit = audits.get(audit_key, {})
        score = audit.get('score')
        if score is not None and score < 1:
            metrics['diagnostics'].append({
                'id': audit_key,
                'title': audit.get('title', audit_key),
                'description': audit.get('description', ''),
                'score': score,
                'displayValue': audit.get('displayValue', ''),
                'details': audit.get('details', {}),
            })

    # Resource summary
    resource_summary = audits.get('resource-summary', {}).get('details', {}).get('items', [])
    metrics['resources'] = {}
    for item in resource_summary:
        resource_type = item.get('resourceType', 'other')
        metrics['resources'][resource_type] = {
            'count': item.get('requestCount', 0),
            'size': item.get('transferSize', 0),
        }

    return metrics


def check_budgets(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    """Check metrics against performance budgets."""
    violations = []

    resources = metrics.get('resources', {})

    # Check JS budget
    js_size = resources.get('script', {}).get('size', 0) / 1024  # KB
    if js_size > BUDGETS['total_js_kb']:
        violations.append({
            'type': 'JavaScript',
            'actual': f"{js_size:.1f}KB",
            'budget': f"{BUDGETS['total_js_kb']}KB",
            'severity': 'high' if js_size > BUDGETS['total_js_kb'] * 1.5 else 'medium',
        })

    # Check CSS budget
    css_size = resources.get('stylesheet', {}).get('size', 0) / 1024
    if css_size > BUDGETS['total_css_kb']:
        violations.append({
            'type': 'CSS',
            'actual': f"{css_size:.1f}KB",
            'budget': f"{BUDGETS['total_css_kb']}KB",
            'severity': 'medium',
        })

    return violations


def print_report(url: str, metrics: dict[str, Any]) -> None:
    """Print formatted performance report."""
    print("=" * 60)
    print("LIGHTHOUSE PERFORMANCE AUDIT REPORT")
    print("=" * 60)
    print(f"\nURL: {url}")
    print("-" * 60)

    # Performance Score
    score = metrics.get('performance_score', 0)
    rating, emoji = get_rating(score, 'performance')
    print(f"\n{emoji} Performance Score: {score:.0f}/100 ({rating.replace('_', ' ').title()})")

    # Core Web Vitals
    print("\n📊 CORE WEB VITALS")
    print("-" * 40)

    cwv_metrics = [
        ('lcp', 'LCP (Largest Contentful Paint)', True),
        ('cls', 'CLS (Cumulative Layout Shift)', False),
        ('inp', 'INP (Interaction to Next Paint)', True),
    ]

    for key, name, is_time in cwv_metrics:
        if key in metrics:
            value = metrics[key]
            rating, emoji = get_rating(value, key)

            if key == 'cls':
                formatted = f"{value:.3f}"
            elif is_time:
                formatted = format_time(value)
            else:
                formatted = f"{value:.2f}"

            estimated = " (estimated)" if metrics.get(f'{key}_estimated') else ""
            print(f"  {emoji} {name}: {formatted}{estimated}")

    # Other Metrics
    print("\n📈 OTHER METRICS")
    print("-" * 40)

    other_metrics = [
        ('tbt', 'TBT (Total Blocking Time)', True),
        ('fcp', 'FCP (First Contentful Paint)', True),
        ('si', 'SI (Speed Index)', True),
        ('tti', 'TTI (Time to Interactive)', True),
    ]

    for key, name, is_time in other_metrics:
        if key in metrics:
            value = metrics[key]
            rating, emoji = get_rating(value, key)
            formatted = format_time(value) if is_time else f"{value:.2f}"
            print(f"  {emoji} {name}: {formatted}")

    # Budget Violations
    violations = check_budgets(metrics)
    if violations:
        print("\n⚠️  BUDGET VIOLATIONS")
        print("-" * 40)
        for v in violations:
            severity_emoji = '🔴' if v['severity'] == 'high' else '🟡'
            print(f"  {severity_emoji} {v['type']}: {v['actual']} (budget: {v['budget']})")

    # Resource Summary
    resources = metrics.get('resources', {})
    if resources:
        print("\n📦 RESOURCE SUMMARY")
        print("-" * 40)
        total_size = 0
        for rtype, data in sorted(resources.items(), key=lambda x: x[1].get('size', 0), reverse=True):
            size_kb = data.get('size', 0) / 1024
            count = data.get('count', 0)
            total_size += data.get('size', 0)
            if size_kb > 1:
                print(f"  {rtype}: {size_kb:.1f}KB ({count} requests)")
        print(f"  {'─' * 30}")
        print(f"  Total: {total_size / 1024:.1f}KB")

    # Diagnostics / Issues
    diagnostics = metrics.get('diagnostics', [])
    if diagnostics:
        print("\n🔍 ISSUES FOUND")
        print("-" * 40)

        # Sort by score (lower is worse)
        sorted_diags = sorted(diagnostics, key=lambda x: x.get('score', 1))

        for i, diag in enumerate(sorted_diags[:10], 1):  # Top 10 issues
            score = diag.get('score', 0)
            if score == 0:
                emoji = '🔴'
            elif score < 0.5:
                emoji = '🟡'
            else:
                emoji = '🟢'

            display_value = diag.get('displayValue', '')
            title = diag.get('title', diag['id'])

            print(f"\n  {emoji} {i}. {title}")
            if display_value:
                print(f"     {display_value}")

    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 40)

    recommendations = []

    lcp = metrics.get('lcp', 0)
    if lcp > 2500:
        recommendations.append("• Optimize LCP: Preload critical images, reduce server response time")

    cls = metrics.get('cls', 0)
    if cls > 0.1:
        recommendations.append("• Fix CLS: Add explicit dimensions to images/embeds, avoid inserting content above existing content")

    tbt = metrics.get('tbt', 0)
    if tbt > 200:
        recommendations.append("• Reduce TBT: Break up long tasks, defer non-critical JavaScript")

    if any(d['id'] == 'render-blocking-resources' for d in diagnostics):
        recommendations.append("• Eliminate render-blocking resources: Inline critical CSS, defer non-critical JS")

    if any(d['id'] == 'unused-javascript' for d in diagnostics):
        recommendations.append("• Remove unused JavaScript: Code split, tree shake, lazy load")

    if any(d['id'] == 'modern-image-formats' for d in diagnostics):
        recommendations.append("• Use modern image formats: Convert to WebP/AVIF for 25-50% savings")

    if not recommendations:
        recommendations.append("• Great job! No critical issues found.")

    for rec in recommendations:
        print(f"  {rec}")

    print("\n" + "=" * 60)
    print("See reference/core-web-vitals.md for detailed optimization guides")
    print("=" * 60)


def main():
    if len(sys.argv) < 2:
        print("Usage: python lighthouse-audit.py <url>")
        print("Example: python lighthouse-audit.py http://localhost:3000")
        sys.exit(1)

    url = sys.argv[1]

    # Validate URL
    if not url.startswith(('http://', 'https://')):
        url = f"http://{url}"

    # Run Lighthouse
    data = run_lighthouse(url)

    if not data:
        print("\nFailed to run Lighthouse audit.")
        print("Make sure:")
        print("  1. The URL is accessible")
        print("  2. Lighthouse is installed (npm install -g lighthouse)")
        print("  3. Chrome/Chromium is available")
        sys.exit(1)

    # Extract and display metrics
    metrics = extract_metrics(data)
    print_report(url, metrics)

    # Exit with non-zero if performance is poor
    if metrics.get('performance_score', 0) < 50:
        sys.exit(1)


if __name__ == '__main__':
    main()
