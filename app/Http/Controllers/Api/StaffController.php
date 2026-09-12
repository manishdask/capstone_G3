<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * FR21-FR25: doctor/staff profiles, schedules, shifts and attendance.
 */
class StaffController extends Controller
{
    /**
     * Supports gender-wise/specialty-wise doctor filtration for patient booking (SRS 3.2).
     */
    public function index(Request $request)
    {
        $query = Staff::query()->with(['user', 'doctor', 'branch'])
            ->withCount('feedback')->withAvg('feedback', 'rating');

        $query->when($request->filled('branch_id'), fn ($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('staff_type'), fn ($q) => $q->where('staff_type', $request->string('staff_type')))
            ->when($request->filled('specialization'), function ($q) use ($request) {
                $q->whereHas('doctor', fn ($d) => $d->where('specialization', $request->string('specialization')));
            })
            ->when($request->filled('gender'), function ($q) use ($request) {
                $q->whereHas('doctor', fn ($d) => $d->where('gender', $request->string('gender')));
            });

        return response()->json($query->orderBy('id')->paginate($request->integer('per_page', 20)));
    }

    /**
     * FR21: administrators add doctor/staff profiles and specialisations.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'staff_type' => ['required', 'in:doctor,nurse,receptionist,pharmacist,lab_technician,branch_manager,admin'],
            'designation' => ['nullable', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:100', 'unique:staff,registration_no'],
            'specialization' => ['required_if:staff_type,doctor', 'nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'in:male,female,other'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        $staff = DB::transaction(function () use ($data) {
            $user = User::create([
                'branch_id' => $data['branch_id'],
                'name' => $data['name'],
                'username' => $this->generateUniqueUsername($data['email']),
                'email' => $data['email'],
                'password' => $data['password'],
                'status' => 'active',
            ]);

            $roleName = match ($data['staff_type']) {
                'doctor' => Role::DOCTOR,
                'nurse' => Role::NURSE,
                'receptionist' => Role::RECEPTIONIST,
                'pharmacist' => Role::PHARMACIST,
                'lab_technician' => Role::LAB_TECHNICIAN,
                'branch_manager' => Role::BRANCH_MANAGER,
                default => Role::ADMIN,
            };
            $role = Role::firstOrCreate(['name' => $roleName]);
            $user->roles()->attach($role->id, ['effective_from' => now()->toDateString()]);

            $staff = Staff::create([
                'user_id' => $user->id,
                'branch_id' => $data['branch_id'],
                'staff_type' => $data['staff_type'],
                'designation' => $data['designation'] ?? null,
                'registration_no' => $data['registration_no'] ?? null,
                'status' => 'active',
            ]);

            if ($data['staff_type'] === 'doctor') {
                Doctor::create([
                    'staff_id' => $staff->id,
                    'specialization' => $data['specialization'],
                    'gender' => $data['gender'] ?? null,
                    'qualification' => $data['qualification'] ?? null,
                    'consultation_fee' => $data['consultation_fee'] ?? null,
                ]);
            }

            return $staff;
        });

        return response()->json(['data' => $staff->load('user', 'doctor')], 201);
    }

    public function show(Staff $staff)
    {
        return response()->json(['data' => $staff->load('user', 'doctor', 'branch', 'schedules')]);
    }

    public function update(Request $request, Staff $staff)
    {
        $data = $request->validate([
            'designation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive'],
            'specialization' => ['sometimes', 'string', 'max:255'],
            'consultation_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $staff->update(collect($data)->only(['designation', 'status'])->all());

        if ($staff->doctor && (isset($data['specialization']) || array_key_exists('consultation_fee', $data))) {
            $staff->doctor->update(collect($data)->only(['specialization', 'consultation_fee'])->all());
        }

        return response()->json(['data' => $staff->fresh(['user', 'doctor'])]);
    }

    /**
     * FR22/FR25: schedules, shifts, leave and attendance records for a staff member.
     */
    public function schedules(Staff $staff)
    {
        return response()->json(['data' => $staff->schedules()->orderByDesc('schedule_date')->paginate(30)]);
    }

    public function storeSchedule(Request $request, Staff $staff)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'schedule_date' => ['nullable', 'date'],
            'day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'type' => ['required', 'in:availability,shift,leave'],
        ]);

        $schedule = Schedule::create($data + ['staff_id' => $staff->id]);

        return response()->json(['data' => $schedule], 201);
    }

    /**
     * FR23: doctors access assigned patient files and append treatment notes.
     * FR24: nurses record authorised vitals and care observations (record_type=vitals).
     */
    public function storeMedicalRecord(Request $request, Staff $staff)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'record_type' => ['required', 'in:consultation,diagnosis,note,vitals'],
            'diagnosis' => ['nullable', 'string'],
            'treatment_notes' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
        ]);

        $record = MedicalRecord::create($data + ['author_staff_id' => $staff->id]);

        return response()->json(['data' => $record], 201);
    }

    /**
     * FR23/FR28: a doctor writes a prescription (with itemised medicines) for
     * a patient; pharmacy later dispenses each item via PharmacyController::dispense.
     */
    public function storePrescription(Request $request, Staff $staff)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'medical_record_id' => ['nullable', 'exists:medical_records,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'exists:medicines,id'],
            'items.*.dosage' => ['required', 'string', 'max:255'],
            'items.*.route' => ['nullable', 'string', 'max:100'],
            'items.*.frequency' => ['required', 'string', 'max:255'],
            'items.*.duration' => ['nullable', 'string', 'max:100'],
            'items.*.instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        $prescription = DB::transaction(function () use ($data, $staff) {
            $prescription = Prescription::create([
                'patient_id' => $data['patient_id'],
                'medical_record_id' => $data['medical_record_id'] ?? null,
                'prescriber_staff_id' => $staff->id,
                'status' => 'active',
                'issued_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                $prescription->items()->create($item);
            }

            return $prescription;
        });

        return response()->json(['data' => $prescription->load('items.medicine')], 201);
    }

    private function generateUniqueUsername(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '.') ?: 'staff';
        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.$suffix++;
        }

        return $username;
    }
}
