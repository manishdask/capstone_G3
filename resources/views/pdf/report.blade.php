<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1a1a1a; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <h1>St George Hospital &mdash; Branch Manager Statistical Report</h1>
    <p class="muted">
        Period: {{ $summary['from'] }} to {{ $summary['to'] }}
        @if ($summary['branch_id']) | Branch ID: {{ $summary['branch_id'] }} @else | All branches @endif
    </p>

    <table>
        <tr><th>New patients</th><td>{{ $summary['new_patients'] }}</td></tr>
        <tr><th>Revenue (AUD)</th><td>{{ number_format($summary['revenue'], 2) }}</td></tr>
    </table>

    <h3>Appointments by status</h3>
    <table>
        <thead><tr><th>Status</th><th>Count</th></tr></thead>
        <tbody>
            @forelse ($summary['appointments_by_status'] as $status => $count)
                <tr><td>{{ ucfirst($status) }}</td><td>{{ $count }}</td></tr>
            @empty
                <tr><td colspan="2">No appointment activity in this period.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
