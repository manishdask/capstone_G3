<?php

namespace Tests\Feature;

use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CareTeamFixture;
use Tests\TestCase;

/**
 * FR20: messages are delivered, and a channel that could not deliver says so
 * rather than reporting a success it did not have.
 */
class NotificationDeliveryTest extends TestCase
{
    use CareTeamFixture, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCareTeam();
    }

    private function book()
    {
        return $this->actingAs($this->patientOne->user)->postJson('/api/appointments', [
            'branch_id' => $this->nsw->id,
            'specialization' => 'General Medicine',
            'doctor_staff_id' => $this->doctorA->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
        ]);
    }

    public function test_booking_raises_an_in_app_notification_for_the_patient(): void
    {
        $this->book()->assertStatus(201);

        $inApp = Notification::where('recipient_user_id', $this->patientOne->user_id)
            ->where('channel', 'in_app')
            ->where('template', 'appointment_confirmed')
            ->first();

        $this->assertNotNull($inApp, 'No in-app notification was raised.');
        $this->assertSame('sent', $inApp->status);
        $this->assertNull($inApp->read_at);
    }

    /**
     * The test environment uses the `array` mailer, whose transport keeps every
     * message it was handed — so this asserts the mail actually reached a
     * transport, not merely that a row was written.
     */
    public function test_email_is_handed_to_the_mailer(): void
    {
        $this->book()->assertStatus(201);

        $sent = Mail::mailer()->getSymfonyTransport()->messages();

        $this->assertGreaterThanOrEqual(1, count($sent), 'No email reached the mail transport.');

        $recipients = collect($sent)
            ->map(fn ($item) => $item->getEnvelope()->getRecipients()[0]->getAddress());

        $this->assertContains($this->patientOne->user->email, $recipients->all());

        $emailRows = Notification::where('channel', 'email')->get();

        $this->assertNotEmpty($emailRows);
        $this->assertEmpty(
            $emailRows->where('status', '!=', 'sent'),
            'An email notification was left undelivered.'
        );
    }

    public function test_sms_is_recorded_as_failed_when_no_provider_is_configured(): void
    {
        config(['sms.provider' => null]);

        $this->book()->assertStatus(201);

        $sms = Notification::where('channel', 'sms')->first();

        $this->assertNotNull($sms, 'No SMS notification row was raised at all.');
        $this->assertSame('failed', $sms->status, 'An unconfigured SMS gateway reported a delivered message.');
        $this->assertStringContainsString('SMS_GATEWAY_PROVIDER', (string) $sms->failure_reason);
    }

    public function test_the_placeholder_mock_provider_is_not_treated_as_configured(): void
    {
        config(['sms.provider' => 'mock']);

        $this->book()->assertStatus(201);

        $sms = Notification::where('channel', 'sms')->first();

        $this->assertSame('failed', $sms->status, '"mock" was treated as a working SMS gateway.');
    }

    public function test_sms_reports_sent_once_a_provider_is_configured(): void
    {
        config(['sms.provider' => 'log']);

        $this->book()->assertStatus(201);

        $this->assertSame('sent', Notification::where('channel', 'sms')->first()->status);
    }

    public function test_a_user_only_sees_their_own_notifications(): void
    {
        $this->book()->assertStatus(201);

        $mine = $this->actingAs($this->patientOne->user)->getJson('/api/notifications')->json('data');
        $theirs = $this->actingAs($this->patientTwo->user)->getJson('/api/notifications')->json('data');

        $this->assertNotEmpty($mine);
        $this->assertEmpty($theirs);

        foreach ($mine as $row) {
            $this->assertSame($this->patientOne->user_id, $row['recipient_user_id']);
        }
    }

    public function test_marking_read_is_restricted_to_the_owner(): void
    {
        $this->book();
        $notification = Notification::where('recipient_user_id', $this->patientOne->user_id)
            ->where('channel', 'in_app')->firstOrFail();

        $this->actingAs($this->patientTwo->user)
            ->postJson("/api/notifications/{$notification->id}/read")
            ->assertStatus(403);

        $this->actingAs($this->patientOne->user)
            ->postJson("/api/notifications/{$notification->id}/read")
            ->assertStatus(200);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_delivery_health_names_the_missing_sms_configuration(): void
    {
        config(['sms.provider' => null]);

        $admin = $this->makeStaff($this->nsw, 'admin', \App\Models\Role::ADMIN, 'Admin One', 'admin.one@test.local');

        $health = $this->actingAs($admin->user)->getJson('/api/notifications/health')
            ->assertStatus(200)->json('data');

        $this->assertFalse($health['sms']['configured']);
        $this->assertStringContainsString('SMS_GATEWAY_PROVIDER', $health['sms']['configuration_required']);
    }
}
