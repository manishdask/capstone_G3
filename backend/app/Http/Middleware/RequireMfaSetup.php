<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * FR50 (proposed): once a privileged (Admin/Branch Manager) account has
 * logged in, every route except MFA enrolment, /auth/me and /auth/logout is
 * blocked until they finish setting up MFA. This is the real enforcement —
 * AuthController::login's `mfa_setup_required` flag is only a UX hint.
 */
class RequireMfaSetup
{
    private const ALLOWED_PATHS = [
        'api/mfa/setup', 'api/mfa/enable', 'api/auth/me', 'api/auth/logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->requiresMfa() || $user->hasMfaEnabled()) {
            return $next($request);
        }

        if ($request->is(self::ALLOWED_PATHS)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Multi-factor authentication setup is required for this role before continuing.',
            'mfa_setup_required' => true,
        ], 403);
    }
}
