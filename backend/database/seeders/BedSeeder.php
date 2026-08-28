<?php

namespace Database\Seeders;

use App\Models\Bed;
use App\Models\Branch;
use Illuminate\Database\Seeder;

/** FR53 (proposed): a small ward/room/bed inventory per branch to admit patients into. */
class BedSeeder extends Seeder
{
    private const WARDS = ['General Ward', 'ICU', 'Maternity'];

    public function run(): void
    {
        foreach (Branch::all() as $branch) {
            foreach (self::WARDS as $wardIndex => $ward) {
                $room = 100 + $wardIndex;
                foreach (['A', 'B'] as $bedLetter) {
                    Bed::firstOrCreate([
                        'branch_id' => $branch->id,
                        'ward' => $ward,
                        'room_number' => (string) $room,
                        'bed_number' => $bedLetter,
                    ]);
                }
            }
        }
    }
}
