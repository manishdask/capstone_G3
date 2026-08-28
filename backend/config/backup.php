<?php

// FR57 (proposed): where to find the mysqldump binary for scheduled/manual backups.
return [
    'mysqldump_path' => env('BACKUP_MYSQLDUMP_PATH'),

    'mysqldump_fallback_paths' => [
        'C:\\xampp2\\mysql\\bin\\mysqldump.exe',
        'C:\\xampp\\mysql\\bin\\mysqldump.exe',
        '/usr/bin/mysqldump',
    ],
];
