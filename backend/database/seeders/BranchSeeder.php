<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            ['name' => 'St George Kogarah', 'state' => 'NSW', 'address' => '1 James Street, Kogarah NSW 2217', 'contact_number' => '02 9113 1111', 'capacity' => 120],
            ['name' => 'St George Melbourne', 'state' => 'VIC', 'address' => '55 Collins Street, Melbourne VIC 3000', 'contact_number' => '03 9000 2222', 'capacity' => 90],
            ['name' => 'St George Brisbane', 'state' => 'QLD', 'address' => '200 Adelaide Street, Brisbane QLD 4000', 'contact_number' => '07 3000 3333', 'capacity' => 75],
        ];

        foreach ($branches as $branch) {
            Branch::firstOrCreate(['name' => $branch['name']], $branch + [
                'email' => 'info@'.str()->slug($branch['name']).'.stgeorge.test',
                'status' => 'active',
            ]);
        }
    }
}
