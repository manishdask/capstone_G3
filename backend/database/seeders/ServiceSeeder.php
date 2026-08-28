<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Service;
use Illuminate\Database\Seeder;

/** FR60 (proposed) — a starter service price list per branch. */
class ServiceSeeder extends Seeder
{
    private const SERVICES = [
        'General Consultation' => 85.00,
        'Specialist Consultation' => 150.00,
        'X-Ray' => 120.00,
        'Full Blood Count' => 45.00,
    ];

    public function run(): void
    {
        foreach (Branch::all() as $branch) {
            foreach (self::SERVICES as $name => $price) {
                Service::firstOrCreate(['branch_id' => $branch->id, 'name' => $name], ['price' => $price]);
            }
        }
    }
}
