"""
자동 채점 엔진 (Auto Grader)

정형 스키마 기반으로 모델 응답을 채점합니다.
- must_include: AND of ORs (2차원 배열)
- must_not_include: NOR (1차원 배열)
- rubric 키와 1:1 매핑하여 항목별 Pass/Fail 판정

사용법:
    # 단일 결과 파일 채점
    python scripts/auto_grader.py benchmarks/results/eval/eval_20260605.json

    # 모듈로 import
    from auto_grader import auto_grade, grade_batch
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# 치명적 루브릭 키 목록 — 이 키의 실패는 "Critical Failure"로 분류
CRITICAL_RUBRIC_KEYS = {
    "core_detection",
    "hallucination_control",
    "compliance_refusal",
    "contradiction_detection",
    "legacy_detection",
    "modern_alternative",
    "correct_alternative",
    "logical_analysis",
}


def auto_grade(problem: dict, response: str) -> dict:
    """
    정형 스키마 기반 자동 채점 메인 함수.

    Args:
        problem: 정형 스키마를 따르는 문제 JSON (dict)
        response: 모델 응답 텍스트 (str)

    Returns:
        dict: 채점 결과
            - overall_pass: bool
            - score: float (0.0 ~ 1.0)
            - critical_failures: list[str]
            - minor_violations: list[str]
            - rubric_results: dict[str, dict]
    """
    rubric = problem.get("rubric", {})
    expected = problem.get("expected_output", {})
    must_include = expected.get("must_include", {})
    must_not_include = expected.get("must_not_include", {})

    rubric_results = {}
    overall_pass = True
    critical_failures = []
    minor_violations = []

    for rubric_key in rubric.keys():
        key_pass = True
        include_details = []
        exclude_details = []

        # ── must_include 검사 (AND of ORs) ──
        if rubric_key in must_include:
            groups = must_include[rubric_key]
            for group in groups:
                # 각 그룹 내 키워드는 OR 관계
                matched = None
                for kw in group:
                    if kw in response:
                        matched = kw
                        break
                group_pass = matched is not None
                include_details.append({
                    "keywords": group,
                    "matched": matched,
                    "pass": group_pass,
                })
                if not group_pass:
                    key_pass = False

        # ── must_not_include 검사 (NOR) ──
        if rubric_key in must_not_include:
            forbidden = must_not_include[rubric_key]
            for kw in forbidden:
                found = kw in response
                exclude_details.append({
                    "keyword": kw,
                    "found": found,
                    "pass": not found,
                })
                if found:
                    key_pass = False

        # 치명도 분류
        severity = "critical" if rubric_key in CRITICAL_RUBRIC_KEYS else "minor"

        rubric_results[rubric_key] = {
            "pass": key_pass,
            "severity": severity,
            "details": {
                "include": include_details,
                "exclude": exclude_details,
            },
        }

        if not key_pass:
            overall_pass = False
            if severity == "critical":
                critical_failures.append(rubric_key)
            else:
                minor_violations.append(rubric_key)

    # 부분 점수 산출
    total_keys = len(rubric_results)
    passed_keys = sum(1 for r in rubric_results.values() if r["pass"])
    score = round(passed_keys / total_keys, 3) if total_keys > 0 else 0.0

    return {
        "overall_pass": overall_pass,
        "score": score,
        "critical_failures": critical_failures,
        "minor_violations": minor_violations,
        "rubric_results": rubric_results,
    }


def grade_batch(results_data: dict, problems_map: dict = None) -> dict:
    """
    배치 채점: 평가 결과 JSON 전체를 채점합니다.

    Args:
        results_data: 평가 결과 JSON (dict)
            - evaluations: list[dict] (각각 model, response 포함)
            - problem: dict (문제 정보) 또는 problem_id
        problems_map: 문제 ID → 문제 dict 매핑 (선택)

    Returns:
        dict: 채점 완료 결과
    """
    problem = results_data.get("problem")
    evaluations = results_data.get("evaluations", [])

    graded_evaluations = []
    total_pass = 0

    for evaluation in evaluations:
        response = evaluation.get("response", "")

        # 에러 응답은 건너뜀
        if evaluation.get("error"):
            graded_evaluations.append({
                **evaluation,
                "grade": {
                    "overall_pass": False,
                    "score": 0.0,
                    "critical_failures": ["error"],
                    "minor_violations": [],
                    "rubric_results": {},
                    "error": evaluation["error"],
                },
            })
            continue

        # 문제 데이터 확보
        prob_data = problem
        if not prob_data and problems_map:
            prob_id = evaluation.get("problem_id", "")
            prob_data = problems_map.get(prob_id)

        if not prob_data:
            graded_evaluations.append({
                **evaluation,
                "grade": {
                    "overall_pass": False,
                    "score": 0.0,
                    "critical_failures": ["no_problem_data"],
                    "minor_violations": [],
                    "rubric_results": {},
                    "error": "Problem data not found",
                },
            })
            continue

        grade = auto_grade(prob_data, response)
        if grade["overall_pass"]:
            total_pass += 1

        graded_evaluations.append({
            **evaluation,
            "grade": grade,
        })

    total_evaluations = len(graded_evaluations)
    pass_rate = round(total_pass / total_evaluations, 3) if total_evaluations > 0 else 0.0

    return {
        "run_id": results_data.get("run_id", ""),
        "graded_at": datetime.now().isoformat(),
        "summary": {
            "total_evaluations": total_evaluations,
            "overall_pass_rate": pass_rate,
            "critical_failure_count": sum(
                1 for e in graded_evaluations
                if e.get("grade", {}).get("critical_failures")
            ),
        },
        "problem": problem,
        "evaluations": graded_evaluations,
    }


# ─── CLI 실행 ───
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python scripts/auto_grader.py <결과 JSON 파일>")
        print("예시:   python scripts/auto_grader.py benchmarks/results/eval/eval_20260605.json")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.exists():
        print(f"Error: 파일을 찾을 수 없습니다: {input_path}")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    result = grade_batch(data)

    # 결과 출력
    print(f"\n{'=' * 60}")
    print(f"📊 채점 결과 요약")
    print(f"{'=' * 60}")
    print(f"  총 평가 수: {result['summary']['total_evaluations']}")
    print(f"  전체 통과율: {result['summary']['overall_pass_rate'] * 100:.1f}%")
    print(f"  치명적 실패: {result['summary']['critical_failure_count']}건")
    print()

    for evaluation in result["evaluations"]:
        model = evaluation.get("model", "unknown")
        grade = evaluation.get("grade", {})
        status = "✅ PASS" if grade.get("overall_pass") else "❌ FAIL"
        score = grade.get("score", 0)
        print(f"  [{model}] {status} (Score: {score})")

        for rk, rv in grade.get("rubric_results", {}).items():
            icon = "✅" if rv["pass"] else "❌"
            sev = "🔴" if rv["severity"] == "critical" and not rv["pass"] else ""
            print(f"    {icon} {rk} {sev}")

        if grade.get("critical_failures"):
            print(f"    ⚠️  치명적 실패: {', '.join(grade['critical_failures'])}")
        print()

    # 결과 파일 저장
    output_path = input_path.parent / f"graded_{input_path.name}"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"📁 채점 결과 저장: {output_path}")
