<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Staff;
use Illuminate\Http\Request;

/**
 * FR6-FR10: branch CRUD, staff assignment, branch-scoped statistics.
 */
class BranchController extends Controller
{
    /**
     * Unauthenticated, minimal branch list — needed so the patient
     * registration form (FR1, before any session exists) can offer a branch
     * picker. Deliberately excludes stats/contact details.
     */
    public function publicIndex()
    {
        return response()->json([
            'data' => Branch::where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'state']),
        ]);
    }

    public function index(Request $request)
    {
        $branches = Branch::query()
            ->when($request->boolean('active_only'), fn ($q) => $q->where('status', 'active'))
            ->withCount(['staff', 'patients'])
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($branches);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:0'],
        ]);

        $branch = Branch::create($data);

        return response()->json(['data' => $branch], 201);
    }

    public function show(Branch $branch)
    {
        return response()->json(['data' => $branch->loadCount(['staff', 'patients'])]);
    }

    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $branch->update($data);

        return response()->json(['data' => $branch]);
    }

    /**
     * FR6: branches are deactivated, not hard-deleted, to preserve historical
     * appointment/billing/audit references.
     */
    public function destroy(Branch $branch)
    {
        $branch->update(['status' => 'inactive']);

        return response()->json(['message' => 'Branch deactivated.']);
    }

    /**
     * FR8: assign an existing staff account to a branch.
     */
    public function assignStaff(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'staff_id' => ['required', 'exists:staff,id'],
        ]);

        $staff = Staff::findOrFail($data['staff_id']);
        $staff->update(['branch_id' => $branch->id]);
        $staff->user()->update(['branch_id' => $branch->id]);

        return response()->json(['data' => $staff->fresh('user')]);
    }

    /**
     * FR9-FR10: branch-scoped statistics for branch managers/admins.
     */
    public function statistics(Branch $branch)
    {
        return response()->json(['data' => [
            'branch_id' => $branch->id,
            'total_patients' => $branch->patients()->count(),
            'total_staff' => $branch->staff()->count(),
            'appointments_today' => $branch->appointments()->whereDate('appointment_date', today())->count(),
            'active_admissions' => $branch->beds()->where('status', 'occupied')->count(),
            'free_beds' => $branch->beds()->where('status', 'available')->count(),
            'low_stock_medicines' => $branch->medicines()->whereColumn('quantity', '<', 'threshold')->count(),
        ]]);
    }
}
