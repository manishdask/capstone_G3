<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['branch_id', 'name', 'status'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
