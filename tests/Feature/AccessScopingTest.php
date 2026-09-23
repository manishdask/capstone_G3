<?php

namespace Tests\Feature;

use App\Models\LabOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CareTeamFixture;
use Tests\TestCase;

/**
 * Who may see what. Each test states the rule in its name; a failure here is a
 * data-leak, not a cosmetic defect.
 */
class AccessScopingTest extends TestCase
{
    use CareTeamFixture, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCareTeam();
    }

    public function test_doctor_sees_only_their_own_appointments(): void
    {
        $mine = $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString(), '10:00');
        $theirs = $this->bookFor($this->patientTwo, $this->doctorB, now()->addDay()->toDateString(), '11:00');

        $ids = collect($this->actingAs($this->doctorA->user)->getJson('/api/appointments')->json('data'))
            ->pluck('id');

        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($theirs->id, $ids, 'Doctor A can see Doctor B\'s appointment.');
    }

    public function test_lab_technician_cannot_list_clinical_appointments(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString(), '10:00');

        $response = $this->actingAs($this->labTechNsw->user)->getJson('/api/appointments');

        $this->assertNotEquals(
            200,
            $response->status(),
            'Lab technician received the clinical appointment list.'
        );
    }

    public function test_staff_cannot_read_another_branch_by_passing_its_branch_id(): void
    {
        $vicAppointment = $this->bookFor($this->patientOne, $this->doctorVic, now()->addDay()->toDateString(), '10:00');

        $ids = collect($this->actingAs($this->receptionist->user)
            ->getJson('/api/appointments?branch_id='.$this->vic->id)
            ->json('data'))->pluck('id');

        $this->assertNotContains($ids->contains($vicAppointment->id) ? $vicAppointment->id : -1, [$vicAppointment->id],
            'NSW receptionist read a VIC appointment by changing branch_id.');
    }

    public function test_doctor_cannot_open_a_patient_they_were_never_assigned(): void
    {
        // patientTwo has never seen doctorA.
        $response = $this->actingAs($this->doctorA->user)
            ->getJson('/api/patients/'.$this->patientTwo->id);

        $this->assertEquals(403, $response->status(), 'Unassigned doctor opened a patient file.');
    }

    public function test_doctor_cannot_read_medical_records_of_an_unassigned_patient(): void
    {
        $response = $this->actingAs($this->doctorA->user)
            ->getJson('/api/patients/'.$this->patientTwo->id.'/medical-records');

        $this->assertEquals(403, $response->status(), 'Unassigned doctor read clinical notes.');
    }

    public function test_patient_cannot_read_another_patients_record_by_changing_the_id(): void
    {
        $response = $this->actingAs($this->patientOne->user)
            ->getJson('/api/patients/'.$this->patientTwo->id);

        $this->assertEquals(403, $response->status());
    }

    public function test_a_doctor_cannot_author_a_note_under_another_doctors_name(): void
    {
        // Doctor A is assigned to patient one, so the patient is not the obstacle.
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());

        $response = $this->actingAs($this->doctorA->user)
            ->postJson("/api/staff/{$this->doctorB->id}/medical-records", [
                'patient_id' => $this->patientOne->id,
                'record_type' => 'consultation',
                'treatment_notes' => 'Written under a colleague\'s name.',
            ]);

        $this->assertEquals(403, $response->status(), 'A doctor authored a note as another doctor.');
    }

    public function test_a_doctor_cannot_revise_another_clinicians_note(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());
        $this->bookFor($this->patientOne, $this->doctorB, now()->addDays(2)->toDateString(), '11:00');

        $record = $this->actingAs($this->doctorA->user)
            ->postJson("/api/staff/{$this->doctorA->id}/medical-records", [
                'patient_id' => $this->patientOne->id,
                'record_type' => 'consultation',
                'treatment_notes' => 'Original note',
            ])->json('data');

        // Doctor B is also assigned to this patient, but the note is not theirs.
        $this->actingAs($this->doctorB->user)
            ->putJson("/api/medical-records/{$record['id']}", ['treatment_notes' => 'Tampered'])
            ->assertStatus(403);
    }

    public function test_revising_a_note_bumps_its_version_rather_than_silently_overwriting(): void
    {
        $this->bookFor($this->patientOne, $this->doctorA, now()->addDay()->toDateString());

        $record = $this->actingAs($this->doctorA->user)
            ->postJson("/api/staff/{$this->doctorA->id}/medical-records", [
                'patient_id' => $this->patientOne->id,
                'record_type' => 'consultation',
                'treatment_notes' => 'Original note',
            ])->json('data');

        $updated = $this->actingAs($this->doctorA->user)
            ->putJson("/api/medical-records/{$record['id']}", ['treatment_notes' => 'Revised note'])
            ->assertStatus(200)->json('data');

        $this->assertSame('Revised note', $updated['treatment_notes']);
        $this->assertSame(2, $updated['version']);
    }

    public function test_a_lab_technician_cannot_browse_the_patient_directory(): void
    {
        $response = $this->actingAs($this->labTechNsw->user)->getJson('/api/patients');

        $this->assertEmpty($response->json('data'), 'A lab technician listed patient records.');
    }

    public function test_a_lab_technician_cannot_write_into_another_branches_order(): void
    {
        $vicOrder = LabOrder::create([
            'patient_id' => $this->patientTwo->id, 'requester_staff_id' => $this->doctorVic->id,
            'branch_id' => $this->vic->id, 'test_type' => 'Full Blood Count',
            'status' => 'requested', 'requested_at' => now(),
        ]);

        $this->actingAs($this->labTechNsw->user)
            ->postJson("/api/lab-orders/{$vicOrder->id}/results", ['result_details' => 'Tampered'])
            ->assertStatus(403);
    }

    public function test_a_doctor_cannot_complete_another_doctors_appointment(): void
    {
        $theirs = $this->bookFor($this->patientTwo, $this->doctorB, now()->addDay()->toDateString(), '11:00');

        $this->actingAs($this->doctorA->user)
            ->patchJson("/api/appointments/{$theirs->id}/status", ['status' => 'completed'])
            ->assertStatus(403);

        $this->assertSame('confirmed', $theirs->fresh()->status);
    }

    public function test_lab_technician_sees_only_their_own_branch_queue(): void
    {
        $nswOrder = LabOrder::create([
            'patient_id' => $this->patientOne->id, 'requester_staff_id' => $this->doctorA->id,
            'branch_id' => $this->nsw->id, 'test_type' => 'Full Blood Count',
            'status' => 'requested', 'requested_at' => now(),
        ]);
        $vicOrder = LabOrder::create([
            'patient_id' => $this->patientTwo->id, 'requester_staff_id' => $this->doctorVic->id,
            'branch_id' => $this->vic->id, 'test_type' => 'Full Blood Count',
            'status' => 'requested', 'requested_at' => now(),
        ]);

        $ids = collect($this->actingAs($this->labTechNsw->user)
            ->getJson('/api/lab-orders?branch_id='.$this->vic->id)
            ->json('data'))->pluck('id');

        $this->assertNotContains($vicOrder->id, $ids, 'NSW lab tech saw a VIC lab order.');
        $this->assertContains($nswOrder->id, collect($this->actingAs($this->labTechNsw->user)
            ->getJson('/api/lab-orders')->json('data'))->pluck('id'));
    }
}
