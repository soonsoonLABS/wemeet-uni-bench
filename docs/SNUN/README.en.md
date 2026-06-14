# 🚀 SNUN (WE-Meet 1st Cohort Team)

🇰🇷 **[한국어](README.md)** · 🇺🇸 **[English](README.en.md)**

**SNUN** is a team name created by combining the mentor company Soonsoon Factory (**Soonsoon**) and Seoul National University (**SNU**). It is a project team consisting of **Taeun Kim** and **Hoyun Kim**, the 1st cohort participants of the Seoul National University WE-Meet industry-academia cooperation project.

This document serves as the main document to record the research, problem design process, and project progress history of the SNUN team while conducting the "AI Model Benchmark Development for Korean University Students (wemeet-uni-bench)" project. Please note that the documents of the SNUN team were written by the team leader, Taeun Kim, using an LLM model.

## 👥 Team Composition (WE-Meet 1st Cohort)

| Name | Affiliation | Contact |
|------|-------------|---------|
| **Taeun Kim** | Dept. of Computer Science and Engineering, SNU | listro002@snu.ac.kr |
| **Hoyun Kim** | Dept. of Materials Science and Engineering, SNU | khoyun007@gmail.com |

> Mentor: Yongsung Song (CEO of Soonsoon Factory / soonsoon@soonsoons.com)

## 🎯 Project Goals and Direction

This project started from the awareness that existing AI benchmarks (MMLU, HumanEval, etc.) are designed mainly by English-speaking and professional researchers, which causes a gap with the actual academic environment (assignments, exams, thesis research, etc.) of Korean university students.

Based on the question, **"How helpful is this AI for the actual academic work of university students?"**, the SNUN team aims to:
1. Design meaningful evaluation criteria from a university student's perspective.
2. Derive benchmark problems based on actual university assignment and exam scenarios.
3. Provide guidelines for finding an AI model with 'appropriate cost/performance for my situation' rather than just 'top performance'.

We are planning the benchmark with these three goals in mind.

## 📑 Final Result Report

The overall achievements, benchmark evaluation results, and final conclusions of this project can be found in detail in the report below.
- [WE-Meet 결과 보고서.pdf](./WE-Meet%20결과%20보고서.pdf)

## 📂 Work and Progress History (Docs)

Under this directory (`docs/SNUN/`), the planning, strategy, and research reports conducted weekly by the SNUN team, along with the final result report, are stored. It includes all history and progress tracking details during the project period.

```text
├── README.md                                  # SNUN Team Introduction
├── WE-Meet 결과 보고서.pdf                      # WE-Meet 1st Cohort Final Result Report
├── SNUN_week2_docs/                           # Week 2 Progress Documents
│   ├── playground_ktw_docs/                   # Playground-related Reports
│   │   ├── playground_analysis_report.md      # Existing Playground Analysis Report
│   │   └── playground_comparison_report.md    # Comparison Report between Existing and New Versions
│   └── scoring_bottleneck_analysis_about_Week2_Result.md # Scoring Bottleneck Analysis
├── SNUN_week3_docs/                           # Week 3 Progress Documents
│   ├── week3_problem_structure_plan_report.md # Problem Structure and Plan
│   └── week3_strategy_report.md               # Benchmark Strategy Planning Report
├── SNUN_week4_docs/                           # Week 4 Progress Documents
│   ├── benchmark_refactoring_report.md        # Benchmark Evaluation Logic and Integrity Audit Report
│   ├── week4_result_report.md                 # Week 4 Result Report
│   └── week4_strategy_report.md               # Stress Test Mass Production and Evaluation Pipeline Planning Report
└── SNUN_week5_docs/                           # Week 5 Progress Documents
    ├── benchmark_validity_report.md           # Stress Test Benchmark Validity Verification Report
    └── keyword_evaluation_analysis.md         # Analysis of Limitations of Keyword-based Auto-scoring (False Negative Analysis)
```

*(This project has now been successfully concluded, and regular updates have ended.)*

---

## 🔗 Related Repository (Fork Repository)

The SNUN team's work on this project was conducted and managed in the **[Listro02/wemeet-uni-bench](https://github.com/Listro02/wemeet-uni-bench)** repository, which was created by forking the original repository.

---

> This material was documented by team leader Taeun Kim for the purpose of organizing the project's achievements and sharing them with students in the next cohort.
