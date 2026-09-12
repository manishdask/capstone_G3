<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sliding 10-minute idle timeout for authenticated API sessions (NFR11).
 * Each authenticated request refreshes a short-lived cache marker keyed to the
 * access token; once that marker expires the token is revoked and the caller
 * must sign in again.
 */
class EnsureSessionIsActive
{
    private const IDLE_MINUTES = 10;

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        if (! $token) {
            return $next($request);
        }

        $cacheKey = "session-active:{$token->id}";

        if (! Cache::has($cacheKey)) {
            $token->delete();

            return response()->json([
                'message' => 'Your session has expired due to inactivity. Please sign in again.',
            ], 401);
        }

        Cache::put($cacheKey, true, now()->addMinutes(self::IDLE_MINUTES));

        return $next($request);
    }
}
