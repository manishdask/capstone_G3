<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consent extends Model
{
    /** Bump when the privacy notice text materially changes. */
    public const CURRENT_NOTICE_VERSION = '2026-08-1';

    public const PURPOSE_PRIVACY_NOTICE = 'privacy_notice_and_treatment';

    protected $fillable = ['patient_id', 'purpose', 'notice_version', 'state', 'changed_at'];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
