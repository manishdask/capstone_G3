<?php

use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AiChatController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BedController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BreakGlassController;
use App\Http\Controllers\Api\ConsentController;
use App\Http\Controllers\Api\DataRequestController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LabController;
use App\Http\Controllers\Api\MfaController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PatientDuplicateController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PharmacyController;
use App\Http\Controllers\Api\ProcedureBookingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SecurityAlertController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\WardObservationController;
use App\Models\Role;
use Illuminate\Support\Facades\Route;

$admin = Role::ADMIN;
$branchManager = Role::BRANCH_MANAGER;
$doctor = Role::DOCTOR;
$nurse = Role::NURSE;
$receptionist = Role::RECEPTIONIST;
$patient = Role::PATIENT;
$labTech = Role::LAB_TECHNICIAN;
$pharmacist = Role::PHARMACIST;

Route::get('/health', HealthController::class);

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Unauthenticated — needed to populate the registration form's branch picker.
Route::get('/public/branches', [BranchController::class, 'publicIndex']);

// FR50: second login step for MFA-enabled accounts — no session exists yet,
// so this must sit outside the authenticated group like /auth/login.
Route::post('/auth/mfa/verify', [MfaController::class, 'verify']);

// FR64 (proposed): sandboxed gateway webhook — real payment gateways call
// back without a user session, so this can't sit behind auth:sanctum either.
Route::post('/payments/callback', [PaymentController::class, 'callback'])->middleware('audit');

