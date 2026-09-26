<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\LabOrder;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CareTeamFixture;
use Tests\TestCase;

/**
 * The end-to-end journey the brief asks to be proven: book -> unpaid -> visible
 * to the right people -> lab request -> lab completion -> report available.
 */
class CareWorkflowTest extends TestCase
{
    use CareTeamFixture, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCareTeam();
    }

    private function bookViaApi(array $overrides = [])
    {
        return $this->actingAs($this->patientOne->user)->postJson('/api/appointments', array_merge([
            'branch_id' => $this->nsw->id,
            'specialization' => 'General Medicine',
            'doctor_staff_id' => $this->doctorA->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
            'reason' => 'Test booking',
        ], $overrides));
    }

    public function test_booking_leaves_the_bill_unpaid(): void
    {
        $response = $this->bookViaApi()->assertStatus(201);

        $invoice = Invoice::find($response->json('invoice_id'));

        $this->assertNotNull($invoice, 'No invoice was raised for the booking.');
        $this->assertSame('pending', $invoice->status, 'Booking marked the invoice paid.');
        $this->assertSame(0, $invoice->payments()->count());
    }

    public function test_a_booked_slot_cannot_be_taken_twice(): void
    {
        $this->bookViaApi()->assertStatus(201);

        $second = $this->actingAs($this->patientTwo->user)->postJson('/api/appointments', [
            'branch_id' => $this->nsw->id,
            'specialization' => 'General Medicine',
            'doctor_staff_id' => $this->doctorA->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
        ]);

        $second->assertStatus(409);
    }

    public function test_a_booked_slot_disappears_from_availability(): void
    {
        $date = now()->addDay()->toDateString();
        $this->bookViaApi(['appointment_date' => $date])->assertStatus(201);

        $booked = $this->actingAs($this->patientTwo->user)
            ->getJson("/api/doctors/{$this->doctorA->id}/availability?date=$date")
            ->json('data.booked_slots');

        $this->assertNotEmpty($booked, 'Availability still shows the slot as free.');
    }

    public function test_the_booking_appears_in_the_patients_own_list(): void
    {
        $id = $this->bookViaApi()->json('data.id');

        $ids = collect($this->actingAs($this->patientOne->user)->getJson('/api/appointments')->json('data'))
            ->pluck('id');

        $this->assertContains($id, $ids, 'Patient cannot see their own booking.');
    }

    public function test_the_booking_reaches_only_the_assigned_doctor(): void
    {
        $id = $this->bookViaApi()->json('data.id');

        $assigned = collect($this->actingAs($this->doctorA->user)->getJson('/api/appointments')->json('data'))->pluck('id');
        $other = collect($this->actingAs($this->doctorB->user)->getJson('/api/appointments')->json('data'))->pluck('id');
        $vic = collect($this->actingAs($this->doctorVic->user)->getJson('/api/appointments')->json('data'))->pluck('id');

        $this->assertContains($id, $assigned);
        $this->assertNotContains($id, $other, 'The other NSW doctor sees it too.');
        $this->assertNotContains($id, $vic, 'A VIC doctor sees an NSW appointment.');
    }

    public function test_a_lab_request_reaches_the_lab_technician_queue(): void
    {
        $appointmentId = $this->bookViaApi()->json('data.id');

        $order = $this->actingAs($this->doctorA->user)->postJson('/api/lab-orders', [
            'patient_id' => $this->patientOne->id,
            'branch_id' => $this->nsw->id,
            'appointment_id' => $appointmentId,
            'test_type' => 'Full Blood Count',
        ])->assertStatus(201)->json('data');

        $queue = collect($this->actingAs($this->labTechNsw->user)->getJson('/api/lab-orders')->json('data'));

        $this->assertContains($order['id'], $queue->pluck('id'), 'The lab technician never received the request.');
        $this->assertSame($this->doctorA->id, $order['requester_staff_id'], 'The order is not linked to the requesting doctor.');
        $this->assertSame($this->patientOne->id, $order['patient_id']);
    }

    public function test_the_lab_technician_can_complete_an_assigned_order(): void
    {
        $order = LabOrder::create([
            'patient_id' => $this->patientOne->id, 'requester_staff_id' => $this->doctorA->id,
            'branch_id' => $this->nsw->id, 'test_type' => 'Full Blood Count',
            'status' => 'requested', 'requested_at' => now(),
        ]);

        $result = $this->actingAs($this->labTechNsw->user)
            ->postJson("/api/lab-orders/{$order->id}/results", ['result_details' => 'Normal range'])
            ->assertStatus(201)->json('data');

        $this->actingAs($this->labTechNsw->user)
            ->postJson("/api/lab-results/{$result['id']}/release")
            ->assertStatus(200);

        $this->assertSame('completed', $order->fresh()->status);
    }

    public function test_a_patient_can_read_their_released_lab_result(): void
    {
        $order = LabOrder::create([
            'patient_id' => $this->patientOne->id, 'requester_staff_id' => $this->doctorA->id,
            'branch_id' => $this->nsw->id, 'test_type' => 'Full Blood Count',
            'status' => 'requested', 'requested_at' => now(),
        ]);

        $result = $this->actingAs($this->labTechNsw->user)
            ->postJson("/api/lab-orders/{$order->id}/results", ['result_details' => 'Normal range'])->json('data');
        $this->actingAs($this->labTechNsw->user)->postJson("/api/lab-results/{$result['id']}/release");

        $mine = collect($this->actingAs($this->patientOne->user)->getJson('/api/lab-orders')->json('data'));
        $theirs = collect($this->actingAs($this->patientTwo->user)->getJson('/api/lab-orders')->json('data'));

        $this->assertContains($order->id, $mine->pluck('id'));
        $this->assertNotContains($order->id, $theirs->pluck('id'));
    }

    public function test_notifications_are_actually_delivered_not_left_queued(): void
    {
        $this->bookViaApi()->assertStatus(201);

        $queued = Notification::where('status', 'queued')->count();

        $this->assertSame(0, $queued, $queued.' notification(s) were left in the queue with nothing to send them.');
    }

    public function test_a_patient_can_list_their_in_app_notifications(): void
    {
        $this->bookViaApi()->assertStatus(201);

        $this->actingAs($this->patientOne->user)
            ->getJson('/api/notifications')
            ->assertStatus(200);
    }

    public function test_a_doctor_can_update_a_treatment_note_they_authored(): void
    {
        $appointmentId = $this->bookViaApi()->json('data.id');

        $record = $this->actingAs($this->doctorA->user)
            ->postJson("/api/staff/{$this->doctorA->id}/medical-records", [
                'patient_id' => $this->patientOne->id,
                'appointment_id' => $appointmentId,
                'record_type' => 'consultation',
                'diagnosis' => 'Initial',
                'treatment_notes' => 'First pass',
            ])->assertStatus(201)->json('data');

        $this->actingAs($this->doctorA->user)
            ->putJson("/api/medical-records/{$record['id']}", ['treatment_notes' => 'Revised after review'])
            ->assertStatus(200);
    }
}
