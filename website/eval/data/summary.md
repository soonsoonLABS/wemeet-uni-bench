# 모델별 스트레스 테스트 평가 요약
**분석 일시**: 2026-06-05 16:15:02
**분석된 파일 수**: 1개
- graded_run_20260605_150628.json

## 모델별 통과율 및 치명적 실패율 요약

| 모델 | 전체 통과율 | 거짓 전제 (Pass) | 거짓 전제 (Critical Fail) | 가짜 개념 (Pass) | 가짜 개념 (Critical Fail) | 레거시 강요 (Pass) | 레거시 강요 (Critical Fail) | 자기 모순 (Pass) | 자기 모순 (Critical Fail) |
|---|---|---|---|---|---|---|---|---|---|
| **cp-sonnet-4.6** | 50.0% (8/16) | 3/4 | 1/4 | 1/4 | 3/4 | 1/4 | 3/4 | 3/4 | 1/4 |
| **gemini-3.5-flash** | 43.8% (7/16) | 3/4 | 1/4 | 0/4 | 4/4 | 2/4 | 2/4 | 2/4 | 2/4 |
| **claude-opus-4.6** | 37.5% (6/16) | 2/4 | 2/4 | 0/4 | 4/4 | 1/4 | 3/4 | 3/4 | 1/4 |
| **claude-sonnet-4.6** | 37.5% (6/16) | 2/4 | 2/4 | 1/4 | 3/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **cp-opus-4.7** | 37.5% (6/16) | 3/4 | 1/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **cp-sonnet-4.5** | 37.5% (6/16) | 3/4 | 1/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **deepseek-v4-flash** | 31.2% (5/16) | 2/4 | 2/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **gpt-5.4-mini** | 31.2% (5/16) | 0/4 | 4/4 | 1/4 | 3/4 | 1/4 | 3/4 | 3/4 | 1/4 |
| **gpt-5.5** | 31.2% (5/16) | 1/4 | 3/4 | 0/4 | 4/4 | 1/4 | 3/4 | 3/4 | 1/4 |
| **kimi-k2.5** | 31.2% (5/16) | 2/4 | 2/4 | 1/4 | 3/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **qwen3-coder-next** | 31.2% (5/16) | 2/4 | 2/4 | 0/4 | 4/4 | 0/4 | 4/4 | 3/4 | 1/4 |
| **az-deepseek-v4-pro** | 25.0% (4/16) | 1/4 | 3/4 | 0/4 | 3/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **claude-haiku** | 25.0% (4/16) | 1/4 | 3/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **devstral-2-123b** | 25.0% (4/16) | 1/4 | 3/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **glm-5** | 25.0% (4/16) | 2/4 | 2/4 | 0/4 | 4/4 | 1/4 | 3/4 | 1/4 | 3/4 |
| **gpt-5.4** | 25.0% (4/16) | 2/4 | 2/4 | 0/4 | 4/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **gpt-5.4-nano** | 25.0% (4/16) | 1/4 | 3/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **cp-haiku-4.5** | 18.8% (3/16) | 1/4 | 3/4 | 0/4 | 4/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **deepseek-v3.2** | 18.8% (3/16) | 0/4 | 4/4 | 1/4 | 3/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **deepseek-v4-pro** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **fw-deepseek-v4-pro** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **gemini-2.5-flash-lite** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 3/4 | 1/4 |
| **gemini-3.1-flash-lite-preview** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 3/4 | 1/4 |
| **kimi-k2.6** | 18.8% (3/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 2/4 | 2/4 |
| **grok-4.3** | 12.5% (2/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **nova-lite** | 12.5% (2/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 2/4 | 2/4 |
| **glm-4.7** | 6.2% (1/16) | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 | 0/4 | 4/4 |
| **gpt-4.1-nano** | 6.2% (1/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 1/4 | 3/4 |
| **gemini-3.1-pro-preview** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |
| **glm-4.7-flash** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |
| **gpt-5.4-pro** | 0.0% (0/16) | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 | 0/4 | 4/4 |

## 모델별 주요 실패 원인 (Critical Failures Breakdown)

### az-deepseek-v4-pro
- `compliance_refusal`: 7건
- `legacy_detection`: 3건
- `core_detection`: 1건
- `error`: 1건
- `modern_alternative`: 1건
- `logical_analysis`: 1건

### claude-haiku
- `compliance_refusal`: 10건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `core_detection`: 2건
- `modern_alternative`: 2건
- `correct_alternative`: 1건

### claude-opus-4.6
- `compliance_refusal`: 10건
- `hallucination_control`: 2건
- `legacy_detection`: 2건
- `modern_alternative`: 2건

### claude-sonnet-4.6
- `compliance_refusal`: 7건
- `legacy_detection`: 3건
- `hallucination_control`: 1건
- `modern_alternative`: 1건
- `logical_analysis`: 1건

### cp-haiku-4.5
- `compliance_refusal`: 9건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `correct_alternative`: 1건
- `logical_analysis`: 1건

### cp-opus-4.7
- `compliance_refusal`: 7건
- `legacy_detection`: 3건
- `hallucination_control`: 2건
- `modern_alternative`: 1건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### cp-sonnet-4.5
- `compliance_refusal`: 9건
- `hallucination_control`: 2건
- `legacy_detection`: 2건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### cp-sonnet-4.6
- `compliance_refusal`: 8건
- `legacy_detection`: 2건
- `modern_alternative`: 2건

### deepseek-v3.2
- `compliance_refusal`: 9건
- `legacy_detection`: 4건
- `core_detection`: 3건
- `hallucination_control`: 3건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건

### deepseek-v4-flash
- `compliance_refusal`: 8건
- `hallucination_control`: 3건
- `core_detection`: 2건
- `modern_alternative`: 2건
- `correct_alternative`: 1건
- `legacy_detection`: 1건
- `contradiction_detection`: 1건

### deepseek-v4-pro
- `compliance_refusal`: 6건
- `core_detection`: 3건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 3건
- `correct_alternative`: 1건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### devstral-2-123b
- `compliance_refusal`: 8건
- `core_detection`: 3건
- `legacy_detection`: 3건
- `hallucination_control`: 2건
- `modern_alternative`: 2건
- `contradiction_detection`: 2건
- `logical_analysis`: 1건

### fw-deepseek-v4-pro
- `compliance_refusal`: 8건
- `core_detection`: 4건
- `hallucination_control`: 2건
- `legacy_detection`: 2건
- `correct_alternative`: 1건
- `error`: 1건
- `modern_alternative`: 1건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### gemini-2.5-flash-lite
- `compliance_refusal`: 9건
- `legacy_detection`: 4건
- `core_detection`: 3건
- `hallucination_control`: 3건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### gemini-3.1-flash-lite-preview
- `compliance_refusal`: 8건
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `core_detection`: 2건
- `modern_alternative`: 2건
- `logical_analysis`: 1건

### gemini-3.1-pro-preview
- `error`: 16건

### gemini-3.5-flash
- `compliance_refusal`: 7건
- `hallucination_control`: 2건
- `legacy_detection`: 2건
- `modern_alternative`: 2건
- `correct_alternative`: 1건
- `error`: 1건
- `logical_analysis`: 1건

### glm-4.7
- `compliance_refusal`: 9건
- `core_detection`: 3건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `contradiction_detection`: 3건
- `modern_alternative`: 2건
- `logical_analysis`: 1건

### glm-4.7-flash
- `compliance_refusal`: 9건
- `core_detection`: 4건
- `hallucination_control`: 4건
- `legacy_detection`: 3건
- `contradiction_detection`: 3건
- `correct_alternative`: 2건
- `modern_alternative`: 2건
- `logical_analysis`: 1건

### glm-5
- `compliance_refusal`: 10건
- `hallucination_control`: 4건
- `legacy_detection`: 2건
- `modern_alternative`: 2건
- `correct_alternative`: 1건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### gpt-4.1-nano
- `compliance_refusal`: 7건
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `core_detection`: 3건
- `logical_analysis`: 3건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건

### gpt-5.4
- `compliance_refusal`: 11건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `hallucination_control`: 1건
- `error`: 1건

### gpt-5.4-mini
- `compliance_refusal`: 9건
- `legacy_detection`: 3건
- `hallucination_control`: 2건
- `core_detection`: 1건
- `modern_alternative`: 1건

### gpt-5.4-nano
- `compliance_refusal`: 9건
- `hallucination_control`: 3건
- `legacy_detection`: 3건
- `core_detection`: 1건
- `modern_alternative`: 1건
- `logical_analysis`: 1건

### gpt-5.4-pro
- `error`: 16건

### gpt-5.5
- `compliance_refusal`: 5건
- `legacy_detection`: 3건
- `error`: 2건
- `hallucination_control`: 2건
- `modern_alternative`: 2건
- `core_detection`: 1건
- `correct_alternative`: 1건

### grok-4.3
- `compliance_refusal`: 5건
- `core_detection`: 4건
- `hallucination_control`: 4건
- `legacy_detection`: 4건
- `correct_alternative`: 3건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### kimi-k2.5
- `compliance_refusal`: 9건
- `legacy_detection`: 3건
- `hallucination_control`: 2건
- `core_detection`: 2건
- `modern_alternative`: 2건
- `contradiction_detection`: 1건
- `logical_analysis`: 1건

### kimi-k2.6
- `core_detection`: 4건
- `correct_alternative`: 4건
- `legacy_detection`: 3건
- `modern_alternative`: 3건
- `hallucination_control`: 2건
- `error`: 2건
- `contradiction_detection`: 2건
- `logical_analysis`: 2건

### nova-lite
- `compliance_refusal`: 11건
- `core_detection`: 4건
- `legacy_detection`: 4건
- `hallucination_control`: 3건
- `modern_alternative`: 2건
- `logical_analysis`: 1건

### qwen3-coder-next
- `compliance_refusal`: 8건
- `error`: 3건
- `legacy_detection`: 3건
- `modern_alternative`: 2건
- `hallucination_control`: 1건
