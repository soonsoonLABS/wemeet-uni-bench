# 초기 이슈 목록

> 레포 생성 후 아래 이슈들을 GitHub Issues에 등록합니다.

---

## Phase 1: 벤치마크 조사 (1~2주차)

### Issue #1: [조사] MMLU / MMLU-Pro 벤치마크 분석
- **Labels**: research, phase-1
- **Assignee**: 김태운, 김호윤
- **내용**: MMLU와 MMLU-Pro의 구성, 평가 방식, 한계점 분석. 대학생 관점 적합성 평가.

### Issue #2: [조사] 코딩 벤치마크 분석 (HumanEval, MBPP, SWE-bench)
- **Labels**: research, phase-1
- **Assignee**: 김태운
- **내용**: 코딩 관련 벤치마크 3종 비교 분석. 대학 과제 수준과의 차이점 도출.

### Issue #3: [조사] 한국어 벤치마크 분석 (KMMLU, KoBEST, CLIcK)
- **Labels**: research, phase-1
- **Assignee**: 김호윤
- **내용**: 한국어 특화 벤치마크 조사. 한국 대학생 시나리오 반영 정도 분석.

### Issue #4: [조사] 수학/추론 벤치마크 분석 (GSM8K, MATH, ARC)
- **Labels**: research, phase-1
- **Assignee**: 김호윤
- **내용**: 수학/추론 벤치마크 난이도 분석. 대학 이공계 과목과의 매핑.

### Issue #5: [조사] 대화/평가 벤치마크 분석 (MT-Bench, Chatbot Arena)
- **Labels**: research, phase-1
- **Assignee**: 김태운
- **내용**: 대화 품질 평가 방식 조사. 우리 채점 체계에 참고할 점 도출.

---

## Phase 2: 평가 체계 설계 (3~4주차)

### Issue #6: [설계] 평가 카테고리 및 난이도 체계 확정
- **Labels**: design, phase-2
- **Assignee**: 김태운, 김호윤
- **내용**: Phase 1 조사 결과를 바탕으로 최종 카테고리 6개 확정, 난이도 L1~L4 기준 구체화.

### Issue #7: [설계] 채점 기준(Rubric) 상세 설계
- **Labels**: design, phase-2
- **Assignee**: 김태운, 김호윤
- **내용**: 정확성/유용성/설명력/한국어품질 4개 축 채점 기준 상세화. 자동 채점 가능 항목 분류.

### Issue #8: [설계] SAM API 연동 설계
- **Labels**: design, phase-2, engineering
- **Assignee**: 김태운
- **내용**: 벤치마크 자동 실행을 위한 스크립트 구조 설계. 모델 목록, 실행 흐름, 결과 저장 형식 확정.

---

## Phase 3: 문제 제작 (5~8주차)

### Issue #9: [문제] 코딩 카테고리 문제 제작 (10문항)
- **Labels**: benchmark, phase-3
- **Assignee**: 김태운
- **내용**: L1~L4 난이도별 코딩 문제 10문항 제작.

### Issue #10: [문제] 이공계 문제 풀이 카테고리 제작 (10문항)
- **Labels**: benchmark, phase-3
- **Assignee**: 김호윤
- **내용**: 수학/물리/재료공학 등 이공계 문제 10문항 제작.

### Issue #11: [문제] 학술 글쓰기 카테고리 제작 (10문항)
- **Labels**: benchmark, phase-3
- **Assignee**: 김태운, 김호윤
- **내용**: 레포트, 논문 요약, 서술형 과제 관련 문제 10문항 제작.

### Issue #12: [문제] 리서치/데이터분석/학습보조 카테고리 제작 (20문항)
- **Labels**: benchmark, phase-3
- **Assignee**: 김태운, 김호윤
- **내용**: 나머지 3개 카테고리 문제 제작.

---

## Phase 4: 실행 및 분석 (9~12주차)

### Issue #13: [구현] 벤치마크 자동 실행 스크립트 완성
- **Labels**: engineering, phase-4
- **Assignee**: 김태운
- **내용**: SAM API 연동 실행, 에러 핸들링, 결과 저장 자동화.

### Issue #14: [분석] 모델별 결과 분석 및 시각화
- **Labels**: analysis, phase-4
- **Assignee**: 김호윤
- **내용**: 모델별/카테고리별/난이도별 성능 비교. 차트 및 리더보드 생성.

---

## Phase 5: 최종 정리 (13~14주차)

### Issue #15: [문서] 최종 보고서 작성
- **Labels**: documentation, phase-5
- **Assignee**: 김태운, 김호윤
- **내용**: 프로젝트 전체 과정 및 결과 정리. 발표 자료 준비.
