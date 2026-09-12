<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** FR60 (proposed): branch-scoped department management. */
class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query();
        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')));

        return response()->json(['data' => $query->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('departments')->where('branch_id', $request->input('branch_id')),
            ],
        ]);

        $department = Department::create($data);

        return response()->json(['data' => $department], 201);
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('departments')->where('branch_id', $department->branch_id)->ignore($department->id),
            ],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $department->update($data);

        return response()->json(['data' => $department]);
    }

    public function destroy(Department $department)
    {
        $department->update(['status' => 'inactive']);

        return response()->json(['message' => 'Department deactivated.']);
    }
}
