<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\PatientDuplicateFlag;

/**
 * FR62 (proposed): fuzzy match on name + DOB + contact number. Simple and
 * explainable on purpose — a scored heuristic, not a black-box classifier,
 * so an admin reviewing a flag can see exactly why it was raised.
 */
class DuplicatePatientDetector
{
    private const FLAG_THRESHOLD = 60;

    /**
     * Compares the given patient against other active patients and creates
     * pending review flags for any match at or above the threshold.
     */
    public function detectAndFlag(Patient $patient): void
    {
        $candidates = Patient::query()
            ->where('id', '!=', $patient->id)
            ->where('status', 'active')
            ->where(function ($q) use ($patient) {
                $q->where('date_of_birth', $patient->date_of_birth)
                    ->orWhere('last_name', $patient->last_name)
                    ->orWhere('contact_number', $patient->contact_number);
            })
            ->get();

        foreach ($candidates as $candidate) {
            $score = $this->score($patient, $candidate);

            if ($score >= self::FLAG_THRESHOLD) {
                PatientDuplicateFlag::firstOrCreate([
                    'patient_id' => $patient->id,
                    'matched_patient_id' => $candidate->id,
                ], [
                    'score' => $score,
                    'status' => 'pending',
                ]);
            }
        }
    }

    /**
     * 0-100 heuristic score: DOB match and contact match are strong signals;
     * name similarity is graded via PHP's similar_text percentage.
     */
    private function score(Patient $a, Patient $b): int
    {
        $score = 0;

        if ($a->date_of_birth?->isSameDay($b->date_of_birth)) {
            $score += 40;
        }

        $nameA = mb_strtolower(trim("{$a->first_name} {$a->last_name}"));
        $nameB = mb_strtolower(trim("{$b->first_name} {$b->last_name}"));
        similar_text($nameA, $nameB, $namePercent);
        $score += (int) round($namePercent * 0.4); // up to 40

        $contactA = preg_replace('/\D+/', '', (string) $a->contact_number);
        $contactB = preg_replace('/\D+/', '', (string) $b->contact_number);
        if ($contactA !== '' && $contactA === $contactB) {
            $score += 20;
        }

        return min(100, $score);
    }
}
