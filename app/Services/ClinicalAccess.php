<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BreakGlassSession;
use App\Models\LabOrder;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * The single authority on "what may this user see or touch".
 *
 * Every scope below is derived from the authenticated user's OWN staff/patient
 * record. Nothing here reads an id out of the request body or query string to
 * decide access — a client-supplied `branch_id` or `patient_id` can only ever
 * NARROW a scope that was already established from the session, never widen it.
 * That is what stops "change the id in the URL" from working.
 *
 * Roles fall into four shapes:
 *  - Patient        — their own records, nothing else, ever.
 *  - Doctor         — the patients assigned to them (see assignedPatientIds())
 *                     and the appointments booked with them personally.
 *  - Branch staff   — nurse, receptionist, lab technician, pharmacist, branch
 *                     manager: their OWN branch, and only the record types
 *                     their job needs.
 *  - Admin          — unrestricted, and may filter by branch on request.
 */
class ClinicalAccess
{
    /** Roles that have no business reading the clinical appointment book. */
    private const NO_APPOINTMENT_ACCESS = [Role::LAB_TECHNICIAN, Role::PHARMACIST];

    /**
     * Restrict an appointment query to what $user is allowed to see.
     *
     * @param  int|null  $requestedBranchId  optional client filter; only ever
     *                                       narrows an already-allowed scope.
     */
    public function scopeAppointments(Builder $query, User $user, ?int $requestedBranchId = null): Builder
    {
        if ($user->hasRole(Role::PATIENT)) {
            // A patient with no patient record has no appointments — never "all".
            return $query->where('patient_id', $user->patient?->id ?? 0);
        }

        if ($user->hasRole(Role::DOCTOR)) {
            // Keyed on the doctor's own staff row. A doctor account with no
            // staff record sees nothing rather than falling through to
            // everything, which is what previously put one booking on several
            // doctors' dashboards.
            return $query->where('doctor_staff_id', $user->staff?->id ?? 0);
        }

        if ($user->hasRole(Role::ADMIN)) {
            return $requestedBranchId
                ? $query->where('branch_id', $requestedBranchId)
                : $query;
        }

        // Every remaining staff role is confined to its own branch. The branch
        // comes from the user's staff record, never from the request.
        return $query->where('branch_id', $this->branchIdFor($user) ?? 0);
    }

    /** True when this role may read the clinical appointment book at all. */
    public function mayListAppointments(User $user): bool
    {
        return ! $user->hasAnyRole(self::NO_APPOINTMENT_ACCESS);
    }

    /**
     * May $user act on this specific appointment (confirm, reject, complete)?
     * A doctor may only act on their own; branch staff only within their branch.
     */
    public function mayManageAppointment(User $user, Appointment $appointment): bool
    {
        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->hasRole(Role::PATIENT)) {
            return $appointment->patient_id === $user->patient?->id;
        }

        if ($user->hasRole(Role::DOCTOR)) {
            return $appointment->doctor_staff_id === $user->staff?->id;
        }

        if ($user->hasAnyRole([Role::BRANCH_MANAGER, Role::RECEPTIONIST, Role::NURSE])) {
            return $appointment->branch_id === $this->branchIdFor($user);
        }

