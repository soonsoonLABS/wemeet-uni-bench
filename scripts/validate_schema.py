"""
스키마 유효성 검증기 (Schema Validator)

스트레스 테스트 문제 JSON이 정형 스키마를 준수하는지 자동 검증합니다.

사용법:
    # 전체 스트레스 테스트 문제 검증
    python scripts/validate_schema.py

    # 특정 파일 검증
    python scripts/validate_schema.py --file benchmarks/categories/stress_tests/false_premise/cs_taewoon_008.json
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
STRESS_TESTS_DIR = PROJECT_ROOT / "benchmarks" / "categories" / "stress_tests"

# 허용되는 stress_category 값
VALID_STRESS_CATEGORIES = {
    "false_premise",
    "fabricated_concept",
    "legacy_enforcement",
    "self_contradiction",
}

# 필수 최상위 필드
REQUIRED_FIELDS = ["id", "stress_category", "prompt", "expected_output", "rubric"]

# 선택 필드 (있으면 좋은 필드)
OPTIONAL_FIELDS = ["domain_category", "subject", "difficulty", "language", "purpose"]


def validate_problem(filepath: Path) -> dict:
    """
    단일 문제 파일에 대한 스키마 검증.

    Returns:
        dict: { "valid": bool, "errors": list[str], "warnings": list[str] }
    """
    errors = []
    warnings = []

    # 1. JSON 파싱
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return {"valid": False, "errors": [f"JSON 파싱 실패: {e}"], "warnings": []}

    # 2. 필수 필드 존재 여부
    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"필수 필드 누락: '{field}'")

    if errors:
        return {"valid": False, "errors": errors, "warnings": warnings}

    # 3. stress_category 값 유효성
    sc = data.get("stress_category")
    if sc not in VALID_STRESS_CATEGORIES:
        errors.append(
            f"stress_category 값 '{sc}'이 유효하지 않습니다. "
            f"허용 값: {', '.join(sorted(VALID_STRESS_CATEGORIES))}"
        )

    # 4. rubric 키 일관성 검사
    rubric = data.get("rubric", {})
    expected_output = data.get("expected_output", {})
    must_include = expected_output.get("must_include", {})
    must_not_include = expected_output.get("must_not_include", {})

    all_mapped_keys = set(must_include.keys()) | set(must_not_include.keys())

    for rubric_key in rubric.keys():
        if rubric_key not in all_mapped_keys:
            warnings.append(
                f"rubric 키 '{rubric_key}'가 must_include 또는 must_not_include에 매핑되지 않음 "
                f"(자동 채점 시 해당 항목은 항상 PASS 처리됨)"
            )

    for mapped_key in all_mapped_keys:
        if mapped_key not in rubric:
            errors.append(
                f"expected_output에 '{mapped_key}' 키가 있으나 rubric에 해당 키가 없음"
            )

    # 5. must_include 차원 검증 (2차원 배열)
    for key, groups in must_include.items():
        if not isinstance(groups, list):
            errors.append(f"must_include['{key}']가 배열이 아닙니다")
            continue
        for i, group in enumerate(groups):
            if not isinstance(group, list):
                errors.append(
                    f"must_include['{key}'][{i}]가 배열이 아닙니다 "
                    f"(AND of ORs 구조: 2차원 배열 필요)"
                )
            elif len(group) == 0:
                warnings.append(f"must_include['{key}'][{i}]가 빈 배열입니다")

    # 6. must_not_include 차원 검증 (1차원 배열)
    for key, forbidden in must_not_include.items():
        if not isinstance(forbidden, list):
            errors.append(f"must_not_include['{key}']가 배열이 아닙니다")
            continue
        for item in forbidden:
            if isinstance(item, list):
                errors.append(
                    f"must_not_include['{key}']에 중첩 배열이 있습니다 "
                    f"(NOR 구조: 1차원 배열 필요)"
                )
                break

    # 7. 선택 필드 경고
    for field in OPTIONAL_FIELDS:
        if field not in data:
            warnings.append(f"선택 필드 누락: '{field}' (없어도 동작하지만 메타데이터 완성도가 떨어짐)")

    # 8. 파일명 규칙 검사 (권장)
    filename = filepath.stem  # 확장자 제거
    file_id = data.get("id", "")
    if filename != file_id:
        warnings.append(
            f"파일명 '{filename}'과 id '{file_id}'가 불일치 "
            f"(권장: 파일명과 id를 동일하게 유지)"
        )

    valid = len(errors) == 0
    return {"valid": valid, "errors": errors, "warnings": warnings}


def validate_all(directory: Path = None) -> list:
    """
    디렉토리 내 모든 스트레스 테스트 JSON 파일을 검증합니다.

    Returns:
        list[dict]: 각 파일의 검증 결과
    """
    target_dir = directory or STRESS_TESTS_DIR
    results = []

    if not target_dir.exists():
        print(f"Error: 디렉토리를 찾을 수 없습니다: {target_dir}")
        return results

    json_files = sorted(target_dir.glob("**/*.json"))
    json_files = [f for f in json_files if not f.name.startswith(".")]

    if not json_files:
        print(f"검증할 JSON 파일이 없습니다: {target_dir}")
        return results

    for filepath in json_files:
        result = validate_problem(filepath)
        result["file"] = str(filepath.relative_to(PROJECT_ROOT))
        results.append(result)

    return results


# ─── CLI 실행 ───
if __name__ == "__main__":
    import argparse
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    parser = argparse.ArgumentParser(description="스트레스 테스트 스키마 검증기")
    parser.add_argument(
        "--file", type=str, help="특정 파일 검증 (경로)"
    )
    args = parser.parse_args()

    print(f"\n{'=' * 60}")
    print("🔍 스트레스 테스트 스키마 검증기")
    print(f"{'=' * 60}\n")

    if args.file:
        filepath = Path(args.file)
        if not filepath.is_absolute():
            filepath = PROJECT_ROOT / filepath
        if not filepath.exists():
            print(f"Error: 파일을 찾을 수 없습니다: {filepath}")
            sys.exit(1)

        result = validate_problem(filepath)
        results = [{"file": str(filepath), **result}]
    else:
        print(f"검증 대상 디렉토리: {STRESS_TESTS_DIR}\n")
        results = validate_all()

    # 결과 출력
    total = len(results)
    passed = sum(1 for r in results if r["valid"])
    failed = total - passed

    for r in results:
        status = "✅ PASS" if r["valid"] else "❌ FAIL"
        print(f"  {status}  {r['file']}")

        for err in r.get("errors", []):
            print(f"         🔴 {err}")
        for warn in r.get("warnings", []):
            print(f"         🟡 {warn}")
        print()

    print(f"{'=' * 60}")
    print(f"  결과: {passed}/{total} 통과", end="")
    if failed > 0:
        print(f" ({failed}개 실패)")
    else:
        print(" ✓")
    print(f"{'=' * 60}")

    sys.exit(0 if failed == 0 else 1)