Route::middleware(['auth:sanctum', 'active.session', 'mfa.setup'])->group(function () use (
    $admin, $branchManager, $doctor, $nurse, $receptionist, $patient, $labTech, $pharmacist
) {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('audit');

    // FR46: non-clinical AI chatbot — available to any authenticated role.
    // The answer is audited (action AI_CHAT) inside AiService for provenance.
    Route::post('/ai/chat', [AiChatController::class, 'chat']);

    // FR50: MFA enrolment/removal — available to any authenticated user, but
    // enforced (mandatory) only for Admin/Branch Manager via RequireMfaSetup.
    Route::post('/mfa/setup', [MfaController::class, 'setup']);
    Route::post('/mfa/enable', [MfaController::class, 'enable'])->middleware('audit');
    Route::post('/mfa/disable', [MfaController::class, 'disable'])->middleware('audit');

    // Branches — FR6-FR10
    Route::middleware('audit')->group(function () use ($admin) {
        Route::post('/branches', [BranchController::class, 'store'])->middleware("role:{$admin}");
        Route::put('/branches/{branch}', [BranchController::class, 'update'])->middleware("role:{$admin}");
        Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])->middleware("role:{$admin}");
        Route::post('/branches/{branch}/assign-staff', [BranchController::class, 'assignStaff'])->middleware("role:{$admin}");
    });
    Route::middleware("role:{$admin},{$branchManager}")->group(function () {
        Route::get('/branches', [BranchController::class, 'index']);
        Route::get('/branches/{branch}', [BranchController::class, 'show']);
        Route::get('/branches/{branch}/statistics', [BranchController::class, 'statistics']);
    });

    // Patients — FR11-FR15
    Route::middleware("role:{$admin},{$branchManager},{$doctor},{$nurse},{$receptionist}")->group(function () use ($admin, $receptionist) {
        Route::get('/patients', [PatientController::class, 'index']);
        Route::post('/patients', [PatientController::class, 'store'])->middleware(['audit', "role:{$admin},{$receptionist}"]);
    });
    Route::get('/patients/{patient}', [PatientController::class, 'show']);
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->middleware('audit');
    Route::get('/patients/{patient}/medical-records', [PatientController::class, 'medicalRecords']);

    // Appointments — FR16-FR20
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/doctors/{doctor}/availability', [AppointmentController::class, 'availability']);
    Route::post('/appointments', [AppointmentController::class, 'store'])
        ->middleware(['audit', "role:{$patient}"]);
    // Patients are included so they can cancel their OWN booking (the patient
    // app has always offered the button); updateStatus() restricts them to
    // 'cancelled' on their own appointment and nothing else.
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])
        ->middleware(['audit', "role:{$admin},{$branchManager},{$receptionist},{$doctor},{$patient}"]);

    // Staff — FR21-FR25
    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/{staff}', [StaffController::class, 'show']);
    Route::get('/staff/{staff}/schedules', [StaffController::class, 'schedules']);
    Route::post('/staff', [StaffController::class, 'store'])->middleware(['audit', "role:{$admin}"]);
    Route::middleware(['audit', "role:{$admin},{$branchManager}"])->group(function () {
        Route::put('/staff/{staff}', [StaffController::class, 'update']);
        Route::post('/staff/{staff}/schedules', [StaffController::class, 'storeSchedule']);
    });
    Route::post('/staff/{staff}/medical-records', [StaffController::class, 'storeMedicalRecord'])
        ->middleware(['audit', "role:{$doctor},{$nurse}"]);
    Route::post('/staff/{staff}/prescriptions', [StaffController::class, 'storePrescription'])
        ->middleware(['audit', "role:{$doctor}"]);

    // Pharmacy — FR26-FR30
    Route::middleware("role:{$pharmacist},{$admin},{$branchManager},{$doctor}")->group(function () {
        Route::get('/medicines', [PharmacyController::class, 'index']);
        Route::get('/medicines/low-stock', [PharmacyController::class, 'lowStock']);
    });
    Route::get('/prescriptions', [PharmacyController::class, 'prescriptionsIndex'])
        ->middleware("role:{$patient},{$pharmacist},{$doctor},{$admin},{$branchManager}");
    Route::middleware(['audit', "role:{$pharmacist},{$admin}"])->group(function () {
        Route::post('/medicines', [PharmacyController::class, 'store']);
        Route::post('/medicines/{medicine}/purchase-order', [PharmacyController::class, 'purchaseOrder']);
        Route::post('/prescriptions/{prescription}/dispense', [PharmacyController::class, 'dispense']);
        Route::patch('/prescriptions/{prescription}/status', [PharmacyController::class, 'updatePrescriptionStatus']);
    });
    // FR60 (proposed): branch-scoped inventory threshold/price management.
    Route::put('/medicines/{medicine}', [PharmacyController::class, 'update'])
        ->middleware(['audit', "role:{$admin},{$branchManager},{$pharmacist}"]);

    // Laboratory — FR31-FR35
    Route::get('/lab-orders', [LabController::class, 'index']);
    Route::get('/lab-results/{result}/download', [LabController::class, 'download']);
    Route::post('/lab-orders', [LabController::class, 'store'])
        ->middleware(['audit', "role:{$doctor}"]);
    Route::post('/lab-orders/{order}/results', [LabController::class, 'uploadResult'])
        ->middleware(['audit', "role:{$labTech}"]);
    Route::post('/lab-results/{result}/release', [LabController::class, 'release'])
        ->middleware(['audit', "role:{$labTech},{$doctor}"]);

    // Procedures (FR37 billing input) — staff record procedures against a visit.
    Route::middleware("role:{$admin},{$branchManager},{$receptionist},{$doctor},{$nurse}")->group(function () {
        Route::get('/procedure-bookings', [ProcedureBookingController::class, 'index']);
        Route::post('/procedure-bookings', [ProcedureBookingController::class, 'store']);
        Route::patch('/procedure-bookings/{booking}/status', [ProcedureBookingController::class, 'updateStatus'])
            ->middleware('audit');
    });

    // Billing — FR36-FR40
    Route::get('/invoices', [BillingController::class, 'index']);
    Route::get('/invoices/{invoice}', [BillingController::class, 'show']);
    Route::get('/invoices/{invoice}/pdf', [BillingController::class, 'downloadPdf']);
    Route::post('/invoices', [BillingController::class, 'store'])
        ->middleware(['audit', "role:{$admin},{$branchManager},{$receptionist}"]);
    Route::post('/invoices/{invoice}/pay', [BillingController::class, 'pay'])
        ->middleware(['audit', "role:{$patient},{$receptionist},{$admin}"]);
    // FR40: Stripe checkout — create intent (card tokenized client-side by Elements).
    Route::post('/invoices/{invoice}/checkout', [BillingController::class, 'checkout'])
        ->middleware(['audit', "role:{$patient},{$receptionist},{$admin}"]);
    Route::post('/invoices/{invoice}/confirm', [BillingController::class, 'confirm'])
        ->middleware(['audit', "role:{$patient},{$receptionist},{$admin}"]);

    // FR64 (proposed): staff-initiated refund.
    Route::post('/payments/{payment}/refund', [PaymentController::class, 'refund'])
        ->middleware(['audit', "role:{$receptionist},{$admin}"]);

    // Reports — FR41-FR44 (FR46-FR48 AI insights intentionally excluded)
    Route::middleware("role:{$admin},{$branchManager}")->group(function () {
        Route::get('/reports/summary', [ReportController::class, 'summary']);
        Route::get('/reports/trend', [ReportController::class, 'trend']);
        Route::get('/reports/department-comparison', [ReportController::class, 'departmentComparison']);
        Route::get('/reports/export.csv', [ReportController::class, 'exportCsv']);
        Route::get('/reports/export.pdf', [ReportController::class, 'exportPdf']);
    });

    // Feedback / reviews (SRS 3.2) — sentiment classification (FR47) is excluded.
    Route::get('/feedback', [FeedbackController::class, 'index'])
        ->middleware("role:{$admin},{$branchManager}");
    Route::post('/feedback', [FeedbackController::class, 'store'])
        ->middleware(['audit', "role:{$patient}"]);

    // Audit trail (NFR12) — read access to what AuditMiddleware already records.
    // FR55 (proposed): richer filters + CSV export.
    Route::middleware("role:{$admin}")->group(function () {
        Route::get('/audit-logs', [AuditController::class, 'index']);
        Route::get('/audit-logs/export.csv', [AuditController::class, 'exportCsv']);
        Route::get('/security-alerts', [SecurityAlertController::class, 'index']);

        // Backups — FR57/FR58 (proposed)
        Route::get('/backup-jobs', [BackupController::class, 'index']);
        Route::post('/backup-jobs', [BackupController::class, 'store'])->middleware('audit');
        Route::post('/backup-jobs/{backupJob}/restore-drill', [BackupController::class, 'restoreDrill'])->middleware('audit');
    });

    // Consent — FR49 (proposed)
    Route::get('/consents', [ConsentController::class, 'index'])
        ->middleware("role:{$patient},{$admin},{$branchManager},{$receptionist}");
    Route::post('/consents', [ConsentController::class, 'store'])
        ->middleware(['audit', "role:{$patient},{$admin},{$receptionist}"]);
    Route::post('/consents/{consent}/withdraw', [ConsentController::class, 'withdraw'])
        ->middleware(['audit', "role:{$patient},{$admin},{$receptionist}"]);

    // Patient data access/correction requests — FR61 (proposed)
    Route::get('/data-requests', [DataRequestController::class, 'index'])
        ->middleware("role:{$patient},{$admin},{$branchManager},{$receptionist}");
    Route::post('/data-requests', [DataRequestController::class, 'store'])
        ->middleware(['audit', "role:{$patient}"]);
    Route::post('/data-requests/{dataRequest}/assign', [DataRequestController::class, 'assign'])
        ->middleware(['audit', "role:{$admin},{$branchManager},{$receptionist}"]);
    Route::post('/data-requests/{dataRequest}/decide', [DataRequestController::class, 'decide'])
        ->middleware(['audit', "role:{$admin},{$branchManager}"]);

    // Duplicate-patient review — FR62 (proposed)
    Route::middleware("role:{$admin},{$branchManager}")->group(function () {
        Route::get('/patient-duplicates', [PatientDuplicateController::class, 'index']);
        Route::post('/patient-duplicates/{patientDuplicateFlag}/dismiss', [PatientDuplicateController::class, 'dismiss'])
            ->middleware('audit');
        Route::post('/patient-duplicates/{patientDuplicateFlag}/merge', [PatientDuplicateController::class, 'merge'])
            ->middleware('audit');
    });

    // Break-glass emergency access — FR51 (proposed)
    Route::post('/break-glass', [BreakGlassController::class, 'store'])
        ->middleware(['audit', "role:{$admin},{$branchManager},{$doctor},{$nurse},{$receptionist},{$labTech},{$pharmacist}"]);
    Route::middleware("role:{$admin},{$branchManager}")->group(function () use ($admin) {
        Route::get('/break-glass', [BreakGlassController::class, 'index']);
        Route::post('/break-glass/{breakGlassSession}/revoke', [BreakGlassController::class, 'revoke'])->middleware('audit');
        Route::post('/break-glass/{breakGlassSession}/review', [BreakGlassController::class, 'review'])
            ->middleware(['audit', "role:{$admin}"]);
    });

    // Wards/beds/admissions — FR52-FR54 (proposed)
    Route::middleware("role:{$admin},{$branchManager},{$doctor},{$nurse},{$receptionist}")->group(function () {
        Route::get('/beds', [BedController::class, 'index']);
        Route::get('/admissions', [AdmissionController::class, 'index']);
        Route::get('/admissions/{admission}', [AdmissionController::class, 'show']);
        Route::get('/admissions/{admission}/observations', [WardObservationController::class, 'index']);

        Route::middleware('audit')->group(function () {
            Route::post('/admissions', [AdmissionController::class, 'admit']);
            Route::post('/admissions/{admission}/transfer', [AdmissionController::class, 'transfer']);
            Route::post('/admissions/{admission}/discharge', [AdmissionController::class, 'discharge']);
        });
    });

    Route::post('/admissions/{admission}/observations', [WardObservationController::class, 'store'])
        ->middleware(['audit', "role:{$doctor},{$nurse}"]);

    // Branch-scoped configuration — FR60 (proposed)
    Route::middleware("role:{$admin},{$branchManager}")->group(function () {
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::get('/services', [ServiceController::class, 'index']);

        Route::middleware('audit')->group(function () {
            Route::post('/departments', [DepartmentController::class, 'store']);
            Route::put('/departments/{department}', [DepartmentController::class, 'update']);
            Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

            Route::post('/services', [ServiceController::class, 'store']);
            Route::put('/services/{service}', [ServiceController::class, 'update']);
            Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

            Route::post('/beds', [BedController::class, 'store']);
            Route::put('/beds/{bed}', [BedController::class, 'update']);
        });
    });

    // System settings — FR59 (proposed)
    Route::get('/settings', [SettingController::class, 'index'])
        ->middleware("role:{$admin},{$branchManager}");
    Route::put('/settings/{setting:key}', [SettingController::class, 'update'])
        ->middleware(['audit', "role:{$admin}"]);
});
