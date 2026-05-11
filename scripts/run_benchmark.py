"""
SAM API를 활용한 벤치마크 실행 스크립트

사용법:
    python scripts/run_benchmark.py --category coding --level 2
    python scripts/run_benchmark.py --all
"""

import httpx
import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime

# SAM API 설정
SAM_API_KEY = os.getenv("SAM_API_KEY", "sam-45ae2ebb0617e7963d9d47f2db3ae47f306786e9b1ce9f98")
SAM_BASE_URL = os.getenv("SAM_BASE_URL", "https://sam.soonsoon.ai")

# 벤치마크 대상 모델 목록
TARGET_MODELS = [
    "glm-4.7-flash",
    "gpt-5.4-nano",
    "claude-haiku",
    "gpt-5.4-mini",
    "deepseek-v3.2",
    "claude-sonnet-4.6",
    "gpt-5.4",
]

BENCHMARKS_DIR = Path(__file__).parent.parent / "benchmarks"
RESULTS_DIR = BENCHMARKS_DIR / "results"


def sam_generate(model: str, messages: list, **options) -> dict:
    """SAM /v1/generate 호출 (non-stream)"""
    response = httpx.post(
        f"{SAM_BASE_URL}/v1/generate",
        headers={"X-API-Key": SAM_API_KEY, "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": messages,
            "options": {"stream": False, **options},
        },
        timeout=120.0,
    )
    if response.status_code == 429:
        data = response.json()
        retry_after = data.get("suggestion", {}).get("retry_after_seconds", 5)
        print(f"  Rate limited. Waiting {retry_after}s...")
        time.sleep(retry_after)
        return sam_generate(model, messages, **options)
    response.raise_for_status()
    return response.json()


def load_problems(category: str = None, level: int = None) -> list:
    """벤치마크 문제 로드"""
    problems = []
    categories_dir = BENCHMARKS_DIR / "categories"

    if not categories_dir.exists():
        print(f"Error: {categories_dir} 디렉토리가 없습니다.")
        return problems

    for problem_file in categories_dir.glob("**/*.json"):
        with open(problem_file) as f:
            problem = json.load(f)

        if category and problem.get("category") != category:
            continue
        if level and problem.get("level") != level:
            continue

        problems.append(problem)

    return problems


def run_single_problem(model: str, problem: dict) -> dict:
    """단일 문제에 대해 모델 실행"""
    messages = [{"role": "user", "content": problem["prompt"]}]

    if problem.get("context"):
        messages[0]["content"] = f"{problem['context']}\n\n{problem['prompt']}"

    start_time = time.time()
    result = sam_generate(model, messages)
    elapsed = time.time() - start_time

    return {
        "problem_id": problem["id"],
        "model": model,
        "response": result.get("output", {}).get("content", ""),
        "latency_seconds": round(elapsed, 2),
        "timestamp": datetime.now().isoformat(),
        "tokens": result.get("usage", {}),
    }


def run_benchmark(category: str = None, level: int = None):
    """벤치마크 실행"""
    problems = load_problems(category, level)

    if not problems:
        print("실행할 문제가 없습니다. benchmarks/categories/ 에 문제를 추가하세요.")
        return

    print(f"📋 {len(problems)}개 문제 × {len(TARGET_MODELS)}개 모델 = {len(problems) * len(TARGET_MODELS)}회 실행")
    print("=" * 60)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = []

    for i, problem in enumerate(problems, 1):
        print(f"\n[{i}/{len(problems)}] {problem['id']}: {problem.get('title', 'Untitled')}")

        for model in TARGET_MODELS:
            print(f"  → {model}...", end=" ", flush=True)
            try:
                result = run_single_problem(model, problem)
                results.append(result)
                print(f"✓ ({result['latency_seconds']}s)")
            except Exception as e:
                print(f"✗ Error: {e}")
                results.append({
                    "problem_id": problem["id"],
                    "model": model,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat(),
                })

    # 결과 저장
    output_file = RESULTS_DIR / f"run_{run_id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"✅ 완료! 결과 저장: {output_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SAM 벤치마크 실행")
    parser.add_argument("--category", type=str, help="카테고리 필터")
    parser.add_argument("--level", type=int, help="난이도 필터 (1-4)")
    parser.add_argument("--all", action="store_true", help="전체 실행")

    args = parser.parse_args()
    run_benchmark(category=args.category, level=args.level)
