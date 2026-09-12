<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Department;
use Illuminate\Database\Seeder;

/** FR60 (proposed) — a starter department list per branch. */
class DepartmentSeeder extends Seeder
{
    private const DEPARTMENTS = ['General Medicine', 'Emergency', 'Pathology', 'Pharmacy'];

    public function run(): void
    {
        foreach (Branch::all() as $branch) {
            foreach (self::DEPARTMENTS as $name) {
                Department::firstOrCreate(['branch_id' => $branch->id, 'name' => $name]);
            }
        }
    }
}
