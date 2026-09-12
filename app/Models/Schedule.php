<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id', 'branch_id', 'schedule_date', 'day_of_week', 'start_time', 'end_time', 'type',
    ];

    protected function casts(): array
    {
        return [
            'schedule_date' => 'date',
        ];
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
