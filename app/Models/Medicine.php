<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id', 'name', 'category', 'batch_number', 'unit_price',
        'quantity', 'threshold', 'expiry_date', 'supplier',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date->isPast();
    }

    public function isBelowThreshold(): bool
    {
        return $this->quantity < $this->threshold;
    }
}
