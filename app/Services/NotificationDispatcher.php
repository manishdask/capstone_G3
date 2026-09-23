<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * FR20/FR33: turns an event into notifications that are actually delivered.
 *
 * Before this existed, controllers wrote `Notification` rows with status
 * `queued` and nothing ever read them — no mailer, no SMS, no in-app list. The
 * table was a record of intent, not of delivery.
 *
 * Every event now raises an IN-APP notification (always deliverable, and what
 * the bell in the UI reads) plus whichever external channels the recipient can
 * actually receive. Each row records its own outcome:
 *
 *   sent   — the channel accepted it (mail handed to the configured mailer,
 *            SMS accepted by the provider).
 *   failed — with `failure_reason` saying why, e.g. that no SMS provider is
 *            configured. Nothing is ever marked sent on a channel that did not
 *            actually carry it.
 */
class NotificationDispatcher
{
    public function __construct(private SmsGateway $sms) {}

    /**
     * Raise and deliver a notification set for one recipient.
     *
     * @param  array<int, string>  $channels  extra channels beyond in_app
     * @param  array{type?: string, id?: int}  $related
     */
    public function send(
        ?User $recipient,
        string $template,
        string $message,
        array $related = [],
        array $channels = ['email'],
        ?string $contact = null,
    ): void {
        if (! $recipient) {
            return;
        }

        $contact ??= $this->contactFor($recipient);

        // in_app is always raised: it is the one channel that cannot fail and
        // the one the patient sees without leaving the app.
        foreach (array_unique(array_merge(['in_app'], $channels)) as $channel) {
            $notification = Notification::create([
                'recipient_user_id' => $recipient->id,
                'recipient_contact' => $channel === 'sms' ? $contact : $recipient->email,
                'channel' => $channel,
                'template' => $template,
                'message' => $message,
                'related_type' => $related['type'] ?? null,
                'related_id' => $related['id'] ?? null,
                'status' => 'queued',
            ]);

            $this->deliver($notification, $recipient);
        }
    }

    /**
     * Attempt one notification and record the outcome on the row itself.
     * Delivery failures never bubble up — a mail server being down must not
     * roll back the booking that triggered the message.
     */
    public function deliver(Notification $notification, ?User $recipient = null): void
    {
        $recipient ??= $notification->recipient;
        $notification->increment('attempts');

        try {
            match ($notification->channel) {
                'in_app' => null, // nothing to transmit: the row IS the delivery
                'email' => $this->sendEmail($notification, $recipient),
                'sms' => $this->sms->send($notification->recipient_contact, (string) $notification->message),
                default => throw new \RuntimeException("No transport for channel {$notification->channel}."),
            };

            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
                'failure_reason' => null,
            ]);
        } catch (Throwable $e) {
            $notification->update([
                'status' => 'failed',
                'failure_reason' => \Illuminate\Support\Str::limit($e->getMessage(), 250),
            ]);

            Log::warning('Notification delivery failed', [
                'notification_id' => $notification->id,
                'channel' => $notification->channel,
                'reason' => $e->getMessage(),
            ]);
        }
    }

    private function sendEmail(Notification $notification, ?User $recipient): void
    {
        // `recipient_contact` is whatever the raising code stored — older rows
        // put a mobile number there even on an email row. Use it only when it
        // actually is an address, and otherwise fall back to the account's.
        $stored = filter_var((string) $notification->recipient_contact, FILTER_VALIDATE_EMAIL)
            ? $notification->recipient_contact
            : null;

        $address = $stored ?: $recipient?->email;

        if (! $address) {
            throw new \RuntimeException('The recipient has no email address on file.');
        }

        Mail::raw((string) $notification->message, function ($mail) use ($address, $notification) {
            $mail->to($address)->subject($this->subjectFor($notification->template));
        });
    }

    /** Human subject lines for the templates the app raises. */
    private function subjectFor(?string $template): string
    {
        return match ($template) {
            'appointment_confirmed' => 'Your appointment is confirmed',
            'appointment_cancelled' => 'Your appointment was cancelled',
            'appointment_rejected' => 'Your appointment could not be accepted',
            'appointment_completed' => 'Your visit summary',
            'invoice_ready' => 'Your invoice is ready',
            'lab_result_released' => 'Your test result is available',
            'lab_request_submitted' => 'Your test request was received',
            'lab_request_approved' => 'Your test request was approved',
            'lab_request_declined' => 'About your test request',
            'lab_order_created' => 'A test has been ordered for you',
            default => 'St George Hospital',
        };
    }

    /** The mobile number to text, from the patient record where there is one. */
    private function contactFor(User $user): ?string
    {
        return Patient::where('user_id', $user->id)->value('contact_number');
    }
}
