"""
결과 분석 및 요약 생성 (analyze_results.py)

채점 결과가 저장된 evaluation 디렉토리의 파일들을 읽어 모델별 통과율, 치명적 실패(환각, 동조 등)의 비율을 집계하고
결과를 summary.md 형태의 리포트로 생성합니다.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime

BENCHMARKS_DIR = Path(__file__).parent.parent / "benchmarks"
EVALUATION_DIR = BENCHMARKS_DIR / "results" / "stress-eval" / "evaluation"
SUMMARY_FILE = Path(__file__).parent.parent / "website" / "eval" / "data" / "summary.md"
STRESS_PROBLEMS_FILE = Path(__file__).parent.parent / "website" / "eval" / "data" / "stress_problems.json"

def analyze(target_file: Path = None):
    if not EVALUATION_DIR.exists():
        print(f"Error: {EVALUATION_DIR} 디렉토리가 없습니다.")
        sys.exit(1)
        
    # Load stress_problems mapping
    problem_to_category = {}
    if STRESS_PROBLEMS_FILE.exists():
        with open(STRESS_PROBLEMS_FILE, "r", encoding="utf-8") as f:
            sp_data = json.load(f)
            for p in sp_data.get("problems", []):
                problem_to_category[p["id"]] = p["stress_category"]

    model_stats = defaultdict(lambda: {
        "total": 0,
        "passed": 0,
        "critical_failures": 0,
        "critical_by_category": defaultdict(int),
        "passed_by_category": defaultdict(int),
        "total_by_category": defaultdict(int),
        "failure_types": defaultdict(int)
    })
    
    if target_file:
        if not target_file.exists():
            print(f"Error: 파일을 찾을 수 없습니다: {target_file}")
            sys.exit(1)
        graded_files = [target_file]
        print(f"📋 지정된 결과 파일을 분석합니다: {target_file.name}")
    else:
        # 기본적으로 가장 최근에 생성/수정된 graded_run_*.json 파일 하나만 분석
        all_files = list(EVALUATION_DIR.glob("graded_*.json"))
        if not all_files:
            print(f"Error: 채점된 파일이 없습니다.")
            sys.exit(1)
        latest_file = max(all_files, key=lambda p: p.stat().st_mtime)
        graded_files = [latest_file]
        print(f"📋 가장 최근 결과 파일을 분석합니다: {latest_file.name}")
        
    for file_path in graded_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for eval_data in data.get("evaluations", []):
            model = eval_data.get("model", "unknown")
            grade = eval_data.get("grade", {})
            
            problem_id = eval_data.get("problem_id", "unknown")
            cat = problem_to_category.get(problem_id, "unknown")

            # 카운트 증가
            model_stats[model]["total"] += 1
            model_stats[model]["total_by_category"][cat] += 1

            if grade.get("overall_pass"):
                model_stats[model]["passed"] += 1
                model_stats[model]["passed_by_category"][cat] += 1
                
            criticals = grade.get("critical_failures", [])
            if criticals:
                model_stats[model]["critical_failures"] += 1
                model_stats[model]["critical_by_category"][cat] += 1
                    
                for c in criticals:
                    model_stats[model]["failure_types"][c] += 1

    # 마크다운 리포트 생성
    report_lines = []
    report_lines.append(f"# 모델별 스트레스 테스트 평가 요약")
    report_lines.append(f"**분석 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append(f"**분석된 파일 수**: {len(graded_files)}개")
    for f in graded_files:
        report_lines.append(f"- {f.name}")
    report_lines.append("")
    
    report_lines.append("## 모델별 통과율 및 치명적 실패율 요약\n")
    report_lines.append("| 모델 | 전체 통과율 | 거짓 전제 (Pass) | 거짓 전제 (Critical Fail) | 가짜 개념 (Pass) | 가짜 개념 (Critical Fail) | 레거시 강요 (Pass) | 레거시 강요 (Critical Fail) | 자기 모순 (Pass) | 자기 모순 (Critical Fail) |")
    report_lines.append("|---|---|---|---|---|---|---|---|---|---|")
    
    for model, stats in sorted(model_stats.items(), key=lambda x: x[1]["passed"] / max(x[1]["total"], 1), reverse=True):
        total = stats["total"]
        pass_rate = (stats["passed"] / total) * 100 if total > 0 else 0
        
        c_pass = stats["passed_by_category"]
        c_fail = stats["critical_by_category"]
        c_tot = stats["total_by_category"]
        
        report_lines.append(
            f"| **{model}** | {pass_rate:.1f}% ({stats['passed']}/{total}) | "
            f"{c_pass['false_premise']}/{c_tot['false_premise']} | {c_fail['false_premise']}/{c_tot['false_premise']} | "
            f"{c_pass['fabricated_concept']}/{c_tot['fabricated_concept']} | {c_fail['fabricated_concept']}/{c_tot['fabricated_concept']} | "
            f"{c_pass['legacy_enforcement']}/{c_tot['legacy_enforcement']} | {c_fail['legacy_enforcement']}/{c_tot['legacy_enforcement']} | "
            f"{c_pass['self_contradiction']}/{c_tot['self_contradiction']} | {c_fail['self_contradiction']}/{c_tot['self_contradiction']} |"
        )
        
    report_lines.append("\n## 모델별 주요 실패 원인 (Critical Failures Breakdown)\n")
    for model, stats in sorted(model_stats.items()):
        report_lines.append(f"### {model}")
        if not stats["failure_types"]:
            report_lines.append("- 치명적 실패 없음")
        else:
            for failure, count in sorted(stats["failure_types"].items(), key=lambda x: x[1], reverse=True):
                report_lines.append(f"- `{failure}`: {count}건")
        report_lines.append("")

    report_content = "\n".join(report_lines)
    
    SUMMARY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"📊 분석 완료. 요약 리포트 저장: {SUMMARY_FILE}")
    print(report_content)

if __name__ == "__main__":
    target = None
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    analyze(target)
