<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * FR50 (proposed): TOTP multi-factor authentication, mandatory for Admin and
 * Branch Manager roles (see User::requiresMfa()).
 */
class MfaController extends Controller
{
    private const CHALLENGE_TTL_MINUTES = 5;

    /**
     * Generates a pending secret (not yet active) for the authenticated user
     * to scan/enter into an authenticator app.
     */
    public function setup(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        // Stored immediately so a subsequent /enable call can verify against
        // it, but two_factor_enabled_at stays null until that verification
        // succeeds — MFA is not "on" just because a secret exists.
        $user->forceFill(['two_factor_secret' => $secret])->save();

        return response()->json(['data' => [
            'secret' => $secret,
            'otpauth_url' => $google2fa->getQRCodeUrl(
                'St George HMS',
                $user->email,
                $secret
            ),
        ]]);
    }

    /** Confirms the pending secret with a real code from the app, then activates MFA. */
    public function enable(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();

        if (! $user->two_factor_secret) {
            abort(422, 'Call /mfa/setup first to generate a secret.');
        }

        $google2fa = new Google2FA();
        if (! $google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            abort(422, 'That code did not match. Please try again.');
        }

        $recoveryCodes = collect(range(1, 8))->map(fn () => Str::upper(Str::random(4).'-'.Str::random(4)))->all();

        $user->forceFill([
            'two_factor_enabled_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ])->save();

        AuditLog::record([
            'actor_id' => $user->id,
            'action' => 'MFA_ENABLED',
            'object_type' => 'user',
            'object_id' => $user->id,
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return response()->json(['data' => ['recovery_codes' => $recoveryCodes]]);
    }

    /** Requires a password re-check — disabling MFA is a sensitive action. */
    public function disable(Request $request)
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            abort(422, 'Incorrect password.');
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_enabled_at' => null,
        ])->save();

        AuditLog::record([
            'actor_id' => $user->id,
            'action' => 'MFA_DISABLED',
            'object_type' => 'user',
            'object_id' => $user->id,
            'outcome' => 'success',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return response()->json(['message' => 'MFA disabled.']);
    }

    /**
     * Second step of login for MFA-enabled users — exchanges a short-lived
     * challenge (issued by AuthController::login) plus a TOTP code for a
     * real session token.
     */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'challenge' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        $userId = Cache::get("mfa-challenge:{$data['challenge']}");

        if (! $userId) {
            abort(422, 'This login challenge has expired. Please sign in again.');
        }

        $user = User::findOrFail($userId);
        $google2fa = new Google2FA();
        $validCode = $google2fa->verifyKey($user->two_factor_secret, $data['code']);
        $validRecovery = in_array(strtoupper($data['code']), $user->two_factor_recovery_codes ?? [], true);

        if (! $validCode && ! $validRecovery) {
            AuditLog::record([
                'actor_id' => $user->id,
                'action' => 'MFA_VERIFY_FAILED',
                'object_type' => 'user',
                'object_id' => $user->id,
                'outcome' => 'failure',
                'ip_address' => $request->ip(),
                'source' => 'api',
            ]);
            abort(422, 'Invalid authentication code.');
        }

        Cache::forget("mfa-challenge:{$data['challenge']}");

        // A used recovery code is single-use — remove it.
        if ($validRecovery) {
            $remaining = array_values(array_diff($user->two_factor_recovery_codes, [strtoupper($data['code'])]));
            $user->forceFill(['two_factor_recovery_codes' => $remaining])->save();
        }

        return app(AuthController::class)->issueVerifiedSession($request, $user);
    }

    public static function issueChallenge(int $userId): string
    {
        $challenge = Str::random(40);
        Cache::put("mfa-challenge:{$challenge}", $userId, now()->addMinutes(self::CHALLENGE_TTL_MINUTES));

        return $challenge;
    }
}
