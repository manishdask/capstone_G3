<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * FR41-FR44: patient/revenue/appointment statistics and exportable reports.
 * FR46-FR48 (AI insights, sentiment) are explicitly out of scope for this pass.
 */
class ReportController extends Controller
{
    /**
     * FR41: daily/weekly/monthly patient, revenue and appointment statistics,
     * scoped to an authorised branch when provided.
     */
    public function summary(Request $request)
    {
        $branchId = $request->integer('branch_id') ?: null;
        $from = $request->date('from') ?? now()->subDays(30);
        $to = $request->date('to') ?? now();

        $patients = Patient::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $appointments = Appointment::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('appointment_date', [$from, $to])
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $revenue = Payment::query()
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->when($branchId, fn ($q) => $q->where('invoices.branch_id', $branchId))
            ->where('payments.status', 'success')
            ->whereBetween('payments.received_at', [$from, $to])
            ->sum('payments.amount');

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'branch_id' => $branchId,
            'new_patients' => $patients,
            'appointments_by_status' => $appointments,
            'revenue' => (float) $revenue,
        ]]);
    }

    /**
     * FR41/FR43: day-by-day revenue and appointment volume for the dashboard's
     * trend charts, scoped to an authorised branch when provided.
     */
    public function trend(Request $request)
    {
        $branchId = $request->integer('branch_id') ?: null;
        $days = min(90, $request->integer('days', 7));
        $from = now()->subDays($days - 1)->startOfDay();
        $to = now()->endOfDay();

        $appointmentsByDay = Appointment::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('appointment_date', [$from, $to])
            ->selectRaw('appointment_date as day, count(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $revenueByDay = Payment::query()
            ->join('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->when($branchId, fn ($q) => $q->where('invoices.branch_id', $branchId))
            ->where('payments.status', 'success')
            ->whereBetween('payments.received_at', [$from, $to])
            ->selectRaw('DATE(payments.received_at) as day, sum(payments.amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $series = [];
        for ($cursor = $from->copy(); $cursor->lte($to); $cursor->addDay()) {
            $key = $cursor->toDateString();
            $series[] = [
                'date' => $key,
                'appointments' => (int) ($appointmentsByDay[$key] ?? 0),
                'revenue' => (float) ($revenueByDay[$key] ?? 0),
            ];
        }

        return response()->json(['data' => $series]);
    }

    /**
     * FR44: branch managers compare authorised department (specialization) performance.
     */
    public function departmentComparison(Request $request)
    {
        $branchId = $request->integer('branch_id') ?: null;

        $data = Appointment::query()
            ->join('staff', 'staff.id', '=', 'appointments.doctor_staff_id')
            ->join('doctors', 'doctors.staff_id', '=', 'staff.id')
            ->when($branchId, fn ($q) => $q->where('appointments.branch_id', $branchId))
            ->selectRaw('doctors.specialization, count(*) as appointment_count')
            ->groupBy('doctors.specialization')
            ->orderByDesc('appointment_count')
            ->get();

        return response()->json(['data' => $data]);
    }

    /**
     * FR42: export the summary report as a CSV spreadsheet.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $branchId = $request->integer('branch_id') ?: null;
        $from = $request->date('from') ?? now()->subDays(30);
        $to = $request->date('to') ?? now();

        $appointments = Appointment::query()
            ->with(['patient', 'doctor.user', 'branch'])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereBetween('appointment_date', [$from, $to])
            ->orderBy('appointment_date')
            ->get();

        $filename = 'sgh-report-'.$from->toDateString().'-to-'.$to->toDateString().'.csv';

        return response()->streamDownload(function () use ($appointments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Branch', 'Patient', 'Doctor', 'Status']);

            foreach ($appointments as $appointment) {
                fputcsv($handle, [
                    $appointment->appointment_date->toDateString(),
                    $appointment->branch->name ?? '',
                    $appointment->patient->fullName() ?? '',
                    $appointment->doctor->user->name ?? '',
                    $appointment->status,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * FR42: exportable Branch Manager Statistical Report as PDF (SRS 4.1.4).
     */
    public function exportPdf(Request $request)
    {
        $summary = $this->summary($request)->getData(true)['data'];

        $pdf = Pdf::loadView('pdf.report', ['summary' => $summary]);

        return $pdf->download('sgh-statistical-report.pdf');
    }
}
