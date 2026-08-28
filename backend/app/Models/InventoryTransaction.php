<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'branch_id', 'medicine_id', 'quantity', 'type', 'actor_id', 'reference', 'notes',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
