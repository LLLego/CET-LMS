"""
CET Pipeline Orchestrator
==========================
Runs all 3 extraction scripts in sequence:
  1. extract_pdf_content.py  → subjects.json, chapters.json, sections.json
  2. extract_questions.py    → questions.json (auto-generated MCQs)
  3. extract_flashcards.py   → flashcards.json (auto-generated flashcards)

Usage:
  python scripts/run_pipeline.py                          # Full pipeline with defaults
  python scripts/run_pipeline.py --pdf-dir "path/to/pdfs" # Custom PDF directory
  python scripts/run_pipeline.py --skip-questions          # Skip question generation
  python scripts/run_pipeline.py --skip-flashcards         # Skip flashcard generation
  python scripts/run_pipeline.py --step 1                  # Run only step 1

The pipeline will:
  - Skip PDF files that don't exist (graceful degradation)
  - Use fallback text extraction if PyMuPDF is not installed
  - Save all output to data/extracted/
  - Print a summary at the end
"""

import json
import os
import sys
import time
import argparse
import subprocess


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(PROJECT_ROOT, "scripts")
OUT_DIR = os.path.join(PROJECT_ROOT, "data", "extracted")
HOME_DIR = os.path.expanduser("~")

DEFAULT_PDF_DIR = os.path.join(PROJECT_ROOT, "Documents", "CET", "V12_Deliverables")

# Color codes for terminal output (stripped on classic Windows consoles)
_USE_COLOR = os.name != 'nt' or bool(os.environ.get('WT_SESSION') or os.environ.get('TERM_PROGRAM'))

if _USE_COLOR:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"
else:
    GREEN = YELLOW = RED = CYAN = BOLD = RESET = ""


# ──────────────────────────────────────────────
# Utility Functions
# ──────────────────────────────────────────────

def timestamp():
    """Return current timestamp string."""
    return time.strftime("%H:%M:%S")


def log_step(step_num, message, color=CYAN):
    """Print a formatted step header."""
    print(f"\n  {color}{'─' * 56}{RESET}")
    print(f"  {color}  Step {step_num}: {message}{RESET}")
    print(f"  {color}{'─' * 56}{RESET}")
    print()


def log_ok(message):
    """Print a success message."""
    print(f"  [{GREEN}OK{RESET}] [{timestamp()}] {message}")


def log_warn(message):
    """Print a warning message."""
    print(f"  [{YELLOW}WARN{RESET}] [{timestamp()}] {message}")


def log_error(message):
    """Print an error message."""
    print(f"  [{RED}ERROR{RESET}] [{timestamp()}] {message}")


def run_script(script_name, args=None, timeout=None):
    """
    Run a Python script and return (success, output, error).

    Args:
        script_name: Filename of the script in scripts/
        args: List of additional arguments to pass
        timeout: Timeout in seconds (None = no timeout)

    Returns:
        Tuple of (success: bool, stdout: str, stderr: str)
    """
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    cmd = [sys.executable, script_path]

    if args:
        cmd.extend(args)

    log_ok(f"Running: {' '.join(cmd)}")
    start_time = time.time()

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=PROJECT_ROOT,
        )
        elapsed = time.time() - start_time

        if result.returncode == 0:
            log_ok(f"{script_name} completed in {elapsed:.1f}s")
            return True, result.stdout, result.stderr
        else:
            log_error(f"{script_name} failed (exit code {result.returncode}) in {elapsed:.1f}s")
            return False, result.stdout, result.stderr

    except subprocess.TimeoutExpired:
        log_error(f"{script_name} timed out after {timeout}s")
        return False, "", "Timeout"
    except FileNotFoundError:
        log_error(f"Script not found: {script_path}")
        return False, "", "File not found"
    except Exception as e:
        log_error(f"Failed to run {script_name}: {e}")
        return False, "", str(e)


