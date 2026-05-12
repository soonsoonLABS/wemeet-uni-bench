# 🎓 wemeet-uni-bench

> 서울대학교 WE-Meet 산학연계 프로젝트 — 대학생을 위한 AI 모델 벤치마크 개발
>
> `soonsoonlabs/wemeet-uni-bench`

🌐 **[프로젝트 소개 페이지](https://soonsoonlabs.github.io/wemeet-uni-bench/)** · 🇺🇸 **[English README](README.en.md)**

---

## 프로젝트 개요

기존 LLM 벤치마크(MMLU, HumanEval, GPQA 등)는 해외 AI 연구진 중심으로 설계되어, 실제 한국 대학생들이 학업에서 AI를 활용할 때 체감하는 성능과 괴리가 있습니다.

**본 프로젝트의 목표:**
1. 기존 벤치마크 체계를 조사·분석
2. 대학생 관점에서 유의미한 평가 파라미터 도출
3. 실제 대학 과제·리서치·시험 시나리오 기반 벤치마크 문제 설계
4. SAM 플랫폼 내 다양한 모델에 대해 벤치마크 실행 및 결과 공개

---

## 팀 구성

| 역할 | 이름 | 소속 | 연락처 |
|------|------|------|--------|
| 멘토 | 송용성 | 순순팩토리 대표 / 강원대 AI콘텐츠공학과 겸임교수 | soonsoon@soonsoons.com |
| 학생 | 김태운 | 서울대학교 컴퓨터공학과 2학년 | listro002@snu.ac.kr |
| 학생 | 김호윤 | 서울대학교 재료공학과 2학년 | khoyun007@gmail.com |

---

## WE-Meet 프로그램 소개

서울대학교 WE-Meet(위밋)은 기업과 대학이 협력하여 학생들이 실제 산업 현장의 문제를 해결하며 실무 역량을 기르고 학점을 인정받는 산학연계 프로젝트입니다.

- **운영 방식**: 기업 재직자 멘토링 + 팀 프로젝트 수행 → 성과 평가(S/U)
- **특징**: 정규 교과목 학점 인정 가능, 재직자 멘토링
- **주요 분야**: 차세대반도체, 빅데이터, 그린바이오, AI 등 첨단 산업

---

## 프로젝트 구조

```
├── README.md                    # 프로젝트 소개
├── docs/
│   ├── project-plan.md          # 프로젝트 계획서
│   ├── benchmark-survey.md      # 기존 벤치마크 조사
│   └── evaluation-criteria.md   # 평가 기준 설계
├── benchmarks/
│   ├── categories/              # 벤치마크 카테고리별 문제
│   └── results/                 # 벤치마크 실행 결과
├── scripts/
│   └── run_benchmark.py         # 벤치마크 실행 스크립트
└── .github/
    └── ISSUE_TEMPLATE/          # 이슈 템플릿
```

---

## 기술 스택

- **AI 플랫폼**: [SAM by SoonsoonFactory](https://sam.soonsoon.ai)
- **언어**: Python (벤치마크 실행), Markdown (문서화)
- **협업**: GitHub Issues & Projects

---

## 참여 방법

1. 이슈 목록에서 할당된 작업 확인
2. 브랜치 생성 후 작업 (`feature/이슈번호-설명`)
3. PR 생성 및 리뷰 요청
4. 멘토 승인 후 머지

---

## 라이선스

MIT License

---

## 관련 링크

- [SAM Platform](https://sam.soonsoon.ai)
- [순순팩토리](https://soonsoon.ai)
- [서울대학교 WE-Meet](https://wemeet.snu.ac.kr)
