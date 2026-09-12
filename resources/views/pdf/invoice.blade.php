<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1a1a1a; }
        h1 { font-size: 18px; margin-bottom: 0; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f2f2f2; }
        .totals { margin-top: 12px; text-align: right; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .status.paid { background: #d4edda; color: #155724; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.cancelled { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>St George Hospital &mdash; Invoice #{{ $invoice->id }}</h1>
    <p class="muted">Branch: {{ $invoice->branch->name ?? '—' }} | Issued: {{ optional($invoice->issued_at)->format('d M Y') }}</p>
    <p>
        Patient ID: {{ $invoice->patient->global_patient_id ?? '—' }}<br>
        Patient: {{ $invoice->patient->fullName() ?? '—' }}<br>
        Status: <span class="status {{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span>
    </p>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td>{{ ucfirst($item->item_type) }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format($item->unit_price, 2) }}</td>
                    <td>{{ number_format($item->amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <strong>Total: AUD {{ number_format($invoice->total_amount, 2) }}</strong>
    </div>
</body>
</html>
