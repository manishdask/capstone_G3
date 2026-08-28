<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/** FR59 (proposed) — default system settings. */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'appointment_duration_minutes', 'value' => '30', 'label' => 'Default appointment duration (minutes)', 'type' => 'number'],
            ['key' => 'notification_lead_hours', 'value' => '2', 'label' => 'Appointment reminder lead time (hours)', 'type' => 'number'],
            ['key' => 'data_retention_days', 'value' => '2555', 'label' => 'Patient record retention period (days)', 'type' => 'number'],
            ['key' => 'feature_ai_insights', 'value' => 'false', 'label' => 'Feature flag: AI insights (FR46)', 'type' => 'boolean'],
            ['key' => 'feature_sentiment_analysis', 'value' => 'false', 'label' => 'Feature flag: feedback sentiment analysis (FR47)', 'type' => 'boolean'],
        ];

        foreach ($defaults as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