def check_output_files():
    """Check which output files exist and return their stats."""
    expected_files = [
        "subjects.json",
        "chapters.json",
        "sections.json",
        "questions.json",
        "flashcards.json",
    ]
    results = {}
    for fname in expected_files:
        fpath = os.path.join(OUT_DIR, fname)
        if os.path.exists(fpath):
            size = os.path.getsize(fpath)
            results[fname] = {
                "exists": True,
                "size": size,
                "size_str": f"{size / 1024:.1f} KB",
            }
        else:
            results[fname] = {"exists": False, "size": 0, "size_str": "-"}
    return results


def print_banner():
    """Print the pipeline banner."""
    print()
    print(f"  {BOLD}{'=' * 60}{RESET}")
    print(f"  {BOLD}  CET PDF Content Extraction Pipeline{RESET}")
    print(f"  {BOLD}  Project: CET LMS{RESET}")
    print(f"  {BOLD}{'=' * 60}{RESET}")
    print()
    print(f"  Started:  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Python:   {sys.version.split()[0]}")
    print(f"  Project:  {PROJECT_ROOT}")
    print(f"  Output:   {OUT_DIR}")
    print()


def print_summary(start_time, output_files):
    """Print a detailed summary of pipeline results."""
    elapsed = time.time() - start_time
    print(f"\n  {BOLD}{'=' * 60}{RESET}")
    print(f"  {BOLD}  PIPELINE SUMMARY{RESET}")
    print(f"  {BOLD}{'=' * 60}{RESET}")
    print(f"\n  Duration:  {elapsed:.1f}s")
    print(f"  Output:    {OUT_DIR}")
    print()

    # Load and display stats
    subjects_path = os.path.join(OUT_DIR, "subjects.json")
    sections_path = os.path.join(OUT_DIR, "sections.json")
    questions_path = os.path.join(OUT_DIR, "questions.json")
    flashcards_path = os.path.join(OUT_DIR, "flashcards.json")

    subject_count = 0
    chapter_count = 0
    section_count = 0
    question_count = 0
    flashcard_count = 0

    if os.path.exists(subjects_path):
        try:
            with open(subjects_path, "r") as f:
                subjects = json.load(f)
            subject_count = len(subjects)
        except (json.JSONDecodeError, IOError):
            pass

    if os.path.exists(sections_path):
        try:
            with open(sections_path, "r") as f:
                sections = json.load(f)
            section_count = len(sections)
            # Count unique chapter IDs
            chapter_ids = set(s.get("chapter_id", "") for s in sections)
            chapter_count = len(chapter_ids)
        except (json.JSONDecodeError, IOError):
            pass

    if os.path.exists(questions_path):
        try:
            with open(questions_path, "r") as f:
                questions = json.load(f)
            question_count = len(questions)
        except (json.JSONDecodeError, IOError):
            pass

    if os.path.exists(flashcards_path):
        try:
            with open(flashcards_path, "r") as f:
                fc_data = json.load(f)
            flashcard_count = len(fc_data.get("flashcards", []))
        except (json.JSONDecodeError, IOError):
            pass

    # Print table
    print(f"  {'File':<25} {'Status':<10} {'Size':<12} {'Count':<10}")
    print(f"  {'─' * 57}")

    for fname, info in sorted(output_files.items()):
        count_str = ""
        if fname == "subjects.json":
            count_str = str(subject_count) if info["exists"] else "-"
        elif fname == "sections.json":
            count_str = str(section_count) if info["exists"] else "-"
        elif fname == "questions.json":
            count_str = str(question_count) if info["exists"] else "-"
        elif fname == "flashcards.json":
            count_str = str(flashcard_count) if info["exists"] else "-"

        status = f"{GREEN}OK{RESET}" if info["exists"] else f"{YELLOW}MISSING{RESET}"
        size = info["size_str"] if info["exists"] else "-"
        print(f"  {fname:<25} {status:<10} {size:<12} {count_str:<10}")

    # Content overview
    print()
    print(f"  {BOLD}Content Overview:{RESET}")
    print(f"  {BOLD}{'─' * 40}{RESET}")
    print(f"  Subjects:        {subject_count}")
    print(f"  Chapters:        {chapter_count}")
    print(f"  Sections:        {section_count}")
    print(f"  Auto-Questions:  {question_count}")
    print(f"  Flashcards:      {flashcard_count}")

    # Per-subject breakdown if sections exist
    if os.path.exists(sections_path):
        try:
            with open(sections_path, "r") as f:
                sections = json.load(f)
            from collections import Counter
            subject_secs = Counter(s.get("subject_id", "unknown") for s in sections)
            print(f"\n  Sections by subject:")
            for sid, count in sorted(subject_secs.items()):
                print(f"    {sid}: {count} sections")
        except (json.JSONDecodeError, IOError):
            pass

    print(f"\n  {BOLD}{'=' * 60}{RESET}")
    print(f"  {GREEN}Pipeline completed successfully!{RESET}")
    print(f"  You can now serve the app and test the TextbookReader.")
    print(f"  {BOLD}{'=' * 60}{RESET}")
    print()


