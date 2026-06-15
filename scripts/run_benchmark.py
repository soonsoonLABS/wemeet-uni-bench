"""
SAM API를 활용한 벤치마크 실행 스크립트 (비동기 처리 지원)

사용법:
    python scripts/run_benchmark.py --category false_premise
    python scripts/run_benchmark.py --all
    python scripts/run_benchmark.py --models claude-sonnet-4.6,gpt-5.4 --limit-problems 2
"""

import argparse
import asyncio
import httpx
import json
import os
import re
import sys
import time
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return False

load_dotenv()

# SAM API 설정
SAM_API_KEY = os.getenv("SAM_API_KEY")
SAM_BASE_URL = os.getenv("SAM_BASE_URL", "https://sam.soonsoon.ai")

# 벤치마크 대상 모델 목록 (전체 31개 모델)
TARGET_MODELS = [
    "cp-opus-4.7", "gpt-5.4-pro", "claude-opus-4.6", "gemini-3.1-pro-preview", 
    "gpt-5.5", "claude-sonnet-4.6", "cp-sonnet-4.6", "az-deepseek-v4-pro", 
    "fw-deepseek-v4-pro", "gemini-3.5-flash", "grok-4.3", "kimi-k2.6", 
    "gpt-5.4", "cp-sonnet-4.5", "deepseek-v4-pro", "glm-5", "deepseek-v4-flash", 
    "deepseek-v3.2", "gpt-5.4-mini", "devstral-2-123b", "kimi-k2.5", 
    "claude-haiku", "cp-haiku-4.5", "glm-4.7", "qwen3-coder-next", 
    "gemini-3.1-flash-lite-preview", "gpt-5.4-nano", "gemini-2.5-flash-lite", 
    "glm-4.7-flash", "gpt-4.1-nano", "nova-lite"
]

BENCHMARKS_DIR = Path(__file__).parent.parent / "benchmarks"
RESULTS_DIR = BENCHMARKS_DIR / "results" / "stress-eval" / "raw-data"

# 동시성 제한 (한 번에 최대 10개의 API 호출)
DEFAULT_CONCURRENCY = 10
semaphore = asyncio.Semaphore(DEFAULT_CONCURRENCY)


def parse_models(raw_models: str | None) -> list[str] | None:
    """쉼표로 구분한 모델 문자열을 리스트로 변환한다."""
    if not raw_models:
        return None
    models = [model.strip() for model in raw_models.split(",") if model.strip()]
    return models or None


def load_models_from_file(path: Path) -> list[str]:
    """JSON 배열 또는 줄 단위 텍스트 파일에서 모델 목록을 읽는다."""
    with open(path, encoding="utf-8") as f:
        if path.suffix == ".json":
            data = json.load(f)
            if isinstance(data, dict):
                data = data.get("models", [])
            return [str(model).strip() for model in data if str(model).strip()]

        return [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]


def safe_label(label: str | None) -> str:
    """파일명에 들어갈 수 있는 짧은 라벨로 정리한다."""
    if not label:
        return ""
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", label.strip()).strip("-")[:60]

async def sam_generate_async(
    client: httpx.AsyncClient,
    model: str,
    messages: list,
    timeout_seconds: float = 120.0,
    max_retries: int = 0,
    **options,
) -> dict:
    """SAM /v1/generate 호출 (비동기)"""
    if not SAM_API_KEY:
        raise RuntimeError("SAM_API_KEY 환경 변수를 설정하세요.")

    for attempt in range(max_retries + 1):
        try:
            response = await client.post(
                f"{SAM_BASE_URL}/v1/generate",
                headers={"X-API-Key": SAM_API_KEY, "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": messages,
                    "options": {"stream": False, **options},
                },
                timeout=timeout_seconds,
            )
            if response.status_code == 429:
                data = response.json()
                retry_after = data.get("suggestion", {}).get("retry_after_seconds", 5)
                if attempt < max_retries:
                    print(f"  [{model}] Rate limited. Waiting {retry_after}s...")
                    await asyncio.sleep(retry_after)
                    continue
                raise RuntimeError(f"HTTP 429: {response.text[:1200]}")

            if response.status_code >= 500 and attempt < max_retries:
                wait_seconds = min(3 * (attempt + 1), 15)
                print(f"  [{model}] HTTP {response.status_code}. Retrying in {wait_seconds}s...")
                await asyncio.sleep(wait_seconds)
                continue

            if response.status_code >= 400:
                body = response.text[:1200]
                raise RuntimeError(f"HTTP {response.status_code}: {body}")

            return response.json()
        except (httpx.TimeoutException, httpx.TransportError) as e:
            if attempt < max_retries:
                wait_seconds = min(3 * (attempt + 1), 15)
                print(f"  [{model}] {type(e).__name__}. Retrying in {wait_seconds}s...")
                await asyncio.sleep(wait_seconds)
                continue
            raise