        return false;
    }

    /**
     * May $user open this patient's file?
     *
     * A doctor must be assigned to the patient (or hold a live break-glass
     * grant). Ward staff are limited to their own branch. Lab technicians and
     * pharmacists get nothing here — they work from the lab order and the
     * prescription, which each carry the patient details they need.
     */
    public function mayViewPatient(User $user, Patient $patient): bool
    {
        if ($user->hasRole(Role::PATIENT)) {
            return $user->patient?->id === $patient->id;
        }

        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->hasRole(Role::DOCTOR)) {
            return $this->isAssignedToDoctor($patient, $user) || $this->hasBreakGlass($user, $patient);
        }

        if ($user->hasAnyRole([Role::BRANCH_MANAGER, Role::RECEPTIONIST, Role::NURSE])) {
            return $patient->branch_id === $this->branchIdFor($user)
                || $this->hasBreakGlass($user, $patient);
        }

        return $this->hasBreakGlass($user, $patient);
    }

    /** Restrict a patient-directory query to what $user may browse. */
    public function scopePatients(Builder $query, User $user, ?int $requestedBranchId = null): Builder
    {
        if ($user->hasRole(Role::PATIENT)) {
            return $query->where('id', $user->patient?->id ?? 0);
        }

        if ($user->hasRole(Role::ADMIN)) {
            return $requestedBranchId
                ? $query->where('branch_id', $requestedBranchId)
                : $query;
        }

        if ($user->hasRole(Role::DOCTOR)) {
            return $query->whereIn('id', $this->assignedPatientIds($user));
        }

        if ($user->hasAnyRole([Role::BRANCH_MANAGER, Role::RECEPTIONIST, Role::NURSE])) {
            return $query->where('branch_id', $this->branchIdFor($user) ?? 0);
        }

        // Lab technicians / pharmacists: no patient directory.
        return $query->whereRaw('1 = 0');
    }

    /**
     * The patients a doctor is responsible for: anyone who has booked with them
     * (whatever the visit's current status, so history stays readable), anyone
     * they have already written a note for, and anyone covered by a live
     * break-glass grant.
     *
     * Returned as ids so it composes into a whereIn without a correlated
     * subquery per row.
     *
     * @return array<int, int>
     */
    public function assignedPatientIds(User $user): array
    {
        $staffId = $user->staff?->id;

        if (! $staffId) {
            return [];
        }

        $viaAppointments = Appointment::where('doctor_staff_id', $staffId)->pluck('patient_id');
        $viaNotes = \App\Models\MedicalRecord::where('author_staff_id', $staffId)->pluck('patient_id');
        $viaBreakGlass = $this->liveBreakGlassQuery($user)->pluck('patient_id');

        return $viaAppointments->merge($viaNotes)->merge($viaBreakGlass)
            ->unique()->values()->all();
    }

    public function isAssignedToDoctor(Patient $patient, User $doctorUser): bool
    {
        $staffId = $doctorUser->staff?->id;

        if (! $staffId) {
            return false;
        }

        return Appointment::where('doctor_staff_id', $staffId)
            ->where('patient_id', $patient->id)
            ->exists()
            || \App\Models\MedicalRecord::where('author_staff_id', $staffId)
                ->where('patient_id', $patient->id)
                ->exists();
    }

    /**
     * Restrict a lab-order query.
     *
     * Lab technicians see their own branch's queue and nothing else — that is
     * the "relevant lab requests" rule. Doctors see the orders they raised plus
     * any order belonging to a patient assigned to them, so a colleague's
     * request on their own patient is still visible at the bedside.
     */
    public function scopeLabOrders(Builder $query, User $user, ?int $requestedBranchId = null): Builder
    {
        if ($user->hasRole(Role::PATIENT)) {
            return $query->where('patient_id', $user->patient?->id ?? 0);
        }

        if ($user->hasRole(Role::ADMIN)) {
            return $requestedBranchId
                ? $query->where('branch_id', $requestedBranchId)
                : $query;
        }

        if ($user->hasRole(Role::DOCTOR)) {
            $staffId = $user->staff?->id ?? 0;
            $assigned = $this->assignedPatientIds($user);

            return $query->where(function ($q) use ($staffId, $assigned) {
                $q->where('requester_staff_id', $staffId)
                    ->orWhereIn('patient_id', $assigned ?: [0]);
            });
        }

        if ($user->hasAnyRole([Role::LAB_TECHNICIAN, Role::BRANCH_MANAGER, Role::NURSE, Role::RECEPTIONIST])) {
            return $query->where('branch_id', $this->branchIdFor($user) ?? 0);
        }

        return $query->whereRaw('1 = 0');
    }

    /** May $user record or release results against this order? */
    public function mayWorkLabOrder(User $user, LabOrder $order): bool
    {
        if ($user->hasRole(Role::ADMIN)) {
            return true;
        }

        if ($user->hasRole(Role::LAB_TECHNICIAN)) {
            return $order->branch_id === $this->branchIdFor($user);
        }

        if ($user->hasRole(Role::DOCTOR)) {
            return $order->requester_staff_id === $user->staff?->id
                || in_array($order->patient_id, $this->assignedPatientIds($user), true);
        }

        return false;
    }

    /** May $user download the report attached to this order's result? */
    public function mayReadLabReport(User $user, LabOrder $order): bool
    {
        if ($user->hasRole(Role::PATIENT)) {
            return $user->patient?->id === $order->patient_id;
        }

        if ($user->hasRole(Role::BRANCH_MANAGER)) {
            return $order->branch_id === $this->branchIdFor($user);
        }

        return $this->mayWorkLabOrder($user, $order)
            || ($user->staff !== null && $this->hasBreakGlass($user, $order->patient));
    }

    /** A live, unrevoked, unexpired emergency grant for this patient (FR51). */
    public function hasBreakGlass(User $user, ?Patient $patient): bool
    {
        if (! $patient) {
            return false;
        }

        return $this->liveBreakGlassQuery($user)
            ->where('patient_id', $patient->id)
            ->exists();
    }

    private function liveBreakGlassQuery(User $user)
    {
        return BreakGlassSession::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }

    /** The branch this user actually belongs to, from their staff record. */
    public function branchIdFor(User $user): ?int
    {
        return $user->staff?->branch_id ?? $user->branch_id;
    }
}
