<?php

namespace Tests\Feature;

use App\Models\LabOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CareTeamFixture;
use Tests\TestCase;

/**
 * FR31: a patient may ask for a test, but the laboratory only ever works from
 * a doctor's decision. These tests pin the gate shut.
 */
class LabRequestApprovalTest extends TestCase
{
    use CareTeamFixture, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCareTeam();
    }

    private function requestTest(array $overrides = [])
    {
        return $this->actingAs($this->patientOne->user)->postJson('/api/lab-requests', array_merge([
            'doctor_staff_id' => $this->doctorA->id,
            'test_type' => 'Full Blood Count',
            'request_reason' => 'Ongoing fatigue for three weeks.',
        ], $overrides));
    }

    public function test_a_patient_cannot_post_straight_into_the_lab_queue(): void
    {
        $this->actingAs($this->patientOne->user)->postJson('/api/lab-orders', [
            'patient_id' => $this->patientOne->id,
            'branch_id' => $this->nsw->id,
            'test_type' => 'Full Blood Count',
        ])->assertStatus(403);
    }

    public function test_a_request_may_only_go_to_a_doctor_the_patient_has_seen(): void
    {
        $this->requestTest()->assertStatus(403);

        // Once they have an appointment with that doctor, the request is allowed.
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());

        $this->requestTest()->assertStatus(201);
    }

    public function test_a_pending_request_never_reaches_the_laboratory(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->assertStatus(201)->json('data');

        $this->assertSame('pending_approval', $order['status']);

        $labQueue = collect($this->actingAs($this->labTechNsw->user)->getJson('/api/lab-orders')->json('data'))
            ->pluck('id');

        $this->assertNotContains($order['id'], $labQueue, 'An unapproved patient request reached the lab bench.');
    }

    public function test_only_the_addressed_doctor_can_decide_the_request(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->json('data');

        $this->actingAs($this->doctorB->user)
            ->postJson("/api/lab-orders/{$order['id']}/decision", ['decision' => 'approve'])
            ->assertStatus(403);

        $this->assertSame('pending_approval', LabOrder::find($order['id'])->status);
    }

    public function test_approval_releases_the_request_to_the_laboratory(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->json('data');

        $this->actingAs($this->doctorA->user)
            ->postJson("/api/lab-orders/{$order['id']}/decision", ['decision' => 'approve'])
            ->assertStatus(200);

        $this->assertSame('requested', LabOrder::find($order['id'])->status);

        $labQueue = collect($this->actingAs($this->labTechNsw->user)->getJson('/api/lab-orders')->json('data'))
            ->pluck('id');

        $this->assertContains($order['id'], $labQueue, 'An approved request never reached the lab bench.');
    }

    public function test_a_declined_request_stays_out_of_the_laboratory(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->json('data');

        $this->actingAs($this->doctorA->user)
            ->postJson("/api/lab-orders/{$order['id']}/decision", [
                'decision' => 'decline',
                'decision_note' => 'Recent results already cover this.',
            ])->assertStatus(200);

        $this->assertSame('declined', LabOrder::find($order['id'])->status);

        $labQueue = collect($this->actingAs($this->labTechNsw->user)->getJson('/api/lab-orders')->json('data'))
            ->pluck('id');

        $this->assertNotContains($order['id'], $labQueue);
    }

    public function test_a_request_cannot_be_decided_twice(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->json('data');

        $this->actingAs($this->doctorA->user)
            ->postJson("/api/lab-orders/{$order['id']}/decision", ['decision' => 'approve'])->assertStatus(200);

        $this->actingAs($this->doctorA->user)
            ->postJson("/api/lab-orders/{$order['id']}/decision", ['decision' => 'decline'])->assertStatus(422);
    }

    public function test_the_patient_sees_their_own_pending_request(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $order = $this->requestTest()->json('data');

        $mine = collect($this->actingAs($this->patientOne->user)->getJson('/api/lab-orders')->json('data'))->pluck('id');
        $theirs = collect($this->actingAs($this->patientTwo->user)->getJson('/api/lab-orders')->json('data'))->pluck('id');

        $this->assertContains($order['id'], $mine);
        $this->assertNotContains($order['id'], $theirs);
    }
}
