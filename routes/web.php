<?php

use Illuminate\Support\Facades\Route;

// Catch-all route to serve the React SPA shell.
// Regex constraint ensures /api routes are never swallowed.
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

