<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\Role;
use Illuminate\Http\Request;

/**
 * Patient reviews (SRS 3.2 "leaving doctor reviews"; original brief "patient
 * give reviews on doctor profile"). Sentiment classification (FR47) is an
 * excluded AI feature — the sentiment column stays null here; the comment
 * and rating are stored as submitted.
 */
class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::query()->with(['patient', 'branch', 'doctor.user']);

        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('doctor_staff_id'), fn ($q) => $q->where('doctor_staff_id', $request->integer('doctor_staff_id')));

        return response()->json($query->latest('created_at')->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'doctor_staff_id' => ['nullable', 'exists:staff,id'],
            'comment' => ['required', 'string', 'max:2000'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $user = $request->user();
        $patient = $user->hasRole(Role::PATIENT) ? $user->patient : null;

        $feedback = Feedback::create($data + [
            'patient_id' => $patient?->id,
            'branch_id' => $patient?->branch_id,
        ]);

        return response()->json(['data' => $feedback->load('branch', 'doctor.user')], 201);
    }
}
