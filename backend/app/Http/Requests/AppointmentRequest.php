<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Appointment Request Form (SRS 4.1.3): branch, specialty, doctor, preferred
 * date (calendar picker) and preferred time slot (dropdown).
 */
class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'specialization' => ['required', 'string'],
            'doctor_staff_id' => ['required', 'exists:staff,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The appointment request is invalid. Please check the form and try again.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
