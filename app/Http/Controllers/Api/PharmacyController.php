<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\InventoryTransaction;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FR26-FR30: medicine stock, dispensing, expiry/threshold checks, low-stock alerts.
 */
class PharmacyController extends Controller
{
    public function index(Request $request)
    {
        $query = Medicine::query()
            ->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('quantity', '<', 'threshold'))
            ->when($request->boolean('expired'), fn ($q) => $q->whereDate('expiry_date', '<', today()));

        return response()->json($query->orderBy('name')->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR26: store medicines, quantities, expiry dates, minimum thresholds and suppliers.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:0'],
            'threshold' => ['required', 'integer', 'min:0'],
            'expiry_date' => ['required', 'date', 'after:today'],
            'supplier' => ['nullable', 'string', 'max:255'],
        ]);

        $medicine = Medicine::create($data);

        if ($medicine->quantity > 0) {
            InventoryTransaction::create([
                'branch_id' => $medicine->branch_id,
                'medicine_id' => $medicine->id,
                'quantity' => $medicine->quantity,
                'type' => 'stock_in',
                'actor_id' => $request->user()->id,
                'reference' => 'initial_stock',
            ]);
        }

        return response()->json(['data' => $medicine], 201);
    }

    /** FR60 (proposed): branch-scoped management of inventory thresholds/pricing on an existing medicine. */
    public function update(Request $request, Medicine $medicine)
    {
        $data = $request->validate([
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'threshold' => ['sometimes', 'integer', 'min:0'],
            'supplier' => ['nullable', 'string', 'max:255'],
        ]);

        $medicine->update($data);

        return response()->json(['data' => $medicine]);
    }

    /**
     * FR27: medicines currently below their minimum threshold.
     */
    public function lowStock(Request $request)
    {
        $query = Medicine::query()
            ->whereColumn('quantity', '<', 'threshold')
            ->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')));

        return response()->json(['data' => $query->orderBy('quantity')->get()]);
    }

    /**
     * Should (FR29): create a purchase order transaction for restocking.
     */
    public function purchaseOrder(Request $request, Medicine $medicine)
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);

        $transaction = InventoryTransaction::create([
            'branch_id' => $medicine->branch_id,
            'medicine_id' => $medicine->id,
            'quantity' => $data['quantity'],
            'type' => 'purchase_order',
            'actor_id' => $request->user()->id,
            'reference' => 'restock_request',
        ]);

        return response()->json(['data' => $transaction], 201);
    }

    /**
     * Lists prescriptions for the pharmacy desk (branch/status filterable) or,
     * for a Patient-role caller, their own prescriptions only (backs the
     * patient records screen and the pharmacist dispensing queue).
     */
    public function prescriptionsIndex(Request $request)
    {
        $user = $request->user();
        $query = Prescription::query()->with(['patient', 'prescriber.user', 'items.medicine']);

        if ($user->hasRole(Role::PATIENT)) {
            $query->where('patient_id', $user->patient?->id);
        } else {
            $query->when($request->filled('patient_id'), fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
                ->when($request->filled('branch_id'), fn ($q) => $q->whereHas('patient', fn ($p) => $p->where('branch_id', $request->integer('branch_id'))));
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));

        return response()->json($query->latest('issued_at')->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR28: record a dispensed medicine, reduce stock, link to prescription/patient.
     * FR30: block dispensing when the medicine is expired or stock is insufficient.
     */
    public function dispense(Request $request, Prescription $prescription)
    {
        $data = $request->validate([
            'prescription_item_id' => ['required', 'exists:prescription_items,id'],
            // FR63 (proposed): mandatory justification to dispense past an allergy warning.
            'override_reason' => ['nullable', 'string', 'min:10'],
        ]);

        $item = $prescription->items()->with('medicine')->findOrFail($data['prescription_item_id']);
        $medicine = $item->medicine;

        if ($medicine->expiry_date->isPast()) {
            abort(422, 'This medicine batch has expired and cannot be dispensed.');
        }

        // FR63 (proposed): warn on a possible allergy conflict — blocks unless a
        // reason is supplied, in which case the override itself is logged.
        $conflict = $this->detectAllergyConflict($prescription->patient->allergies, $medicine);
        if ($conflict && empty($data['override_reason'])) {
            return response()->json([
                'message' => "Possible allergy conflict: the patient has a recorded allergy to \"{$conflict}\", which matches this medicine. Provide an override reason to proceed.",
                'allergy_conflict' => true,
                'matched_allergy' => $conflict,
            ], 422);
        }

        $dispenseQty = 1;

        DB::transaction(function () use ($medicine, $dispenseQty, $prescription, $request, $conflict, $data) {
            $locked = Medicine::whereKey($medicine->id)->lockForUpdate()->first();

            if ($locked->quantity < $dispenseQty) {
                abort(422, 'Insufficient stock to dispense this medicine.');
            }

            $locked->decrement('quantity', $dispenseQty);

            InventoryTransaction::create([
                'branch_id' => $locked->branch_id,
                'medicine_id' => $locked->id,
                'quantity' => -$dispenseQty,
                'type' => 'dispense',
                'actor_id' => $request->user()->id,
                'reference' => 'prescription:'.$prescription->id,
            ]);

            if ($conflict) {
                AuditLog::record([
                    'actor_id' => $request->user()->id,
                    'action' => 'ALLERGY_OVERRIDE_DISPENSE',
                    'object_type' => 'medicine',
                    'object_id' => $locked->id,
                    'outcome' => 'success',
                    'ip_address' => $request->ip(),
                    'source' => 'api',
                ]);
            }
        });

        return response()->json(['data' => $medicine->fresh()]);
    }

    private function detectAllergyConflict(?string $patientAllergies, Medicine $medicine): ?string
    {
        if (! $patientAllergies) {
            return null;
        }

        $tokens = array_filter(array_map('trim', preg_split('/[,;]|\band\b/i', $patientAllergies)));
        $haystack = strtolower($medicine->name.' '.$medicine->category);

        foreach ($tokens as $token) {
            $needle = strtolower($token);
            if ($needle !== '' && str_contains($haystack, $needle)) {
                return $token;
            }
        }

        return null;
    }

    public function updatePrescriptionStatus(Request $request, Prescription $prescription)
    {
        $data = $request->validate(['status' => ['required', 'in:active,dispensed,cancelled']]);

        $prescription->update($data);

        return response()->json(['data' => $prescription]);
    }
}
