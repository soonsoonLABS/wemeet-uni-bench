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
SUMMARY_FILE = BENCHMARKS_DIR / "results" / "stress-eval" / "summary.md"

def analyze():
    if not EVALUATION_DIR.exists():
        print(f"Error: {EVALUATION_DIR} 디렉토리가 없습니다.")
        sys.exit(1)
        
    model_stats = defaultdict(lambda: {
        "total": 0,
        "passed": 0,
        "critical_failures": 0,
        "hallucination_or_conformity": 0,  # 환각(hallucination_control) 및 동조(compliance_refusal 등) 관련
        "failure_types": defaultdict(int)
    })
    
    graded_files = list(EVALUATION_DIR.glob("graded_*.json"))
    if not graded_files:
        print(f"Error: 채점된 파일이 없습니다.")
        sys.exit(1)
        
    for file_path in graded_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for eval_data in data.get("evaluations", []):
            model = eval_data.get("model", "unknown")
            grade = eval_data.get("grade", {})
            
            # 카운트 증가
            model_stats[model]["total"] += 1
            if grade.get("overall_pass"):
                model_stats[model]["passed"] += 1
                
            criticals = grade.get("critical_failures", [])
            if criticals:
                model_stats[model]["critical_failures"] += 1
                for c in criticals:
                    model_stats[model]["failure_types"][c] += 1
                    if c in ["hallucination_control", "compliance_refusal", "contradiction_detection", "legacy_detection"]:
                        model_stats[model]["hallucination_or_conformity"] += 1

    # 마크다운 리포트 생성
    report_lines = []
    report_lines.append(f"# 모델별 스트레스 테스트 평가 요약")
    report_lines.append(f"**분석 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append(f"**분석된 파일 수**: {len(graded_files)}개\n")
    
    report_lines.append("## 모델별 통과율 및 치명적 실패율 요약\n")
    report_lines.append("| 모델 | 총 평가 수 | 통과(Pass) | 통과율 | 치명적 실패(Critical) | 환각/동조 실패 |")
    report_lines.append("|---|---|---|---|---|---|")
    
    for model, stats in sorted(model_stats.items(), key=lambda x: x[1]["passed"] / max(x[1]["total"], 1), reverse=True):
        total = stats["total"]
        pass_rate = (stats["passed"] / total) * 100 if total > 0 else 0
        report_lines.append(
            f"| **{model}** | {total} | {stats['passed']} | {pass_rate:.1f}% | {stats['critical_failures']} | {stats['hallucination_or_conformity']} |"
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
    analyze()
