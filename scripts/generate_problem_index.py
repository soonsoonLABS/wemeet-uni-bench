"""
벤치마크 문제 인덱스 빌드 스크립트

benchmarks/categories/ 내의 모든 JSON 문제 파일을 스캔하여:
1. problems.json 인덱스 파일 생성
2. 개별 문제 파일을 website/playground_ktw/data/ 경로로 복사

사용법:
    python scripts/generate_problem_index.py
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

# 경로 설정
PROJECT_ROOT = Path(__file__).parent.parent
CATEGORIES_DIR = PROJECT_ROOT / "benchmarks" / "categories"
OUTPUT_DIR = PROJECT_ROOT / "website" / "playground_ktw" / "data"
EVAL_OUTPUT_DIR = PROJECT_ROOT / "website" / "eval" / "data"
LABELS_FILE = PROJECT_ROOT / "benchmarks" / "category_labels.json"

# 기본 카테고리 라벨 매핑
DEFAULT_CATEGORY_LABELS = {
    "algorithms": "알고리즘",
    "data_structures": "자료구조",
    "coding": "코딩",
    "materials": "재료공학",
    "academic_writing": "학술 글쓰기",
    "data_analysis": "데이터 분석",
    "research": "리서치",
    "learning": "학습 보조",
    "math": "수학",
    "physics": "물리",
    "chemistry": "화학",
    "general": "일반",
}

def load_category_labels():
    """category_labels.json 파일이 있으면 불러오고, 없으면 기본값을 사용"""
    labels = DEFAULT_CATEGORY_LABELS.copy()
    if LABELS_FILE.exists():
        try:
            with open(LABELS_FILE, "r", encoding="utf-8") as f:
                custom_labels = json.load(f)
            labels.update(custom_labels)
            print(f"[INFO] 카테고리 라벨 설정 로드 완료: {LABELS_FILE.name}")
        except Exception as e:
            print(f"[WARN] 카테고리 라벨 설정 로드 실패 (기본값 사용): {e}")
    return labels

# 실행 시 로드할 전역 카테고리 라벨 딕셔너리
CATEGORY_LABELS = load_category_labels()



def scan_problems():
    """benchmarks/categories/ 내의 모든 JSON 파일을 스캔"""
    problems = []

    if not CATEGORIES_DIR.exists():
        print(f"[WARN] 디렉토리 없음: {CATEGORIES_DIR}")
        return problems

    for json_file in sorted(CATEGORIES_DIR.glob("**/*.json")):
        # .gitkeep 등 무시
        if json_file.name.startswith("."):
            continue

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # 필수 필드 검증
            if "id" not in data or "prompt" not in data:
                print(f"[WARN] 필수 필드 누락, 건너뜀: {json_file.name}")
                continue

            problems.append({
                "data": data,
                "filename": json_file.name,
                "path": json_file,
            })
            print(f"  [OK] {json_file.name} → {data['id']}")

        except json.JSONDecodeError as e:
            print(f"  [FAIL] JSON 파싱 실패: {json_file.name} — {e}")
        except Exception as e:
            print(f"  [FAIL] 오류: {json_file.name} — {e}")

    return problems


def build_tree(problems):
    """카테고리별 트리 구조 생성"""
    tree = {}

    for p in problems:
        data = p["data"]
        category = data.get("category", "general")

        if category not in tree:
            tree[category] = {
                "label": CATEGORY_LABELS.get(category, category),
                "problems": [],
            }

        tree[category]["problems"].append({
            "id": data["id"],
            "subject": data.get("subject", data.get("title", data["id"])),
            "difficulty": data.get("difficulty", data.get("level", "?")),
            "file": p["filename"],
        })

    # 각 카테고리 내에서 id 순으로 정렬
    for cat in tree.values():
        cat["problems"].sort(key=lambda x: x["id"])

    return tree


def generate_index(problems, tree):
    """problems.json 인덱스 파일 생성"""
    index = {
        "generated_at": datetime.now().isoformat(),
        "total": len(problems),
        "tree": tree,
    }
    return index


def copy_files(problems):
    """개별 문제 파일을 data/ 디렉토리로 복사"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for p in problems:
        src = p["path"]
        dst = OUTPUT_DIR / p["filename"]
        shutil.copy2(src, dst)
        
        # stress_category가 있는 경우 eval/data/ 에도 복사
        if "stress_category" in p["data"]:
            eval_dst = EVAL_OUTPUT_DIR / p["filename"]
            shutil.copy2(src, eval_dst)


def main():
    print("=" * 60)
    print("[INDEX] Benchmark Problem Index Builder")
    print(f"   소스: {CATEGORIES_DIR}")
    print(f"   출력: {OUTPUT_DIR}")
    print("=" * 60)
    print()

    # 1. 스캔
    print("[1/3] 문제 파일 스캔...")
    problems = scan_problems()
    print(f"      → {len(problems)}개 문제 발견")
    print()

    if not problems:
        print("[WARN] 등록된 문제가 없습니다. benchmarks/categories/ 에 문제를 추가하세요.")
        # 빈 인덱스라도 생성
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        empty_index = {
            "generated_at": datetime.now().isoformat(),
            "total": 0,
            "tree": {},
        }
        index_path = OUTPUT_DIR / "problems.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(empty_index, f, ensure_ascii=False, indent=2)
        print(f"   빈 인덱스 생성: {index_path}")
        return

    # 2. 트리 생성
    print("[2/3] 카테고리 트리 생성...")
    tree = build_tree(problems)
    for cat_key, cat_val in tree.items():
        print(f"      {cat_val['label']} ({cat_key}): {len(cat_val['problems'])}개")

    # 3. 인덱스 생성 및 파일 복사
    print()
    print("[3/3] 인덱스 생성 및 파일 복사...")
    index = generate_index(problems, tree)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 인덱스 저장
    index_path = OUTPUT_DIR / "problems.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"      → {index_path}")

    # 스트레스 테스트 전용 인덱스 저장
    stress_problems = [p["data"] for p in problems if "stress_category" in p["data"]]
    stress_index = {
        "generated_at": datetime.now().isoformat(),
        "total": len(stress_problems),
        "problems": stress_problems
    }
    stress_index_path = EVAL_OUTPUT_DIR / "stress_problems.json"
    with open(stress_index_path, "w", encoding="utf-8") as f:
        json.dump(stress_index, f, ensure_ascii=False, indent=2)
    print(f"      → {stress_index_path} (스트레스 문제: {len(stress_problems)}개)")

    # 파일 복사
    copy_files(problems)
    print(f"      → {len(problems)}개 파일 복사 완료")

    print()
    print("=" * 60)
    print(f"[DONE] Build complete! {len(problems)} problems, {len(stress_problems)} stress tests")
    print("=" * 60)


if __name__ == "__main__":
    main()