def load_problems(category: str = None, level: int = None) -> list:
    """벤치마크 문제 로드"""
    problems = []
    categories_dir = BENCHMARKS_DIR / "categories"

    if not categories_dir.exists():
        print(f"Error: {categories_dir} 디렉토리가 없습니다.")
        return problems

    for problem_file in sorted(categories_dir.glob("stress_tests/**/*.json")):
        with open(problem_file, encoding="utf-8") as f:
            problem = json.load(f)

        if category and problem.get("stress_category") != category and problem.get("category") != category:
            continue
        if level and problem.get("level") != level:
            continue

        problems.append(problem)

    return problems

async def run_single_problem_async(
    client: httpx.AsyncClient,
    model: str,
    problem: dict,
    timeout_seconds: float = 120.0,
    max_retries: int = 0,
    max_tokens: int | None = None,
) -> dict:
    """단일 문제에 대해 모델 실행 (비동기)"""
    async with semaphore:
        messages = [{"role": "user", "content": problem["prompt"]}]

        if problem.get("context"):
            messages[0]["content"] = f"{problem['context']}\n\n{problem['prompt']}"

        start_time = time.time()
        print(f"  → {model} 시작 ({problem['id']})...", flush=True)
        try:
            generation_options = {}
            if max_tokens:
                generation_options["max_tokens"] = max_tokens

            result = await sam_generate_async(
                client,
                model,
                messages,
                timeout_seconds=timeout_seconds,
                max_retries=max_retries,
                **generation_options,
            )
            elapsed = time.time() - start_time
            print(f"  ✓ {model} 완료 ({problem['id']}) - {elapsed:.2f}s", flush=True)
            return {
                "problem_id": problem["id"],
                "model": model,
                "response": result.get("output", {}).get("content", ""),
                "latency_seconds": round(elapsed, 2),
                "timestamp": datetime.now().isoformat(),
                "tokens": result.get("usage", {}),
            }
        except Exception as e:
            elapsed = time.time() - start_time
            error_message = str(e) or repr(e)
            print(f"  ✗ {model} 에러 ({problem['id']}) - {elapsed:.2f}s: {error_message}", flush=True)
            return {
                "problem_id": problem["id"],
                "model": model,
                "error": error_message,
                "timestamp": datetime.now().isoformat(),
            }

