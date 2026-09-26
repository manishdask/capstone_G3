<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CareTeamFixture;
use Tests\TestCase;

/**
 * An invoice becomes Paid only on a real, matched gateway authorisation.
 */
class PaymentIntegrityTest extends TestCase
{
    use CareTeamFixture, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCareTeam();
    }

    private function bookedInvoice(): Invoice
    {
        $response = $this->actingAs($this->patientOne->user)->postJson('/api/appointments', [
            'branch_id' => $this->nsw->id,
            'specialization' => 'General Medicine',
            'doctor_staff_id' => $this->doctorA->id,
            'appointment_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:30',
        ])->assertStatus(201);

        return Invoice::findOrFail($response->json('invoice_id'));
    }

    public function test_an_invoice_cannot_be_settled_with_an_invented_reference(): void
    {
        $invoice = $this->bookedInvoice();

        $this->actingAs($this->patientOne->user)
            ->postJson("/api/invoices/{$invoice->id}/confirm", ['gateway_reference' => 'sandbox_i-made-this-up'])
            ->assertStatus(422);

        $this->assertSame('pending', $invoice->fresh()->status, 'An invented reference marked the invoice paid.');
    }

    public function test_a_real_checkout_settles_the_invoice(): void
    {
        $invoice = $this->bookedInvoice();

        $reference = $this->actingAs($this->patientOne->user)
            ->postJson("/api/invoices/{$invoice->id}/checkout")
            ->assertStatus(200)
            ->json('data.gateway_reference');

        $this->assertSame('pending', $invoice->fresh()->status, 'Opening a checkout marked the invoice paid.');

        $this->actingAs($this->patientOne->user)
            ->postJson("/api/invoices/{$invoice->id}/confirm", ['gateway_reference' => $reference])
            ->assertStatus(201);

        $this->assertSame('paid', $invoice->fresh()->status);
        $this->assertSame(1, Payment::where('invoice_id', $invoice->id)->where('status', 'success')->count());
    }

    public function test_another_patient_cannot_open_or_settle_someone_elses_invoice(): void
    {
        $invoice = $this->bookedInvoice();

        $this->actingAs($this->patientTwo->user)
            ->postJson("/api/invoices/{$invoice->id}/checkout")
            ->assertStatus(403);

        $this->actingAs($this->patientTwo->user)
            ->getJson("/api/invoices/{$invoice->id}")
            ->assertStatus(403);
    }

    public function test_a_reference_issued_for_one_invoice_cannot_settle_another(): void
    {
        $first = $this->bookedInvoice();

        $second = Invoice::create([
            'patient_id' => $this->patientOne->id,
            'branch_id' => $this->nsw->id,
            'status' => 'pending',
            'issued_at' => now(),
        ]);
        $second->items()->create([
            'description' => 'Specialist Consultation', 'item_type' => 'consultation',
            'quantity' => 1, 'unit_price' => 150, 'amount' => 150,
        ]);
        $second->recalculateTotal();

        $reference = $this->actingAs($this->patientOne->user)
            ->postJson("/api/invoices/{$first->id}/checkout")->json('data.gateway_reference');

        $this->actingAs($this->patientOne->user)
            ->postJson("/api/invoices/{$second->id}/confirm", ['gateway_reference' => $reference])
            ->assertStatus(422);

        $this->assertSame('pending', $second->fresh()->status);
    }
}
