<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\InventoryTransaction;
use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'unit_price' => 5.50, 'quantity' => 200, 'threshold' => 50],
            ['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotic', 'unit_price' => 12.00, 'quantity' => 80, 'threshold' => 30],
            ['name' => 'Ibuprofen 200mg', 'category' => 'Anti-inflammatory', 'unit_price' => 6.75, 'quantity' => 150, 'threshold' => 40],
            ['name' => 'Salbutamol Inhaler', 'category' => 'Respiratory', 'unit_price' => 18.00, 'quantity' => 25, 'threshold' => 20],
            ['name' => 'Metformin 500mg', 'category' => 'Diabetes', 'unit_price' => 9.20, 'quantity' => 8, 'threshold' => 25],
            ['name' => 'Atorvastatin 20mg', 'category' => 'Cardiovascular', 'unit_price' => 14.50, 'quantity' => 60, 'threshold' => 20],
        ];

        foreach (Branch::all() as $branch) {
            foreach ($catalog as $item) {
                $medicine = Medicine::create($item + [
                    'branch_id' => $branch->id,
                    'batch_number' => 'BATCH-'.$branch->id.'-'.fake()->numerify('####'),
                    'expiry_date' => now()->addMonths(fake()->numberBetween(3, 18))->toDateString(),
                    'supplier' => fake()->company(),
                ]);

                InventoryTransaction::create([
                    'branch_id' => $branch->id,
                    'medicine_id' => $medicine->id,
                    'quantity' => $medicine->quantity,
                    'type' => 'stock_in',
                    'reference' => 'seed_initial_stock',
                ]);
            }
        }
    }
}
