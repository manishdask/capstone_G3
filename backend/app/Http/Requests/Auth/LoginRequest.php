<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'These credentials do not match our records.',
        ], 422));
    }
}
