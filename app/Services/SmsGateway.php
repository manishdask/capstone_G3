<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * SMS delivery (FR20).
 *
 * The deliberate design point: this class NEVER reports success for a message
 * it did not actually hand to something. With no provider configured it throws,
 * the notification is recorded as failed with the reason, and the missing
 * configuration is visible in the app — an unconfigured gateway must not look
 * like a working one.
 *
 * Configure in config/sms.php (values from .env):
 *   SMS_GATEWAY_PROVIDER=twilio
 *   SMS_GATEWAY_SID=ACxxxxxxxx…      (Twilio Account SID)
 *   SMS_GATEWAY_TOKEN=…              (Twilio Auth Token)
 *   SMS_GATEWAY_FROM=+61400000000    (a Twilio number, E.164)
 */
class SmsGateway
{
    public const PROVIDER_LOG = 'log';

    public const PROVIDER_TWILIO = 'twilio';

    /** Providers this class can actually dispatch through. */
    private const SUPPORTED = [self::PROVIDER_LOG, self::PROVIDER_TWILIO];

    /**
     * The effective provider, or null when SMS is not set up.
     *
     * Anything unrecognised (including the placeholder "mock" the project
     * shipped with) counts as NOT configured — a name nobody implemented must
     * never be treated as a working gateway.
     */
    public function provider(): ?string
    {
        $configured = strtolower((string) config('sms.provider'));

        return in_array($configured, self::SUPPORTED, true) ? $configured : null;
    }

    public function isConfigured(): bool
    {
        $provider = $this->provider();

        if ($provider === null) {
            return false;
        }

        if ($provider === self::PROVIDER_TWILIO) {
            return (bool) (config('sms.sid') && config('sms.token') && config('sms.from'));
        }

        return true;
    }

    /**
     * One line naming exactly what is missing, shown to staff in the app and
     * stored on the failed notification. Null when SMS is ready to send.
     */
    public function configurationGap(): ?string
    {
        if (config('sms.provider') && $this->provider() === null) {
            return 'SMS_GATEWAY_PROVIDER is set to "'.config('sms.provider').'", which is not a supported provider. Set it to "twilio" (or "log" for local development).';
        }

        if ($this->provider() === null) {
            return 'No SMS provider is configured. Set SMS_GATEWAY_PROVIDER=twilio plus SMS_GATEWAY_SID, SMS_GATEWAY_TOKEN and SMS_GATEWAY_FROM in .env.';
        }

        if ($this->provider() === self::PROVIDER_TWILIO) {
            $missing = array_keys(array_filter([
                'SMS_GATEWAY_SID' => ! config('sms.sid'),
                'SMS_GATEWAY_TOKEN' => ! config('sms.token'),
                'SMS_GATEWAY_FROM' => ! config('sms.from'),
            ]));

            if ($missing) {
                return 'Twilio is selected but '.implode(', ', $missing).' '.(count($missing) === 1 ? 'is' : 'are').' not set in .env.';
            }
        }

        return null;
    }

    /**
     * Send one message. Returns the provider's reference on success.
     *
     * @throws RuntimeException when SMS is not configured, the destination is
     *                          unusable, or the provider rejects the message.
     */
    public function send(?string $to, string $message): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException($this->configurationGap());
        }

        $to = trim((string) $to);

        if ($to === '') {
            throw new RuntimeException('The recipient has no mobile number on file.');
        }

        return match ($this->provider()) {
            self::PROVIDER_LOG => $this->sendViaLog($to, $message),
            self::PROVIDER_TWILIO => $this->sendViaTwilio($to, $message),
        };
    }

    private function sendViaLog(string $to, string $message): string
    {
        $reference = 'log_'.bin2hex(random_bytes(8));

        Log::channel(config('logging.default'))->info('[SMS] outbound', [
            'reference' => $reference,
            'to' => $to,
            'message' => $message,
        ]);

        return $reference;
    }

    /**
     * Twilio's Messages resource. Kept to a plain HTTP call so the project does
     * not take on the Twilio SDK for one endpoint; swapping in another provider
     * means adding one method and one enum value.
     */
    private function sendViaTwilio(string $to, string $message): string
    {
        $sid = (string) config('sms.sid');

        $response = Http::asForm()
            ->withBasicAuth($sid, (string) config('sms.token'))
            ->timeout((int) config('sms.timeout', 10))
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => (string) config('sms.from'),
                'Body' => $message,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Twilio rejected the message: '.($response->json('message') ?? 'HTTP '.$response->status()));
        }

        return (string) $response->json('sid');
    }
}
