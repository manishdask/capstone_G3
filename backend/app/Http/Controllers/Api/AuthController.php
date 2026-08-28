<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterPatientRequest;
use App\Models\AuditLog;
use App\Models\Consent;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use App\Services\DuplicatePatientDetector;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * FR1: Register a new patient user only after validating email, unique
     * username and password. Passwords are hashed (never stored in plaintext).
     */
    public function register(RegisterPatientRequest $request, DuplicatePatientDetector $duplicateDetector)
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data) {
            $username = $this->generateUniqueUsername($data['email']);

            $user = User::create([
                'branch_id' => $data['branch_id'],
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'username' => $username,
                'email' => $data['email'],
                'password' => $data['password'],
                'status' => 'active',
            ]);

            $patientRole = Role::firstOrCreate(['name' => Role::PATIENT]);
            $user->roles()->attach($patientRole->id, ['effective_from' => now()->toDateString()]);

            $patient = Patient::create([
                'user_id' => $user->id,
                'branch_id' => $data['branch_id'],
                'global_patient_id' => 'PENDING',
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'date_of_birth' => $data['date_of_birth'],
                'gender' => $data['gender'],
                'contact_number' => $data['contact_number'],
                'email' => $data['email'],
                'allergies' => $data['allergies'] ?? null,
                'status' => 'active',
            ]);

            // FR12: one globally unique patient ID valid across all branches.
            $patient->update([
                'global_patient_id' => sprintf('SGH-PT-%06d', $patient->id),
            ]);

            // FR49: registration completion is the moment of consent — the
            // frontend form requires ticking through the Privacy Notice first.
            Consent::create([
                'patient_id' => $patient->id,
                'purpose' => Consent::PURPOSE_PRIVACY_NOTICE,
                'notice_version' => Consent::CURRENT_NOTICE_VERSION,
                'state' => 'granted',
                'changed_at' => now(),
            ]);

            return $user;
        });

        // FR62: outside the transaction so a slow scan never risks the
        // registration write itself — a missed flag can always be caught later.
        $duplicateDetector->detectAndFlag($user->patient);

        AuditLog::record([
            'actor_id' => $user->id,
            'actor_role' => Role::PATIENT,
            'action' => 'REGISTER',
            'object_type' => 'patient',
            'object_id' => $user->patient->id,
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return $this->issueSession($user, 201);
    }

    /**
     * FR2: Verify login credentials and reject invalid or unauthorised access
     * with a generic error (UC01) — never reveal whether the account exists.
     */
    public function login(LoginRequest $request)
    {
        $login = $request->string('login')->value();

        $user = User::where('email', $login)->orWhere('username', $login)->first();

        $failed = ! $user || $user->status !== 'active' || ! Hash::check($request->string('password')->value(), $user->password);

        AuditLog::record([
            'actor_id' => $user?->id,
            'actor_role' => $user?->roles()->pluck('name')->join(','),
            'action' => 'LOGIN_ATTEMPT',
            'object_type' => 'user',
            'object_id' => $user?->id,
            'outcome' => $failed ? 'failure' : 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        if ($failed) {
            throw ValidationException::withMessages([
                'login' => ['These credentials do not match our records.'],
            ]);
        }

        // FR50: Admin/Branch Manager accounts with MFA already enabled must
        // complete a second TOTP step before a session token is issued.
        if ($user->requiresMfa() && $user->hasMfaEnabled()) {
            return response()->json([
                'mfa_required' => true,
                'challenge' => MfaController::issueChallenge($user->id),
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $response = $this->issueSession($user, 200);

        // Privileged account that hasn't enrolled in MFA yet — the session is
        // issued, but RequireMfaSetup middleware blocks every other route
        // until they enrol, and the frontend forces the setup screen.
        if ($user->requiresMfa() && ! $user->hasMfaEnabled()) {
            $payload = $response->getData(true);
            $payload['mfa_setup_required'] = true;

            return response()->json($payload, 200);
        }

        return $response;
    }

    /** Called by MfaController::verify() once the TOTP/recovery code checks out. */
    public function issueVerifiedSession(\Illuminate\Http\Request $request, User $user)
    {
        $user->forceFill(['last_login_at' => now()])->save();

        AuditLog::record([
            'actor_id' => $user->id,
            'actor_role' => $user->roles()->pluck('name')->join(','),
            'action' => 'MFA_LOGIN_SUCCESS',
            'object_type' => 'user',
            'object_id' => $user->id,
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return $this->issueSession($user, 200);
    }

    /**
     * FR5-adjacent: end the current authenticated session/token (NFR11).
     */
    public function logout(\Illuminate\Http\Request $request)
    {
        $token = $request->user()->currentAccessToken();

        Cache::forget("session-active:{$token->id}");
        $token->delete();

        AuditLog::record([
            'actor_id' => $request->user()->id,
            'action' => 'LOGOUT',
            'object_type' => 'user',
            'object_id' => $request->user()->id,
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * FR4: return the authenticated user with their role-authorised dashboard context.
     */
    public function me(\Illuminate\Http\Request $request)
    {
        $user = $request->user()->load(['branch', 'roles', 'patient', 'staff.doctor']);

        return response()->json(['data' => $user]);
    }

    private function issueSession(User $user, int $status)
    {
        $token = $user->createToken('sgh-app')->plainTextToken;
        $tokenId = explode('|', $token, 2)[0];

        Cache::put("session-active:{$tokenId}", true, now()->addMinutes(10));

        $user->load(['branch', 'roles', 'patient']);

        return response()->json([
            'data' => $user,
            'token' => $token,
        ], $status);
    }

    private function generateUniqueUsername(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '.');
        $base = $base !== '' ? $base : 'patient';
        $username = $base;
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.$suffix++;
        }

        return $username;
    }
}
