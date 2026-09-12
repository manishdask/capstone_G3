<?php

// FR46 (proposed): AI chatbot provider configuration. The provider and API key
// come from the environment — never hardcode a credential in source. The key is
// read lazily by AiService and intentionally left out of responses/logs.
return [
    // Provider name, currently "openrouter".
    'provider' => env('AI_PROVIDER', 'openrouter'),

    // API key for the configured provider. Empty unless the operator sets it.
    'api_key' => env('AI_API_KEY'),

    // OpenRouter base URL (the `/api` is appended by the service).
    'openrouter_base_url' => 'https://openrouter.ai/api/v1',

    // Model the assistant answers with. Configurable so a queued or retired
    // free model can be swapped without a code change. Two things disqualify a
    // model here: the very large free ones (e.g. nemotron-3-ultra-550b) sit in
    // OpenRouter's queue and never answer inside the timeout, and the reasoning
    // ones (e.g. nemotron-3.5-lightning) stream their chain-of-thought into the
    // reply, so the patient sees "Here's a thinking process..." instead of an
    // answer. The default is small, fast and answers directly.
    'model' => env('AI_MODEL', 'inclusionai/ling-3.0-flash-sante:free'),

    // Seconds to wait for the provider. MUST stay comfortably below PHP's
    // max_execution_time — if the HTTP timeout is the larger of the two, PHP
    // fatals inside Guzzle and the request 500s instead of returning the
    // graceful "could not reach my AI engine" fallback.
    'timeout' => (int) env('AI_TIMEOUT_SECONDS', 25),

    // Seconds to wait for the TCP connection itself.
    'connect_timeout' => (int) env('AI_CONNECT_TIMEOUT_SECONDS', 10),
];
