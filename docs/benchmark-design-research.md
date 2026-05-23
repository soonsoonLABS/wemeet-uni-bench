# 벤치마크 설계를 위한 종합 리서치 리포트

> 작성일: 2025-05-23
> 목적: 대학생 수준 AI 학습 도움도 벤치마크의 평가 축과 난이도 체계를 설계하기 위한 선행 연구 조사

---

## 1. 연구 배경 및 목표

### 우리 프로젝트의 최종 방향

대학생 수준(100점 기준)의 **종합 학습 도움도 벤치마크**를 만들고, 그 기준을 아래로 스케일링하여 고등→중등→초등까지 확장 가능한 체계를 설계한다.

### 현재까지의 입력 자료

1. **1주차 조사** — 기존 벤치마크 10종+ 분석, 난이도 갭 확인
2. **2주차 김태운 학생 문제 11개** — 5개 도메인 × 5개 능력 축 도출
3. **위에서 정리한 확장 프레임워크** — 10개 능력 축 × 8개 도메인 축 (잠정)

---

## 2. 관련 연구 — 교육 AI 벤치마크 최신 동향

### 2.1 OpenLearnLM (2025.01, arXiv 2601.13882)

교육용 LLM을 위한 통합 평가 프레임워크. **Knowledge-Skill-Attitude** 3축 평가.

- **Knowledge** — 교과 내용 지식 (Bloom의 기억/이해 수준)
- **Skill** — 실제 적용 능력 (Bloom의 적용/분석/평가/창조)
- **Attitude** — 교육적 태도 (안전성, 공정성, 학습자 존중)

124K+ 문항, 다수 과목, Bloom's Taxonomy 기반 난이도 레벨.

**핵심 발견:** 어떤 단일 모델도 모든 차원에서 지배적이지 않음 → 다축 평가의 필요성 검증.

> 시사점: 우리도 단일 점수가 아닌 다축 프로파일로 결과를 제시해야 함.

### 2.2 SHAPE Benchmark (2025.06, arXiv 2604.22134)

**Safety + Helpfulness + Pedagogy** 통합 벤치마크. 9,087개 학생-질문 쌍.

- 학생의 지식 숙달 상태를 그래프로 모델링
- "적대적 압력" 하에서 튜터링 행동 평가
- 안전성(정답 직접 제공 금지) vs 도움됨(학습 유도) 사이의 균형 측정

> 시사점: 우리 "학습 유도" 축과 직접 연결. 김태운 학생의 005, 009번 문제가 이 방향.

### 2.3 Pedagogical Ability Taxonomy (2024.12, arXiv 2412.09416)

LLM 튜터의 교육적 능력을 **8개 차원**으로 분류:

1. Mistake Identification (오류 식별)
2. Hint Provision (힌트 제공)
3. Scaffolding (비계 설정)
4. Explanation Quality (설명 품질)
5. Encouraging Self-Correction (자기 교정 유도)
6. Adaptive Difficulty (난이도 적응)
7. Motivational Support (동기 부여)
8. Knowledge Assessment (지식 평가)

**핵심 발견:** 모든 프론티어 모델이 60% 미만의 통과율 → LLM 튜터링은 아직 미성숙.

> 시사점: 우리 "학습 유도" 축을 이 8개로 세분화할 수 있음.

### 2.4 SafeTutors (2025.03, arXiv 2603.17373)

AI 튜터링 시스템의 안전성 벤치마크. **11개 위해 차원, 48개 하위 위험**.

- 멀티턴 대화에서 교육적 실패율이 17.7% → 77.8%로 급증
- 모델 크기가 커도 안전성이 비례하지 않음

> 시사점: 멀티턴 맥락 유지가 교육 벤치마크에서 핵심 변수.

### 2.5 KoNET (2025, arXiv 2502.15422)

한국 교육 표준 기반 AI 평가. 초등~대학 입시까지 커버.

- 한국 수능(CSAT), 검정고시, 학력평가 문제 활용
- 교육 수준이 올라갈수록 AI 성능 급락 (특히 대학 입시 수준)
- 한국어 + 멀티모달 (이미지 포함 문제)

> 시사점: 한국 교육 맥락에서의 난이도 스케일링 선례. 우리와 직접 비교 가능.

### 2.6 Korean CSAT LLM Leaderboard (2025, arXiv 2511.18649)

2026 수능 수학 영역으로 LLM 평가. 오염 없는 환경 보장.

> 시사점: 수능 = 고등학교 최상위. 우리는 그 위(대학)를 커버하므로 상호 보완적.

### 2.7 MDK12-Bench (2025, Stanford/arXiv)

K-12 전 학년 다과목 멀티모달 벤치마크. 실제 교육 시험 데이터 활용.

- 초등(PK-5) / 중등(6-8) / 고등(9-12) / 대학 이후 구분
- 다학제: 수학, 과학, 인문, 사회

> 시사점: 난이도 스케일링의 직접적 참고 모델. 우리가 "대학 → 고등 → 중등 → 초등"으로 내려갈 때 이 구조를 참조.

### 2.8 CJEval (2024, arXiv 2409.16202)

