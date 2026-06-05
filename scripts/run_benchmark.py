"""
SAM API를 활용한 벤치마크 실행 스크립트 (비동기 처리 지원)

사용법:
    python scripts/run_benchmark.py --category false_premise
    python scripts/run_benchmark.py --all
"""

import asyncio
import httpx
import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# SAM API 설정
SAM_API_KEY = os.getenv("SAM_API_KEY")
if not SAM_API_KEY:
    print("Error: SAM_API_KEY 환경 변수를 설정하세요.")
    sys.exit(1)
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
semaphore = asyncio.Semaphore(10)

async def sam_generate_async(client: httpx.AsyncClient, model: str, messages: list, **options) -> dict:
    """SAM /v1/generate 호출 (비동기)"""
    try:
        response = await client.post(
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
            print(f"  [{model}] Rate limited. Waiting {retry_after}s...")
            await asyncio.sleep(retry_after)
            return await sam_generate_async(client, model, messages, **options)
            
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise

def load_problems(category: str = None, level: int = None) -> list:
    """벤치마크 문제 로드"""
    problems = []
    categories_dir = BENCHMARKS_DIR / "categories"

    if not categories_dir.exists():
        print(f"Error: {categories_dir} 디렉토리가 없습니다.")
        return problems

    for problem_file in categories_dir.glob("stress_tests/**/*.json"):
        with open(problem_file, encoding="utf-8") as f:
            problem = json.load(f)

        if category and problem.get("stress_category") != category and problem.get("category") != category:
            continue
        if level and problem.get("level") != level:
            continue

        problems.append(problem)

    return problems

async def run_single_problem_async(client: httpx.AsyncClient, model: str, problem: dict) -> dict:
    """단일 문제에 대해 모델 실행 (비동기)"""
    async with semaphore:
        messages = [{"role": "user", "content": problem["prompt"]}]

        if problem.get("context"):
            messages[0]["content"] = f"{problem['context']}\n\n{problem['prompt']}"

        start_time = time.time()
        print(f"  → {model} 시작 ({problem['id']})...", flush=True)
        try:
            result = await sam_generate_async(client, model, messages)
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
            print(f"  ✗ {model} 에러 ({problem['id']}) - {elapsed:.2f}s: {e}", flush=True)
            return {
                "problem_id": problem["id"],
                "model": model,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

async def run_benchmark_async(category: str = None, level: int = None):
    problems = load_problems(category, level)

    if not problems:
        print("실행할 문제가 없습니다. benchmarks/categories/ 에 문제를 추가하세요.")
        return

    print(f"📋 {len(problems)}개 문제 × {len(TARGET_MODELS)}개 모델 = {len(problems) * len(TARGET_MODELS)}회 실행 (비동기)")
    print("=" * 60)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 비동기로 모든 태스크 수집
    tasks = []
    async with httpx.AsyncClient() as client:
        for problem in problems:
            for model in TARGET_MODELS:
                tasks.append(run_single_problem_async(client, model, problem))
                
        # 병렬 실행 대기
        results = await asyncio.gather(*tasks)

    # 결과 저장 (problem_id, model 기준으로 정렬하면 보기 좋음)
    results = sorted(results, key=lambda x: (x.get("problem_id", ""), x.get("model", "")))
    
    output_data = {
        "run_id": f"run_{run_id}",
        "run_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "evaluations": results
    }
    
    output_file = RESULTS_DIR / f"run_{run_id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"✅ 완료! 결과 저장: {output_file}")

def run_benchmark(category: str = None, level: int = None):
    """동기 환경 진입점"""
    asyncio.run(run_benchmark_async(category, level))

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SAM 벤치마크 실행")
    parser.add_argument("--category", type=str, help="카테고리 필터")
    parser.add_argument("--level", type=int, help="난이도 필터 (1-4)")
    parser.add_argument("--all", action="store_true", help="전체 실행")

    args = parser.parse_args()
    run_benchmark(category=args.category, level=args.level)
