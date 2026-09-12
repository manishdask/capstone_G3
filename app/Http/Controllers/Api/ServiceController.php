<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** FR60 (proposed): branch-scoped service price list. */
class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query();
        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')));

        return response()->json(['data' => $query->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('services')->where('branch_id', $request->input('branch_id')),
            ],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $service = Service::create($data);

        return response()->json(['data' => $service], 201);
    }

    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'name' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('services')->where('branch_id', $service->branch_id)->ignore($service->id),
            ],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $service->update($data);

        return response()->json(['data' => $service]);
    }

    public function destroy(Service $service)
    {
        $service->update(['status' => 'inactive']);

        return response()->json(['message' => 'Service deactivated.']);
    }
}
