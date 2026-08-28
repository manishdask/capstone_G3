<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// FR57 (proposed): matches the "Daily (02:00 AM)" default already shown in AdminConfig.jsx.
Schedule::command('backup:run')->dailyAt('02:00');
