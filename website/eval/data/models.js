window.AVAILABLE_MODELS = [
  { id: "cp-opus-4.7", name: "Claude Opus 4.7", tag: "Premium", price: "$15.0 / $75.0 per M tok", desc: "highest quality, enterprise workflows" },
  { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", tag: "Premium", price: "$15.0 / $120.0 per M tok", desc: "frontier reasoning, long context" },
  { id: "claude-opus-4.6", name: "Claude Opus 4.6", tag: "Premium", price: "$5.5 / $27.5 per M tok", desc: "slow · highest quality" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", tag: "Premium", price: "$2.0 / $12.0 per M tok", desc: "multimodal analysis, complex logic" },
  { id: "gpt-5.5", name: "GPT-5.5", tag: "Premium", price: "$5.0 / $30.0 per M tok", desc: "frontier reasoning" },
  { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tag: "Mid", price: "$3.3 / $16.5 per M tok", desc: "balanced performance" },
  { id: "cp-sonnet-4.6", name: "Claude Sonnet 4.6 (Platform)", tag: "Mid", price: "$3.0 / $15.0 per M tok", desc: "enterprise platform" },
  { id: "az-deepseek-v4-pro", name: "DeepSeek V4 Pro (Azure)", tag: "Premium", price: "$1.74 / $3.48 per M tok", desc: "advanced coding, math logic" },
  { id: "fw-deepseek-v4-pro", name: "FW-DeepSeek V4 Pro", tag: "Premium", price: "$1.74 / $3.48 per M tok", desc: "optimized inference" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", tag: "Mid", price: "$1.5 / $9.0 per M tok", desc: "fast reasoning, agentic coding" },
  { id: "grok-4.3", name: "Grok 4.3", tag: "Premium", price: "$1.25 / $2.5 per M tok", desc: "low hallucination, tool calling" },
  { id: "kimi-k2.6", name: "Kimi K2.6", tag: "Mid", price: "$0.6 / $2.5 per M tok", desc: "agentic coding, long context" },
  { id: "gpt-5.4", name: "GPT-5.4", tag: "Premium", price: "$2.5 / $15.0 per M tok", desc: "1M context" },
  { id: "cp-sonnet-4.5", name: "Claude Sonnet 4.5 (Platform)", tag: "Mid", price: "$3.0 / $15.0 per M tok", desc: "enterprise platform" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tag: "Premium", price: "$2.19 / $8.76 per M tok", desc: "complex reasoning, math logic" },
  { id: "glm-5", name: "GLM-5", tag: "Mid", price: "$1.0 / $3.2 per M tok", desc: "long context reasoning" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tag: "Budget", price: "$0.14 / $0.28 per M tok", desc: "fast inference, cost efficient" },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", tag: "Budget", price: "$0.62 / $1.85 per M tok", desc: "budget reasoning" },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", tag: "Mid", price: "$0.75 / $4.5 per M tok", desc: "cost efficient chat" },
  { id: "devstral-2-123b", name: "Mistral Devstral 2 123B", tag: "Mid", price: "$0.4 / $2.0 per M tok", desc: "open weights logic" },
  { id: "kimi-k2.5", name: "Moonshot Kimi K2.5", tag: "Mid", price: "$0.6 / $3.0 per M tok", desc: "long context" },
  { id: "claude-haiku", name: "Claude Haiku 4.5", tag: "Budget", price: "$1.1 / $5.5 per M tok", desc: "600ms, fast response" },
  { id: "cp-haiku-4.5", name: "Claude Haiku 4.5 (Platform)", tag: "Budget", price: "$0.8 / $4.0 per M tok", desc: "platform fast response" },
  { id: "glm-4.7", name: "GLM 4.7", tag: "Mid", price: "$0.4 / $1.5 per M tok", desc: "general reasoning" },
  { id: "qwen3-coder-next", name: "Qwen3 Coder Next", tag: "Coding", price: "$0.5 / $1.2 per M tok", desc: "code-specialized" },
  { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash-Lite Preview", tag: "Budget", price: "$0.25 / $1.5 per M tok", desc: "preview lite model" },
  { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", tag: "Budget", price: "$0.2 / $1.25 per M tok", desc: "fast router, high volume" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", tag: "Budget", price: "$0.1 / $0.4 per M tok", desc: "cost efficient chat" },
  { id: "glm-4.7-flash", name: "GLM 4.7 Flash", tag: "Coding", price: "$0.06 / $0.4 per M tok", desc: "fastest" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", tag: "Budget", price: "$0.1 / $0.4 per M tok", desc: "multimodal analysis" },
  { id: "nova-lite", name: "Nova Lite 2.0", tag: "Budget", price: "$0.3 / $2.5 per M tok", desc: "lightweight reasoning" }
];

// 기존 하드코딩 모델 6개의 Alias를 초기 선택 상태로 사용
window.DEFAULT_SELECTED_MODELS = [
  "claude-opus-4.6", // 기존 claude-opus 대체
  "gpt-5.4",
  "claude-haiku",
  "deepseek-v3.2",
  "glm-4.7-flash",
  "qwen3-coder-next"
];
