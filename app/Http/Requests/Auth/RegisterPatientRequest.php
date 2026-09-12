<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Patient Registration Form (SRS 4.1.3): first name, last name, email, password,
 * date of birth, gender, contact number, pre-existing medical allergies.
 */
class RegisterPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'contact_number' => ['required', 'string', 'max:30'],
            'allergies' => ['nullable', 'string', 'max:2000'],
            'branch_id' => ['required', 'exists:branches,id'],
        ];
    }

    /**
     * Generic, non-revealing error messages (NFR14, UC01) — never confirm
     * which specific field (e.g. email) already exists to an anonymous caller.
     */
    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The details provided are invalid. Please check the form and try again.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
