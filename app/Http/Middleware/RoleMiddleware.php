<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side RBAC gate (NFR10). Usage: ->middleware('role:Admin,Branch Manager')
 * Denies with a generic 403 — never reveals which roles would have been allowed.
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'You are not authorised to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}