# ──────────────────────────────────────────────
# Pipeline Steps
# ──────────────────────────────────────────────

def step1_extract_content(pdf_dir, out_dir, skip_if_exists=False):
    """Step 1: Extract PDF content → subjects.json, chapters.json, sections.json."""
    sections_path = os.path.join(out_dir, "sections.json")

    if skip_if_exists and os.path.exists(sections_path):
        log_ok("Step 1 output already exists, skipping (use --force to re-run)")
        return True

    log_step(1, "PDF Content Extraction")
    log_ok(f"PDF directory: {pdf_dir}")
    log_ok(f"Output directory: {out_dir}")

    args = [
        f"--pdf-dir={pdf_dir}",
        f"--out-dir={out_dir}",
    ]

    success, stdout, stderr = run_script("extract_pdf_content.py", args, timeout=300)

    if stdout:
        # Print a concise summary from the script
        for line in stdout.split("\n"):
            if any(kw in line for kw in ["OK]", "ERROR]", "WARN]", "PIPELINE", "Subjects", "Chapters", "Sections"]):
                print(f"    {line.strip()}")

    if stderr:
        for line in stderr.strip().split("\n"):
            if line.strip():
                log_warn(f"stderr: {line.strip()}")

    return success


def step2_generate_questions(out_dir, skip_if_exists=False):
    """Step 2: Generate auto-questions from sections.json."""
    questions_path = os.path.join(out_dir, "questions.json")
    sections_path = os.path.join(out_dir, "sections.json")

    if skip_if_exists and os.path.exists(questions_path):
        log_ok("Step 2 output already exists, skipping")
        return True

    if not os.path.exists(sections_path):
        log_error("sections.json not found. Run Step 1 first.")
        return False

    log_step(2, "Auto-Question Generation")

    args = [
        f"--sections-path={sections_path}",
        f"--out-dir={out_dir}",
    ]

    success, stdout, stderr = run_script("extract_questions.py", args, timeout=120)

    if stdout:
        for line in stdout.split("\n"):
            if any(kw in line for kw in ["OK]", "ERROR]", "Generated", "Wrote", "questions", "COMPLETE"]):
                print(f"    {line.strip()}")

    if stderr:
        for line in stderr.strip().split("\n"):
            if line.strip():
                log_warn(f"stderr: {line.strip()}")

    return success


