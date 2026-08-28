<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * FR53 (proposed): real-time bed availability — a plain read of current DB state, no caching.
 * FR60 (proposed): branch-scoped management of wards/rooms/beds (store/update below).
 */
class BedController extends Controller
{
    public function index(Request $request)
    {
        $query = Bed::query();

        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')));
        $query->when($request->filled('ward'), fn ($q) => $q->where('ward', $request->string('ward')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));

        return response()->json(['data' => $query->orderBy('ward')->orderBy('room_number')->orderBy('bed_number')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'ward' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'bed_number' => [
                'required', 'string', 'max:50',
                Rule::unique('beds')->where('branch_id', $request->input('branch_id'))
                    ->where('ward', $request->input('ward'))
                    ->where('room_number', $request->input('room_number')),
            ],
        ]);

        $bed = Bed::create([...$data, 'status' => 'available']);

        return response()->json(['data' => $bed], 201);
    }

    /** Only maintenance/available toggling is allowed here — occupied is set exclusively by AdmissionController. */
    public function update(Request $request, Bed $bed)
    {
        $data = $request->validate([
            'ward' => ['sometimes', 'string', 'max:255'],
            'room_number' => ['sometimes', 'string', 'max:50'],
            'bed_number' => ['sometimes', 'string', 'max:50'],
            'status' => ['sometimes', 'in:available,maintenance'],
        ]);

        if (($data['status'] ?? null) && $bed->status === 'occupied') {
            abort(422, 'This bed is currently occupied — discharge or transfer the patient first.');
        }

        $bed->update($data);

        return response()->json(['data' => $bed]);
    }
}
