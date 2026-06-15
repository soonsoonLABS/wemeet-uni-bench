# 모델별 스트레스 테스트 평가 요약
**분석 일시**: 2026-06-15 19:36:25
**분석된 파일 수**: 1개
- graded_run_20260615_191036_major-12-fixed-sam.json

## 모델별 통과율 및 치명적 실패율 요약

| 모델 | 전체 통과율 | 거짓 전제 (Pass) | 거짓 전제 (Critical Fail) | 가짜 개념 (Pass) | 가짜 개념 (Critical Fail) | 레거시 강요 (Pass) | 레거시 강요 (Critical Fail) | 자기 모순 (Pass) | 자기 모순 (Critical Fail) |
|---|---|---|---|---|---|---|---|---|---|
| **cp-sonnet-4.6** | 56.2% (9/16) | 3/4 | 1/4 | 2/4 | 2/4 | 1/4 | 3/4 | 3/4 | 1/4 |
| **cp-opus-4.7** | 43.8% (7/16) | 2/4 | 2/4 | 2/4 | 2/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **claude-sonnet-4.6** | 37.5% (6/16) | 1/4 | 3/4 | 2/4 | 2/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **claude-opus-4.6** | 31.2% (5/16) | 2/4 | 2/4 | 0/4 | 4/4 | 0/4 | 4/4 | 3/4 | 1/4 |
| **gemini-3.1-pro-preview** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **grok-4.3** | 18.8% (3/16) | 0/4 | 4/4 | 1/4 | 3/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **deepseek-v3.2** | 12.5% (2/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **deepseek-v4-flash** | 12.5% (2/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 1/4 | 3/4 |
| **gpt-5.5** | 6.2% (1/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 |
| **gemini-3.5-flash** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |
| **gpt-5.4-pro** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |
| **kimi-k2.6** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |

## 모델별 주요 실패 원인 (Critical Failures Breakdown)

### claude-opus-4.6
- `compliance_refusal`: 10건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 2건

### claude-sonnet-4.6
- `compliance_refusal`: 8건
- `legacy_detection`: 3건
- `modern_alternative`: 1건
- `logical_analysis`: 1건

### cp-opus-4.7
- `compliance_refusal`: 7건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `hallucination_control`: 1건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### cp-sonnet-4.6
- `compliance_refusal`: 6건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `correct_alternative`: 1건
- `hallucination_control`: 1건

### deepseek-v3.2
- `compliance_refusal`: 9건
- `hallucination_control`: 4건
- `core_detection`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### deepseek-v4-flash
- `compliance_refusal`: 6건
- `core_detection`: 4건
- `hallucination_control`: 4건
- `correct_alternative`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `contradiction_detection`: 2건
- `logical_analysis`: 2건

### gemini-3.1-pro-preview
- `correct_alternative`: 4건
- `hallucination_control`: 4건
- `core_detection`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 3건
- `compliance_refusal`: 2건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### gemini-3.5-flash
- `core_detection`: 4건
- `correct_alternative`: 4건
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `modern_alternative`: 4건
- `contradiction_detection`: 4건
- `logical_analysis`: 4건

### gpt-5.4-pro
- `hallucination_control`: 4건
- `core_detection`: 3건
- `correct_alternative`: 3건
- `modern_alternative`: 3건
- `error`: 3건
- `legacy_detection`: 2건
- `contradiction_detection`: 2건
- `logical_analysis`: 2건
- `compliance_refusal`: 1건

### gpt-5.5
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `modern_alternative`: 4건
- `core_detection`: 3건
- `correct_alternative`: 3건
- `contradiction_detection`: 3건
- `logical_analysis`: 3건
- `compliance_refusal`: 1건

### grok-4.3
- `compliance_refusal`: 5건
- `legacy_detection`: 4건
- `core_detection`: 3건
- `correct_alternative`: 3건
- `hallucination_control`: 3건
- `modern_alternative`: 3건
- `logical_analysis`: 2건
- `contradiction_detection`: 1건

### kimi-k2.6
- `core_detection`: 4건
- `correct_alternative`: 4건
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `modern_alternative`: 4건
- `logical_analysis`: 4건
- `contradiction_detection`: 3건
