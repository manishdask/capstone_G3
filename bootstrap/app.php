<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'audit' => \App\Http\Middleware\AuditMiddleware::class,
            'active.session' => \App\Http\Middleware\EnsureSessionIsActive::class,
            'mfa.setup' => \App\Http\Middleware\RequireMfaSetup::class,
        ]);

        // Laravel's default guest redirect resolves `route('login')` inside the
        // auth middleware, before the exception handler is ever consulted. This
        // backend has no such route, so that threw a 500 for any unauthenticated
        // request that didn't ask for JSON (opening /api/... in a browser).
        // Returning null keeps it on the AuthenticationException path, which the
        // handler below answers with a clean 401.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // This backend serves an API only — there is no `login` route to send a
        // guest to. Without this, an unauthenticated request that doesn't ask
        // for JSON (e.g. opening /api/appointments straight in a browser) made
        // Laravel try to redirect to the named `login` route and blow up with a
        // 500 "Route [login] not defined" instead of a clean 401.
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->expectsJson()
        );

        // The guest-redirect happens while building the response, before the
        // renderer above gets a say, so the unauthenticated case needs its own
        // handler to answer with 401 rather than reaching for `route('login')`.
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