async def run_benchmark_async(
    category: str = None,
    level: int = None,
    models: list[str] | None = None,
    limit_problems: int | None = None,
    problem_ids: list[str] | None = None,
    concurrency: int = DEFAULT_CONCURRENCY,
    timeout_seconds: float = 120.0,
    max_retries: int = 0,
    max_tokens: int | None = None,
    run_label: str | None = None,
):
    global semaphore
    semaphore = asyncio.Semaphore(max(1, concurrency))

    problems = load_problems(category, level)
    selected_models = models or TARGET_MODELS

    if problem_ids:
        wanted = set(problem_ids)
        problems = [problem for problem in problems if problem.get("id") in wanted]

    if limit_problems:
        problems = problems[:limit_problems]

    if not problems:
        print("실행할 문제가 없습니다. benchmarks/categories/ 에 문제를 추가하세요.")
        return

    print(f"📋 {len(problems)}개 문제 × {len(selected_models)}개 모델 = {len(problems) * len(selected_models)}회 실행 (비동기)")
    print(f"⚙️  동시성: {max(1, concurrency)}")
    print(f"⏱️  타임아웃: {timeout_seconds:.0f}s · 재시도: {max_retries}회")
    if max_tokens:
        print(f"🧾 max_tokens: {max_tokens}")
    print(f"🎯 모델: {', '.join(selected_models)}")
    print("=" * 60)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    label = safe_label(run_label)
    output_file = RESULTS_DIR / f"run_{run_id}{'_' + label if label else ''}.json"

    def write_results(current_results: list[dict], status: str = "running"):
        sorted_results = sorted(current_results, key=lambda x: (x.get("problem_id", ""), x.get("model", "")))
        output_data = {
            "run_id": f"run_{run_id}" + (f"_{label}" if label else ""),
            "run_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": status,
            "models": selected_models,
            "problem_count": len(problems),
            "model_count": len(selected_models),
            "expected_evaluations": len(problems) * len(selected_models),
            "completed_evaluations": len(sorted_results),
            "evaluations": sorted_results,
        }
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    # 비동기로 모든 태스크 수집
    tasks = []
    results = []
    async with httpx.AsyncClient() as client:
        for problem in problems:
            for model in selected_models:
                tasks.append(asyncio.create_task(run_single_problem_async(
                    client,
                    model,
                    problem,
                    timeout_seconds=timeout_seconds,
                    max_retries=max_retries,
                    max_tokens=max_tokens,
                )))
                
        try:
            for completed_count, task in enumerate(asyncio.as_completed(tasks), start=1):
                results.append(await task)
                if completed_count % 5 == 0 or completed_count == len(tasks):
                    write_results(results, status="running")
                    print(f"  … progress saved ({completed_count}/{len(tasks)})", flush=True)
        except (asyncio.CancelledError, KeyboardInterrupt):
            for task in tasks:
                task.cancel()
            write_results(results, status="interrupted")
            print(f"\n⚠️  중단됨. 부분 결과 저장: {output_file} ({len(results)}/{len(tasks)})")
            raise

    # 결과 저장 (problem_id, model 기준으로 정렬하면 보기 좋음)
    write_results(results, status="complete")

    print(f"\n{'=' * 60}")
    print(f"✅ 완료! 결과 저장: {output_file}")

def run_benchmark(
    category: str = None,
    level: int = None,
    models: list[str] | None = None,
    limit_problems: int | None = None,
    problem_ids: list[str] | None = None,
    concurrency: int = DEFAULT_CONCURRENCY,
    timeout_seconds: float = 120.0,
    max_retries: int = 0,
    max_tokens: int | None = None,
    run_label: str | None = None,
):
    """동기 환경 진입점"""
    asyncio.run(run_benchmark_async(
        category=category,
        level=level,
        models=models,
        limit_problems=limit_problems,
        problem_ids=problem_ids,
        concurrency=concurrency,
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
        max_tokens=max_tokens,
        run_label=run_label,
    ))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SAM 벤치마크 실행")
    parser.add_argument("--category", type=str, help="카테고리 필터")
    parser.add_argument("--level", type=int, help="난이도 필터 (1-4)")
    parser.add_argument("--all", action="store_true", help="전체 실행")
    parser.add_argument("--models", type=str, help="쉼표로 구분한 모델 목록")
    parser.add_argument("--models-file", type=Path, help="모델 목록 파일(JSON 배열 또는 줄 단위 텍스트)")
    parser.add_argument("--limit-problems", type=int, help="앞에서부터 N개 문제만 실행")
    parser.add_argument("--problem-ids", type=str, help="쉼표로 구분한 특정 문제 ID 목록")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY, help="동시 API 호출 수")
    parser.add_argument("--timeout", type=float, default=120.0, help="요청당 타임아웃(초)")
    parser.add_argument("--retries", type=int, default=0, help="5xx/타임아웃 재시도 횟수")
    parser.add_argument("--max-tokens", type=int, help="생성 max_tokens 옵션")
    parser.add_argument("--run-label", type=str, help="결과 파일명에 붙일 라벨")

    args = parser.parse_args()

    if not SAM_API_KEY:
        print("Error: SAM_API_KEY 환경 변수를 설정하세요.")
        sys.exit(1)

    selected_models = parse_models(args.models)
    if args.models_file:
        selected_models = load_models_from_file(args.models_file)

    selected_problem_ids = parse_models(args.problem_ids)

    run_benchmark(
        category=args.category,
        level=args.level,
        models=selected_models,
        limit_problems=args.limit_problems,
        problem_ids=selected_problem_ids,
        concurrency=args.concurrency,
        timeout_seconds=args.timeout,
        max_retries=max(0, args.retries),
        max_tokens=args.max_tokens,
        run_label=args.run_label,
    )