중국 중학교 시험 데이터 기반 벤치마크. 26,136 샘플, 10과목.

- 문제 유형, 난이도, 지식 개념, 정답 해설까지 상세 어노테이션
- 4가지 교육 태스크: 지식 기억, 이해, 적용, 분석

> 시사점: 문제 메타데이터 구조의 참고 모델. 우리 JSON 형식에 반영 가능.

### 2.9 Socratic LLM 평가 (2025, arXiv 2508.06583)

소크라테스식 교수법에서 LLM의 적응적 비계 설정 능력 평가.

**핵심 발견:** 학습자가 혼란을 겪거나 방향 전환이 필요할 때 LLM이 효과적 비계를 제공하지 못함.

> 시사점: 김태운 학생의 005, 009번 문제가 정확히 이 능력을 측정.

---

## 3. Bloom's Taxonomy와 우리 벤치마크의 매핑

Bloom의 인지적 영역 6단계를 우리 프레임워크에 매핑:

| Bloom 단계 | 설명 | 우리 능력 축 매핑 | 난이도 |
|---|---|---|---|
| **기억 (Remember)** | 사실, 용어, 공식 회상 | 정확성 | L1 |
| **이해 (Understand)** | 개념 설명, 요약, 해석 | 설명력, 문체 품질 | L1-L2 |
| **적용 (Apply)** | 배운 것을 새 상황에 적용 | 제약 준수, 형식 이행 | L2 |
| **분석 (Analyze)** | 구조 파악, 관계 식별 | 추론, 함정 감지 | L2-L3 |
| **평가 (Evaluate)** | 판단, 비판, 정당화 | 자기 한계 인정, 함정 감지 | L3 |
| **창조 (Create)** | 새로운 것 생성, 설계 | 학습 유도, 창의적 생성 | L3-L4 |

---

## 4. 난이도 스케일링 체계 (제안)

### 4.1 학년 기반 레벨 체계

| 레벨 | 대상 | Bloom 주요 단계 | 예시 |
|---|---|---|---|
| **L0** | 초등 (4~6학년) | 기억, 이해 | 기본 사칙연산, 단어 뜻 설명 |
| **L1** | 중등 (중1~고1) | 이해, 적용 | 방정식 풀이, 과학 개념 설명 |
| **L2** | 고등~대학 초반 (고2~대2) | 적용, 분석 | 미적분, 프로그래밍, 전공 기초 |
| **L3** | 대학 중반~졸업 (대2~대4) | 분석, 평가 | 알고리즘 설계, 논문 분석, 실험 설계 |
| **L4** | 대학원/전문가 | 평가, 창조 | 연구 방법론, 새로운 이론 제안 |

### 4.2 스케일링 원칙

대학생 수준(L2-L3)을 **100점 기준**으로 설정하고:

- **같은 도메인, 같은 능력 축**에서 난이도만 조절
- 예: "동적계획법 설명" → L1(개념만), L2(코드+설명), L3(변형+최적화+증명)
- 예: "전위 개념" → L1(정의만), L2(유형 비교), L3(실험 데이터 해석)

### 4.3 난이도 조절 변수

| 변수 | 쉬움 (L0-L1) | 보통 (L2) | 어려움 (L3-L4) |
|---|---|---|---|
| 제약 조건 수 | 0~1개 | 2~3개 | 4개 이상 |
| 다단계 추론 | 1~2단계 | 3~4단계 | 5단계 이상 |
| 한국어 전문성 | 일상어 | 학술 문체 | 전문 용어 + 코드스위칭 |
| 함정/오개념 | 없음 | 1개 | 복합 함정 |
| 멀티턴 | 단일 턴 | 2~3턴 | 5턴 이상 |
| 출력 형식 제약 | 자유 | 구조화 요구 | 엄격한 형식 + 금지 조건 |

---

## 5. 최종 평가 프레임워크 (제안)

### 5.1 능력 축 (Capability Axis) — 12개

기존 10개에서 교육 연구 기반으로 2개 추가:

| # | 능력 축 | 영문 | 근거 논문 | 김태운 문제 |
|---|---|---|---|---|
| 1 | 사실 정확성 | Factual Accuracy | OpenLearnLM (Knowledge) | — |
| 2 | 다단계 추론 | Multi-step Reasoning | Bloom (분석/평가) | 003 |
| 3 | 제약 준수 | Constraint Compliance | IFEval, 김태운 001/003 | 001, 003 |
| 4 | 함정 감지 | Robustness (False Premise) | SHAPE (adversarial) | 008, 010, 011 |
| 5 | 학습 유도 | Pedagogical Scaffolding | Socratic LLM, SHAPE | 005, 009 |
| 6 | 설명력 | Explanation Quality | Pedagogical Taxonomy | 004, 007 |
| 7 | 문체 품질 | Style & Code-switching | KoNET (한국어) | 004, 007, 008 |
| 8 | 형식 이행 | Format Compliance | IFEval | 001, 002, 003, 006 |
| 9 | 맥락 유지 | Context Retention | SafeTutors (multi-turn) | — |
| 10 | 자기 한계 인정 | Intellectual Honesty | SHAPE (safety) | 010 |
| 11 | **적응적 난이도** | Adaptive Difficulty | Pedagogical Taxonomy | — (신규) |
| 12 | **참고자료 제시** | Source Citation | 대학생 니즈 | — (신규) |

