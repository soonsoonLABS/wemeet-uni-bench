# 🎓 wemeet-uni-bench

> Seoul National University WE-Meet Industry-Academia Project — AI Model Benchmark for University Students
>
> `soonsoonlabs/wemeet-uni-bench`

🌐 **[Project Website](https://soonsoonlabs.github.io/wemeet-uni-bench/en.html)** · 🇰🇷 **[한국어 README](README.md)**

---

## Project Overview

Existing LLM benchmarks (MMLU, HumanEval, GPQA, etc.) are designed by overseas AI researchers and fail to reflect the performance gap that Korean university students experience when using AI for their actual coursework.

**Project Goals:**
1. Survey and analyze existing benchmark systems
2. Derive evaluation parameters meaningful from a student's perspective
3. Design benchmark problems based on real university assignments, research, and exam scenarios
4. Execute benchmarks across diverse models via the SAM platform and publish results

---

## Team

| Role | Name | Affiliation | Contact |
|------|------|-------------|---------|
| Mentor | Song Yongsung (송용성) | CEO, SoonsoonFactory / Adjunct Prof., Kangwon National Univ. | soonsoon@soonsoons.com |
| Student | Kim Taewoon (김태운) | Seoul National University, CSE, Year 2 | listro002@snu.ac.kr |
| Student | Kim Hoyoon (김호윤) | Seoul National University, MatSE, Year 2 | khoyun007@gmail.com |

---

## About WE-Meet

Seoul National University's WE-Meet (위밋) is an industry-academia collaboration project where companies and universities partner so that students solve real industry problems, build practical skills, and earn academic credit.

- **Format**: Corporate mentor guidance + team project → performance evaluation (S/U)
- **Features**: Official course credit, hands-on mentoring from industry professionals
- **Domains**: Next-gen Semiconductors, Big Data, Green Bio, AI

---

## Project Structure

```
├── README.md                    # Project intro (Korean)
├── README.en.md                 # Project intro (English)
├── docs/
│   ├── project-plan.md          # Project plan
│   ├── benchmark-survey.md      # Existing benchmark survey
│   └── evaluation-criteria.md   # Evaluation criteria design
├── benchmarks/
│   ├── categories/              # Benchmark problems by category
│   └── results/                 # Benchmark execution results
├── scripts/
│   └── run_benchmark.py         # Benchmark execution script
├── website/                     # Project website (GitHub Pages)
└── .github/
    └── ISSUE_TEMPLATE/          # Issue templates
```

---

## Tech Stack

- **AI Platform**: [SAM by SoonsoonFactory](https://sam.soonsoon.ai)
- **Language**: Python (benchmark execution), Markdown (documentation)
- **Collaboration**: GitHub Issues & Projects

---

## How to Contribute

1. Check assigned tasks in the issue list
2. Create a branch and work (`feature/issue-number-description`)
3. Create a PR and request review
4. Merge after mentor approval

---

## License

MIT License

---

## Links

- [SAM Platform](https://sam.soonsoon.ai)
- [SoonsoonFactory](https://soonsoon.ai)
- [Seoul National University WE-Meet](https://wemeet.snu.ac.kr)
