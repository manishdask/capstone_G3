<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SecurityAlertDetector;

/** FR56 (proposed): repeated failed logins, privileged changes, unusual record access. */
class SecurityAlertController extends Controller
{
    public function index(SecurityAlertDetector $detector)
    {
        return response()->json(['data' => $detector->detect()]);
    }
}