### 5.2 도메인 축 (Domain Axis) — 8개

| # | 도메인 | 예시 과목 | 현재 커버 |
|---|---|---|---|
| 1 | 코딩 | 자료구조, 알고리즘, 웹개발 | ✅ 김태운 |
| 2 | 시스템/HW | 운영체제, 컴구조, Verilog | ✅ 김태운 |
| 3 | 수학/공학수학 | 선형대수, 미적분, 확률통계 | ✅ 김태운 |
| 4 | 자연과학 | 물리, 화학, 재료공학, 생물 | 🔄 김호윤 예정 |
| 5 | 인문/사회 | 경제, 법, 철학, 역사 | ❌ 미커버 |
| 6 | 논문/리서치 | 문헌 검색, 선행연구 정리 | ❌ 미커버 |
| 7 | 데이터분석 | 통계, 시각화, 실험 설계 | ❌ 미커버 |
| 8 | 일반/종합 | 학습 계획, 발표 준비, 글쓰기 | 부분 커버 |

### 5.3 종합 점수 체계

```
Student Helpfulness Score (SHS) = 100점 만점
├── Academic Task Score (60%)
│   ├── 정확성 × 도메인별 가중치
│   ├── 추론 × 난이도 보정
│   ├── 제약 준수
│   ├── 형식 이행
│   └── 문체 품질
└── Learning Assistant Score (40%)
    ├── 학습 유도 (Scaffolding)
    ├── 설명력
    ├── 적응적 난이도
    ├── 함정 감지 / 정직성
    └── 맥락 유지
```

---

## 6. 기존 벤치마크와의 차별점

| 기존 벤치마크 | 우리 벤치마크 |
|---|---|
| 영어 중심 | **한국어 학술 문체** 필수 |
| 객관식 정답 | **서술형 + 코드 + 설명** |
| 최종 답만 채점 | **과정 + 설명력 + 문체** 다축 채점 |
| 단일 턴 | **멀티턴 대화** 포함 |
| 연구자 관점 | **학생 관점** (도움이 되는가?) |
| 고정 난이도 | **L0~L4 스케일링** (초등~대학원) |
| 단일 점수 | **도메인×능력 프로파일** |
| 정답 제공 능력만 | **학습 유도 + 정답 통제** 능력도 측정 |

---

## 7. 다음 단계 (3주차 이후)

### 즉시 실행 가능
- [ ] 김호윤 학생 문제로 자연과학 도메인 채우기
- [ ] 김태운 학생 문제 11개를 위 프레임워크에 정식 매핑
- [ ] 각 문제에 Bloom 레벨 + 능력 축 태그 추가

### 단기 (3~4주차)
- [ ] 빈 칸 채우기: 인문/사회, 논문/리서치, 데이터분석 도메인
- [ ] 멀티턴 문제 설계 (맥락 유지 축 커버)
- [ ] 참고자료 제시 능력 측정 문제 설계
- [ ] L1 (중등) 수준 문제 3~5개 파일럿 작성

### 중기 (5~8주차)
- [ ] 자동 채점 파이프라인 설계 (rubric → 점수 변환)
- [ ] SAM으로 10+ 모델 정식 벤치마크 실행
- [ ] 결과 시각화 (도메인×능력 히트맵)
- [ ] 비용 효율 분석 (같은 점수를 더 싼 모델로?)

---

## 8. 참고 문헌

1. OpenLearnLM — A Unified Framework for Evaluating Knowledge, Skill, and Attitude in Educational LLMs (arXiv 2601.13882, 2025)
2. SHAPE — Unifying Safety, Helpfulness and Pedagogy for Educational LLMs (arXiv 2604.22134, 2025)
3. Pedagogical Ability Taxonomy — An Evaluation Taxonomy for LLM-Powered AI Tutors (arXiv 2412.09416, 2024)
4. SafeTutors — Benchmarking Pedagogical Safety in AI Tutoring Systems (arXiv 2603.17373, 2025)
5. KoNET — Evaluating Multimodal Generative AI with Korean Educational Standards (arXiv 2502.15422, 2025)
6. Korean CSAT LLM Evaluation — Evaluating LLMs on the 2026 Korean CSAT Mathematics Exam (arXiv 2511.18649, 2025)
7. MDK12-Bench — A Multi-Discipline Benchmark for Evaluating MLLMs (Stanford/arXiv, 2025)
8. CJEval — A Benchmark Using Chinese Junior High School Exam Data (arXiv 2409.16202, 2024)
9. Socratic LLM — Discerning Minds or Generic Tutors? (arXiv 2508.06583, 2025)
10. Bloom's Taxonomy — Anderson & Krathwohl (2001), Revised Taxonomy
11. IFEval — Instruction Following Evaluation (arXiv 2311.07911, 2023)
12. The Impact of AI on Educational Assessment — Stanford (arXiv 2506.23815, 2025)