def step3_generate_flashcards(out_dir, skip_if_exists=False):
    """Step 3: Generate flashcards from sections.json."""
    flashcards_path = os.path.join(out_dir, "flashcards.json")
    sections_path = os.path.join(out_dir, "sections.json")

    if skip_if_exists and os.path.exists(flashcards_path):
        log_ok("Step 3 output already exists, skipping")
        return True

    if not os.path.exists(sections_path):
        log_error("sections.json not found. Run Step 1 first.")
        return False

    log_step(3, "Flashcard Generation")

    args = [
        f"--sections-path={sections_path}",
        f"--out-dir={out_dir}",
    ]

    success, stdout, stderr = run_script("extract_flashcards.py", args, timeout=120)

    if stdout:
        for line in stdout.split("\n"):
            if any(kw in line for kw in ["OK]", "ERROR]", "Generated", "Wrote", "flashcards", "COMPLETE"]):
                print(f"    {line.strip()}")

    if stderr:
        for line in stderr.strip().split("\n"):
            if line.strip():
                log_warn(f"stderr: {line.strip()}")

    return success


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="CET PDF Content Extraction Pipeline Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/run_pipeline.py                              # Full pipeline
  python scripts/run_pipeline.py --pdf-dir "path/to/pdf"    # Custom PDF dir
  python scripts/run_pipeline.py --step 1                    # Only extract content
  python scripts/run_pipeline.py --skip-questions            # Skip question gen
  python scripts/run_pipeline.py --force                     # Re-run all steps
        """,
    )
    parser.add_argument(
        "--pdf-dir",
        default=DEFAULT_PDF_DIR,
        help=f"Directory containing CET PDFs (default: {DEFAULT_PDF_DIR})",
    )
    parser.add_argument(
        "--out-dir",
        default=OUT_DIR,
        help=f"Output directory (default: {OUT_DIR})",
    )
    parser.add_argument(
        "--step",
        type=int,
        choices=[1, 2, 3],
        help="Run only a specific step (1=extract, 2=questions, 3=flashcards)",
    )
    parser.add_argument(
        "--skip-questions",
        action="store_true",
        help="Skip auto-question generation",
    )
    parser.add_argument(
        "--skip-flashcards",
        action="store_true",
        help="Skip flashcard generation",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-running all steps even if output exists",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check output files without running anything",
    )

    args = parser.parse_args()

    # Resolve paths
    pdf_dir = os.path.abspath(args.pdf_dir) if os.path.isabs(args.pdf_dir) else os.path.join(PROJECT_ROOT, args.pdf_dir)
    out_dir = os.path.abspath(args.out_dir) if os.path.isabs(args.out_dir) else os.path.join(PROJECT_ROOT, args.out_dir)

    # Create output directory
    os.makedirs(out_dir, exist_ok=True)

    start_time = time.time()

    if args.check:
        print_banner()
        log_ok("Check mode — no scripts will be executed")
        files = check_output_files()
        print_summary(start_time, files)
        return

    # Print banner
    print_banner()

    # Check PDF directory
    if not os.path.exists(pdf_dir):
        log_warn(f"PDF directory not found: {pdf_dir}")
        log_warn(f"Pipeline will create placeholder data from existing JSON sources")
        log_warn(f"Place the 8 PDFs in {pdf_dir} for full extraction")
        print()

    skip_if_exists = not args.force

    # Determine which steps to run
    if args.step:
        steps_to_run = {args.step}
    else:
        steps_to_run = {1, 2, 3}

    # Run steps
    all_success = True

    if 1 in steps_to_run:
        success = step1_extract_content(pdf_dir, out_dir, skip_if_exists)
        if not success:
            log_error("Step 1 failed. Subsequent steps may produce limited results.")
            all_success = False

    if 2 in steps_to_run and not args.skip_questions:
        success = step2_generate_questions(out_dir, skip_if_exists)
        if not success:
            log_error("Step 2 (question generation) failed.")
            all_success = False

    if 3 in steps_to_run and not args.skip_flashcards:
        success = step3_generate_flashcards(out_dir, skip_if_exists)
        if not success:
            log_error("Step 3 (flashcard generation) failed.")
            all_success = False

    # Print summary
    print()
    output_files = check_output_files()
    print_summary(start_time, output_files)

    if not all_success:
        log_warn("Some steps had issues. Check the output above for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()
