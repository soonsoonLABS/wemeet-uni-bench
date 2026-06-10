# 🚀 SNUN (WE-Meet 1기 팀)

**SNUN**은 멘토 기업인 순순팩토리(**Soonsoon**)와 서울대학교(**SNU**)를 결합하여 만든 명칭으로, 서울대학교 WE-Meet 산학연계 프로젝트에서 본 프로젝트의 1기 참여자인 **김태운**, **김호윤** 학생으로 구성된 프로젝트 팀입니다.

본 문서는 SNUN 팀이 "한국 대학생을 위한 AI 모델 벤치마크 개발(wemeet-uni-bench)" 프로젝트를 수행하며 진행한 리서치, 문제 설계 과정, 그리고 프로젝트 진행 기록을 남겨두기 위한 메인 문서로, SNUN 팀의 문서는 팀장인 김태운이 LLM 모델을 이용하여 작성했음을 밝힙니다.

## 👥 팀 구성 (WE-Meet 1기)

| 이름 | 소속 | 주요 연락처 |
|------|------|--------|
| **김태운** | 서울대학교 컴퓨터공학과 | listro002@snu.ac.kr |
| **김호윤** | 서울대학교 재료공학과 | khoyun007@gmail.com |

> 멘토: 송용성 (순순팩토리 대표 / soonsoon@soonsoons.com)

## 🎯 프로젝트 목표 및 방향성

기존의 AI 벤치마크(MMLU, HumanEval 등)가 영미권 및 전문 연구진 중심으로 설계되어 한국 대학생의 실제 학업 환경(과제, 시험, 논문 리서치 등)과 괴리가 있다는 문제의식에서 출발했습니다. 

SNUN 팀은 **"이 AI가 대학생의 실제 학업에 얼마나 도움이 되는가?"** 라는 질문을 바탕으로,
1. 대학생 관점에서 유의미한 평가 기준 설계
2. 실제 대학 과제 및 시험 시나리오 기반의 벤치마크 문제 도출
3. '최고 성능'만이 아닌 '내 상황에 맞는 적정 비용/성능' 모델을 찾을 수 있는 가이드라인 제시

위 세 가지를 목표로 벤치마크를 기획하고 있습니다.

## 📂 작업 및 진행 기록 (Docs)

이 디렉토리(`docs/SNUN/`) 하위에는 SNUN 팀이 매주 진행한 기획, 전략, 리서치 리포트가 저장됩니다. 프로젝트의 히스토리를 파악하고 진행 상황을 트래킹하는 용도로 활용됩니다.

```
├── README.md                                  # SNUN 팀 소개
├── SNUN_week2_docs/                           # 2주차 진행 문서
│   ├── playground_ktw_docs/                   # 플레이그라운드 관련 리포트
│   │   ├── playground_analysis_report.md      # 기존 플레이그라운드 분석 리포트
│   │   └── playground_comparison_report.md    # 기존과 새로운 버전 간 비교 리포트
│   └── scoring_bottleneck_analysis_about_Week2_Result.md # 채점 병목 현상 분석
├── SNUN_week3_docs/                           # 3주차 진행 문서
│   ├── week3_problem_structure_plan_report.md # 문제 구조 및 기획안
│   └── week3_strategy_report.md               # 벤치마크 전략 기획 리포트
└── SNUN_week4_docs/                           # 4주차 진행 문서
    ├── benchmark_refactoring_report.md        # 벤치마크 평가 로직 및 무결성 감사 리포트
    ├── week4_result_report.md                 # 4주차 결과 보고서
    └── week4_strategy_report.md               # 스트레스 테스트 양산 및 평가 파이프라인 기획 리포트
```

*(이후 진행에 따라 추가 문서들이 지속적으로 업데이트될 예정입니다.)*

---

## 🔗 관련 저장소 (Fork Repository)

본 프로젝트의 SNUN 팀 작업은 원본 저장소를 Fork하여 구성한 **[Listro02/wemeet-uni-bench](https://github.com/Listro02/wemeet-uni-bench)** 레포지토리에서 진행 및 관리되고 있었습니다.

---

> 본 자료는 팀장 김태운이 프로젝트의 성과 정리 및 다음 기수 학생들에게 공유하기 위한 목적으로 문서화를 진행한 자료입니다.
