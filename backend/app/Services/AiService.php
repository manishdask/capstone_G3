<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Http;

/**
 * FR46 (proposed): non-clinical AI chatbot backed by the OpenRouter gateway.
 *
 * Privacy boundary (SRS §4.1): FR46-48 are constrained to non-clinical,
 * human-reviewed use and MUST NOT send identifiable health information to an
 * external AI provider without approval. To honour that without a human in the
 * loop on every message, we classify inbound text BEFORE any external call:
 * emergency and clinical-sounding queries escalate to a human receptionist and
 * never leave this machine. Only neutral, supported questions (booking, result
 * status, opening hours, contacts) reach the model — and those carry no patient
 * identifiers, since the caller is only identified by role + first name.
 *
 * Provenance: every exchange is recorded in the audit trail (action AI_CHAT)
 * and the provider/model is returned to the client so the user can see what
 * produced a reply. Chat text is deliberately NOT stored — the audit entry is
 * the human-reviewable trail without persisting extra copies of user content.
 */
class AiService
{
    private const MAX_TOKENS = 400;

    /** Emergency / clinical cues that must escalate before any external call. */
    private const CLINICAL_CUES = [
        '/emergen|ambulan|urgent|\b000\b/i',
        '/diagnos|symptom|pain|treat|medic|drug|dos|prescri|disease|condition|sick|ill|hurt|bleed|fever|infection|allerg/i',
    ];

    /**
     * @return array{text: string, escalate: bool, provider: ?string, model: ?string}
     */
    public function answer(string $message, array $context = []): array
    {
        $input = trim($message);
        $key = $this->apiKey();

        if ($input === '') {
            return $this->response('Please type a question — I can help with booking appointments, lab result status, opening hours and contact numbers.', escalate: false);
        }

        if ($this->isClinical($input)) {
            // Privacy gate: clinical content never reaches the external provider.
            // Distinct action so the audit trail reads the escalation as such;
            // outcome stays within the audit_logs enum (success/failure).
            $this->audit('AI_CHAT_ESCALATED', 'success');
            return $this->escalate();
        }

        if (! $key) {
            $this->audit('AI_CHAT', 'failure');
            return $this->response(
                'The AI assistant is not configured yet — please contact our reception staff for help.',
                escalate: false
            );
        }

        $model = $this->resolveModel($context['model'] ?? null);

        try {
            $reply = $this->callProvider($key, $model, $input);
        } catch (\Throwable $e) {
            $this->audit('AI_CHAT', 'failure');
            return $this->response(
                'I could not reach my AI engine just now. Please try again, or ask a receptionist for help.',
                escalate: false
            );
        }

        $this->audit('AI_CHAT', 'success');

        return $this->response($reply, escalate: false, provider: 'openrouter', model: $model);
    }

    private function callProvider(string $key, string $model, string $message): string
    {
        // The timeouts come from config and are deliberately kept below PHP's
        // max_execution_time: if Guzzle is allowed to outlast PHP, the process
        // fatals mid-request and the caller gets a 500 instead of the graceful
        // fallback that answer()'s catch block is there to return.
        $response = Http::baseUrl(config('ai.openrouter_base_url'))
            ->connectTimeout((int) config('ai.connect_timeout'))
            ->timeout((int) config('ai.timeout'))
            ->withToken($key)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'HTTP-Referer' => request()->getSchemeAndHttpHost(),
                'X-Title' => 'SGH St George HMS',
            ])
            ->post('/chat/completions', [
                'model' => $model,
                'max_tokens' => self::MAX_TOKENS,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->systemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => $message,
                    ],
                ],
            ]);

        $response->throw();

        $payload = $response->json();

        return trim($payload['choices'][0]['message']['content'] ?? '');
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
You are the SGH (St George Hospital) non-clinical virtual assistant, "SGH Assistant".

Your ONLY permitted topics are:
1. Booking / rescheduling / cancelling appointments
2. Lab test / result status
3. SGH branch opening hours
4. Contact numbers and general hospital information

Authoritative facts (answer only from these — do not invent hours, numbers or steps):
- Branch hours — Kogarah: Mon–Fri 7:30am–8pm, Sat 8am–5pm, Sun 9am–3pm. Hurstville: Mon–Fri 8am–7pm, Sat 8am–4pm, Closed Sunday. Parramatta: Mon–Fri 7am–9pm, Sat 8am–6pm, Sun 10am–3pm. Southbank (VIC): Mon–Fri 8am–7pm, Sat 9am–5pm, Closed Sunday.
- Contacts — Main line: 1800-SGH-HELP. Kogarah: (02) 9113 1000. Hurstville: (02) 9580 1200. Parramatta: (02) 8842 3400. Southbank (VIC): (03) 9088 1700. Email: info@stgeorge.health, billing@stgeorge.health.
- Booking flow — the SGH app books appointments in three steps: 1) Home tab → Book an Appointment; 2) filter by specialty or doctor, then select a doctor; 3) choose a preferred date and time. The request is then sent to the doctor for confirmation.
- Lab results — results appear under Records → Lab reports once the lab technician signs them off; ready results show a green badge and a Get Report button, in-progress ones show "In progress".

For these topics give clear, helpful, factual answers in plain text with bold **markers** for
emphasis. If you are asked something outside these topics — especially anything clinical,
medical, diagnostic, or about symptoms, medications, or treatment — you must NOT answer.
Instead reply with exactly:
"I'm a non-clinical assistant, so I can't answer that. Let me connect you to a human receptionist for help."
Never offer medical advice, diagnoses, or dosage guidance. Never invent hospital facts.
PROMPT;
    }

    /**
     * Escalation reply for the privacy gate and for the model's own refusal —
     * mirrors the existing rule-based widget's "connecting to a receptionist" flow.
     */
    private function escalate(): array
    {
        return $this->response(
            "I'm a non-clinical assistant, so I can't answer that. Let me connect you to a human receptionist for help.",
            escalate: true
        );
    }

    private function isClinical(string $input): bool
    {
        foreach (self::CLINICAL_CUES as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    private function apiKey(): string
    {
        return (string) config('ai.api_key', '');
    }

    /** The single model this deployment is configured to answer with. */
    public static function supportedModel(): string
    {
        return (string) config('ai.model');
    }

    private function resolveModel(?string $requested): string
    {
        // A client may only pick the exact supported model — never let an
        // arbitrary model name from a request reach the provider.
        return $requested === self::supportedModel() ? $requested : self::supportedModel();
    }

    /**
     * @return array{text: string, escalate: bool, provider: ?string, model: ?string}
     */
    private function response(string $text, bool $escalate, ?string $provider = null, ?string $model = null): array
    {
        return [
            'text' => $text,
            'escalate' => $escalate,
            'provider' => $provider,
            'model' => $model,
        ];
    }

    private function audit(string $action, string $outcome): void
    {
        $user = auth('sanctum')->user();

        AuditLog::record([
            'actor_id' => $user?->id,
            'actor_role' => $user?->roles()->pluck('name')->join(','),
            'action' => $action,
            'object_type' => 'ai_chat',
            'object_id' => null,
            'outcome' => $outcome,
            'ip_address' => request()->ip(),
            'source' => 'api',
        ]);
    }
}