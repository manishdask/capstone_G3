<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Logs actor, action, object and outcome for sensitive writes (NFR12).
 * Applied to state-changing routes (POST/PUT/PATCH/DELETE); reads are not logged here.
 */
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->isMethodSafe()) {
            return $response;
        }

        $routeName = optional($request->route())->getName() ?? $request->path();
        [$objectType, $objectId] = $this->resolveSubject($request);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'actor_role' => $request->user()?->roles()->pluck('name')->join(','),
            'action' => strtoupper($request->method()).' '.$routeName,
            'object_type' => $objectType,
            'object_id' => $objectId,
            'outcome' => $response->getStatusCode() < 400 ? 'success' : 'failure',
            'ip_address' => $request->ip(),
            'source' => 'api',
        ]);

        return $response;
    }

    /**
     * @return array{0: ?string, 1: ?int}
     */
    private function resolveSubject(Request $request): array
    {
        $route = $request->route();

        if (! $route) {
            return [null, null];
        }

        foreach ($route->parameters() as $key => $value) {
            $id = is_object($value) ? ($value->id ?? null) : $value;

            if ($id !== null) {
                return [$key, (int) $id];
            }
        }

        return [null, null];
    }
}
